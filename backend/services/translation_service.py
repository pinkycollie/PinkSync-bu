"""
Translation Service for PinkSync
Handles sign language to text and text to sign language translation
"""

import asyncio
import numpy as np
import cv2
import mediapipe as mp
import tensorflow as tf
from typing import List, Dict, Any, Optional
import logging
import json
from datetime import datetime

from schemas.translation_schemas import TranslationRequest, SignLanguageInput, TranslationResult
from models.database import get_database
from utils.video_processing import VideoProcessor
from utils.ml_models import SignLanguageModel, TextToSignModel

logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self):
        self.db = None
        self.sign_to_text_model = None
        self.text_to_sign_model = None
        self.pose_detector = None
        self.hands_detector = None
        self.face_detector = None
        self.video_processor = VideoProcessor()
        self.is_initialized = False
    
    async def load_models(self):
        """Load AI/ML models for translation"""
        try:
            logger.info("Loading translation models...")
            
            # Initialize MediaPipe
            mp_pose = mp.solutions.pose
            mp_hands = mp.solutions.hands
            mp_face_mesh = mp.solutions.face_mesh
            
            self.pose_detector = mp_pose.Pose(
                static_image_mode=False,
                model_complexity=2,
                enable_segmentation=False,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.5
            )
            
            self.hands_detector = mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                model_complexity=1,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.5
            )
            
            self.face_detector = mp_face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.5
            )
            
            # Load custom models (in production, these would be actual trained models)
            self.sign_to_text_model = SignLanguageModel()
            self.text_to_sign_model = TextToSignModel()
            
            await self.sign_to_text_model.load_model()
            await self.text_to_sign_model.load_model()
            
            self.db = await get_database()
            self.is_initialized = True
            
            logger.info("✅ Translation models loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to load translation models: {e}")
            raise
    
    async def translate_sign_to_text(
        self, 
        translation_request: TranslationRequest, 
        user_id: str
    ) -> TranslationResult:
        """Translate sign language video to text"""
        if not self.is_initialized:
            await self.load_models()
        
        try:
            # Process video input
            video_data = translation_request.video_data
            frames = await self.video_processor.extract_frames(video_data)
            
            # Extract features from each frame
            sequence_features = []
            for frame in frames:
                features = await self.extract_sign_features(frame)
                if features is not None:
                    sequence_features.append(features)
            
            if not sequence_features:
                raise ValueError("No valid sign language features detected in video")
            
            # Convert to numpy array for model input
            sequence_array = np.array(sequence_features)
            
            # Run inference
            prediction = await self.sign_to_text_model.predict(sequence_array)
            
            # Post-process results
            translated_text = await self.post_process_translation(
                prediction, 
                translation_request.target_language
            )
            
            # Store translation in database
            translation_record = {
                "user_id": user_id,
                "source_type": "sign_language",
                "target_type": "text",
                "source_language": translation_request.source_language,
                "target_language": translation_request.target_language,
                "translated_text": translated_text,
                "confidence_score": prediction.confidence,
                "processing_time": prediction.processing_time,
                "created_at": datetime.utcnow()
            }
            
            await self.db.translations.insert_one(translation_record)
            
            logger.info(f"Sign-to-text translation completed for user {user_id}")
            
            return TranslationResult(
                translated_text=translated_text,
                confidence_score=prediction.confidence,
                source_language=translation_request.source_language,
                target_language=translation_request.target_language,
                processing_time=prediction.processing_time,
                features_detected=len(sequence_features)
            )
            
        except Exception as e:
            logger.error(f"Sign-to-text translation failed: {e}")
            raise ValueError(f"Translation failed: {str(e)}")
    
    async def translate_text_to_sign(
        self, 
        translation_request: TranslationRequest, 
        user_id: str
    ) -> TranslationResult:
        """Translate text to sign language"""
        if not self.is_initialized:
            await self.load_models()
        
        try:
            text_input = translation_request.text_input
            target_sign_language = translation_request.target_language
            
            # Preprocess text
            processed_text = await self.preprocess_text(text_input)
            
            # Generate sign sequence
            sign_sequence = await self.text_to_sign_model.generate_signs(
                processed_text, target_sign_language
            )
            
            # Generate video representation
            sign_video_url = await self.generate_sign_video(
                sign_sequence, user_id
            )
            
            # Store translation
            translation_record = {
                "user_id": user_id,
                "source_type": "text",
                "target_type": "sign_language",
                "source_text": text_input,
                "target_language": target_sign_language,
                "sign_sequence": sign_sequence.to_dict(),
                "video_url": sign_video_url,
                "confidence_score": sign_sequence.confidence,
                "created_at": datetime.utcnow()
            }
            
            await self.db.translations.insert_one(translation_record)
            
            logger.info(f"Text-to-sign translation completed for user {user_id}")
            
            return TranslationResult(
                sign_sequence=sign_sequence.to_dict(),
                video_url=sign_video_url,
                confidence_score=sign_sequence.confidence,
                source_language="en",  # Assuming English input
                target_language=target_sign_language,
                processing_time=sign_sequence.processing_time
            )
            
        except Exception as e:
            logger.error(f"Text-to-sign translation failed: {e}")
            raise ValueError(f"Translation failed: {str(e)}")
    
    async def extract_sign_features(self, frame: np.ndarray) -> Optional[Dict[str, Any]]:
        """Extract sign language features from a video frame"""
        try:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Detect pose landmarks
            pose_results = self.pose_detector.process(rgb_frame)
            hands_results = self.hands_detector.process(rgb_frame)
            face_results = self.face_detector.process(rgb_frame)
            
            features = {
                "pose_landmarks": [],
                "left_hand_landmarks": [],
                "right_hand_landmarks": [],
                "face_landmarks": [],
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Extract pose landmarks
            if pose_results.pose_landmarks:
                for landmark in pose_results.pose_landmarks.landmark:
                    features["pose_landmarks"].append({
                        "x": landmark.x,
                        "y": landmark.y,
                        "z": landmark.z,
                        "visibility": landmark.visibility
                    })
            
            # Extract hand landmarks
            if hands_results.multi_hand_landmarks:
                for idx, hand_landmarks in enumerate(hands_results.multi_hand_landmarks):
                    hand_label = hands_results.multi_handedness[idx].classification[0].label
                    landmarks_list = []
                    
                    for landmark in hand_landmarks.landmark:
                        landmarks_list.append({
                            "x": landmark.x,
                            "y": landmark.y,
                            "z": landmark.z
                        })
                    
                    if hand_label == "Left":
                        features["left_hand_landmarks"] = landmarks_list
                    else:
                        features["right_hand_landmarks"] = landmarks_list
            
            # Extract face landmarks (key points only)
            if face_results.multi_face_landmarks:
                face_landmarks = face_results.multi_face_landmarks[0]
                # Extract key facial landmarks for sign language (mouth, eyebrows, etc.)
                key_indices = [0, 17, 18, 200, 199, 175, 176, 148, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10, 151, 9, 8, 168, 6, 197, 195, 196, 3, 51, 48, 115, 131, 134, 102, 49, 220, 305, 292, 308, 324, 318]
                
                for idx in key_indices:
                    if idx < len(face_landmarks.landmark):
                        landmark = face_landmarks.landmark[idx]
                        features["face_landmarks"].append({
                            "x": landmark.x,
                            "y": landmark.y,
                            "z": landmark.z
                        })
            
            # Only return features if we have meaningful data
            if (features["pose_landmarks"] or 
                features["left_hand_landmarks"] or 
                features["right_hand_landmarks"]):
                return features
            
            return None
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            return None
    
    async def post_process_translation(
        self, 
        prediction: Any, 
        target_language: str
    ) -> str:
        """Post-process translation results"""
        # In a real implementation, this would include:
        # - Grammar correction
        # - Cultural context adaptation
        # - Language-specific formatting
        # - Confidence-based filtering
        
        translated_text = prediction.text
        
        # Basic post-processing
        translated_text = translated_text.strip()
        translated_text = translated_text.capitalize()
        
        # Add punctuation if missing
        if translated_text and not translated_text.endswith(('.', '!', '?')):
            translated_text += '.'
        
        return translated_text
    
    async def preprocess_text(self, text: str) -> str:
        """Preprocess text for sign language generation"""
        # Basic preprocessing
        text = text.strip()
        text = text.lower()
        
        # Remove excessive punctuation
        text = text.replace('...', '.')
        text = text.replace('!!', '!')
        text = text.replace('??', '?')
        
        return text
    
    async def generate_sign_video(
        self, 
        sign_sequence: Any, 
        user_id: str
    ) -> str:
        """Generate video representation of sign sequence"""
        # In production, this would generate an actual video
        # For now, return a placeholder URL
        video_filename = f"sign_video_{user_id}_{datetime.utcnow().timestamp()}.mp4"
        video_url = f"/api/media/sign-videos/{video_filename}"
        
        # Store video generation task for background processing
        video_task = {
            "user_id": user_id,
            "sign_sequence": sign_sequence.to_dict(),
            "video_url": video_url,
            "status": "generating",
            "created_at": datetime.utcnow()
        }
        
        await self.db.video_generation_tasks.insert_one(video_task)
        
        return video_url
    
    async def process_realtime_translation(
        self, 
        data: Dict[str, Any], 
        client_id: str
    ) -> Dict[str, Any]:
        """Process real-time translation for WebSocket"""
        try:
            if data.get("type") == "sign_frame":
                # Process single frame for real-time feedback
                frame_data = data.get("frame")
                features = await self.extract_sign_features(frame_data)
                
                if features:
                    # Quick inference for real-time feedback
                    partial_result = await self.sign_to_text_model.predict_partial(features)
                    
                    return {
                        "type": "partial_translation",
                        "text": partial_result.text,
                        "confidence": partial_result.confidence,
                        "features_detected": bool(features)
                    }
                
                return {
                    "type": "no_features",
                    "message": "No sign language features detected"
                }
            
            return {"type": "error", "message": "Unknown request type"}
            
        except Exception as e:
            logger.error(f"Real-time translation failed: {e}")
            return {"type": "error", "message": str(e)}
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.pose_detector:
            self.pose_detector.close()
        if self.hands_detector:
            self.hands_detector.close()
        if self.face_detector:
            self.face_detector.close()
        
        logger.info("Translation service cleaned up")
