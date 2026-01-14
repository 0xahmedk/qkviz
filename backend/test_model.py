"""
Test script to verify the trained model and demonstrate its usage.
Run this after training to see the model in action.
"""

import torch
import torch.nn.functional as F
from pathlib import Path
from model import GPTLanguageModel
from data import load_tokenizer


def load_model_and_tokenizer():
    """Load the trained model and tokenizer"""
    model_path = Path('logit_model.pth')
    tokenizer_path = Path('tokenizer.pkl')
    
    if not model_path.exists() or not tokenizer_path.exists():
        print("❌ Model or tokenizer not found!")
        print("   Please run train.py first.")
        return None, None
    
    # Load tokenizer
    tokenizer = load_tokenizer(tokenizer_path)
    print(f"✅ Loaded tokenizer (vocab size: {tokenizer.vocab_size})")
    
    # Load model
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    checkpoint = torch.load(model_path, map_location=device)
    
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
    
    print(f"✅ Loaded model on {device}")
    print(f"   Parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    return model, tokenizer, device


def test_generation(model, tokenizer, device, prompts):
    """Test text generation with various prompts"""
    print("\n" + "=" * 80)
    print("🎯 Testing Text Generation")
    print("=" * 80)
    
    for i, prompt in enumerate(prompts, 1):
        print(f"\n--- Test {i} ---")
        print(f"Prompt: \"{prompt}\"")
        
        # Encode prompt
        context_ids = tokenizer.encode(prompt) if prompt else [0]
        idx = torch.tensor([context_ids], dtype=torch.long, device=device)
        
        # Generate with different temperatures
        for temp in [0.5, 0.8, 1.0]:
            generated = model.generate(idx, max_new_tokens=150, temperature=temp, top_k=50)
            text = tokenizer.decode(generated[0].tolist())
            
            print(f"\nTemperature {temp}:")
            print(f"  {text[:200]}...")


def test_next_token_prediction(model, tokenizer, device, context):
    """Test next token prediction with probabilities"""
    print("\n" + "=" * 80)
    print("🔮 Testing Next Token Prediction")
    print("=" * 80)
    print(f"\nContext: \"{context}\"")
    
    # Encode context
    context_ids = tokenizer.encode(context)
    idx = torch.tensor([context_ids], dtype=torch.long, device=device)
    
    # Get predictions
    with torch.no_grad():
        logits, _ = model(idx)
        logits = logits[:, -1, :]  # Last token
        
        # Get top 10 predictions
        probs = F.softmax(logits / 0.8, dim=-1)
        top_probs, top_indices = torch.topk(probs[0], k=10)
        
        print("\nTop 10 Next Token Predictions:")
        print("-" * 50)
        for i in range(10):
            token_id = top_indices[i].item()
            token = tokenizer.decode([token_id])
            prob = top_probs[i].item()
            
            # Display token with special handling for whitespace
            display_token = repr(token) if token in [' ', '\n', '\t'] else token
            bar = "█" * int(prob * 50)
            print(f"{i+1:2}. {display_token:10} {prob:6.2%} {bar}")


def test_interactive_generation(model, tokenizer, device):
    """Interactive step-by-step generation"""
    print("\n" + "=" * 80)
    print("🎮 Interactive Generation (Step-by-Step)")
    print("=" * 80)
    print("Enter a starting text, and we'll generate token by token.")
    print("You can see the top predictions at each step.")
    print("(Press Ctrl+C to stop)\n")
    
    try:
        start_text = input("Enter starting text: ").strip()
        num_steps = int(input("How many tokens to generate? (e.g., 20): "))
        temperature = float(input("Temperature (0.1-2.0, default 0.8): ") or "0.8")
        
        # Encode starting text
        context_ids = tokenizer.encode(start_text) if start_text else [0]
        idx = torch.tensor([context_ids], dtype=torch.long, device=device)
        
        generated_text = start_text
        print("\n" + "=" * 80)
        print("Generation in progress...")
        print("=" * 80)
        print(f"\nStarting: {start_text}")
        
        for step in range(num_steps):
            with torch.no_grad():
                # Crop to block size
                idx_cond = idx if idx.size(1) <= model.block_size else idx[:, -model.block_size:]
                
                # Get predictions
                logits, _ = model(idx_cond)
                logits = logits[:, -1, :] / temperature
                probs = F.softmax(logits, dim=-1)
                
                # Get top 5 for display
                top_probs, top_indices = torch.topk(probs[0], k=5)
                
                print(f"\n--- Step {step + 1} ---")
                print("Top 5 predictions:")
                for i in range(5):
                    token_id = top_indices[i].item()
                    token = tokenizer.decode([token_id])
                    prob = top_probs[i].item()
                    display_token = repr(token) if token in [' ', '\n', '\t'] else token
                    print(f"  {i+1}. {display_token:10} {prob:6.2%}")
                
                # Sample next token
                idx_next = torch.multinomial(probs, num_samples=1)
                next_token = tokenizer.decode([idx_next.item()])
                
                print(f"✓ Sampled: {repr(next_token)}")
                
                # Update sequence
                idx = torch.cat((idx, idx_next), dim=1)
                generated_text += next_token
        
        print("\n" + "=" * 80)
        print("Final Generated Text:")
        print("=" * 80)
        print(generated_text)
        
    except KeyboardInterrupt:
        print("\n\nGeneration stopped.")
    except ValueError as e:
        print(f"\n❌ Invalid input: {e}")


def main():
    print("=" * 80)
    print("🧪 QKViz Model Testing Suite")
    print("=" * 80)
    
    # Load model
    model, tokenizer, device = load_model_and_tokenizer()
    if model is None:
        return
    
    # Test prompts
    prompts = [
        "The sciences",
        "In the Name of",
        "Man is",
        "Royal authority",
        ""  # Empty prompt
    ]
    
    # Run tests
    test_generation(model, tokenizer, device, prompts)
    
    test_next_token_prediction(model, tokenizer, device, "The sciences are")
    
    # Interactive mode
    print("\n" + "=" * 80)
    response = input("\nWould you like to try interactive generation? (y/n): ")
    if response.lower() == 'y':
        test_interactive_generation(model, tokenizer, device)
    
    print("\n" + "=" * 80)
    print("✅ Testing complete!")
    print("=" * 80)
    print("\n💡 Next step: Start the API server with 'python main.py'")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
