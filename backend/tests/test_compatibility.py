"""
Test script to verify backward compatibility of the model changes.
Tests that the existing generation code still works with return_internals=False (default).
"""

import torch
from model import GPTLanguageModel

def test_backward_compatibility():
    """Test that the model still works with the old API (no return_internals)"""
    print("=== Testing Backward Compatibility ===\n")
    
    # Create a small test model
    vocab_size = 100
    model = GPTLanguageModel(
        vocab_size=vocab_size,
        n_embd=32,
        n_head=2,
        n_layer=2,
        block_size=64
    )
    
    # Test 1: Forward pass without targets (generation mode)
    print("Test 1: Forward pass without targets (generation mode)")
    idx = torch.randint(0, vocab_size, (1, 10))
    logits, loss = model(idx)
    assert logits.shape == (1, 10, vocab_size), f"Expected shape (1, 10, {vocab_size}), got {logits.shape}"
    assert loss is None, f"Expected loss=None, got {loss}"
    print("✓ Passed: Returns (logits, None) when no targets provided\n")
    
    # Test 2: Forward pass with targets (training mode)
    print("Test 2: Forward pass with targets (training mode)")
    targets = torch.randint(0, vocab_size, (1, 10))
    logits, loss = model(idx, targets=targets)
    assert logits.shape == (1, 10, vocab_size), f"Expected shape (1, 10, {vocab_size}), got {logits.shape}"
    assert loss is not None, f"Expected loss to be computed, got None"
    assert isinstance(loss.item(), float), f"Expected loss to be a scalar, got {type(loss)}"
    print(f"✓ Passed: Returns (logits, loss) when targets provided (loss={loss.item():.4f})\n")
    
    # Test 3: Generate method still works
    print("Test 3: Generate method")
    generated = model.generate(idx, max_new_tokens=5)
    assert generated.shape == (1, 15), f"Expected shape (1, 15), got {generated.shape}"
    print(f"✓ Passed: Generate method works (generated {generated.shape[1]} total tokens)\n")
    
    print("=== All Backward Compatibility Tests Passed! ===\n")


def test_new_spy_mode():
    """Test the new return_internals feature"""
    print("=== Testing New 'Spy Mode' Feature ===\n")
    
    # Create a small test model
    vocab_size = 100
    model = GPTLanguageModel(
        vocab_size=vocab_size,
        n_embd=32,
        n_head=2,
        n_layer=2,
        block_size=64
    )
    
    # Test 4: Forward pass with return_internals=True
    print("Test 4: Forward pass with return_internals=True")
    idx = torch.randint(0, vocab_size, (1, 10))
    targets = torch.randint(0, vocab_size, (1, 10))
    logits, internals = model(idx, targets=targets, return_internals=True)
    
    assert logits.shape == (1, 10, vocab_size), f"Expected shape (1, 10, {vocab_size}), got {logits.shape}"
    assert isinstance(internals, dict), f"Expected internals to be dict, got {type(internals)}"
    assert 'loss' in internals, "Expected 'loss' in internals"
    assert 'attention_weights' in internals, "Expected 'attention_weights' in internals"
    
    print(f"✓ Passed: Returns (logits, internals) with return_internals=True")
    print(f"  - Loss: {internals['loss'].item():.4f}")
    print(f"  - Attention weights: {len(internals['attention_weights'])} heads")
    print(f"  - Attention shape: {internals['attention_weights'][0].shape}\n")
    
    print("=== All New Feature Tests Passed! ===\n")


if __name__ == "__main__":
    test_backward_compatibility()
    test_new_spy_mode()
    print("🎉 All tests passed! The model is backward compatible and the new feature works!")
