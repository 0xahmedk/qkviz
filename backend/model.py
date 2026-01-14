"""
Minimal GPT-style Decoder-only Transformer for educational purposes.
Built from scratch using PyTorch - no HuggingFace or pre-built transformers.
"""

import torch
import torch.nn as nn
from torch.nn import functional as F


class Head(nn.Module):
    """Single self-attention head"""
    
    def __init__(self, n_embd, head_size, block_size, dropout=0.1):
        super().__init__()
        self.key = nn.Linear(n_embd, head_size, bias=False)
        self.query = nn.Linear(n_embd, head_size, bias=False)
        self.value = nn.Linear(n_embd, head_size, bias=False)
        self.register_buffer('tril', torch.tril(torch.ones(block_size, block_size)))
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x, return_attention_weights=False):
        B, T, C = x.shape
        k = self.key(x)   # (B, T, head_size)
        q = self.query(x) # (B, T, head_size)
        
        # Compute attention scores ("affinities")
        wei = q @ k.transpose(-2, -1) * (k.shape[-1] ** -0.5)  # (B, T, T)
        wei = wei.masked_fill(self.tril[:T, :T] == 0, float('-inf'))  # Causal mask
        wei_softmax = F.softmax(wei, dim=-1)  # (B, T, T)
        wei_dropped = self.dropout(wei_softmax)
        
        # Perform weighted aggregation of values
        v = self.value(x)  # (B, T, head_size)
        out = wei_dropped @ v      # (B, T, head_size)
        
        if return_attention_weights:
            return out, wei_softmax
        return out


class MultiHeadAttention(nn.Module):
    """Multiple heads of self-attention in parallel"""
    
    def __init__(self, n_embd, num_heads, head_size, block_size, dropout=0.1):
        super().__init__()
        self.heads = nn.ModuleList([Head(n_embd, head_size, block_size, dropout) for _ in range(num_heads)])
        self.proj = nn.Linear(n_embd, n_embd)
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x, return_attention_weights=False):
        if return_attention_weights:
            head_outputs = []
            attention_weights = []
            for h in self.heads:
                out, wei = h(x, return_attention_weights=True)
                head_outputs.append(out)
                attention_weights.append(wei)
            out = torch.cat(head_outputs, dim=-1)
            out = self.dropout(self.proj(out))
            # Return the attention weights from all heads
            return out, attention_weights
        else:
            out = torch.cat([h(x) for h in self.heads], dim=-1)
            out = self.dropout(self.proj(out))
            return out


class FeedForward(nn.Module):
    """Simple feed-forward network with GELU activation"""
    
    def __init__(self, n_embd, dropout=0.1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),
            nn.GELU(),
            nn.Linear(4 * n_embd, n_embd),
            nn.Dropout(dropout),
        )
        
    def forward(self, x):
        return self.net(x)


class Block(nn.Module):
    """Transformer block: communication (attention) followed by computation (feedforward)"""
    
    def __init__(self, n_embd, n_head, block_size, dropout=0.1):
        super().__init__()
        head_size = n_embd // n_head
        self.sa = MultiHeadAttention(n_embd, n_head, head_size, block_size, dropout)
        self.ffwd = FeedForward(n_embd, dropout)
        self.ln1 = nn.LayerNorm(n_embd)
        self.ln2 = nn.LayerNorm(n_embd)
        
    def forward(self, x, return_attention_weights=False):
        # Pre-norm formulation
        if return_attention_weights:
            sa_out, attn_weights = self.sa(self.ln1(x), return_attention_weights=True)
            x = x + sa_out
            x = x + self.ffwd(self.ln2(x))
            return x, attn_weights
        else:
            x = x + self.sa(self.ln1(x))
            x = x + self.ffwd(self.ln2(x))
            return x


class GPTLanguageModel(nn.Module):
    """
    Minimal GPT-style language model.
    Character-level decoder-only transformer.
    """
    
    def __init__(self, vocab_size, n_embd=64, n_head=4, n_layer=4, block_size=128, dropout=0.1):
        super().__init__()
        self.block_size = block_size
        self.token_embedding_table = nn.Embedding(vocab_size, n_embd)
        self.position_embedding_table = nn.Embedding(block_size, n_embd)
        self.blocks = nn.Sequential(*[Block(n_embd, n_head, block_size, dropout) for _ in range(n_layer)])
        self.ln_f = nn.LayerNorm(n_embd)
        self.lm_head = nn.Linear(n_embd, vocab_size)
        
        # Initialize weights
        self.apply(self._init_weights)
        
    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            
    def forward(self, idx, targets=None, return_internals=False):
        B, T = idx.shape
        
        # idx and targets are both (B, T) tensor of integers
        tok_emb = self.token_embedding_table(idx)  # (B, T, n_embd)
        pos_emb = self.position_embedding_table(torch.arange(T, device=idx.device))  # (T, n_embd)
        x = tok_emb + pos_emb  # (B, T, n_embd)
        
        # Pass through blocks
        if return_internals:
            # Collect attention weights from the last layer
            all_attn_weights = None
            for i, block in enumerate(self.blocks):
                if i == len(self.blocks) - 1:  # Last layer
                    x, all_attn_weights = block(x, return_attention_weights=True)
                else:
                    x = block(x, return_attention_weights=False)
        else:
            x = self.blocks(x)     # (B, T, n_embd)
        
        x = self.ln_f(x)       # (B, T, n_embd)
        logits = self.lm_head(x)  # (B, T, vocab_size)
        
        if targets is None:
            loss = None
        else:
            B, T, C = logits.shape
            logits_reshaped = logits.view(B * T, C)
            targets_reshaped = targets.view(B * T)
            loss = F.cross_entropy(logits_reshaped, targets_reshaped)
        
        if return_internals:
            internals = {}
            if all_attn_weights is not None:
                # all_attn_weights is a list of attention weights per head
                internals['attention_weights'] = all_attn_weights
            if loss is not None:
                internals['loss'] = loss
            return logits, internals
        
        return logits, loss
    
    def generate(self, idx, max_new_tokens, temperature=1.0, top_k=None):
        """
        Generate new tokens given a context.
        
        Args:
            idx: (B, T) array of indices in the current context
            max_new_tokens: number of tokens to generate
            temperature: sampling temperature (higher = more random)
            top_k: if set, only sample from top k tokens
            
        Returns:
            idx with generated tokens appended
        """
        for _ in range(max_new_tokens):
            # Crop context to block_size
            idx_cond = idx if idx.size(1) <= self.block_size else idx[:, -self.block_size:]
            # Get predictions
            logits, _ = self(idx_cond)
            # Focus only on the last time step
            logits = logits[:, -1, :]  # (B, vocab_size)
            # Apply temperature
            logits = logits / temperature
            # Optionally crop to top k tokens
            if top_k is not None:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = -float('Inf')
            # Apply softmax to get probabilities
            probs = F.softmax(logits, dim=-1)  # (B, vocab_size)
            # Sample from the distribution
            idx_next = torch.multinomial(probs, num_samples=1)  # (B, 1)
            # Append sampled index to the running sequence
            idx = torch.cat((idx, idx_next), dim=1)  # (B, T+1)
        return idx
