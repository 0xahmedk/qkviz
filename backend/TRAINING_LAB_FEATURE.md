# Training Lab Feature - Implementation Summary

## Overview

The "Training Lab" feature allows users to input a small text corpus (e.g., a single paragraph) and visualize how the model learns on that specific text in real-time. This feature runs **independently** from the main generation feature and uses its own fresh model and tokenizer.

## Implementation Details

### 1. Model Refactoring (`model.py`)

Added "Spy Mode" capability to extract internal states during training without breaking backward compatibility.

#### Changes Made:

**`Head` class:**

- Added optional `return_attention_weights` parameter to `forward()` method
- Default behavior unchanged (`return_attention_weights=False`)
- When `True`, returns tuple `(output, attention_weights)`

**`MultiHeadAttention` class:**

- Added optional `return_attention_weights` parameter
- Collects attention weights from all heads when enabled
- Returns attention weights as a list

**`Block` class:**

- Added optional `return_attention_weights` parameter
- Passes the parameter through to the attention layer
- Returns attention weights from the last block only

**`GPTLanguageModel` class:**

- Added optional `return_internals` parameter to `forward()` method
- **Default behavior:** `return_internals=False` → Returns `(logits, loss)` (preserves existing API)
- **Spy mode:** `return_internals=True` → Returns `(logits, internals)` where `internals` is a dict containing:
  - `attention_weights`: List of attention matrices from the last layer (one per head)
  - `loss`: The computed loss (if targets are provided)

#### Backward Compatibility:

✅ All existing code continues to work without modification:

- `train.py` uses default `return_internals=False`
- `/generate` endpoint uses default `return_internals=False`
- The `generate()` method is unchanged
- Pretrained `logit_model.pth` loads and works normally

### 2. Training Simulator (`trainer_dvr.py`)

New file that handles the "Training Simulation" logic for the Training Lab feature.

#### Key Function: `simulate_training_run(text_corpus: str, hyperparameters: dict)`

**Process:**

1. **Fresh Tokenization**: Creates a temporary word-level tokenizer specifically for the input text

   - Uses `WordTokenizer` class from `data.py`
   - Vocabulary contains only words from the user's input
   - Ensures clean visualization without irrelevant tokens

2. **Model Initialization**: Creates a small, fresh model

   - Default: `embed_dim=32, n_head=2, n_layer=2, block_size=64`
   - No dropout (for stable visualization)
   - All parameters are randomly initialized

3. **Training Loop**: Trains for specified epochs (default: 20)

   - Uses the entire input text as a single training sequence
   - Records snapshot at each epoch:
     - `epoch`: Current epoch number
     - `loss`: Training loss value
     - `predicted_text`: Greedy decode of model's predictions
     - `attention_weights`: Attention matrix from first head of last layer
     - `input_tokens`: Decoded input sequence
     - `target_tokens`: Decoded target sequence

4. **Return Value**: Dictionary containing:
   - `history`: List of snapshots (one per epoch)
   - `vocab`: Token-to-index mapping
   - `idx_to_token`: Index-to-token mapping
   - `vocab_size`: Size of the vocabulary

**Hyperparameters:**

- `epochs`: Number of training epochs (default: 20)
- `lr`: Learning rate (default: 0.01)
- `embed_dim`: Embedding dimension (default: 32)
- `n_head`: Number of attention heads (default: 2)
- `n_layer`: Number of transformer layers (default: 2)
- `block_size`: Maximum context length (default: 64)

### 3. API Endpoint (`main.py`)

Added new endpoint: `POST /api/simulate`

#### Request Model: `SimulateRequest`

```python
{
    "text": str,              # Required: User's input text
    "epochs": int = 20,       # Optional: Number of training epochs
    "lr": float = 0.01,       # Optional: Learning rate
    "embed_dim": int = 32,    # Optional: Embedding dimension
    "n_head": int = 2,        # Optional: Number of attention heads
    "n_layer": int = 2,       # Optional: Number of layers
    "block_size": int = 64    # Optional: Context length
}
```

#### Response Model: `SimulateResponse`

```python
{
    "history": List[Dict],    # Training history snapshots
    "vocab": Dict,            # Token to index mapping
    "idx_to_token": Dict,     # Index to token mapping
    "vocab_size": int,        # Vocabulary size
    "error": Optional[str]    # Error message if any
}
```

#### Validation:

- Text cannot be empty
- Epochs must be between 1 and 1000
- Learning rate must be between 0 and 1

#### Example Usage:

```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog.",
    "epochs": 30,
    "lr": 0.01
  }'
```

## Testing

A test script `test_compatibility.py` has been created to verify:

1. **Backward Compatibility Tests:**

   - Forward pass without targets (generation mode)
   - Forward pass with targets (training mode)
   - Generate method functionality

2. **New Feature Tests:**
   - Forward pass with `return_internals=True`
   - Proper structure of internals dictionary
   - Attention weights extraction

**Run tests:**

```bash
cd backend
python test_compatibility.py
```

## Architecture Decisions

### Why Separate Tokenizer?

The Training Lab uses a fresh tokenizer for each simulation because:

- **Clean visualization**: Only shows words relevant to user's input
- **Independence**: Doesn't interfere with the main pretrained model
- **Educational value**: Users see the model learn their specific vocabulary

### Why Small Model?

Default parameters are kept small:

- **Fast training**: Converges quickly for real-time visualization
- **Resource efficient**: Can run on CPU
- **Educational clarity**: Simpler to understand and visualize

### Why Greedy Decoding?

Training history uses greedy decoding (argmax) instead of sampling:

- **Deterministic**: Same input always produces same visualization
- **Clear progression**: Shows model improvement more clearly
- **Simpler to interpret**: Users see the "most likely" prediction

## File Structure

```
backend/
├── model.py              # ✨ Modified: Added return_internals parameter
├── trainer_dvr.py        # ✨ New: Training simulation logic
├── main.py               # ✨ Modified: Added /api/simulate endpoint
├── train.py              # ✅ Unchanged: Original training script
├── data.py               # ✅ Unchanged: Tokenizer and data utilities
├── test_compatibility.py # ✨ New: Backward compatibility tests
└── logit_model.pth       # ✅ Unchanged: Pretrained model
```

## Preserved Functionality

✅ **Training Script (`train.py`)**: Works exactly as before
✅ **Generation Endpoint (`/generate`)**: No changes to behavior
✅ **Pretrained Model**: Loads and generates as expected
✅ **Tokenizer**: Main tokenizer remains unchanged
✅ **Model Architecture**: Same structure, just added optional parameter

## Next Steps for Frontend Integration

The frontend can now:

1. **Create a Training Lab UI** with:

   - Text input area for user's corpus
   - Hyperparameter controls (epochs, learning rate, etc.)
   - Start training button

2. **Visualize Training Progress**:

   - Plot loss over epochs
   - Show predicted text at each epoch
   - Display attention heatmap
   - Animate the learning process

3. **Example API Call**:

```javascript
const response = await fetch("http://localhost:8000/api/simulate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: userInputText,
    epochs: 20,
    lr: 0.01,
  }),
});

const data = await response.json();
// data.history contains all training snapshots
// data.vocab contains the vocabulary mapping
```

## Summary

✅ **Model refactored** with optional `return_internals` parameter
✅ **Training simulator** created in `trainer_dvr.py`
✅ **API endpoint** added at `/api/simulate`
✅ **Backward compatibility** fully preserved
✅ **Tests created** to verify functionality
✅ **Documentation** provided

The implementation is complete and ready for frontend integration!
