"""
Simple examples demonstrating how to use the QKViz components.
Run this after training to see various use cases.
"""

import torch
import torch.nn.functional as F
from pathlib import Path


# Example 1: Using the tokenizer
def example_tokenizer():
    """Demonstrate tokenizer usage"""
    print("=" * 80)
    print("Example 1: Word-Level Tokenizer")
    print("=" * 80)
    
    from data import WordTokenizer
    
    # Create a simple tokenizer
    text = "Hello, World!"
    tokenizer = WordTokenizer(text)
    
    print(f"\nOriginal text: {text}")
    print(f"Vocabulary size: {tokenizer.vocab_size}")
    print(f"Characters: {list(tokenizer.char_to_idx.keys())}")
    
    # Encode
    encoded = tokenizer.encode(text)
    print(f"\nEncoded: {encoded}")
    
    # Decode
    decoded = tokenizer.decode(encoded)
    print(f"Decoded: {decoded}")
    print(f"Match: {text == decoded}")


# Example 2: Model forward pass
def example_forward_pass():
    """Demonstrate a forward pass through the model"""
    print("\n" + "=" * 80)
    print("Example 2: Model Forward Pass")
    print("=" * 80)
    
    from model import GPTLanguageModel
    
    # Create a tiny model
    vocab_size = 50
    model = GPTLanguageModel(
        vocab_size=vocab_size,
        n_embd=32,
        n_head=4,
        n_layer=2,
        block_size=16
    )
    
    print(f"\nModel parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Create dummy input
    batch_size = 2
    seq_length = 10
    idx = torch.randint(0, vocab_size, (batch_size, seq_length))
    
    print(f"Input shape: {idx.shape}")
    
    # Forward pass
    logits, loss = model(idx, targets=idx)  # Using same as targets for demo
    
    print(f"Output logits shape: {logits.shape}")
    print(f"Loss: {loss.item():.4f}")


# Example 3: Generation with temperature
def example_temperature_sampling():
    """Demonstrate temperature effect on generation"""
    print("\n" + "=" * 80)
    print("Example 3: Temperature Effect on Sampling")
    print("=" * 80)
    
    # Simulate model output (logits for 5 tokens)
    logits = torch.tensor([2.0, 1.5, 1.0, 0.5, 0.1])
    
    print("\nLogits:", logits.numpy())
    
    for temp in [0.1, 0.5, 1.0, 2.0]:
        scaled_logits = logits / temp
        probs = F.softmax(scaled_logits, dim=-1)
        
        print(f"\nTemperature {temp}:")
        print(f"  Probabilities: {probs.numpy()}")
        print(f"  Top token prob: {probs.max().item():.3f}")
        print(f"  Entropy: {-(probs * probs.log()).sum().item():.3f}")


# Example 4: Attention masking
def example_attention_mask():
    """Demonstrate causal attention masking"""
    print("\n" + "=" * 80)
    print("Example 4: Causal Attention Masking")
    print("=" * 80)
    
    seq_length = 5
    
    # Create attention scores (before masking)
    scores = torch.randn(seq_length, seq_length)
    
    print("\nAttention scores (before masking):")
    print(scores.numpy())
    
    # Apply causal mask
    mask = torch.tril(torch.ones(seq_length, seq_length))
    masked_scores = scores.masked_fill(mask == 0, float('-inf'))
    
    print("\nAttention scores (after masking):")
    print(masked_scores.numpy())
    
    # Apply softmax
    attention_weights = F.softmax(masked_scores, dim=-1)
    
    print("\nAttention weights (after softmax):")
    print(attention_weights.numpy())
    print("\nNote: Each row only attends to current and previous positions!")


# Example 5: Batch generation
def example_batch_generation():
    """Demonstrate batch data generation"""
    print("\n" + "=" * 80)
    print("Example 5: Training Batch Generation")
    print("=" * 80)
    
    # Create dummy data
    data = torch.arange(0, 100)  # Simple sequence
    
    print(f"\nData: {data[:20].tolist()}... (length: {len(data)})")
    
    # Generate batch
    batch_size = 4
    block_size = 8
    
    # Random starting positions
    ix = torch.randint(len(data) - block_size, (batch_size,))
    x = torch.stack([data[i:i+block_size] for i in ix])
    y = torch.stack([data[i+1:i+block_size+1] for i in ix])
    
    print(f"\nBatch size: {batch_size}, Block size: {block_size}")
    print("\nInput sequences (x):")
    for i, seq in enumerate(x):
        print(f"  Sample {i}: {seq.tolist()}")
    
    print("\nTarget sequences (y):")
    for i, seq in enumerate(y):
        print(f"  Sample {i}: {seq.tolist()}")
    
    print("\nNote: Each target is shifted by one position!")


# Example 6: Top-k filtering
def example_topk_filtering():
    """Demonstrate top-k token filtering"""
    print("\n" + "=" * 80)
    print("Example 6: Top-K Filtering")
    print("=" * 80)
    
    # Simulate logits for 10 tokens
    torch.manual_seed(42)
    logits = torch.randn(10)
    
    print("\nOriginal logits:", logits.numpy())
    
    # Get probabilities
    probs = F.softmax(logits, dim=-1)
    print("\nProbabilities:", probs.numpy())
    
    # Apply top-k filtering
    k = 3
    top_k_probs, top_k_indices = torch.topk(probs, k)
    
    print(f"\nTop-{k} tokens:")
    for i in range(k):
        idx = top_k_indices[i].item()
        prob = top_k_probs[i].item()
        print(f"  Token {idx}: {prob:.4f}")
    
    # Create filtered distribution
    filtered_probs = torch.zeros_like(probs)
    filtered_probs[top_k_indices] = top_k_probs
    filtered_probs = filtered_probs / filtered_probs.sum()  # Renormalize
    
    print(f"\nFiltered probabilities (only top-{k}):", filtered_probs.numpy())


# Example 7: Loading and using trained model
def example_use_trained_model():
    """Demonstrate using the trained model"""
    print("\n" + "=" * 80)
    print("Example 7: Using Trained Model")
    print("=" * 80)
    
    from model import GPTLanguageModel
    from data import load_tokenizer
    
    model_path = Path('logit_model.pth')
    tokenizer_path = Path('tokenizer.pkl')
    
    if not model_path.exists():
        print("\n⚠️  Model not found. Run train.py first!")
        return
    
    # Load tokenizer
    tokenizer = load_tokenizer(tokenizer_path)
    print(f"\nLoaded tokenizer with {tokenizer.vocab_size} characters")
    
    # Load model
    checkpoint = torch.load(model_path, map_location='cpu')
    model = GPTLanguageModel(
        vocab_size=checkpoint['vocab_size'],
        n_embd=checkpoint['n_embd'],
        n_head=checkpoint['n_head'],
        n_layer=checkpoint['n_layer'],
        block_size=checkpoint['block_size']
    )
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    
    print(f"Loaded model with {sum(p.numel() for p in model.parameters()):,} parameters")
    
    # Generate text
    context = "The sciences"
    print(f"\nPrompt: '{context}'")
    
    context_ids = tokenizer.encode(context)
    idx = torch.tensor([context_ids], dtype=torch.long)
    
    with torch.no_grad():
        # Get next token predictions
        logits, _ = model(idx)
        logits = logits[:, -1, :]
        probs = F.softmax(logits, dim=-1)
        
        # Show top 5
        top_probs, top_indices = torch.topk(probs[0], 5)
        
        print("\nTop 5 next token predictions:")
        for i in range(5):
            token = tokenizer.decode([top_indices[i].item()])
            prob = top_probs[i].item()
            print(f"  '{token}': {prob:.4f}")
        
        # Generate sequence
        generated = model.generate(idx, max_new_tokens=50, temperature=0.8)
        text = tokenizer.decode(generated[0].tolist())
        print(f"\nGenerated text:\n{text[:200]}...")


def main():
    """Run all examples"""
    print("\n" + "=" * 80)
    print("🎓 QKViz - Code Examples")
    print("=" * 80)
    print("\nThese examples demonstrate core concepts used in the QKViz project.")
    print("They can run without a trained model (except Example 7).\n")
    
    examples = [
        ("Tokenizer", example_tokenizer),
        ("Forward Pass", example_forward_pass),
        ("Temperature Sampling", example_temperature_sampling),
        ("Attention Masking", example_attention_mask),
        ("Batch Generation", example_batch_generation),
        ("Top-K Filtering", example_topk_filtering),
        ("Trained Model", example_use_trained_model),
    ]
    
    for i, (name, func) in enumerate(examples, 1):
        try:
            func()
        except Exception as e:
            print(f"\n❌ Example {i} failed: {e}")
        
        if i < len(examples):
            input("\nPress Enter to continue to next example...")
    
    print("\n" + "=" * 80)
    print("✅ All examples complete!")
    print("=" * 80)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
