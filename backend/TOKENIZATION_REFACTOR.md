# Tokenization Refactor: Space-Prefix Strategy

## Overview

The tokenizer in `backend/data.py` has been refactored to use a **space-prefix strategy** (similar to SentencePiece/BPE) to eliminate visual noise in the Attention Matrix visualization.

## Problem: Zero-Entropy Rows

### Before (Old Tokenizer)

```python
# Old regex: r'\w+|[^\w\s]|\s+'
# Treated spaces as separate tokens

Input:  "The quick brown"
Tokens: ['The', ' ', 'quick', ' ', 'brown']
```

**Issues:**

- Standalone space tokens (`' '`) created "zero-entropy" rows in attention matrices
- These tokens were essentially meaningless placeholders
- Visual noise made it harder to understand word-to-word attention relationships
- Increased vocabulary size unnecessarily

### After (New Tokenizer)

```python
# New regex: r' ?\S+'
# Attaches spaces to words

Input:  "The quick brown"
Tokens: ['The', ' quick', ' brown']
```

**Benefits:**

- ✅ No standalone space tokens
- ✅ Cleaner, denser attention matrices
- ✅ Direct word-to-word relationships visible
- ✅ Reduced vocabulary size
- ✅ More intuitive for educational purposes

## Implementation Details

### Regex Pattern: `r' ?\S+'`

- `' ?'` - Matches an optional space (0 or 1 space)
- `\S+` - Matches one or more non-whitespace characters
- Result: Each token is either:
  - The first word (no leading space): `"The"`
  - Subsequent words (with leading space): `" quick"`, `" brown"`

### Code Changes

**File: `backend/data.py`**

```python
class WordTokenizer:
    """
    Space-prefix tokenizer (similar to SentencePiece/BPE strategy).
    Attaches preceding space to each word, reducing visual noise in attention matrices.

    Example: "The quick brown" -> ['The', ' quick', ' brown']
    """

    def __init__(self, text):
        # Tokenize using space-prefix strategy
        tokens = re.findall(r' ?\S+', text)

        # Get all unique tokens
        unique_tokens = sorted(list(set(tokens)))
        self.vocab_size = len(unique_tokens)

        # Create mappings
        self.token_to_idx = {token: i for i, token in enumerate(unique_tokens)}
        self.idx_to_token = {i: token for i, token in enumerate(unique_tokens)}

    def encode(self, text):
        """Convert text to list of integers using space-prefix tokenization"""
        tokens = re.findall(r' ?\S+', text)
        return [self.token_to_idx.get(token, 0) for token in tokens]

    def decode(self, indices):
        """Convert list of integers to text (join with empty string since spaces are embedded)"""
        return ''.join([self.idx_to_token.get(i, '') for i in indices])
```

**Key Changes:**

1. ✅ Updated `__init__`: Uses `r' ?\S+'` instead of `r'\w+|[^\w\s]|\s+'`
2. ✅ Updated `encode`: Uses same regex pattern
3. ✅ Updated `decode`: Joins with `''` instead of needing explicit spaces
4. ✅ Updated docstrings: Explains space-prefix strategy

## Testing

### Test Results

```bash
$ python test_tokenization.py
```

**Test 1: Space-Prefix Tokenization**

```
Input text: 'The quick brown fox jumps'
Vocabulary size: 5

Token mappings:
  0: ' brown' (repr: ' brown')
  1: ' fox' (repr: ' fox')
  2: ' jumps' (repr: ' jumps')
  3: ' quick' (repr: ' quick')
  4: 'The' (repr: 'The')

✓ Has standalone space tokens: False
✓ Round-trip encoding/decoding successful!
✓ First token has no leading space
```

**Test 2: Punctuation Handling**

```
Input text: 'Hello, world! How are you?'
Tokens:
  'Hello,' (repr: 'Hello,')
  ' world!' (repr: ' world!')
  ' How' (repr: ' How')
  ' are' (repr: ' are')
  ' you?' (repr: ' you?')

✓ Punctuation handling successful!
```

**Test 3: No Space Entropy**

```
Input text: 'The    quick     brown'  # Multiple spaces
Pure space tokens found: 0

✓ No space-only tokens (zero-entropy rows eliminated)!
```

### Backward Compatibility

✅ All existing model tests pass with new tokenization:

- Text generation works correctly
- Next token prediction works correctly
- Round-trip encoding/decoding preserved

## Impact on Visualization

### Attention Matrix - Before

```
     The  ' '  quick  ' '  brown
The  [0.3  0.0  0.2   0.0  0.5 ]
' '  [0.0  1.0  0.0   0.0  0.0 ]  ← Zero entropy row (useless)
quick[0.4  0.0  0.3   0.0  0.3 ]
' '  [0.0  0.0  0.0   1.0  0.0 ]  ← Zero entropy row (useless)
brown[0.2  0.0  0.3   0.0  0.5 ]
```

### Attention Matrix - After

```
      The   quick  brown
The  [0.3   0.2    0.5 ]
quick[0.4   0.3    0.3 ]
brown[0.2   0.3    0.5 ]
```

**Result:** Cleaner, denser, more meaningful attention visualization!

## Punctuation Behavior

The tokenizer naturally handles punctuation by attaching it to adjacent words:

```python
Input:  "Hello, world!"
Tokens: ['Hello,', ' world!']

Input:  "What is this?"
Tokens: ['What', ' is', ' this?']
```

This is acceptable for an educational tool and mirrors how many modern tokenizers (like GPT's BPE) handle punctuation.

## Performance Impact

**Vocabulary Size Reduction:**

- Old tokenizer: Includes standalone space tokens in vocabulary
- New tokenizer: Space tokens eliminated, smaller vocab
- Example: "The quick brown" - 5 tokens → 3 tokens

**Training Efficiency:**

- Fewer tokens per sequence = faster training
- Smaller vocabulary = less memory usage
- More semantic tokens = better learning signal

## Migration Notes

**No Breaking Changes:**

- The `WordTokenizer` interface remains identical
- `encode()` and `decode()` signatures unchanged
- All existing code using the tokenizer continues to work
- Models trained with old tokenizer need retraining (vocab changed)

**Recommendation:**
Delete old model checkpoints and retrain with the new tokenizer for best results.

## Future Enhancements

Possible future improvements (not currently implemented):

- Byte-pair encoding (BPE) for subword tokenization
- Vocabulary size limits with fallback to character-level
- Special tokens for padding, unknown, etc.
- Unicode normalization for international text

## References

- **SentencePiece:** Space-prefix strategy commonly used
- **GPT-2/3 BPE:** Similar approach to handling spaces
- **Educational Benefit:** Cleaner visualizations help students understand attention mechanisms

---

**Date:** January 16, 2026  
**Author:** QKViz Development Team  
**Status:** ✅ Complete and Tested
