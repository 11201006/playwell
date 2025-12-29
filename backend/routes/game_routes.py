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


def generate_recommendations(stress, cognitive):
    if stress == "high" or cognitive < 40:
        return [
            "Take a 5–10 minute break and do breathing exercises.",
            "Reduce distractions and retry shorter sessions."
        ]
    elif stress == "medium" or cognitive < 70:
        return [
            "Try a short focus exercise (5 minutes).",
            "Repeat the game to build familiarity."
        ]
    return ["Great job — keep practicing to improve further!"]

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
