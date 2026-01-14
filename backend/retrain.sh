#!/bin/bash
# Retrain script after switching to word-level tokenization

set -e

echo "🔄 Retraining Model with Word-Level Tokenization"
echo "================================================"
echo ""

# Check if we're in the backend directory
if [ ! -f "train.py" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "   cd backend && ./retrain.sh"
    exit 1
fi

# Check if old model exists
if [ -f "logit_model.pth" ] || [ -f "tokenizer.pkl" ]; then
    echo "⚠️  Found existing model files"
    echo ""
    echo "These files will be deleted:"
    [ -f "logit_model.pth" ] && echo "  - logit_model.pth"
    [ -f "tokenizer.pkl" ] && echo "  - tokenizer.pkl"
    echo ""
    read -p "Continue? (y/N) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi
    
    # Delete old files
    rm -f logit_model.pth tokenizer.pkl
    echo "✅ Deleted old model files"
    echo ""
fi

# Check if muqaddimah.txt exists
if [ ! -f "assets/muqaddimah.txt" ]; then
    echo "❌ Error: Training corpus not found at assets/muqaddimah.txt"
    exit 1
fi

echo "📚 Training corpus: assets/muqaddimah.txt"
echo "🎯 Tokenization: Word-level (words + special characters)"
echo "⚙️  Model size: 4 layers, 4 heads, 64 embedding dim"
echo ""
echo "Starting training in 3 seconds..."
sleep 3
echo ""

# Run training
python train.py

echo ""
echo "================================================"
echo "✅ Training Complete!"
echo ""
echo "Next steps:"
echo "  1. Start the API server: python main.py"
echo "  2. Test generation: python test_model.py"
echo "  3. Launch frontend: cd ../logit-app && pnpm dev"
echo ""
echo "💡 The model now generates word-by-word instead of character-by-character!"
