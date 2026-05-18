"""
Training script for the minimal GPT language model.
Trains on muqaddimah.txt and saves the model weights.
"""

import torch
from pathlib import Path
from app.model import GPTLanguageModel
from app.data import load_data, get_batch, save_tokenizer


# Hyperparameters
BATCH_SIZE = 32
BLOCK_SIZE = 128
MAX_ITERS = 1000
EVAL_INTERVAL = 500
LEARNING_RATE = 3e-4
EVAL_ITERS = 200
N_EMBD = 64
N_HEAD = 4
N_LAYER = 4
DROPOUT = 0.1

# Paths
DATA_PATH = Path(__file__).parent / "assets" / "muqaddimah.txt"
MODEL_PATH = Path(__file__).parent / "logit_model.pth"
TOKENIZER_PATH = Path(__file__).parent / "tokenizer.pkl"


def estimate_loss(model, train_data, val_data, device):
    """Estimate loss on train and val sets"""
    out = {}
    model.eval()
    for split, data in [('train', train_data), ('val', val_data)]:
        losses = torch.zeros(EVAL_ITERS)
        for k in range(EVAL_ITERS):
            X, Y = get_batch(data, BLOCK_SIZE, BATCH_SIZE, device)
            logits, loss = model(X, Y)
            losses[k] = loss.item()
        out[split] = losses.mean()
    model.train()
    return out


def train():
    """Main training function"""
    # Set device
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Using device: {device}")
    
    # Load data
    print("\n=== Loading Data ===")
    train_data, val_data, tokenizer = load_data(DATA_PATH)
    
    # Save tokenizer
    save_tokenizer(tokenizer, TOKENIZER_PATH)
    
    # Initialize model
    print("\n=== Initializing Model ===")
    model = GPTLanguageModel(
        vocab_size=tokenizer.vocab_size,
        n_embd=N_EMBD,
        n_head=N_HEAD,
        n_layer=N_LAYER,
        block_size=BLOCK_SIZE,
        dropout=DROPOUT
    )
    model = model.to(device)
    
    # Count parameters
    n_params = sum(p.numel() for p in model.parameters())
    print(f"Model has {n_params:,} parameters")
    
    # Create optimizer
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE)
    
    # Training loop
    print("\n=== Training ===")
    for iter in range(MAX_ITERS):
        # Evaluate loss periodically
        if iter % EVAL_INTERVAL == 0 or iter == MAX_ITERS - 1:
            losses = estimate_loss(model, train_data, val_data, device)
            print(f"Step {iter}: train loss {losses['train']:.4f}, val loss {losses['val']:.4f}")
        
        # Get batch and compute loss
        xb, yb = get_batch(train_data, BLOCK_SIZE, BATCH_SIZE, device)
        logits, loss = model(xb, yb)
        
        # Backpropagation
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        optimizer.step()
    
    # Save model
    print("\n=== Saving Model ===")
    torch.save({
        'model_state_dict': model.state_dict(),
        'vocab_size': tokenizer.vocab_size,
        'n_embd': N_EMBD,
        'n_head': N_HEAD,
        'n_layer': N_LAYER,
        'block_size': BLOCK_SIZE,
    }, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    
    # Generate sample text
    print("\n=== Sample Generation ===")
    model.eval()
    context = torch.zeros((1, 1), dtype=torch.long, device=device)
    generated = model.generate(context, max_new_tokens=200, temperature=0.8)[0].tolist()
    print(tokenizer.decode(generated))


if __name__ == "__main__":
    train()
