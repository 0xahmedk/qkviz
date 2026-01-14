# Training Lab API - Usage Examples

## Quick Start

### 1. Start the Server

```bash
cd backend
python main.py
```

The server will start on `http://localhost:8000`

### 2. Test the New Training Lab Endpoint

#### Basic Example

```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The cat sat on the mat. The mat was soft.",
    "epochs": 20
  }'
```

#### With Custom Hyperparameters

```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world! How are you today?",
    "epochs": 30,
    "lr": 0.015,
    "embed_dim": 48,
    "n_head": 4,
    "n_layer": 3
  }'
```

### 3. Example Response

```json
{
  "history": [
    {
      "epoch": 0,
      "loss": 2.5439,
      "predicted_text": "cat was The soft . mat on the...",
      "attention_weights": [[...], [...]],
      "input_tokens": "The cat sat on the mat . The mat was ",
      "target_tokens": " cat sat on the mat . The mat was soft"
    },
    {
      "epoch": 1,
      "loss": 2.1234,
      "predicted_text": "cat sat on the mat . The mat was...",
      "attention_weights": [[...], [...]],
      "input_tokens": "The cat sat on the mat . The mat was ",
      "target_tokens": " cat sat on the mat . The mat was soft"
    }
    // ... more epochs
  ],
  "vocab": {
    "The": 0,
    "cat": 1,
    "sat": 2,
    "on": 3,
    // ... more tokens
  },
  "idx_to_token": {
    "0": "The",
    "1": "cat",
    "2": "sat",
    "3": "on",
    // ... more tokens
  },
  "vocab_size": 10
}
```

## Python Example

```python
import requests
import json

# Training Lab simulation
url = "http://localhost:8000/api/simulate"

payload = {
    "text": "The quick brown fox jumps over the lazy dog.",
    "epochs": 25,
    "lr": 0.01,
    "embed_dim": 32,
    "n_head": 2,
    "n_layer": 2
}

response = requests.post(url, json=payload)
result = response.json()

# Print training progress
print(f"Vocabulary size: {result['vocab_size']}")
print(f"Training epochs: {len(result['history'])}")

# Show loss improvement
first_loss = result['history'][0]['loss']
last_loss = result['history'][-1]['loss']
improvement = (first_loss - last_loss) / first_loss * 100

print(f"\nTraining Progress:")
print(f"  Initial loss: {first_loss:.4f}")
print(f"  Final loss: {last_loss:.4f}")
print(f"  Improvement: {improvement:.1f}%")

# Show predictions at different epochs
print(f"\nPredictions:")
for i in [0, len(result['history'])//2, -1]:
    epoch = result['history'][i]
    print(f"  Epoch {epoch['epoch']}: {epoch['predicted_text'][:50]}...")
```

## JavaScript/Frontend Example

```javascript
// Training Lab simulation
async function runTrainingSimulation(text, epochs = 20) {
  const response = await fetch("http://localhost:8000/api/simulate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      epochs: epochs,
      lr: 0.01,
    }),
  });

  const data = await response.json();

  // Visualize training progress
  console.log(`Vocabulary size: ${data.vocab_size}`);
  console.log(`Training epochs: ${data.history.length}`);

  // Plot loss curve
  const losses = data.history.map((h) => h.loss);
  plotLossCurve(losses);

  // Display attention heatmap for final epoch
  const finalEpoch = data.history[data.history.length - 1];
  displayAttentionHeatmap(finalEpoch.attention_weights);

  // Show prediction improvement
  data.history.forEach((epoch, i) => {
    console.log(`Epoch ${i}: ${epoch.predicted_text}`);
  });
}

// Example usage
runTrainingSimulation("The cat sat on the mat.", 30);
```

## Testing the Existing Generation Feature

The original `/generate` endpoint still works exactly as before:

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "context": "The",
    "temperature": 1.0,
    "top_k": 5
  }'
```

Response:

```json
{
  "next_token_predictions": [
    {"token": "quick", "probability": 0.234, "log_probability": -1.456},
    {"token": "cat", "probability": 0.189, "log_probability": -1.667},
    {"token": "dog", "probability": 0.145, "log_probability": -1.931},
    ...
  ],
  "context": "The",
  "generated_token": "quick"
}
```

## Error Handling

### Empty Text

```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"text": ""}'
```

Response (400):

```json
{
  "detail": "Text corpus cannot be empty"
}
```

### Invalid Hyperparameters

```bash
curl -X POST http://localhost:8000/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "epochs": 5000}'
```

Response (400):

```json
{
  "detail": "Epochs must be between 1 and 1000"
}
```

## Hyperparameters Guide

| Parameter    | Type   | Default | Range   | Description                   |
| ------------ | ------ | ------- | ------- | ----------------------------- |
| `text`       | string | -       | Any     | Input text corpus (required)  |
| `epochs`     | int    | 20      | 1-1000  | Number of training iterations |
| `lr`         | float  | 0.01    | 0.0-1.0 | Learning rate                 |
| `embed_dim`  | int    | 32      | >0      | Embedding dimension size      |
| `n_head`     | int    | 2       | >0      | Number of attention heads     |
| `n_layer`    | int    | 2       | >0      | Number of transformer layers  |
| `block_size` | int    | 64      | >0      | Maximum context length        |

### Recommendations:

**For quick experimentation:**

- `epochs: 10-20`
- `lr: 0.01-0.02`
- `embed_dim: 32`
- `n_head: 2`

**For better quality (slower):**

- `epochs: 50-100`
- `lr: 0.005-0.01`
- `embed_dim: 64`
- `n_head: 4`

**For long texts:**

- Increase `block_size` to 128 or 256
- May need more `epochs` and lower `lr`

## Visualization Ideas

The returned data can be used to create rich visualizations:

1. **Loss Curve**: Plot `history[i].loss` over epochs
2. **Attention Heatmap**: Visualize `history[i].attention_weights`
3. **Prediction Timeline**: Show how `predicted_text` improves
4. **Token-by-Token Comparison**: Compare input vs prediction
5. **Animation**: Animate the learning process epoch by epoch

## API Documentation

Full API documentation is available at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Troubleshooting

**Server won't start:**

- Check if PyTorch is installed: `pip list | grep torch`
- Check if FastAPI is installed: `pip list | grep fastapi`
- Run: `pip install -r requirements.txt`

**Model not found error on /generate:**

- This is expected if you haven't trained the main model yet
- Run: `python train.py` to train the model first
- The `/api/simulate` endpoint works independently and doesn't need this

**Simulation is slow:**

- Reduce `epochs` to 10-15
- Reduce `embed_dim` to 16 or 24
- Use shorter input text
- Check if CUDA is available: Model will use GPU if available
