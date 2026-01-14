# QKViz - Interactive LLM Visualization

An educational tool to understand how Large Language Models work internally. Built with PyTorch and FastAPI.

## Project Structure

```
backend/
├── model.py          # GPT architecture (Transformer blocks, attention, etc.)
├── data.py           # Character-level tokenizer and data loading
├── train.py          # Training script
├── main.py           # FastAPI server with generation endpoints
├── requirements.txt  # Python dependencies
└── assets/
    └── muqaddimah.txt  # Training corpus (Ibn Khaldun's text)
```

## Features

- **From-scratch Transformer**: No HuggingFace, pure PyTorch implementation
- **Character-level tokenization**: Simple and educational
- **Interactive API**: Get top-k token predictions with probabilities
- **Step-by-step generation**: See the model's decision-making process
- **Small & fast**: Trains on CPU in minutes

## Setup

1. **Install dependencies:**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Train the model:**

   ```bash
   python train.py
   ```

   This will:

   - Load `muqaddimah.txt`
   - Create a character-level tokenizer
   - Train a minimal GPT model (4 layers, 4 heads, 64 embedding dim)
   - Save weights to `logit_model.pth`
   - Save tokenizer to `tokenizer.pkl`

   Training takes ~5-10 minutes on CPU (5000 iterations)

3. **Run the API server:**

   ```bash
   python main.py
   ```

   Server runs at http://localhost:8000

## API Endpoints

### `GET /` - Root

Returns API status and model loading state

### `GET /health` - Health Check

Check if the API and model are ready

### `POST /generate` - Step-by-step Generation

Generate next token predictions with probabilities.

**Request:**

```json
{
  "context": "In the Name of",
  "temperature": 1.0,
  "top_k": 5
}
```

**Response:**

```json
{
  "next_token_predictions": [
    {
      "token": " ",
      "probability": 0.34,
      "log_probability": -1.08
    },
    {
      "token": "G",
      "probability": 0.28,
      "log_probability": -1.27
    },
    ...
  ],
  "context": "In the Name of",
  "generated_token": " "
}
```

### `POST /generate-sequence` - Full Generation

Generate a complete sequence of text.

**Request:**

```json
{
  "context": "The sciences",
  "temperature": 0.8,
  "max_tokens": 100
}
```

### `GET /vocab` - Vocabulary Info

Get vocabulary size and sample characters.

## Model Architecture

The model is a minimal GPT-style decoder-only transformer:

- **Head**: Single self-attention head with causal masking
- **MultiHeadAttention**: Parallel attention heads
- **FeedForward**: 2-layer MLP with GELU activation
- **Block**: Pre-norm transformer block (attention + FFN + residual)
- **GPTLanguageModel**: Full model with token + position embeddings

### Hyperparameters

```python
n_embd = 64        # Embedding dimension
n_head = 4         # Number of attention heads
n_layer = 4        # Number of transformer blocks
block_size = 128   # Maximum context length
vocab_size = ~80   # Number of unique characters
```

## Key Concepts Demonstrated

1. **Character-level Tokenization**: Simplest form of tokenization
2. **Self-Attention**: How tokens attend to previous tokens
3. **Causal Masking**: Preventing future token leakage
4. **Multi-head Attention**: Parallel attention patterns
5. **Layer Normalization**: Stabilizing training
6. **Residual Connections**: Enabling deep networks
7. **Temperature Sampling**: Controlling randomness
8. **Logits vs Probabilities**: Raw scores vs normalized probabilities

## Usage Examples

### Training

```bash
python train.py
```

### Testing Generation (Python)

```python
from data import load_tokenizer
from model import GPTLanguageModel
import torch

# Load model
checkpoint = torch.load('logit_model.pth')
tokenizer = load_tokenizer('tokenizer.pkl')

model = GPTLanguageModel(
    vocab_size=checkpoint['vocab_size'],
    n_embd=checkpoint['n_embd'],
    n_head=checkpoint['n_head'],
    n_layer=checkpoint['n_layer'],
    block_size=checkpoint['block_size']
)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

# Generate
context = "The sciences"
context_ids = tokenizer.encode(context)
idx = torch.tensor([context_ids], dtype=torch.long)

generated = model.generate(idx, max_new_tokens=100, temperature=0.8)
print(tokenizer.decode(generated[0].tolist()))
```

### Testing API (curl)

```bash
# Start server
python main.py

# Test generation
curl -X POST "http://localhost:8000/generate" \
  -H "Content-Type: application/json" \
  -d '{"context": "The sciences", "temperature": 0.8, "top_k": 5}'
```

## Next Steps for Frontend

The API is designed to support interactive visualization:

1. **Token-by-token generation**: Call `/generate` repeatedly, appending chosen tokens
2. **Probability visualization**: Display top-k predictions as bar charts
3. **Temperature control**: Slider to adjust randomness
4. **Attention visualization**: (Future) Show attention weights between tokens
5. **Training progress**: (Future) Show loss curves during training

## Educational Notes

This implementation prioritizes **clarity over performance**:

- ✅ Easy to understand architecture
- ✅ Well-commented code
- ✅ Small enough to grasp fully
- ❌ Not optimized for production use
- ❌ No Flash Attention, KV cache, etc.

Perfect for learning, not for deployment!

## Dependencies

- `torch>=2.0.0` - PyTorch for neural networks
- `fastapi>=0.104.0` - Web API framework
- `uvicorn>=0.24.0` - ASGI server
- `pydantic>=2.0.0` - Data validation

## License

Educational project - feel free to learn from and modify!
