import sys
import os
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.main import app
from app.models import PlayerSnapshot, ExperienceLevel, MatchParticipantStats

# --- Mock Data ---
MOCK_SNAPSHOT = PlayerSnapshot(
    gameName="TestPlayer",
    tagLine="NA1",
    region="na1",
    summonerLevel=100,
    tier="GOLD",
    rank="IV",
    experience_level=ExperienceLevel.INTERMEDIATE,
    recent_matches=[
        MatchParticipantStats(
            championName="Ahri",
            kills=5,
            deaths=2,
            assists=10,
            totalMinionsKilled=150,
            totalDamageDealtToChampions=20000,
            goldEarned=12000,
            win=True,
            items=[1, 2, 3, 4, 5, 6, 0],
            gold_at_10=3500,
            cs_at_10=80,
            xp_at_10=4000,
            early_items=[1001, 3020]
        )
    ],
    top_mastery=[{"championId": 103, "points": 100000}]
)

# --- Test Script ---
def run_workflow():
    print(">>> STARTING WORKFLOW VERIFICATION")
    
    # Patch the analyzer service to avoid Riot API calls
    with patch("app.main.analyzer.build_snapshot", new_callable=AsyncMock) as mock_build:
        mock_build.return_value = MOCK_SNAPSHOT
        
        client = TestClient(app)
        
        # 1. Analyze Player
        print("\n[Step 1] Analyzing Player (Triggers DeepSeek Rating + Claude Tip)...")
        analyze_payload = {"gameName": "TestPlayer", "tagLine": "NA1", "region": "na1"}
        resp = client.post("/api/analyze", json=analyze_payload)
        
        if resp.status_code != 200:
            print(f"FAILED: Analyze endpoint returned {resp.status_code}")
            print(resp.text)
            return
            
        data = resp.json()
        session_id = data["session_id"]
        print(f"SUCCESS: Session Created: {session_id}")
        
        # Get Insights to see the summary
        print("\n[Step 2] Fetching Insights to verify DeepSeek Summary...")
        insights_resp = client.get(f"/api/insights/{session_id}")
        insights = insights_resp.json()
        analysis = insights["analysis"]
        
        print(f"  > Rating: {analysis['rating']}")
        print(f"  > Summary (DeepSeek): {analysis['summary']}")
        print(f"  > Coach Tip (Claude): {analysis['coaching_tip']}")
        
        # 2. Chat with Coach (Trigger Tool)
        print("\n[Step 3] Chatting with Coach (Triggering Analyst Tool)...")
        # We ask a question that specifically requires looking at the stats/itemization
        chat_payload = {
            "session_id": session_id,
            "message": "Analyze my item build efficiency in the last match. Did I buy my first item on time?"
        }
        
        chat_resp = client.post("/api/chat", json=chat_payload)
        if chat_resp.status_code != 200:
            print(f"FAILED: Chat endpoint returned {chat_resp.status_code}")
            print(chat_resp.text)
            return
            
        chat_data = chat_resp.json()
        print(f"  > Coach Response: {chat_data['response']}")
        
    print("\n>>> WORKFLOW VERIFICATION COMPLETE")

if __name__ == "__main__":
    run_workflow()
