#!/bin/bash
# Quick retrain script for new tokenization
# This retrains the model with space-prefix tokenization

set -e

cd "$(dirname "$0")"

echo "════════════════════════════════════════════════════════════════"
echo "🔄 Retraining Model with New Space-Prefix Tokenization"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Backup old model
if [ -f "logit_model.pth" ]; then
    echo "📦 Backing up old model..."
    mv logit_model.pth logit_model.pth.old-tokenization
    echo "   ✅ Old model saved as: logit_model.pth.old-tokenization"
    echo ""
fi

# Train new model
echo "🚀 Training new model with space-prefix tokenization..."
echo ""
python train.py

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Retraining Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Model trained with new tokenization:"
echo "   • No standalone space tokens"
echo "   • Cleaner attention matrices"
echo "   • Better visualization quality"
echo ""
echo "🎯 Next steps:"
echo "   1. Start the API: python main.py"
echo "   2. Test the frontend"
echo "   3. Observe cleaner attention matrices!"
echo ""
