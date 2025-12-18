import os
import asyncio
import httpx
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from app.utils.constants import get_platform_from_region
from app.models import (
    AccountV1Response, 
    SummonerV4Response, 
    LeagueEntry, 
    ChampionMastery
)

class RiotClient:
    def __init__(self):
        self.api_key = os.getenv("RIOT_API_KEY")
        if not self.api_key:
            raise ValueError("RIOT_API_KEY environment variable is not set")
        self.headers = {"X-Riot-Token": self.api_key}
        self.client = httpx.AsyncClient(headers=self.headers, timeout=10.0)

    async def close(self):
        await self.client.aclose()

    async def _request(self, url: str) -> Dict[str, Any]:
        retries = 3
        for attempt in range(retries):
            try:
                response = await self.client.get(url)
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    # Rate limit handling
                    retry_after = int(response.headers.get("Retry-After", 1))
                    print(f"Rate limited. Waiting {retry_after}s...")
                    await asyncio.sleep(retry_after)
                    continue
                elif response.status_code == 404:
                    return None # Handle explicitly in caller
                else:
                    response.raise_for_status()
            except httpx.HTTPError as e:
                print(f"HTTP Error on {url}: {e}")
                if attempt == retries - 1:
                    raise HTTPException(status_code=502, detail=f"Riot API Error: {str(e)}")
                await asyncio.sleep(1)
        raise HTTPException(status_code=504, detail="Riot API Timeout")

    async def get_account(self, game_name: str, tag_line: str) -> Optional[AccountV1Response]:
        # Account-V1 uses 'americas', 'europe', 'asia' routing usually, but the prompt says region code.
        # Actually Account-V1 is often routed by the broad region (Americas, Europe, Asia).
        # We'll use 'americas' as a default safe fallback for lookup or infer from region if possible.
        # Check standard usage: account/v1/accounts/by-riot-id uses AMERICAS for NA/BR/LATAM.
        # We will assume 'americas' for now or make it configurable if needed, 
        # but usually you search on the platform nearest to you or global.
        # The prompt says: https://americas.api.riotgames.com/riot/account/v1/...
        url = f"https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}"
        data = await self._request(url)
        if not data:
            return None
        return AccountV1Response(**data)

    async def get_summoner(self, region: str, puuid: str) -> Optional[SummonerV4Response]:
        url = f"https://{region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
        data = await self._request(url)
        if not data:
            return None
        return SummonerV4Response(**data)

    async def get_league_entries(self, region: str, encrypted_summoner_id: str) -> List[LeagueEntry]:
        url = f"https://{region}.api.riotgames.com/lol/league/v4/entries/by-summoner/{encrypted_summoner_id}"
        data = await self._request(url)
        if not data:
            return []
        return [LeagueEntry(**entry) for entry in data]

    async def get_match_ids(self, region: str, puuid: str, count: int = 15) -> List[str]:
        # Match-V5 uses platform routing (americas, europe, asia, sea)
        platform = get_platform_from_region(region)
        url = f"https://{platform}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count={count}"
        data = await self._request(url)
        return data if data else []

    async def get_match_detail(self, region: str, match_id: str) -> Optional[Dict[str, Any]]:
        platform = get_platform_from_region(region)
        url = f"https://{platform}.api.riotgames.com/lol/match/v5/matches/{match_id}"
        return await self._request(url)
    
    async def get_top_mastery(self, region: str, puuid: str) -> List[ChampionMastery]:
        # Use a count to limit data if needed, but endpoint returns all by default or top k?
        # Check docs: /lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/top defaults to top 3?
        # Prompt says "top".
        url = f"https://{region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/top"
        data = await self._request(url)
        if not data:
            return []
        return [ChampionMastery(**m) for m in data]

    async def get_match_timeline(self, region: str, match_id: str) -> Optional[Dict[str, Any]]:
        platform = get_platform_from_region(region)
        url = f"https://{platform}.api.riotgames.com/lol/match/v5/matches/{match_id}/timeline"
        return await self._request(url)


