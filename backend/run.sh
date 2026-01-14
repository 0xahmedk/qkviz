#!/bin/bash
# QKViz Project Helper Script
# Usage: ./run.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Commands
cmd_help() {
    echo "QKViz Project Helper"
    echo ""
    echo "Usage: ./run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install      Install Python dependencies"
    echo "  train        Train the model"
    echo "  test         Test the trained model"
    echo "  serve        Start the API server"
    echo "  dev          Start server in development mode (auto-reload)"
    echo "  examples     Run example code"
    echo "  clean        Remove generated files (model, tokenizer)"
    echo "  check        Check if everything is set up correctly"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run.sh install"
    # QKViz Project Helper Script
    echo "  ./run.sh serve"
}

cmd_install() {
    info "Installing dependencies..."
    pip install -r requirements.txt
    success "Dependencies installed!"
}

cmd_train() {
    info "Starting training..."
    if [ ! -f "assets/muqaddimah.txt" ]; then
        error "Training corpus not found at assets/muqaddimah.txt"
        exit 1
    fi
    python train.py
    success "Training complete!"
}

cmd_test() {
    info "Testing the model..."
    if [ ! -f "logit_model.pth" ]; then
        error "Model not found. Run './run.sh train' first."
        exit 1
    fi
    python test_model.py
}

cmd_serve() {
    info "Starting API server..."
    if [ ! -f "logit_model.pth" ]; then
        warn "Model not found. The server will start but generation won't work."
        warn "Run './run.sh train' first."
    fi
    python main.py
}

cmd_dev() {
    info "Starting API server in development mode..."
    if [ ! -f "logit_model.pth" ]; then
        warn "Model not found. The server will start but generation won't work."
        warn "Run './run.sh train' first."
    fi
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
}

cmd_examples() {
    info "Running example code..."
    python examples.py
}

cmd_clean() {
    warn "This will delete the trained model and tokenizer."
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Cleaning generated files..."
        rm -f logit_model.pth tokenizer.pkl
        success "Cleaned!"
    else
        info "Cancelled."
    fi
}

cmd_check() {
    info "Checking project setup..."
    echo ""
    
    # Check Python
    if command -v python &> /dev/null; then
        success "Python found: $(python --version)"
    else
        error "Python not found"
    fi
    
    # Check dependencies
    info "Checking dependencies..."
    deps=("torch" "fastapi" "uvicorn" "pydantic")
    for dep in "${deps[@]}"; do
        if python -c "import $dep" 2>/dev/null; then
            success "$dep installed"
        else
            error "$dep not installed"
        fi
    done
    
    # Check files
    echo ""
    info "Checking project files..."
    files=("model.py" "data.py" "train.py" "main.py" "assets/muqaddimah.txt")
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            success "$file exists"
        else
            error "$file missing"
        fi
    done
    
    # Check trained model
    echo ""
    if [ -f "logit_model.pth" ]; then
        success "Trained model found"
    else
        warn "Model not trained yet. Run './run.sh train'"
    fi
    
    if [ -f "tokenizer.pkl" ]; then
        success "Tokenizer found"
    else
        warn "Tokenizer not found. Run './run.sh train'"
    fi
    
    echo ""
    success "Check complete!"
}

# Main
case "${1:-help}" in
    install)
        cmd_install
        ;;
    train)
        cmd_train
        ;;
    test)
        cmd_test
        ;;
    serve)
        cmd_serve
        ;;
    dev)
        cmd_dev
        ;;
    examples)
        cmd_examples
        ;;
    clean)
        cmd_clean
        ;;
    check)
        cmd_check
        ;;
    help|*)
        cmd_help
        ;;
esac
