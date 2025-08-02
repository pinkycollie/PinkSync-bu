"""
PinkSync Main FastAPI Application
Deaf-first AI accessibility synchronization platform
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import asyncio
import logging
from typing import List, Dict, Any
import json

# Import microservices
from services.auth_service import AuthService
from services.translation_service import TranslationService
from services.interpreter_service import InterpreterService
from services.accessibility_service import AccessibilityService
from services.biometric_service import BiometricService
from services.community_service import CommunityService
from services.websocket_manager import WebSocketManager

# Import models and schemas
from models.database import init_database
from schemas.auth_schemas import UserCreate, UserLogin, BiometricAuth
from schemas.translation_schemas import TranslationRequest, SignLanguageInput
from schemas.interpreter_schemas import InterpreterRequest, InterpreterMatch
from schemas.accessibility_schemas import AccessibilityOverlayRequest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
auth_service = AuthService()
translation_service = TranslationService()
interpreter_service = InterpreterService()
accessibility_service = AccessibilityService()
biometric_service = BiometricService()
community_service = CommunityService()
websocket_manager = WebSocketManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("🚀 Starting PinkSync Platform...")
    await init_database()
    await translation_service.load_models()
    await biometric_service.initialize_models()
    logger.info("✨ PinkSync Platform ready!")
    
    yield
    
    # Shutdown
    logger.info("🔄 Shutting down PinkSync Platform...")
    await translation_service.cleanup()
    await biometric_service.cleanup()
    logger.info("👋 PinkSync Platform stopped")

# Create FastAPI app
app = FastAPI(
    title="PinkSync API",
    description="Deaf-first AI accessibility synchronization platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Security
security = HTTPBearer()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://pinksync.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "pinksync.io", "*.pinksync.io"]
)

# Dependency for authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        user = await auth_service.verify_token(credentials.credentials)
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "PinkSync Platform",
        "version": "1.0.0",
        "timestamp": asyncio.get_event_loop().time()
    }

# Authentication endpoints
@app.post("/api/auth/register")
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await auth_service.create_user(user_data)
        return {"message": "User created successfully", "user_id": user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
async def login_user(login_data: UserLogin):
    """Traditional login"""
    try:
        result = await auth_service.authenticate_user(login_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/api/auth/biometric-login")
async def biometric_login(biometric_data: BiometricAuth):
    """Biometric sign language authentication"""
    try:
        result = await biometric_service.authenticate_biometric(biometric_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/api/auth/enroll-biometric")
async def enroll_biometric(
    biometric_data: BiometricAuth,
    current_user = Depends(get_current_user)
):
    """Enroll biometric authentication for user"""
    try:
        result = await biometric_service.enroll_user_biometrics(
            current_user.id, biometric_data
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Translation endpoints
@app.post("/api/translation/sign-to-text")
async def translate_sign_to_text(
    translation_request: TranslationRequest,
    current_user = Depends(get_current_user)
):
    """Translate sign language to text"""
    try:
        result = await translation_service.translate_sign_to_text(
            translation_request, current_user.id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/translation/text-to-sign")
async def translate_text_to_sign(
    translation_request: TranslationRequest,
    current_user = Depends(get_current_user)
):
    """Translate text to sign language"""
    try:
        result = await translation_service.translate_text_to_sign(
            translation_request, current_user.id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Interpreter matching endpoints
@app.post("/api/interpreters/find")
async def find_interpreters(
    interpreter_request: InterpreterRequest,
    current_user = Depends(get_current_user)
):
    """Find and match interpreters"""
    try:
        matches = await interpreter_service.find_optimal_interpreter(
            interpreter_request, current_user.id
        )
        return {"matches": matches}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/interpreters/book/{interpreter_id}")
async def book_interpreter(
    interpreter_id: str,
    booking_details: dict,
    current_user = Depends(get_current_user)
):
    """Book an interpreter"""
    try:
        booking = await interpreter_service.book_interpreter(
            interpreter_id, booking_details, current_user.id
        )
        return booking
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Accessibility overlay endpoints
@app.post("/api/accessibility/analyze-page")
async def analyze_page_accessibility(
    overlay_request: AccessibilityOverlayRequest,
    current_user = Depends(get_current_user)
):
    """Analyze page for accessibility issues"""
    try:
        analysis = await accessibility_service.analyze_page(
            overlay_request, current_user.id
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/accessibility/generate-overlay")
async def generate_accessibility_overlay(
    overlay_request: AccessibilityOverlayRequest,
    current_user = Depends(get_current_user)
):
    """Generate accessibility overlay for website"""
    try:
        overlay = await accessibility_service.generate_overlay(
            overlay_request, current_user.id
        )
        return overlay
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Community endpoints
@app.get("/api/community/feed")
async def get_community_feed(
    current_user = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0
):
    """Get community feed"""
    try:
        feed = await community_service.get_community_feed(
            current_user.id, limit, offset
        )
        return feed
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/community/post")
async def create_community_post(
    post_data: dict,
    current_user = Depends(get_current_user)
):
    """Create a community post"""
    try:
        post = await community_service.create_post(post_data, current_user.id)
        return post
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# WebSocket endpoint for real-time features
@app.websocket("/api/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time communication"""
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Process message based on type
            if message["type"] == "translation_request":
                # Handle real-time translation
                result = await translation_service.process_realtime_translation(
                    message["data"], client_id
                )
                await websocket_manager.send_personal_message(
                    json.dumps({"type": "translation_result", "data": result}),
                    client_id
                )
            
            elif message["type"] == "interpreter_session":
                # Handle interpreter session communication
                await websocket_manager.handle_interpreter_session(
                    message["data"], client_id
                )
            
            elif message["type"] == "accessibility_update":
                # Handle accessibility overlay updates
                result = await accessibility_service.process_realtime_update(
                    message["data"], client_id
                )
                await websocket_manager.send_personal_message(
                    json.dumps({"type": "accessibility_result", "data": result}),
                    client_id
                )
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)
        logger.info(f"Client {client_id} disconnected")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
