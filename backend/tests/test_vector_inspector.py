#!/usr/bin/env python3
"""
Test script to verify the Vector Inspector feature.
Tests that Q and K vectors are properly captured from Head 0 of the last layer.
"""

import torch
from model import GPTLanguageModel
from trainer_dvr import simulate_training_run


def test_qk_vector_capture():
    """Test that Q and K vectors are captured in model internals"""
    print("=" * 80)
    print("🧪 Testing Q/K Vector Capture in Model")
    print("=" * 80)
    
    # Create a small model
    vocab_size = 50
    n_embd = 32
    n_head = 2
    n_layer = 2
    block_size = 16
    
    model = GPTLanguageModel(
        vocab_size=vocab_size,
        n_embd=n_embd,
        n_head=n_head,
        n_layer=n_layer,
        block_size=block_size,
        dropout=0.0
    )
    model.eval()
    
    # Create dummy input
    batch_size = 1
    seq_len = 8
    idx = torch.randint(0, vocab_size, (batch_size, seq_len))
    
    print(f"\n✓ Created model:")
    print(f"  Embedding dim: {n_embd}")
    print(f"  Num heads: {n_head}")
    print(f"  Num layers: {n_layer}")
    print(f"  Head size: {n_embd // n_head}")
    print(f"  Input shape: {idx.shape}")
    
    # Test forward pass with internals
    with torch.no_grad():
        logits, internals = model(idx, return_internals=True)
    
    print(f"\n✓ Forward pass completed")
    print(f"  Logits shape: {logits.shape}")
    print(f"  Internals keys: {list(internals.keys())}")
    
    # Check Q and K vectors
    if 'q_vectors' in internals and 'k_vectors' in internals:
        q_vectors = internals['q_vectors']
        k_vectors = internals['k_vectors']
        
        print(f"\n✓ Q/K vectors captured!")
        print(f"  Q vectors shape: {q_vectors.shape}")
        print(f"  K vectors shape: {k_vectors.shape}")
        print(f"  Expected shape: ({batch_size}, {seq_len}, {n_embd // n_head})")
        
        # Verify shapes
        head_size = n_embd // n_head
        assert q_vectors.shape == (batch_size, seq_len, head_size), \
            f"Q vectors shape mismatch: expected ({batch_size}, {seq_len}, {head_size}), got {q_vectors.shape}"
        assert k_vectors.shape == (batch_size, seq_len, head_size), \
            f"K vectors shape mismatch: expected ({batch_size}, {seq_len}, {head_size}), got {k_vectors.shape}"
        
        print(f"\n✓ Shape verification passed!")
        
        # Check that vectors are not all zeros
        q_mean = q_vectors.abs().mean().item()
        k_mean = k_vectors.abs().mean().item()
        print(f"\n✓ Vector statistics:")
        print(f"  Q vectors mean magnitude: {q_mean:.4f}")
        print(f"  K vectors mean magnitude: {k_mean:.4f}")
        
        assert q_mean > 0, "Q vectors are all zeros!"
        assert k_mean > 0, "K vectors are all zeros!"
        
        print(f"\n✅ Q/K vector capture test PASSED!")
        return True
    else:
        print(f"\n❌ Q/K vectors NOT found in internals!")
        return False


def test_training_simulation():
    """Test that Q and K vectors are properly captured during training simulation"""
    print("\n\n" + "=" * 80)
    print("🧪 Testing Q/K Vector Capture in Training Simulation")
    print("=" * 80)
    
    # Sample text
    text = "The quick brown fox jumps over the lazy dog"
    
    # Hyperparameters
    hyperparameters = {
        'epochs': 5,
        'lr': 0.01,
        'embed_dim': 32,
        'n_head': 2,
        'n_layer': 2,
        'block_size': 16
    }
    
    print(f"\n✓ Running simulation with {hyperparameters['epochs']} epochs...")
    print(f"  Text: \"{text}\"")
    
    # Run simulation
    result = simulate_training_run(text, hyperparameters)
    
    if 'error' in result:
        print(f"\n❌ Simulation error: {result['error']}")
        return False
    
    print(f"\n✓ Simulation completed")
    print(f"  History length: {len(result['history'])}")
    print(f"  Vocab size: {result['vocab_size']}")
    
    # Check first snapshot
    if result['history']:
        snapshot = result['history'][0]
        print(f"\n✓ Checking snapshot structure:")
        print(f"  Keys: {list(snapshot.keys())}")
        
        if 'q_vectors' in snapshot and 'k_vectors' in snapshot:
            q_vectors = snapshot['q_vectors']
            k_vectors = snapshot['k_vectors']
            
            print(f"\n✓ Q/K vectors found in snapshot!")
            print(f"  Q vectors shape: {len(q_vectors)} x {len(q_vectors[0]) if q_vectors else 0}")
            print(f"  K vectors shape: {len(k_vectors)} x {len(k_vectors[0]) if k_vectors else 0}")
            
            # Verify they're lists
            assert isinstance(q_vectors, list), "Q vectors should be a list"
            assert isinstance(k_vectors, list), "K vectors should be a list"
            
            if q_vectors:
                assert isinstance(q_vectors[0], list), "Q vectors should be a 2D list"
                print(f"\n✓ Q/K vectors are properly formatted as Python lists")
                
                # Check dimensions match expected head size
                head_size = hyperparameters['embed_dim'] // hyperparameters['n_head']
                assert len(q_vectors[0]) == head_size, \
                    f"Head size mismatch: expected {head_size}, got {len(q_vectors[0])}"
                print(f"  Head size verification: {len(q_vectors[0])} == {head_size} ✓")
            
            print(f"\n✅ Training simulation Q/K capture test PASSED!")
            return True
        else:
            print(f"\n❌ Q/K vectors NOT found in snapshot!")
            return False
    else:
        print(f"\n❌ No history snapshots generated!")
        return False


def main():
    print("=" * 80)
    print("🚀 QKViz Vector Inspector - Backend Test Suite")
    print("=" * 80)
    
    try:
        # Run tests
        test1_passed = test_qk_vector_capture()
        test2_passed = test_training_simulation()
        
        # Summary
        print("\n\n" + "=" * 80)
        print("📊 Test Summary")
        print("=" * 80)
        print(f"  Model Q/K capture test: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
        print(f"  Training simulation test: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
        
        if test1_passed and test2_passed:
            print("\n🎉 All tests PASSED! Vector Inspector backend is ready.")
            print("\n📝 Next steps:")
            print("  1. Update the API endpoint to expose q_vectors and k_vectors")
            print("  2. Create frontend components to visualize the vectors")
            print("  3. Add dot product visualization")
        else:
            print("\n⚠️  Some tests FAILED. Please review the implementation.")
        
    except Exception as e:
        print(f"\n❌ Test suite error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
