import sys
import os
import asyncio
from unittest.mock import patch
from fastapi.testclient import TestClient
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Load env vars
load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

from app.main import app

def run_real_workflow():
    print(">>> STARTING REAL USER WORKFLOW VERIFICATION")
    
    client = TestClient(app)
    
    # User Data
    game_name = "SuperNovaDoom123"
    tag_line = "12345"
    region = "americas" # As requested, though usually region is na1/euw1 etc. Let's try 'na1' if 'americas' fails validation, but API accepts region code.
    # The API expects 'region' to be like 'na1' for match routing, but 'americas' for account.
    # Our backend handles this? Let's check main.py/riot_client. 
    # riot_client.get_account uses 'americas' hardcoded or derived.
    # riot_client.get_summoner uses 'region' (e.g. na1).
    # The user said "americas", but that's a platform. Let's assume they mean NA1 for the summoner/match lookups if 'americas' is passed.
    # Actually, let's pass 'na1' as the region in the payload, but keep the name/tag.
    
    analyze_payload = {
        "gameName": game_name, 
        "tagLine": tag_line, 
        "region": "na1" # Defaulting to NA1 based on "americas" hint, usually safe for testing.
    }
    
    # Mock BedrockClient to avoid Auth errors
    with patch("app.services.bedrock_client.BedrockClient.generate_rating") as mock_rating, \
         patch("app.services.bedrock_client.BedrockClient.invoke_agent") as mock_agent:
        
        # Mock DeepSeek Rating
        mock_rating.return_value = {
            "rating": 85,
            "percentile": 92.5,
            "summary": "Excellent farming and low deaths indicate a strong laning phase."
        }
        
        # Mock Claude Agent
        mock_agent.return_value = "Based on the analyst's report, you are doing great! Try to roam more."
        
        print(f"\n[Step 1] Analyzing Player: {game_name}#{tag_line}...")
        resp = client.post("/api/analyze", json=analyze_payload)
        
        if resp.status_code != 200:
            print(f"FAILED: Analyze endpoint returned {resp.status_code}")
            print(resp.text)
            return
            
        data = resp.json()
        session_id = data["session_id"]
        print(f"SUCCESS: Session Created: {session_id}")
        
        # Get Insights
        print("\n[Step 2] Fetching Insights...")
        insights_resp = client.get(f"/api/insights/{session_id}")
        insights = insights_resp.json()
        analysis = insights["analysis"]
        
        print(f"  > Rating: {analysis['rating']}")
        print(f"  > Summary: {analysis['summary']}")
        print(f"  > Coach Tip: {analysis['coaching_tip']}")
        
        # Chat
        print("\n[Step 3] Chatting with Coach...")
        chat_payload = {
            "session_id": session_id,
            "message": "What should I build differently to carry harder?"
        }
        
        chat_resp = client.post("/api/chat", json=chat_payload)
        chat_data = chat_resp.json()
        print(f"  > Coach Response: {chat_data['response']}")
    
    print("\n>>> REAL WORKFLOW COMPLETE (AI MOCKED)")

if __name__ == "__main__":
    run_real_workflow()
