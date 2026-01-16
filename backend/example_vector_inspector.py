#!/usr/bin/env python3
"""
Example: How to use the Vector Inspector feature.
Demonstrates extracting and visualizing Q and K vectors.
"""

import torch
import numpy as np
from model import GPTLanguageModel
from trainer_dvr import simulate_training_run


def example_basic_usage():
    """Basic example: Extract Q/K vectors from a forward pass"""
    print("=" * 80)
    print("Example 1: Basic Q/K Vector Extraction")
    print("=" * 80)
    
    # Create a small model
    model = GPTLanguageModel(
        vocab_size=50,
        n_embd=32,
        n_head=2,
        n_layer=2,
        block_size=16,
        dropout=0.0
    )
    model.eval()
    
    # Create sample input (batch_size=1, seq_len=5)
    # Use valid token indices (0 to vocab_size-1)
    idx = torch.tensor([[10, 20, 30, 40, 5]])
    
    # Forward pass with internals
    with torch.no_grad():
        logits, internals = model(idx, return_internals=True)
    
    # Extract Q and K vectors
    q_vectors = internals['q_vectors'][0]  # Remove batch dimension: (5, 16)
    k_vectors = internals['k_vectors'][0]  # Remove batch dimension: (5, 16)
    
    print(f"\nQ vectors shape: {q_vectors.shape}")
    print(f"K vectors shape: {k_vectors.shape}")
    print(f"\nFirst token's Q vector (first 8 dims):")
    print(f"  {q_vectors[0, :8].numpy()}")
    print(f"\nFirst token's K vector (first 8 dims):")
    print(f"  {k_vectors[0, :8].numpy()}")
    
    return q_vectors, k_vectors


def example_dot_product_computation(q_vectors, k_vectors):
    """Show how to compute dot products manually"""
    print("\n" + "=" * 80)
    print("Example 2: Computing Dot Products Manually")
    print("=" * 80)
    
    seq_len, head_size = q_vectors.shape
    
    # Compute dot product for token 0 with all other tokens
    token_idx = 0
    q = q_vectors[token_idx]  # Query vector for token 0
    
    print(f"\nComputing attention scores for token {token_idx}:")
    print(f"  Q[{token_idx}] @ K[j]^T for all j\n")
    
    for j in range(seq_len):
        k = k_vectors[j]
        
        # Dot product (scaled)
        dot_product = torch.dot(q, k).item()
        scaled_score = dot_product / (head_size ** 0.5)
        
        print(f"  Token {token_idx} → Token {j}:")
        print(f"    Raw dot product: {dot_product:7.3f}")
        print(f"    Scaled score:    {scaled_score:7.3f}")


def example_attention_mechanism(q_vectors, k_vectors):
    """Show the full attention computation"""
    print("\n" + "=" * 80)
    print("Example 3: Full Attention Matrix Computation")
    print("=" * 80)
    
    seq_len, head_size = q_vectors.shape
    
    # Compute full attention matrix (before softmax and masking)
    # Shape: (seq_len, seq_len)
    attention_scores = q_vectors @ k_vectors.T / (head_size ** 0.5)
    
    print(f"\nRaw attention scores (Q @ K^T / sqrt(d_k)):")
    print(f"Shape: {attention_scores.shape}\n")
    
    # Show as a formatted matrix
    print("     " + "".join(f"  T{i}" for i in range(seq_len)))
    for i in range(seq_len):
        row_str = f"T{i}  "
        for j in range(seq_len):
            row_str += f"{attention_scores[i, j]:5.2f} "
        print(row_str)
    
    print("\n✓ This matrix shows the 'affinity' between each token pair")
    print("✓ Higher values = stronger attention")
    print("✓ In the actual model, this gets masked (causal) + softmaxed")


def example_training_simulation():
    """Example using the training simulation API"""
    print("\n" + "=" * 80)
    print("Example 4: Q/K Vectors in Training Simulation")
    print("=" * 80)
    
    text = "Hello world"
    hyperparameters = {
        'epochs': 3,
        'lr': 0.01,
        'embed_dim': 32,
        'n_head': 2,
        'n_layer': 2,
        'block_size': 16
    }
    
    print(f"\nRunning simulation on: \"{text}\"")
    result = simulate_training_run(text, hyperparameters)
    
    if 'error' not in result:
        print(f"\n✓ Simulation completed: {len(result['history'])} epochs")
        
        # Show Q/K vectors from first and last epoch
        first_snapshot = result['history'][0]
        last_snapshot = result['history'][-1]
        
        print(f"\n📊 Epoch 0:")
        print(f"  Loss: {first_snapshot['loss']:.4f}")
        print(f"  Q vectors shape: {len(first_snapshot['q_vectors'])} × {len(first_snapshot['q_vectors'][0])}")
        print(f"  K vectors shape: {len(first_snapshot['k_vectors'])} × {len(first_snapshot['k_vectors'][0])}")
        
        print(f"\n📊 Epoch {len(result['history']) - 1}:")
        print(f"  Loss: {last_snapshot['loss']:.4f}")
        print(f"  Q vectors shape: {len(last_snapshot['q_vectors'])} × {len(last_snapshot['q_vectors'][0])}")
        
        # Show how vectors change during training
        first_q = np.array(first_snapshot['q_vectors'][0])
        last_q = np.array(last_snapshot['q_vectors'][0])
        
        print(f"\n📈 Q vector evolution (first token, first 8 dims):")
        print(f"  Epoch 0:    {first_q[:8]}")
        print(f"  Epoch {len(result['history']) - 1}:    {last_q[:8]}")
        print(f"  Change:     {last_q[:8] - first_q[:8]}")


def example_visualization_ideas():
    """Show ideas for frontend visualization"""
    print("\n" + "=" * 80)
    print("Example 5: Visualization Ideas for Frontend")
    print("=" * 80)
    
    print("""
🎨 Visualization Options:

1. **Vector Heatmap**
   - Rows: Tokens in sequence
   - Columns: Vector dimensions
   - Color: Value magnitude (red=positive, blue=negative)
   - Shows the "fingerprint" of each token

2. **Dot Product Matrix**
   - Show Q[i] · K[j] for all pairs
   - Matches attention weights (before softmax)
   - Interactive: hover to highlight source Q and K vectors

3. **Vector Magnitude Chart**
   - Bar chart of ||Q[i]|| and ||K[i]|| per token
   - Shows which tokens have "stronger" representations

4. **Animation Across Epochs**
   - Slider to move through training epochs
   - Watch Q/K vectors evolve and stabilize
   - See how attention patterns emerge

5. **Interactive Inspector**
   - Click attention cell (i, j)
   - Highlight Q[i] and K[j] vectors
   - Show computation: sum(Q[i] * K[j]) / sqrt(d_k)
   - Explain why attention is high/low

6. **Dimension Importance**
   - Which dimensions contribute most to attention?
   - Show Q[i] * K[j] element-wise
   - Helps understand what the model "looks for"
    """)


def main():
    print("=" * 80)
    print("🔬 QKViz Vector Inspector - Usage Examples")
    print("=" * 80)
    print()
    
    try:
        # Run examples
        q_vecs, k_vecs = example_basic_usage()
        example_dot_product_computation(q_vecs, k_vecs)
        example_attention_mechanism(q_vecs, k_vecs)
        example_training_simulation()
        example_visualization_ideas()
        
        print("\n" + "=" * 80)
        print("✅ All examples completed successfully!")
        print("=" * 80)
        print("\n💡 Next: Use these patterns to build frontend visualizations")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
