from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models.game_model import GameSession, AnalysisResult
from backend.utils.auth_middleware import token_required

import joblib, json, os, statistics
import pandas as pd

game_bp = Blueprint("game_bp", __name__)

ML_DIR = os.path.join(os.path.dirname(__file__), "..", "ml")
MODEL_STRESS_PATH = os.path.join(ML_DIR, "model_stress.pkl")
MODEL_COG_PATH = os.path.join(ML_DIR, "model_cognitive.pkl")

_model_stress = joblib.load(MODEL_STRESS_PATH) if os.path.exists(MODEL_STRESS_PATH) else None
_model_cog = joblib.load(MODEL_COG_PATH) if os.path.exists(MODEL_COG_PATH) else None

DEFAULT_REACTION = 300.0
DEFAULT_MEMORY = 70.0
DEFAULT_AGE = 25
DEFAULT_GENDER = "Male"

REACTION_GAMES = {
    "Reaction Test",
    "Visual Search"
}

MEMORY_GAMES = {
    "Memory Test",
    "Pattern Memory"
}

DUAL_GAMES = {
    "Dual Task",
    "Stroop Test"
}

STRESS_MAP = {
    0: "low",
    1: "medium",
    2: "high"
}

def normalize_gender(gender):
    g = str(gender).strip().lower()
    return "Female" if g in ("female", "f", "woman") else "Male"


def median_or_default(values, default):
    clean = [v for v in values if v is not None]
    return float(statistics.median(clean)) if clean else default


def build_model_input(reaction, memory, age, gender):
    return pd.DataFrame([{
        "Reaction_Time": float(reaction),
        "Memory_Test_Score": float(memory),
        "Age": float(age),
        "Gender": normalize_gender(gender),
    }])

import random

def generate_recommendations(stress, cognitive):
    HIGH_STRESS = [
        "Take a short break and focus on slow, deep breathing to reset your mind.",
        "Your responses suggest mental fatigue — stepping away for a few minutes may help.",
        "Consider reducing distractions and trying again when you feel calmer.",
        "A brief pause and relaxation can significantly improve your next performance.",
        "It’s okay to slow down — give yourself time to recover before continuing."
    ]

    MEDIUM_STRESS = [
        "You’re doing fairly well, but a short rest could help sharpen your focus.",
        "Try a brief focus or breathing exercise before your next session.",
        "Repeating the task once more may help improve consistency.",
        "Your performance is stable — staying relaxed can help you do even better.",
        "Maintaining a calm pace will likely improve your results."
    ]

    LOW_STRESS = [
        "Great work — your focus and reaction seem well balanced.",
        "You’re performing consistently — keep up the good rhythm.",
        "Your current state shows strong cognitive control. Well done!",
        "Excellent performance — continuing regular practice can help maintain this level.",
        "You appear relaxed and focused — this is an ideal performance state."
    ]

    if stress == "high" or cognitive < 40:
        return random.choice(HIGH_STRESS)

    elif stress == "medium" or cognitive < 70:
        return random.choice(MEDIUM_STRESS)

    return random.choice(LOW_STRESS)

@game_bp.route("/game/predict", methods=["POST"])
def predict_game():
    try:
        data = request.json or {}

        reaction = data.get("reaction_avg")
        memory = data.get("memory_score")
        age = data.get("age") or DEFAULT_AGE
        gender = data.get("gender") or DEFAULT_GENDER

        reaction_final = float(reaction) if reaction is not None else DEFAULT_REACTION
        memory_final = float(memory) if memory is not None else DEFAULT_MEMORY

        X = build_model_input(
            reaction_final,
            memory_final,
            age,
            gender
        )

        stress_idx = int(_model_stress.predict(X)[0]) if _model_stress else 1
        stress_pred = STRESS_MAP.get(stress_idx, "medium")

        cog_raw = float(_model_cog.predict(X)[0]) if _model_cog else 0.5
        cognitive = int(max(0, min(100, round(cog_raw * 100))))

        return jsonify({
            "stress_level": stress_pred,
            "cognitive_score": cognitive,
            "focus_score": cognitive,
            "recommendations": generate_recommendations(stress_pred, cognitive)
        })

    except Exception as e:
        print("predict_game error:", e)
        return jsonify({"error": "Internal server error"}), 500

@game_bp.route("/game/submit", methods=["POST"])
@token_required
def submit_game(current_user):
    try:
        data = request.json or {}

        game_type = data.get("gameType", "unknown")
        duration_ms = data.get("durationMs", 0)
        meta = data.get("meta", {})

        raw_reaction = data.get("reaction_avg")
        raw_memory = data.get("memory_score")

        reaction = float(raw_reaction) if raw_reaction is not None and (
            game_type in REACTION_GAMES or game_type in DUAL_GAMES
        ) else None

        memory = float(raw_memory) if raw_memory is not None and (
            game_type in MEMORY_GAMES or game_type in DUAL_GAMES
        ) else None

        session = GameSession(
            user_id=current_user.id,
            game_type=game_type,
            reaction_time_avg=reaction,
            memory_score=memory,
            errors=int(meta.get("errors", 0)),
            duration=(duration_ms or 0) / 1000.0
        )

        db.session.add(session)
        db.session.commit()

        history = GameSession.query.filter_by(
            user_id=current_user.id
        ).all()

        reaction_final = (
            reaction if reaction is not None else
            median_or_default(
                [s.reaction_time_avg for s in history],
                DEFAULT_REACTION
            )
        )

        memory_final = (
            memory if memory is not None else
            median_or_default(
                [s.memory_score for s in history],
                DEFAULT_MEMORY
            )
        )

        age = current_user.age or DEFAULT_AGE
        gender = current_user.gender or DEFAULT_GENDER

        X = build_model_input(
            reaction_final,
            memory_final,
            age,
            gender
        )

        stress_idx = int(_model_stress.predict(X)[0]) if _model_stress else 1
        stress_pred = STRESS_MAP.get(stress_idx, "medium")

        cog_raw = float(_model_cog.predict(X)[0]) if _model_cog else 0.5
        cognitive = int(max(0, min(100, round(cog_raw * 100))))

        analysis = AnalysisResult(
            session_id=session.id,
            stress_level=stress_pred,
            cognitive_score=cognitive,
            recommendations=json.dumps(
                generate_recommendations(stress_pred, cognitive)
            )
        )

        db.session.add(analysis)
        db.session.commit()

        return jsonify({
            "session_id": session.id,
            "stress_level": stress_pred,
            "cognitive_score": cognitive,
            "focus_score": cognitive,
            "reaction_used": reaction_final,
            "memory_used": memory_final,
            "recommendations": generate_recommendations(stress_pred, cognitive)
        })

    except Exception as e:
        print("submit_game error:", e)
        return jsonify({"error": "Internal server error"}), 500
