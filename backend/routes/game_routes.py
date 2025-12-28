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
DEFAULT_MEMORY = 50.0
DEFAULT_AGE = 25
DEFAULT_GENDER = "Male"

REACTION_GAMES = {"Reaction Test", "Visual Search"}
MEMORY_GAMES = {"Memory Test", "Pattern Memory"}
DUAL_GAMES = {"Dual Task"}

def avg_or_default(values, default):
    values = [v for v in values if v is not None]
    return float(statistics.mean(values)) if values else default


def normalize_gender(g):
    g = str(g).strip().lower()
    if g in ("female", "f"):
        return "Female"
    return "Male"


def build_model_input(reaction, memory, age, gender):
    """
    IMPORTANT:
    - Must return pandas DataFrame
    - Column names MUST match training
    """
    return pd.DataFrame([{
        "Reaction_Time": float(reaction),
        "Memory_Test_Score": float(memory),
        "Age": float(age),
        "Gender": normalize_gender(gender),
    }])

@game_bp.route("/game/predict", methods=["POST"])
def predict_game():
    try:
        data = request.json or {}

        reaction = float(data.get("reaction_avg") or DEFAULT_REACTION)
        memory = float(data.get("memory_score") or DEFAULT_MEMORY)
        age = float(data.get("age") or DEFAULT_AGE)
        gender = data.get("gender") or DEFAULT_GENDER

        X = build_model_input(reaction, memory, age, gender)

        # ---------- STRESS ----------
        try:
            stress_pred = (
                _model_stress.predict(X)[0]
                if _model_stress
                else "medium"
            )
        except Exception as e:
            print("STRESS MODEL ERROR:", e)
            stress_pred = "medium"

        # ---------- COGNITIVE ----------
        try:
            cog_raw = float(_model_cog.predict(X)[0]) if _model_cog else 50
        except Exception as e:
            print("COG MODEL ERROR:", e)
            cog_raw = 50

        cog_pred = int(max(0, min(100, round(cog_raw))))

        if stress_pred == "high" or cog_pred < 40:
            rec = [
                "Take a 5–10 minute break and do breathing exercises.",
                "Reduce distractions and retry shorter sessions.",
            ]
        elif stress_pred == "medium" or cog_pred < 70:
            rec = [
                "Try a short focus exercise (5 minutes).",
                "Repeat the game to build familiarity.",
            ]
        else:
            rec = ["Great job — keep practicing to improve further!"]

        return jsonify({
            "stress_level": stress_pred,
            "cognitive_score": cog_pred,
            "focus_score": cog_pred,
            "recommendations": rec
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

        reaction = None
        memory = None

        if game_type in REACTION_GAMES or game_type in DUAL_GAMES:
            if raw_reaction is not None:
                reaction = float(raw_reaction)

        if game_type in MEMORY_GAMES or game_type in DUAL_GAMES:
            if raw_memory is not None:
                memory = float(raw_memory)

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

        past = GameSession.query.filter_by(user_id=current_user.id).all()

        reaction_final = reaction if reaction is not None else avg_or_default(
            [s.reaction_time_avg for s in past],
            DEFAULT_REACTION
        )

        memory_final = memory if memory is not None else avg_or_default(
            [s.memory_score for s in past],
            DEFAULT_MEMORY
        )

        age = current_user.age or DEFAULT_AGE
        gender = current_user.gender or DEFAULT_GENDER

        X = build_model_input(reaction_final, memory_final, age, gender)

        # ---------- STRESS ----------
        try:
            stress_pred = _model_stress.predict(X)[0] if _model_stress else "medium"
        except Exception as e:
            print("STRESS MODEL ERROR:", e)
            stress_pred = "medium"

        # ---------- COGNITIVE ----------
        try:
            cog_raw = float(_model_cog.predict(X)[0]) if _model_cog else 50
        except Exception as e:
            print("COG MODEL ERROR:", e)
            cog_raw = 50

        cog_pred = int(max(0, min(100, round(cog_raw))))

        if stress_pred == "high" or cog_pred < 40:
            rec = [
                "Take a 5–10 minute break and do breathing exercises.",
                "Reduce distractions and retry shorter sessions.",
            ]
        elif stress_pred == "medium" or cog_pred < 70:
            rec = [
                "Try a short focus exercise (5 minutes).",
                "Repeat the game to build familiarity.",
            ]
        else:
            rec = ["Great job — keep practicing to improve further!"]

        analysis = AnalysisResult(
            session_id=session.id,
            stress_level=stress_pred,
            cognitive_score=cog_pred,
            recommendations=json.dumps(rec)
        )

        db.session.add(analysis)
        db.session.commit()

        return jsonify({
            "session_id": session.id,
            "stress_level": stress_pred,
            "cognitive_score": cog_pred,
            "focus_score": cog_pred,
            "recommendations": rec
        })

    except Exception as e:
        print("submit_game error:", e)
        return jsonify({"error": "Internal server error"}), 500
