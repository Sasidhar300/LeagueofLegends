import asyncio
from typing import List, Dict, Any, Optional
from app.models import (
    PlayerSnapshot, 
    ExperienceLevel, 
    MatchParticipantStats,
    LeagueEntry,
    AccountV1Response,
    SummonerV4Response,
    ChampionMastery
)
from app.services.riot_client import RiotClient

class AnalyzerService:
    def __init__(self, riot_client: RiotClient):
        self.riot = riot_client

    def calculate_experience_level(self, league_entries: List[LeagueEntry], level: int) -> ExperienceLevel:
        # Prioritize Solo Tuple > Flex
        solo_q = next((e for e in league_entries if e.queueType == "RANKED_SOLO_5x5"), None)
        flex_q = next((e for e in league_entries if e.queueType == "RANKED_FLEX_SR"), None)
        
        entry = solo_q or flex_q
        
        if not entry:
            if level < 30:
                return ExperienceLevel.BEGINNER
            return ExperienceLevel.CASUAL
            
        tier = entry.tier.upper()
        if tier in ["IRON", "BRONZE"]:
            return ExperienceLevel.BEGINNER
        elif tier in ["SILVER", "GOLD"]:
            return ExperienceLevel.INTERMEDIATE
        elif tier in ["PLATINUM", "EMERALD"]:
            return ExperienceLevel.ADVANCED
        elif tier in ["DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"]:
            return ExperienceLevel.PRO
        
        return ExperienceLevel.CASUAL

    async def build_snapshot(self, game_name: str, tag_line: str, region: str) -> PlayerSnapshot:
        # 1. Get Account
        account = await self.riot.get_account(game_name, tag_line)
        if not account:
            raise ValueError("Account not found")
            
        # 2. Get Summoner
        summoner = await self.riot.get_summoner(region, account.puuid)
        if not summoner:
            raise ValueError("Summoner not found")
            
        # 3. Get League Entries & Match IDs & Mastery (Parallel)
        # 3. Get League Entries & Match IDs & Mastery (Parallel)
        if summoner.id:
            league_entries_task = self.riot.get_league_entries(region, summoner.id)
        else:
            # No ID (e.g. low level account), assume no rank
            league_entries_task = asyncio.futures.Future()
            league_entries_task.set_result([])

        
        # Simpler:
        match_ids_task = self.riot.get_match_ids(region, account.puuid)
        mastery_task = self.riot.get_top_mastery(region, account.puuid)

        if summoner.id:
            league_entries, match_ids, masteries = await asyncio.gather(
                self.riot.get_league_entries(region, summoner.id),
                match_ids_task,
                mastery_task
            )
        else:
            # Skip league entries
            league_entries = []
            match_ids, masteries = await asyncio.gather(
                match_ids_task,
                mastery_task
            )
        
        # 4. Fetch Match Details & Timelines (Parallel)
        # We need both details (for end stats) and timeline (for early stats)
        # To avoid rate limits or too many requests, limit to top 5 recent matches for deep analysis if performance is a concern.
        # But per requirements, we'll try to get all or a subset. Let's do recent 5 for deep dive to keep it fast.
        recent_match_ids = match_ids[:5] 
        
        detail_tasks = [self.riot.get_match_detail(region, mid) for mid in recent_match_ids]
        timeline_tasks = [self.riot.get_match_timeline(region, mid) for mid in recent_match_ids]
        
        # Gather all together
        results = await asyncio.gather(*detail_tasks, *timeline_tasks)
        num_matches = len(recent_match_ids)
        matches_data = results[:num_matches]
        timelines_data = results[num_matches:]
        
        # 5. Process Matches
        processed_matches: List[MatchParticipantStats] = []
        for i, match in enumerate(matches_data):
            if not match:
                continue
            
            timeline = timelines_data[i]
            info = match.get("info", {})
            participants = info.get("participants", [])
            
            # Find user
            user_part = next((p for p in participants if p["puuid"] == account.puuid), None)
            if user_part:
                participant_id = user_part.get("participantId")
                
                # Analyze Timeline
                gold_10 = 0
                cs_10 = 0
                xp_10 = 0
                early_items = []
                
                if timeline:
                    # Frames: 0..N. Frame N is at timestamp N * 60000ms (approx)
                    # We want 10 min mark -> Frame 10 (or near 10th index)
                    frames = timeline.get("info", {}).get("frames", [])
                    if len(frames) > 10:
                        frame_10 = frames[10] # 10 mins
                        p_frames = frame_10.get("participantFrames", {})
                        # participantFrames keys are strings "1", "2" etc.
                        p_stats = p_frames.get(str(participant_id))
                        if p_stats:
                            gold_10 = p_stats.get("totalGold", 0)
                            cs_10 = p_stats.get("minionsKilled", 0) + p_stats.get("jungleMinionsKilled", 0)
                            xp_10 = p_stats.get("xp", 0)
                            
                    # Early Items (< 15 mins)
                    events = timeline.get("info", {}).get("events", [])
                    for event in events:
                        if event.get("type") == "ITEM_PURCHASED" and event.get("participantId") == participant_id:
                            if event.get("timestamp", 0) < 15 * 60 * 1000: # 15 mins
                                early_items.append(event.get("itemId"))

                stats = MatchParticipantStats(
                    championName=user_part.get("championName", "Unknown"),
                    kills=user_part.get("kills", 0),
                    deaths=user_part.get("deaths", 0),
                    assists=user_part.get("assists", 0),
                    totalMinionsKilled=user_part.get("totalMinionsKilled", 0) + user_part.get("neutralMinionsKilled", 0),
                    totalDamageDealtToChampions=user_part.get("totalDamageDealtToChampions", 0),
                    goldEarned=user_part.get("goldEarned", 0),
                    win=user_part.get("win", False),
                    items=[user_part.get(f"item{i}", 0) for i in range(7)],
                    # Deep Stats
                    gold_at_10=gold_10,
                    cs_at_10=cs_10,
                    xp_at_10=xp_10,
                    early_items=early_items
                )
                processed_matches.append(stats)
                
        # 6. Determine Experience
        exp_level = self.calculate_experience_level(league_entries, summoner.summonerLevel)
        
        # 7. Extract Rank Info
        solo_q = next((e for e in league_entries if e.queueType == "RANKED_SOLO_5x5"), None)
        
        return PlayerSnapshot(
            gameName=account.gameName,
            tagLine=account.tagLine,
            region=region,
            summonerLevel=summoner.summonerLevel,
            tier=solo_q.tier if solo_q else "UNRANKED",
            rank=solo_q.rank if solo_q else None,
            recent_matches=processed_matches,
            top_mastery=[m.model_dump() for m in masteries[:5]],
            experience_level=exp_level
        )
