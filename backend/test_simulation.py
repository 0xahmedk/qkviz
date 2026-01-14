"""
Test the trainer_dvr simulation functionality.
"""

from trainer_dvr import simulate_training_run

def test_simulation():
    """Test the training simulation with sample text"""
    print("=== Testing Training Simulation ===\n")
    
    # Sample text
    text = "The quick brown fox jumps over the lazy dog. The dog was sleeping."
    
    # Hyperparameters
    hyperparameters = {
        'epochs': 10,
        'lr': 0.01,
        'embed_dim': 32,
        'n_head': 2,
        'n_layer': 2,
        'block_size': 64
    }
    
    print(f"Input text: {text}")
    print(f"Hyperparameters: {hyperparameters}\n")
    
    # Run simulation
    print("Running simulation...")
    result = simulate_training_run(text, hyperparameters)
    
    # Check results
    assert 'history' in result, "Expected 'history' in result"
    assert 'vocab' in result, "Expected 'vocab' in result"
    assert 'idx_to_token' in result, "Expected 'idx_to_token' in result"
    assert 'vocab_size' in result, "Expected 'vocab_size' in result"
    
    print(f"✓ Simulation completed successfully!")
    print(f"  - Vocabulary size: {result['vocab_size']}")
    print(f"  - Number of epochs: {len(result['history'])}")
    print(f"  - Sample tokens: {list(result['vocab'].keys())[:10]}")
    
    # Check history structure
    first_epoch = result['history'][0]
    last_epoch = result['history'][-1]
    
    print(f"\n📊 Training Progress:")
    print(f"  - Epoch 0 loss: {first_epoch['loss']:.4f}")
    print(f"  - Epoch {len(result['history'])-1} loss: {last_epoch['loss']:.4f}")
    print(f"  - Loss reduction: {((first_epoch['loss'] - last_epoch['loss']) / first_epoch['loss'] * 100):.1f}%")
    
    print(f"\n🔮 Predictions:")
    print(f"  - Epoch 0: {first_epoch['predicted_text'][:50]}...")
    print(f"  - Epoch {len(result['history'])-1}: {last_epoch['predicted_text'][:50]}...")
    
    print(f"\n✅ Attention weights shape: {len(first_epoch['attention_weights'])}x{len(first_epoch['attention_weights'][0])}")
    
    print("\n🎉 Training simulation test passed!")

if __name__ == "__main__":
    test_simulation()
