from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models.game_model import GameSession, AnalysisResult
from backend.models.user_model import User
from backend.utils.auth_middleware import token_required
import joblib, json, os, statistics, random

game_bp = Blueprint("game_bp", "game_bp")

ML_DIR = os.path.join(os.path.dirname(__file__), "..", "ml")
MODEL_STRESS_PATH = os.path.join(ML_DIR, "model_stress.pkl")
MODEL_COG_PATH = os.path.join(ML_DIR, "model_cognitive.pkl")
LABEL_ENCODER_PATH = os.path.join(ML_DIR, "label_encoder_stress.pkl")

_model_stress = joblib.load(MODEL_STRESS_PATH) if os.path.exists(MODEL_STRESS_PATH) else None
_model_cog = joblib.load(MODEL_COG_PATH) if os.path.exists(MODEL_COG_PATH) else None
_label_encoder = joblib.load(LABEL_ENCODER_PATH) if os.path.exists(LABEL_ENCODER_PATH) else None

DEFAULT_FEATURES = {"reaction_avg": 300.0, "memory_score": 50.0, "age": 25, "gender": 0}

def build_features(reaction, memory, age, gender_enc):
    age = age if age > 0 else DEFAULT_FEATURES["age"]

    return [[
        reaction,
        memory,
        age,
        gender_enc,
        reaction / age,
        memory / age,
        reaction * memory
    ]]

@game_bp.route("/game/predict", methods=["POST"])
def predict_game():
    try:
        data = request.json or {}

        reaction_avg = float(data.get("reaction_avg", DEFAULT_FEATURES["reaction_avg"]))
        memory_score = float(data.get("memory_score", DEFAULT_FEATURES["memory_score"]))
        age = float(data.get("age", DEFAULT_FEATURES["age"]))
        gender_enc = 1 if data.get("gender", "Male") == "Female" else 0

        X = build_features(reaction_avg, memory_score, age, gender_enc)

        try:
            if _model_stress and _label_encoder:
                stress_cont = _model_stress.predict(X)[0]
                stress_bucket = (
                    "low" if stress_cont <= 3
                    else "medium" if stress_cont <= 6
                    else "high"
                )
                stress_pred = stress_bucket
            else:
                stress_pred = "medium"
        except Exception as e:
            print("STRESS MODEL ERROR:", e)
            stress_pred = "medium"

        try:
            if _model_cog:
                cog_pred = float(_model_cog.predict(X)[0])
            else:
                cog_pred = 50
        except Exception as e:
            print("COG MODEL ERROR:", e)
            cog_pred = 50

        cog_pred = max(0, min(100, round(cog_pred)))

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
        meta = data.get("meta", {})
        duration_ms = data.get("durationMs", 0)

        past_sessions = GameSession.query.filter_by(user_id=current_user.id).all()

        def avg_or_default(vals, default):
            vals = [v for v in vals if v is not None]
            return float(statistics.mean(vals)) if vals else default

        reaction_avg = data.get("reaction_avg")
        memory_score = data.get("memory_score")

        if past_sessions:
            reaction_avg = reaction_avg or avg_or_default(
                [s.reaction_time_avg for s in past_sessions],
                DEFAULT_FEATURES["reaction_avg"]
            )
            memory_score = memory_score or avg_or_default(
                [s.memory_score for s in past_sessions],
                DEFAULT_FEATURES["memory_score"]
            )
        else:
            reaction_avg = reaction_avg or DEFAULT_FEATURES["reaction_avg"]
            memory_score = memory_score or DEFAULT_FEATURES["memory_score"]

        session = GameSession(
            user_id=current_user.id,
            game_type=data.get("gameType", "unknown"),
            reaction_time_avg=float(reaction_avg),
            memory_score=float(memory_score),
            errors=int(meta.get("errors", 0)),
            duration=(duration_ms or 0) / 1000.0
        )
        db.session.add(session)
        db.session.commit()

        age = current_user.age or DEFAULT_FEATURES["age"]
        gender_enc = 1 if current_user.gender == "Female" else 0
        X = build_features(reaction_avg, memory_score, age, gender_enc)

        try:
            stress_cont = _model_stress.predict(X)[0]
            stress_pred = (
                "low" if stress_cont <= 3
                else "medium" if stress_cont <= 6
                else "high"
            )
        except Exception as e:
            print("STRESS MODEL ERROR:", e)
            stress_pred = "medium"

        try:
            cog_pred = float(_model_cog.predict(X)[0])
        except Exception as e:
            print("COG MODEL ERROR:", e)
            cog_pred = 50

        cog_pred = max(0, min(100, round(cog_pred)))

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
