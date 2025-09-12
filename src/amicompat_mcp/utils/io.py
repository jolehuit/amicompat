"""File I/O utilities with safety checks"""
from pathlib import Path
from typing import Optional

MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB limit

def read_file_safe(path: Path, encoding: str = 'utf-8') -> Optional[str]:
    """
    Safely read file with size and encoding checks.
    
    Args:
        path: File path to read
        encoding: Text encoding
    
    Returns:
        File content or None if error
    """
    try:
        # Check file size first
        size = path.stat().st_size
        if size > MAX_FILE_SIZE:
            print(f"Warning: Skipping large file ({size} bytes): {path}")
            return None
        
        if size == 0:
            return ""
        
        # Try to read file
        with open(path, 'r', encoding=encoding, errors='ignore') as f:
            return f.read()
    except PermissionError:
        print(f"Warning: Permission denied: {path}")
        return None
    except Exception as e:
        print(f"Warning: Error reading {path}: {e}")
        return None

def is_binary(path: Path) -> bool:
    """
    Check if file appears to be binary.
    
    Args:
        path: File path to check
    
    Returns:
        True if file appears binary
    """
    try:
        with open(path, 'rb') as f:
            chunk = f.read(1024)
            if not chunk:
                return False
            
            # Check for null bytes (strong indicator of binary)
            if b'\x00' in chunk:
                return True
            
            # Check ratio of non-text bytes
            text_chars = bytes(range(32, 127)) + b'\n\r\t\f\b'
            non_text = sum(1 for b in chunk if b not in text_chars)
            
            # If more than 30% non-text, consider binary
            return (non_text / len(chunk)) > 0.3
    except Exception:
        return True

def get_file_encoding(path: Path) -> str:
    """
    Detect file encoding.
    
    Args:
        path: File path
    
    Returns:
        Encoding name
    """
    # Simple detection - could be enhanced with chardet
    try:
        with open(path, 'rb') as f:
            raw = f.read(4)
            
        # Check for BOM
        if raw.startswith(b'\xff\xfe'):
            return 'utf-16-le'
        elif raw.startswith(b'\xfe\xff'):
            return 'utf-16-be'
        elif raw.startswith(b'\xef\xbb\xbf'):
            return 'utf-8-sig'
        else:
            return 'utf-8'
    except Exception:
        return 'utf-8'

