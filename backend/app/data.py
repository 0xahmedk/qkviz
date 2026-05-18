"""
Data preparation utilities for word-level language modeling.
Loads text, creates tokenizer, and prepares train/val splits.
"""

import torch
from pathlib import Path
import re


class WordTokenizer:
    """
    Space-prefix tokenizer (similar to SentencePiece/BPE strategy).
    Attaches preceding space to each word, reducing visual noise in attention matrices.
    
    Example: "The quick brown" -> ['The', ' quick', ' brown']
    """
    
    def __init__(self, text):
        # Tokenize using space-prefix strategy
        # Pattern: r' ?\S+' matches optional space followed by non-whitespace
        # This eliminates standalone space tokens and attaches spaces to words
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


def load_data(file_path, train_split=0.9):
    """
    Load text data and prepare train/val splits.
    
    Args:
        file_path: Path to the text file
        train_split: Fraction of data to use for training
        
    Returns:
        train_data, val_data, tokenizer
    """
    # Read the text file
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    print(f"Loaded text with {len(text)} characters")
    
    # Create tokenizer
    tokenizer = WordTokenizer(text)
    print(f"Vocabulary size: {tokenizer.vocab_size} unique tokens")
    
    # Encode the entire text
    data = torch.tensor(tokenizer.encode(text), dtype=torch.long)
    
    # Split into train and validation
    n = int(train_split * len(data))
    train_data = data[:n]
    val_data = data[n:]
    
    print(f"Train data: {len(train_data)} tokens")
    print(f"Validation data: {len(val_data)} tokens")
    
    return train_data, val_data, tokenizer


def get_batch(data, block_size, batch_size, device='cpu'):
    """
    Generate a batch of data for training.
    
    Args:
        data: The input data (train or val)
        block_size: Maximum context length
        batch_size: Number of sequences per batch
        device: Device to put tensors on
        
    Returns:
        x, y: Input sequences and targets
    """
    ix = torch.randint(len(data) - block_size, (batch_size,))
    x = torch.stack([data[i:i+block_size] for i in ix])
    y = torch.stack([data[i+1:i+block_size+1] for i in ix])
    x, y = x.to(device), y.to(device)
    return x, y


def save_tokenizer(tokenizer, path):
    """Save tokenizer mappings to file"""
    import pickle
    with open(path, 'wb') as f:
        pickle.dump({
            'token_to_idx': tokenizer.token_to_idx,
            'idx_to_token': tokenizer.idx_to_token,
            'vocab_size': tokenizer.vocab_size
        }, f)
    print(f"Tokenizer saved to {path}")


def load_tokenizer(path):
    """Load tokenizer from file"""
    import pickle
    with open(path, 'rb') as f:
        data = pickle.load(f)
    
    # Reconstruct tokenizer
    tokenizer = WordTokenizer("")  # Empty init
    tokenizer.token_to_idx = data['token_to_idx']
    tokenizer.idx_to_token = data['idx_to_token']
    tokenizer.vocab_size = data['vocab_size']
    
    return tokenizer
