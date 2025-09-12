"""WebStatus API client with caching and rate limiting"""
import os
import httpx
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio

class BaselineAPI:
    """Client for WebStatus API with caching and rate limiting"""
    
    def __init__(self, timeout: float = 5.0):
        """Initialize API client"""
        self.base_url = os.getenv("AMICOMPAT_API_BASE", "https://api.webstatus.dev/v1")
        self.timeout = timeout
        self._cache: Dict[str, tuple[Dict[str, Any], datetime]] = {}
        self._cache_duration = timedelta(hours=1)
        # Concurrency from env (default 5)
        try:
            max_conc = max(1, int(os.getenv("AMICOMPAT_MAX_CONCURRENCY", "5")))
        except ValueError:
            max_conc = 5
        self._semaphore = asyncio.Semaphore(max_conc)
        self._headers = {"User-Agent": "amicompat-mcp/1.0 (+https://github.com/)"}
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self):
        self._client = httpx.AsyncClient(timeout=self.timeout, headers=self._headers)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self._client is not None:
            await self._client.aclose()
            self._client = None
    
    async def get_feature_status(self, feature_id: str) -> Dict[str, Any]:
        """
        Get feature status with caching.
        
        Args:
            feature_id: Feature identifier
        
        Returns:
            Feature status dictionary
        """
        # Check cache first
        if feature_id in self._cache:
            cached_data, timestamp = self._cache[feature_id]
            if datetime.now() - timestamp < self._cache_duration:
                return cached_data
        
        # Fetch from API with rate limiting
        async with self._semaphore:
            try:
                assert self._client is not None, "AsyncClient not initialized"
                # Try direct feature endpoint
                response = await self._client.get(f"{self.base_url}/features/{feature_id}")
                
                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = response.headers.get("Retry-After")
                    try:
                        await asyncio.sleep(float(retry_after) if retry_after else 1.0)
                    except Exception:
                        await asyncio.sleep(1.0)
                    # Retry once
                    response = await self._client.get(f"{self.base_url}/features/{feature_id}")
                
                if response.status_code == 404:
                    # Try search as fallback
                    response = await self._client.get(
                        f"{self.base_url}/features",
                        params={"q": f"id:{feature_id}"}
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("data") and len(data["data"]) > 0:
                            result = self._extract_status(data["data"][0])
                            self._cache[feature_id] = (result, datetime.now())
                            return result
                
                elif response.status_code == 200:
                    data = response.json()
                    result = self._extract_status(data)
                    self._cache[feature_id] = (result, datetime.now())
                    return result
                        
            except asyncio.TimeoutError:
                print(f"Timeout fetching {feature_id}")
            except httpx.ConnectError:
                print(f"Connection error fetching {feature_id}")
            except Exception as e:
                print(f"Error fetching {feature_id}: {e}")
        
        # Return cached if available (even if expired)
        if feature_id in self._cache:
            cached_data, _ = self._cache[feature_id]
            return cached_data
        
        # Default fallback
        return {
            "id": feature_id,
            "baseline_status": "limited",
            "browsers": {},
            "name": feature_id,
            "error": "Could not fetch status"
        }
    
    def _extract_status(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract relevant status information from API response.
        
        Args:
            data: Raw API response
        
        Returns:
            Normalized status dictionary
        """
        browsers = {}
        
        # Extract browser support information
        if "browsers" in data:
            for browser, info in data["browsers"].items():
                if isinstance(info, dict):
                    browsers[browser] = info.get("version", "unknown")
                else:
                    browsers[browser] = str(info)
        
        return {
            "id": data.get("id", ""),
            "baseline_status": data.get("baseline_status", "limited"),
            "baseline_date": data.get("baseline_date"),
            "browsers": browsers,
            "name": data.get("name", ""),
            "description": data.get("description", "")
        }
