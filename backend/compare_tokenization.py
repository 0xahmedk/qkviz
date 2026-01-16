"""
Visual comparison between old and new tokenization strategies.
Shows how space-prefix tokenization eliminates visual noise.
"""

import re


def old_tokenizer(text):
    """Old tokenization: treats spaces as separate tokens"""
    return re.findall(r'\w+|[^\w\s]|\s+', text)


def new_tokenizer(text):
    """New tokenization: space-prefix strategy"""
    return re.findall(r' ?\S+', text)


def visualize_comparison(text):
    """Compare old vs new tokenization"""
    print("=" * 70)
    print(f"INPUT: '{text}'")
    print("=" * 70)
    
    old_tokens = old_tokenizer(text)
    new_tokens = new_tokenizer(text)
    
    print("\n📊 OLD TOKENIZATION (with standalone spaces):")
    print("-" * 70)
    print(f"Token count: {len(old_tokens)}")
    print(f"Tokens: {old_tokens}")
    print("\nToken breakdown:")
    for i, token in enumerate(old_tokens):
        space_indicator = "  ← SPACE TOKEN (visual noise!)" if token.strip() == '' else ""
        print(f"  [{i}] '{token}' (repr: {repr(token)}){space_indicator}")
    
    print("\n✨ NEW TOKENIZATION (space-prefix strategy):")
    print("-" * 70)
    print(f"Token count: {len(new_tokens)}")
    print(f"Tokens: {new_tokens}")
    print("\nToken breakdown:")
    for i, token in enumerate(new_tokens):
        space_indicator = "  ← First word" if not token.startswith(' ') else "  ← Word with space"
        print(f"  [{i}] '{token}' (repr: {repr(token)}){space_indicator}")
    
    print("\n📈 STATISTICS:")
    print("-" * 70)
    old_space_tokens = sum(1 for t in old_tokens if t.strip() == '')
    reduction = len(old_tokens) - len(new_tokens)
    
    print(f"  Old token count:        {len(old_tokens)}")
    print(f"  New token count:        {len(new_tokens)}")
    print(f"  Reduction:              {reduction} tokens ({reduction/len(old_tokens)*100:.1f}%)")
    print(f"  Space tokens removed:   {old_space_tokens}")
    print(f"  Efficiency gain:        {old_space_tokens/len(old_tokens)*100:.1f}% less noise")
    
    print("\n🎯 ATTENTION MATRIX IMPACT:")
    print("-" * 70)
    print(f"  Old matrix size:  {len(old_tokens)}x{len(old_tokens)} = {len(old_tokens)**2} cells")
    print(f"  New matrix size:  {len(new_tokens)}x{len(new_tokens)} = {len(new_tokens)**2} cells")
    print(f"  Cell reduction:   {len(old_tokens)**2 - len(new_tokens)**2} cells")
    print(f"  Zero-entropy rows removed: {old_space_tokens}")
    print("\n")


if __name__ == "__main__":
    print("\n" + "🔬" * 35)
    print(" " * 15 + "TOKENIZATION COMPARISON")
    print("🔬" * 35 + "\n")
    
    # Test Case 1: Simple sentence
    visualize_comparison("The quick brown fox")
    
    print("\n" + "=" * 70 + "\n")
    
    # Test Case 2: With punctuation
    visualize_comparison("Hello, world! How are you?")
    
    print("\n" + "=" * 70 + "\n")
    
    # Test Case 3: Multiple spaces (edge case)
    visualize_comparison("The    quick     brown")
    
    print("\n" + "🎉" * 35)
    print(" " * 10 + "SPACE-PREFIX TOKENIZATION WINS!")
    print("🎉" * 35 + "\n")
    
    print("KEY BENEFITS:")
    print("  ✅ No standalone space tokens")
    print("  ✅ Cleaner attention matrices")
    print("  ✅ Fewer zero-entropy rows")
    print("  ✅ More meaningful word-to-word relationships")
    print("  ✅ Better for educational visualization")
    print()
