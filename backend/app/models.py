from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Enums ---
class ExperienceLevel(str, Enum):
    BEGINNER = "Beginner"
    CASUAL = "Casual"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    PRO = "Pro"

# --- Riot API Response Models (Intermediates) ---
class AccountV1Response(BaseModel):
    puuid: str
    gameName: str
    tagLine: str

class SummonerV4Response(BaseModel):
    id: Optional[str] = None
    accountId: Optional[str] = None
    puuid: str
    summonerLevel: int


class LeagueEntry(BaseModel):
    queueType: str
    tier: str
    rank: str
    leaguePoints: int
    wins: int
    losses: int

class ChampionMastery(BaseModel):
    championId: int
    championLevel: int
    championPoints: int

# --- Internal Data Structures for Analysis ---
class MatchParticipantStats(BaseModel):
    championName: str
    kills: int
    deaths: int
    assists: int
    totalMinionsKilled: int
    totalDamageDealtToChampions: int
    goldEarned: int
    win: bool
    items: List[int] # item0 to item6
    # Deep Analysis Fields
    gold_at_10: Optional[int] = None
    cs_at_10: Optional[int] = None
    xp_at_10: Optional[int] = None
    early_items: List[int] = [] # Items purchased before 15 mins

class PlayerSnapshot(BaseModel):
    """Aggregated data for AI Context"""
    gameName: str
    tagLine: str
    region: str
    summonerLevel: int
    tier: Optional[str] = None
    rank: Optional[str] = None
    recent_matches: List[MatchParticipantStats]
    top_mastery: List[Dict[str, Any]]
    experience_level: ExperienceLevel

class AnalysisResult(BaseModel):
    rating: float = Field(..., description="0-100 Rating")
    percentile: Optional[float] = None
    summary: str
    coaching_tip: str

class SessionData(BaseModel):
    """Stored in session cache"""
    session_id: str
    snapshot: PlayerSnapshot
    analysis: AnalysisResult
    chat_history: List[Dict[str, str]] = []

# --- API Request/Response Schemas ---
class AnalyzeRequest(BaseModel):
    gameName: str
    tagLine: str
    region: str = "na1"

class ChatRequest(BaseModel):
    session_id: str
    message: str

class AnalyzeResponse(BaseModel):
    session_id: str
    status: str
    player: str

class InsightsResponse(BaseModel):
    session_id: str
    snapshot: PlayerSnapshot
    analysis: AnalysisResult
