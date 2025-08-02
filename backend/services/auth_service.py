"""
Authentication Service for PinkSync
Handles traditional and biometric authentication
"""

import jwt
import bcrypt
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import secrets
import logging

from models.user_model import User, UserCreate, UserLogin
from models.database import get_database
from utils.security import SecurityUtils

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self):
        self.db = None
        self.jwt_secret = "your-super-secret-jwt-key"  # Should be from env
        self.jwt_algorithm = "HS256"
        self.token_expire_hours = 24
        self.security_utils = SecurityUtils()
    
    async def initialize(self):
        """Initialize the auth service"""
        self.db = await get_database()
    
    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user account"""
        if not self.db:
            await self.initialize()
        
        # Check if user already exists
        existing_user = await self.db.users.find_one({"email": user_data.email})
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Hash password
        password_hash = bcrypt.hashpw(
            user_data.password.encode('utf-8'), 
            bcrypt.gensalt()
        )
        
        # Create user document
        user_doc = {
            "email": user_data.email,
            "username": user_data.username,
            "password_hash": password_hash.decode('utf-8'),
            "full_name": user_data.full_name,
            "deaf_identity": user_data.deaf_identity,
            "preferred_sign_language": user_data.preferred_sign_language,
            "accessibility_preferences": user_data.accessibility_preferences,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "is_verified": False,
            "biometric_enrolled": False,
            "user_type": user_data.user_type or "individual"
        }
        
        # Insert user
        result = await self.db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        logger.info(f"Created new user: {user_data.email}")
        return User(**user_doc)
    
    async def authenticate_user(self, login_data: UserLogin) -> Dict[str, Any]:
        """Authenticate user with email/password"""
        if not self.db:
            await self.initialize()
        
        # Find user
        user_doc = await self.db.users.find_one({"email": login_data.email})
        if not user_doc:
            raise ValueError("Invalid email or password")
        
        # Verify password
        if not bcrypt.checkpw(
            login_data.password.encode('utf-8'),
            user_doc["password_hash"].encode('utf-8')
        ):
            raise ValueError("Invalid email or password")
        
        # Check if user is active
        if not user_doc.get("is_active", True):
            raise ValueError("Account is deactivated")
        
        # Generate JWT token
        token = self.generate_jwt_token(user_doc)
        
        # Update last login
        await self.db.users.update_one(
            {"_id": user_doc["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        logger.info(f"User authenticated: {login_data.email}")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": self.token_expire_hours * 3600,
            "user": {
                "id": str(user_doc["_id"]),
                "email": user_doc["email"],
                "username": user_doc["username"],
                "full_name": user_doc["full_name"],
                "deaf_identity": user_doc["deaf_identity"],
                "preferred_sign_language": user_doc["preferred_sign_language"],
                "biometric_enrolled": user_doc.get("biometric_enrolled", False)
            }
        }
    
    def generate_jwt_token(self, user_doc: Dict[str, Any]) -> str:
        """Generate JWT token for user"""
        payload = {
            "user_id": str(user_doc["_id"]),
            "email": user_doc["email"],
            "username": user_doc["username"],
            "exp": datetime.utcnow() + timedelta(hours=self.token_expire_hours),
            "iat": datetime.utcnow(),
            "iss": "pinksync-platform"
        }
        
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)
    
    async def verify_token(self, token: str) -> User:
        """Verify JWT token and return user"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=[self.jwt_algorithm])
            user_id = payload.get("user_id")
            
            if not user_id:
                raise ValueError("Invalid token payload")
            
            # Get user from database
            if not self.db:
                await self.initialize()
            
            user_doc = await self.db.users.find_one({"_id": user_id})
            if not user_doc:
                raise ValueError("User not found")
            
            if not user_doc.get("is_active", True):
                raise ValueError("User account is deactivated")
            
            return User(**user_doc)
            
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")
    
    async def refresh_token(self, token: str) -> Dict[str, Any]:
        """Refresh JWT token"""
        user = await self.verify_token(token)
        new_token = self.generate_jwt_token(user.__dict__)
        
        return {
            "access_token": new_token,
            "token_type": "bearer",
            "expires_in": self.token_expire_hours * 3600
        }
    
    async def logout_user(self, token: str) -> bool:
        """Logout user (add token to blacklist)"""
        # In a production system, you'd add the token to a blacklist
        # For now, we'll just verify the token is valid
        await self.verify_token(token)
        return True
    
    async def reset_password_request(self, email: str) -> bool:
        """Request password reset"""
        if not self.db:
            await self.initialize()
        
        user_doc = await self.db.users.find_one({"email": email})
        if not user_doc:
            # Don't reveal if email exists or not
            return True
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        reset_expires = datetime.utcnow() + timedelta(hours=1)
        
        # Store reset token
        await self.db.users.update_one(
            {"_id": user_doc["_id"]},
            {
                "$set": {
                    "reset_token": reset_token,
                    "reset_token_expires": reset_expires
                }
            }
        )
        
        # In production, send email with reset link
        logger.info(f"Password reset requested for: {email}")
        
        return True
    
    async def reset_password(self, reset_token: str, new_password: str) -> bool:
        """Reset password with token"""
        if not self.db:
            await self.initialize()
        
        # Find user with valid reset token
        user_doc = await self.db.users.find_one({
            "reset_token": reset_token,
            "reset_token_expires": {"$gt": datetime.utcnow()}
        })
        
        if not user_doc:
            raise ValueError("Invalid or expired reset token")
        
        # Hash new password
        password_hash = bcrypt.hashpw(
            new_password.encode('utf-8'),
            bcrypt.gensalt()
        )
        
        # Update password and clear reset token
        await self.db.users.update_one(
            {"_id": user_doc["_id"]},
            {
                "$set": {
                    "password_hash": password_hash.decode('utf-8'),
                    "updated_at": datetime.utcnow()
                },
                "$unset": {
                    "reset_token": "",
                    "reset_token_expires": ""
                }
            }
        )
        
        logger.info(f"Password reset completed for user: {user_doc['email']}")
        return True
