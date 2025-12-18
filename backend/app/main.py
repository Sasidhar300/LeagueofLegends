import asyncio
import uuid
from typing import Dict
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from dotenv import load_dotenv

# Load env before imports that might use it
load_dotenv()

from app.models import (
    AnalyzeRequest, 
    AnalyzeResponse, 
    InsightsResponse, 
    ChatRequest, 
    SessionData, 
    AnalysisResult
)
from app.services.riot_client import RiotClient
from app.services.bedrock_client import BedrockClient
from app.services.analyzer import AnalyzerService

# --- State & Lifecycle ---
riot_client = RiotClient()
bedrock_client = BedrockClient()
analyzer = AnalyzerService(riot_client)

# In-memory session store (Use Redis in production)
# Key: session_id, Value: SessionData
sessions: Dict[str, SessionData] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    await riot_client.close()

app = FastAPI(title="LoL AI Coach API", lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependencies ---
async def get_session(session_id: str) -> SessionData:
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# --- Endpoints ---

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_player(request: AnalyzeRequest):
    try:
        # 1. Build Snapshot
        snapshot = await analyzer.build_snapshot(request.gameName, request.tagLine, request.region)
        
        # 2. AI Analysis (Parallel safe?)
        # We can run rating generation here.
        rating_json = bedrock_client.generate_rating(snapshot)
        
        # 3. Generate Initial Coaching Tip
        # Use the agent to generate the initial tip based on the summary
        initial_prompt = f"The analyst provided this summary: '{rating_json.get('summary')}'. Give me a starting coaching tip based on this."
        tip = bedrock_client.invoke_agent(initial_prompt, snapshot)
        
        analysis = AnalysisResult(
            rating=rating_json.get("rating", 0),
            percentile=rating_json.get("percentile", 0.0),
            summary=rating_json.get("summary", "Analysis unavailable."),
            coaching_tip=tip
        )
        
        # 4. Store Session
        session_id = str(uuid.uuid4())
        print(f"DEBUG: Session Created {session_id}")
        sessions[session_id] = SessionData(
            session_id=session_id,
            snapshot=snapshot,
            analysis=analysis
        )
        
        return AnalyzeResponse(
            session_id=session_id,
            status="completed",
            player=f"{request.gameName}#{request.tagLine}"
        )
        
    except ValueError as e:
        print(f"DEBUG: ValueError caught: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        # Log error in production
        print(f"Analysis Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error during analysis")

@app.get("/api/insights/{session_id}", response_model=InsightsResponse)
async def get_insights(session_id: str):
    session = await get_session(session_id)
    return InsightsResponse(
        session_id=session.session_id,
        snapshot=session.snapshot,
        analysis=session.analysis
    )

@app.post("/api/chat")
async def chat_with_coach(request: ChatRequest):
    session = await get_session(request.session_id)
    
    # Generate response via Agent
    response = bedrock_client.invoke_agent(request.message, session.snapshot, session.chat_history)
    
    # Store history (optional, for context window management)
    session.chat_history.append({"user": request.message, "coach": response})
    
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
