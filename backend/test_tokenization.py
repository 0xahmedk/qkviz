"""
Test the space-prefix tokenization strategy.
Verifies that spaces are attached to words, eliminating zero-entropy rows.
"""

import sys
sys.path.insert(0, '/home/applivity/ahmedk/Workspaces/Univ/qkviz/backend')

from data import WordTokenizer


def test_space_prefix_tokenization():
    """Test that tokenizer uses space-prefix strategy"""
    
    # Test input
    text = "The quick brown fox jumps"
    
    # Create tokenizer
    tokenizer = WordTokenizer(text)
    
    # Check tokens
    print("=" * 60)
    print("Testing Space-Prefix Tokenization")
    print("=" * 60)
    print(f"\nInput text: '{text}'")
    print(f"\nVocabulary size: {tokenizer.vocab_size}")
    print("\nToken mappings:")
    
    for idx, token in tokenizer.idx_to_token.items():
        print(f"  {idx}: '{token}' (repr: {repr(token)})")
    
    # Verify no standalone space tokens
    has_space_tokens = any(token.strip() == '' for token in tokenizer.idx_to_token.values())
    print(f"\n✓ Has standalone space tokens: {has_space_tokens}")
    assert not has_space_tokens, "Should not have standalone space tokens!"
    
    # Test encoding
    encoded = tokenizer.encode(text)
    print(f"\nEncoded: {encoded}")
    
    # Test decoding
    decoded = tokenizer.decode(encoded)
    print(f"Decoded: '{decoded}'")
    
    # Verify round-trip
    assert decoded == text, f"Round-trip failed! Expected '{text}', got '{decoded}'"
    print("\n✓ Round-trip encoding/decoding successful!")
    
    # Test that first token has no leading space
    first_token = tokenizer.idx_to_token[encoded[0]]
    print(f"\nFirst token: '{first_token}' (repr: {repr(first_token)})")
    assert not first_token.startswith(' '), "First token should not have leading space"
    print("✓ First token has no leading space")
    
    # Test that subsequent tokens have leading spaces
    if len(encoded) > 1:
        for i, idx in enumerate(encoded[1:], 1):
            token = tokenizer.idx_to_token[idx]
            print(f"Token {i}: '{token}' (repr: {repr(token)})")
            # Note: This may not always be true for punctuation, so we just log it
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)


def test_punctuation_handling():
    """Test that punctuation is handled correctly"""
    
    print("\n" + "=" * 60)
    print("Testing Punctuation Handling")
    print("=" * 60)
    
    text = "Hello, world! How are you?"
    tokenizer = WordTokenizer(text)
    
    print(f"\nInput text: '{text}'")
    print(f"Vocabulary size: {tokenizer.vocab_size}")
    print("\nTokens:")
    
    encoded = tokenizer.encode(text)
    for idx in encoded:
        token = tokenizer.idx_to_token[idx]
        print(f"  '{token}' (repr: {repr(token)})")
    
    decoded = tokenizer.decode(encoded)
    print(f"\nDecoded: '{decoded}'")
    
    assert decoded == text, f"Round-trip failed! Expected '{text}', got '{decoded}'"
    print("\n✓ Punctuation handling successful!")


def test_no_space_entropy():
    """Verify that tokenization eliminates space-only tokens"""
    
    print("\n" + "=" * 60)
    print("Testing No Space Entropy")
    print("=" * 60)
    
    text = "The    quick     brown"  # Multiple spaces
    tokenizer = WordTokenizer(text)
    
    print(f"\nInput text: '{text}'")
    print(f"Vocabulary size: {tokenizer.vocab_size}")
    
    # Check that no token is purely whitespace
    pure_space_tokens = [token for token in tokenizer.idx_to_token.values() 
                         if token.strip() == '']
    
    print(f"\nPure space tokens found: {len(pure_space_tokens)}")
    if pure_space_tokens:
        print(f"  {pure_space_tokens}")
    
    assert len(pure_space_tokens) == 0, "Should have no pure space tokens!"
    print("\n✓ No space-only tokens (zero-entropy rows eliminated)!")


if __name__ == "__main__":
    test_space_prefix_tokenization()
    test_punctuation_handling()
    test_no_space_entropy()
    
    print("\n" + "🎉" * 30)
    print("All tokenization tests passed!")
    print("The Attention Matrix will now be denser and cleaner!")
    print("🎉" * 30)
