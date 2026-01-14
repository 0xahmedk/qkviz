#!/usr/bin/env python3
"""
Quick start script for Logit project.
Checks dependencies and guides you through the setup.
"""

import sys
import subprocess
from pathlib import Path


def check_dependencies():
    """Check if required packages are installed"""
    print("🔍 Checking dependencies...")
    
    required = ['torch', 'fastapi', 'uvicorn']
    missing = []
    
    for package in required:
        try:
            __import__(package)
            print(f"  ✅ {package}")
        except ImportError:
            print(f"  ❌ {package} (missing)")
            missing.append(package)
    
    return missing


def install_dependencies():
    """Install missing dependencies"""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("  ✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("  ❌ Failed to install dependencies")
        return False


def check_files():
    """Check if necessary files exist"""
    print("\n📁 Checking project files...")
    
    files = {
        'model.py': 'Model architecture',
        'data.py': 'Data utilities',
        'train.py': 'Training script',
        'main.py': 'API server',
        'assets/muqaddimah.txt': 'Training corpus'
    }
    
    all_exist = True
    for file, description in files.items():
        path = Path(file)
        if path.exists():
            print(f"  ✅ {file} - {description}")
        else:
            print(f"  ❌ {file} - {description} (missing)")
            all_exist = False
    
    return all_exist


def check_trained_model():
    """Check if model is already trained"""
    model_path = Path('logit_model.pth')
    tokenizer_path = Path('tokenizer.pkl')
    
    if model_path.exists() and tokenizer_path.exists():
        print("\n✅ Trained model found!")
        print(f"   Model: {model_path}")
        print(f"   Tokenizer: {tokenizer_path}")
        return True
    else:
        print("\n⚠️  No trained model found.")
        return False


def main():
    print("=" * 60)
    print("🚀 QKViz - Interactive LLM Visualization")
    print("   Setup and Quick Start")
    print("=" * 60)
    
    # Check files
    if not check_files():
        print("\n❌ Some project files are missing!")
        print("   Make sure you're in the backend directory.")
        return
    
    # Check dependencies
    missing = check_dependencies()
    
    if missing:
        print(f"\n⚠️  Missing packages: {', '.join(missing)}")
        response = input("\nInstall missing packages? (y/n): ")
        if response.lower() == 'y':
            if not install_dependencies():
                print("\n❌ Setup failed. Please install dependencies manually:")
                print("   pip install -r requirements.txt")
                return
        else:
            print("\n❌ Cannot proceed without dependencies.")
            print("   Install them with: pip install -r requirements.txt")
            return
    
    # Check if model is trained
    model_trained = check_trained_model()
    
    print("\n" + "=" * 60)
    print("📋 Next Steps:")
    print("=" * 60)
    
    if not model_trained:
        print("\n1️⃣  Train the model:")
        print("   python train.py")
        print("   (Takes ~5-10 minutes on CPU)")
    
    print("\n2️⃣  Start the API server:")
    print("   python main.py")
    print("   (Server will run at http://localhost:8000)")
    
    print("\n3️⃣  Test the API:")
    print("   Visit http://localhost:8000/docs for interactive API docs")
    print("   Or use curl:")
    print('   curl -X POST "http://localhost:8000/generate" \\')
    print('     -H "Content-Type: application/json" \\')
    print('     -d \'{"context": "The sciences", "temperature": 0.8, "top_k": 5}\'')
    
    print("\n" + "=" * 60)
    print("📚 Documentation:")
    print("   See README.md for detailed information")
    print("=" * 60)
    
    if not model_trained:
        print("\n💡 Tip: Train the model first before starting the server!")
        response = input("\nWould you like to start training now? (y/n): ")
        if response.lower() == 'y':
            print("\n🏋️  Starting training...\n")
            try:
                subprocess.check_call([sys.executable, 'train.py'])
                print("\n✅ Training complete!")
                print("\nYou can now start the server with: python main.py")
            except subprocess.CalledProcessError:
                print("\n❌ Training failed. Check the error messages above.")
            except KeyboardInterrupt:
                print("\n\n⚠️  Training interrupted.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
