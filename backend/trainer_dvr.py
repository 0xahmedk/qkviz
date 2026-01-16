"""
Training Simulation Recorder (DVR) for the Training Lab feature.
Records internal training states and attention patterns for visualization.
"""

import torch
import torch.nn.functional as F
from model import GPTLanguageModel
from data import WordTokenizer
import re


def simulate_training_run(text_corpus: str, hyperparameters: dict):
    """
    Simulate a training run on a small text corpus and record internal states.
    
    Args:
        text_corpus: Small text input from user (e.g., a paragraph)
        hyperparameters: Dict with keys:
            - epochs: Number of training epochs (default: 20)
            - lr: Learning rate (default: 0.01)
            - embed_dim: Embedding dimension (default: 32)
            - n_head: Number of attention heads (default: 2)
            - n_layer: Number of transformer layers (default: 2)
            - block_size: Context length (default: 64)
    
    Returns:
        dict with keys:
            - history: List of snapshots for each epoch
            - vocab: Token to index mapping
            - idx_to_token: Index to token mapping
    """
    
    # Extract hyperparameters
    epochs = hyperparameters.get('epochs', 20)
    lr = hyperparameters.get('lr', 0.01)
    embed_dim = hyperparameters.get('embed_dim', 32)
    n_head = hyperparameters.get('n_head', 2)
    n_layer = hyperparameters.get('n_layer', 2)
    block_size = hyperparameters.get('block_size', 64)
    
    # Set device
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    
    # Create a fresh tokenizer for this specific corpus
    tokenizer = WordTokenizer(text_corpus)
    
    # Encode the corpus
    data = torch.tensor(tokenizer.encode(text_corpus), dtype=torch.long, device=device)
    
    # If the corpus is too short, we can't train effectively
    if len(data) < 2:
        return {
            'error': 'Text corpus is too short. Please provide at least a few words.',
            'history': [],
            'vocab': {},
            'idx_to_token': {}
        }
    
    # Initialize a fresh small model
    model = GPTLanguageModel(
        vocab_size=tokenizer.vocab_size,
        n_embd=embed_dim,
        n_head=n_head,
        n_layer=n_layer,
        block_size=block_size,
        dropout=0.0  # No dropout for training visualization
    ).to(device)
    
    # Create optimizer
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    
    # Training history
    history = []
    
    # Prepare input and target
    # For simplicity, we'll use the entire corpus as a single sequence
    seq_len = min(len(data) - 1, block_size)
    x = data[:seq_len].unsqueeze(0)  # (1, seq_len)
    y = data[1:seq_len+1].unsqueeze(0)  # (1, seq_len)
    
    # Training loop
    model.train()
    for epoch in range(epochs):
        # Forward pass with internals
        logits, internals = model(x, targets=y, return_internals=True)
        loss = internals['loss']
        
        # Get predictions (greedy decode the entire sequence)
        with torch.no_grad():
            pred_tokens = torch.argmax(logits[0], dim=-1).cpu().tolist()
            predicted_text = tokenizer.decode(pred_tokens)
            
            # Get attention weights (from last layer, first head for simplicity)
            attention_weights = internals.get('attention_weights', [])
            if attention_weights:
                # Convert first head's attention to list
                attn_matrix = attention_weights[0][0].detach().cpu().tolist()
            else:
                attn_matrix = []
            
            # Get Q and K vectors from Head 0 of last layer
            q_vectors = internals.get('q_vectors', None)
            k_vectors = internals.get('k_vectors', None)
            
            q_vectors_list = []
            k_vectors_list = []
            
            if q_vectors is not None and k_vectors is not None:
                # Shape: (B, T, head_size) -> Extract batch 0: (T, head_size)
                q_vectors_list = q_vectors[0].detach().cpu().tolist()
                k_vectors_list = k_vectors[0].detach().cpu().tolist()
        
        # Get actual token strings (not decoded text)
        input_token_ids = x[0].cpu().tolist()
        input_token_list = [tokenizer.idx_to_token[idx] for idx in input_token_ids]
        
        target_token_ids = y[0].cpu().tolist()
        target_token_list = [tokenizer.idx_to_token[idx] for idx in target_token_ids]
        
        # Record snapshot
        snapshot = {
            'epoch': epoch,
            'loss': loss.item(),
            'predicted_text': predicted_text,
            'attention_weights': attn_matrix,
            'q_vectors': q_vectors_list,
            'k_vectors': k_vectors_list,
            'input_tokens': input_token_list,  # Send as list of tokens
            'target_tokens': target_token_list  # Send as list of tokens
        }
        history.append(snapshot)
        
        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
    
    # Return results
    return {
        'history': history,
        'vocab': tokenizer.token_to_idx,
        'idx_to_token': tokenizer.idx_to_token,
        'vocab_size': tokenizer.vocab_size
    }
