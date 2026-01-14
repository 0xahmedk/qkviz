"""
FastAPI backend for the QKViz interactive LLM visualization tool.
Provides endpoints for text generation with step-by-step token probabilities.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import torch
import torch.nn.functional as F
from typing import List, Dict, Optional

from model import GPTLanguageModel
from data import load_tokenizer
from trainer_dvr import simulate_training_run


# Initialize FastAPI app
app = FastAPI(title="QKViz", description="Interactive Glass Box Visualization of LLMs")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
MODEL_PATH = Path(__file__).parent / "logit_model.pth"
TOKENIZER_PATH = Path(__file__).parent / "tokenizer.pkl"

# Global variables for model and tokenizer
model = None
tokenizer = None
device = None


class GenerateRequest(BaseModel):
    context: str
    temperature: float = 1.0
    top_k: int = 5


class TokenProbability(BaseModel):
    token: str
    probability: float
    log_probability: float


class GenerateResponse(BaseModel):
    next_token_predictions: List[TokenProbability]
    context: str
    generated_token: str


class SimulateRequest(BaseModel):
    text: str
    epochs: int = 20
    lr: float = 0.01
    embed_dim: int = 32
    n_head: int = 2
    n_layer: int = 2
    block_size: int = 64


class SimulateResponse(BaseModel):
    history: List[Dict]
    vocab: Dict
    idx_to_token: Dict
    vocab_size: int
    error: Optional[str] = None


def load_model():
    """Load the trained model and tokenizer"""
    global model, tokenizer, device
    
    # Set device
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Using device: {device}")
    
    # Load tokenizer
    if not TOKENIZER_PATH.exists():
        raise FileNotFoundError(f"Tokenizer not found at {TOKENIZER_PATH}. Please run train.py first.")
    tokenizer = load_tokenizer(TOKENIZER_PATH)
    print(f"Loaded tokenizer with vocab size: {tokenizer.vocab_size}")
    
    # Load model
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Please run train.py first.")
    
    checkpoint = torch.load(MODEL_PATH, map_location=device)
    model = GPTLanguageModel(
        vocab_size=checkpoint['vocab_size'],
        n_embd=checkpoint['n_embd'],
        n_head=checkpoint['n_head'],
        n_layer=checkpoint['n_layer'],
        block_size=checkpoint['block_size']
    )
    model.load_state_dict(checkpoint['model_state_dict'])
    model = model.to(device)
    model.eval()
    print("Model loaded successfully")


@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    try:
        load_model()
    except Exception as e:
        print(f"Warning: Could not load model on startup: {e}")
        print("The model will be loaded on first request if available.")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "QKViz - Interactive Glass Box Visualization of LLMs",
        "status": "running",
        "model_loaded": model is not None
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": str(device) if device else None
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """
    Generate next token predictions with probabilities.
    This endpoint performs ONE generation step and returns the top-k predictions.
    
    Args:
        context: Input text context
        temperature: Sampling temperature (higher = more random)
        top_k: Number of top predictions to return
        
    Returns:
        Top-k token predictions with probabilities
    """
    # Check if model is loaded
    if model is None or tokenizer is None:
        try:
            load_model()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model not loaded: {str(e)}")
    
    try:
        # Encode the context
        if not request.context:
            # Start with a single token (e.g., newline or space)
            context_ids = [0]  # Start with first token in vocab
        else:
            context_ids = tokenizer.encode(request.context)
        
        # Convert to tensor
        idx = torch.tensor([context_ids], dtype=torch.long, device=device)
        
        # Crop to block size if needed
        if idx.size(1) > model.block_size:
            idx = idx[:, -model.block_size:]
        
        # Get model predictions
        with torch.no_grad():
            logits, _ = model(idx)
            # Focus on the last time step
            logits = logits[:, -1, :]  # (1, vocab_size)
            
            # Apply temperature
            logits = logits / request.temperature
            
            # Get probabilities
            probs = F.softmax(logits, dim=-1)  # (1, vocab_size)
            log_probs = F.log_softmax(logits, dim=-1)  # (1, vocab_size)
            
            # Get top-k predictions
            top_probs, top_indices = torch.topk(probs[0], k=min(request.top_k, tokenizer.vocab_size))
            top_log_probs = log_probs[0][top_indices]
            
            # Convert to list of TokenProbability objects
            predictions = []
            for i in range(len(top_indices)):
                token_id = top_indices[i].item()
                token = tokenizer.decode([token_id])
                prob = top_probs[i].item()
                log_prob = top_log_probs[i].item()
                
                predictions.append(TokenProbability(
                    token=token,
                    probability=prob,
                    log_probability=log_prob
                ))
            
            # Sample the next token (for demonstration)
            sampled_idx = torch.multinomial(probs, num_samples=1)
            generated_token = tokenizer.decode([sampled_idx.item()])
        
        return GenerateResponse(
            next_token_predictions=predictions,
            context=request.context,
            generated_token=generated_token
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.post("/generate-sequence")
async def generate_sequence(request: GenerateRequest, max_tokens: int = 100):
    """
    Generate a complete sequence of tokens.
    
    Args:
        context: Input text context
        temperature: Sampling temperature
        max_tokens: Maximum number of tokens to generate
        
    Returns:
        Complete generated text
    """
    # Check if model is loaded
    if model is None or tokenizer is None:
        try:
            load_model()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model not loaded: {str(e)}")
    
    try:
        # Encode the context
        if not request.context:
            context_ids = [0]
        else:
            context_ids = tokenizer.encode(request.context)
        
        # Convert to tensor
        idx = torch.tensor([context_ids], dtype=torch.long, device=device)
        
        # Generate
        with torch.no_grad():
            generated_ids = model.generate(
                idx,
                max_new_tokens=max_tokens,
                temperature=request.temperature,
                top_k=50
            )[0].tolist()
        
        # Decode
        generated_text = tokenizer.decode(generated_ids)
        
        return {
            "generated_text": generated_text,
            "context": request.context,
            "num_tokens": len(generated_ids)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@app.get("/vocab")
async def get_vocab():
    """Get vocabulary information"""
    if tokenizer is None:
        try:
            load_model()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Tokenizer not loaded: {str(e)}")
    
    return {
        "vocab_size": tokenizer.vocab_size,
        "sample_chars": list(tokenizer.char_to_idx.keys())[:20]
    }


@app.post("/api/simulate", response_model=SimulateResponse)
async def simulate_training(request: SimulateRequest):
    """
    Simulate a training run on user-provided text and return training history.
    
    This endpoint creates a fresh model and tokenizer specifically for the input text,
    trains it for the specified number of epochs, and records internal states at each step.
    
    Args:
        text: User-provided text corpus (e.g., a paragraph)
        epochs: Number of training epochs (default: 20)
        lr: Learning rate (default: 0.01)
        embed_dim: Embedding dimension (default: 32)
        n_head: Number of attention heads (default: 2)
        n_layer: Number of transformer layers (default: 2)
        block_size: Context length (default: 64)
        
    Returns:
        Training history with loss, predictions, and attention weights for each epoch
    """
    try:
        # Validate input
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text corpus cannot be empty")
        
        if request.epochs < 1 or request.epochs > 1000:
            raise HTTPException(status_code=400, detail="Epochs must be between 1 and 1000")
        
        if request.lr <= 0 or request.lr > 1:
            raise HTTPException(status_code=400, detail="Learning rate must be between 0 and 1")
        
        # Prepare hyperparameters
        hyperparameters = {
            'epochs': request.epochs,
            'lr': request.lr,
            'embed_dim': request.embed_dim,
            'n_head': request.n_head,
            'n_layer': request.n_layer,
            'block_size': request.block_size
        }
        
        # Run the simulation
        result = simulate_training_run(request.text, hyperparameters)
        
        # Check for errors
        if 'error' in result and result['error']:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return SimulateResponse(
            history=result['history'],
            vocab=result['vocab'],
            idx_to_token=result['idx_to_token'],
            vocab_size=result['vocab_size']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training simulation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
