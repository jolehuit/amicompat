"""Input validation utilities"""
from pathlib import Path
from typing import List, Optional
import re

def validate_project_path(path: Path) -> None:
    """
    Validate project directory path.
    
    Args:
        path: Directory path to validate
    
    Raises:
        ValueError: If path is invalid
    """
    if not path.exists():
        raise ValueError(f"Path does not exist: {path}")
    
    if not path.is_dir():
        raise ValueError(f"Path is not a directory: {path}")
    
    # Check accessibility
    try:
        next(path.iterdir(), None)
    except PermissionError:
        raise ValueError(f"Permission denied: Cannot read directory {path}")
    except Exception as e:
        raise ValueError(f"Cannot access directory {path}: {e}")
    
    # Check for supported files (don't require them in root)
    extensions = {'.css', '.scss', '.js', '.ts', '.jsx', '.tsx', '.html'}
    has_files = False
    
    try:
        for item in path.rglob("*"):
            if item.is_file() and item.suffix.lower() in extensions:
                has_files = True
                break
    except Exception:
        pass
    
    if not has_files:
        raise ValueError(
            f"No supported files found in {path}. "
            f"Looking for: {', '.join(extensions)}"
        )

def validate_file_path(path: Path) -> None:
    """
    Validate file path for auditing.
    
    Args:
        path: File path to validate
    
    Raises:
        ValueError: If path is invalid
    """
    if not path.exists():
        raise ValueError(f"File does not exist: {path}")
    
    if not path.is_file():
        raise ValueError(f"Path is not a file: {path}")
    
    # Check extension
    valid_extensions = {'.css', '.scss', '.js', '.ts', '.jsx', '.tsx', '.html'}
    if path.suffix.lower() not in valid_extensions:
        raise ValueError(
            f"Unsupported file type: {path.suffix}. "
            f"Supported: {', '.join(valid_extensions)}"
        )
    
    # Check readability
    try:
        with open(path, 'r', encoding='utf-8') as f:
            f.read(1)
    except PermissionError:
        raise ValueError(f"Permission denied: Cannot read {path}")
    except UnicodeDecodeError:
        # Try binary check
        try:
            with open(path, 'rb') as f:
                chunk = f.read(1024)
                if b'\x00' in chunk:
                    raise ValueError(f"File appears to be binary: {path}")
        except Exception:
            pass
    except Exception as e:
        raise ValueError(f"Cannot read file {path}: {e}")

def validate_target(target: str) -> str:
    """
    Validate and normalize target parameter.
    
    Args:
        target: Target baseline
    
    Returns:
        Normalized target string
    
    Raises:
        ValueError: If target is invalid
    """
    target_lower = target.lower()

    # Accept 'widely' or 'baseline-YYYY' pattern (defers exact mapping to Analyzer)
    if target_lower == "widely":
        return target_lower

    # Normalize common variants
    if "wide" in target_lower:
        return "widely"

    # Accept baseline-YYYY pattern
    if re.match(r"^baseline-\d{4}$", target_lower):
        return target_lower

    # Backwards-compat shortcuts
    if "2024" in target_lower:
        return "baseline-2024"
    if "2023" in target_lower:
        return "baseline-2023"

    raise ValueError(
        f"Invalid target: '{target}'. Expected 'widely' or 'baseline-YYYY'."
    )

def validate_max_files(max_files: int) -> int:
    """
    Validate max_files parameter.
    
    Args:
        max_files: Maximum number of files
    
    Returns:
        Validated max_files
    
    Raises:
      ValueError: If invalid
    """
    if not isinstance(max_files, int):
        raise ValueError(f"max_files must be an integer, got {type(max_files)}")
    
    if max_files < 1:
        raise ValueError(f"max_files must be at least 1, got {max_files}")
    
    if max_files > 100000:
        raise ValueError(f"max_files too large (max 100000), got {max_files}")
    
    return max_files
