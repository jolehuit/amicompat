"""File system walker for scanning project files"""
from pathlib import Path
from typing import List, Set

class Walker:
    """Recursively scan directories for web files"""
    
    def __init__(self, max_files: int = 10000):
        """
        Initialize walker with limits.
        
        Args:
            max_files: Maximum number of files to scan
        """
        self.max_files = max_files
        self.extensions = {'.css', '.scss', '.js', '.ts', '.jsx', '.tsx', '.html'}
        self.excluded_dirs = {
            'node_modules', '.git', 'dist', 'build', '.next', 
            'vendor', 'coverage', '.cache', 'tmp', '__pycache__',
            '.venv', 'env', 'venv', '.tox', '.pytest_cache'
        }
    
    def scan(self, directory: Path) -> List[Path]:
        """
        Scan directory for supported files.
        
        Args:
            directory: Root directory to scan
        
        Returns:
            List of file paths
        """
        files = []
        count = 0
        
        try:
            for file_path in self._walk_directory(directory):
                if count >= self.max_files:
                    print(f"Warning: Reached max file limit ({self.max_files})")
                    break
                files.append(file_path)
                count += 1
        except PermissionError as e:
            print(f"Warning: Permission denied for some files: {e}")
        
        return files
    
    def _walk_directory(self, directory: Path):
        """
        Generator for walking directory tree.
        
        Args:
            directory: Directory to walk
        
        Yields:
            File paths
        """
        try:
            for item in directory.iterdir():
                if item.is_dir():
                    if item.name not in self.excluded_dirs:
                        yield from self._walk_directory(item)
                elif item.is_file() and self._should_include(item):
                    yield item
        except PermissionError:
            pass  # Skip directories we can't read
    
    def _should_include(self, path: Path) -> bool:
        """
        Check if file should be included.
        
        Args:
            path: File path to check
        
        Returns:
            True if file should be included
        """
        # Check extension
        if path.suffix.lower() not in self.extensions:
            return False
        
        # Check if in excluded directory (double check)
        for part in path.parts:
            if part in self.excluded_dirs:
                return False
        
        # Check file size (skip huge files)
        try:
            size = path.stat().st_size
            if size > 2 * 1024 * 1024:  # 2MB limit
                return False
            if size == 0:  # Skip empty files
                return False
        except OSError:
            return False
        
        return True

