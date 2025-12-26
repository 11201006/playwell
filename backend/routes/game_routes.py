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

REACTION_GAMES = {
    "Reaction Test",
    "Visual Search",
}

MEMORY_GAMES = {
    "Memory Test",
    "Pattern Memory",
}

DUAL_GAMES = {
    "Dual Task",
}

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
    
def avg_or_default(vals, default):
    vals = [v for v in vals if v is not None]
    return float(statistics.mean(vals)) if vals else default

@game_bp.route("/game/predict", methods=["POST"])
def predict_game():
    try:
        data = request.json or {}

        reaction_avg = float(data.get("reaction_avg") or DEFAULT_FEATURES["reaction_avg"])
        memory_score = float(data.get("memory_score") or DEFAULT_FEATURES["memory_score"])
        age = float(data.get("age") or DEFAULT_FEATURES["age"])
        gender_enc = 1 if data.get("gender", "Male") == "Female" else 0

        X = build_features(
            reaction_avg=reaction_avg,
            memory_score=memory_score,
            age=age,
            gender_enc=gender_enc
        )

        stress_pred = "medium"
        try:
            if _model_stress:
                stress_cont = float(_model_stress.predict(X)[0])
                if stress_cont <= 3:
                    stress_pred = "low"
                elif stress_cont <= 6:
                    stress_pred = "medium"
                else:
                    stress_pred = "high"
        except Exception as e:
            print("STRESS MODEL ERROR:", e)

        try:
            cog_pred = float(_model_cog.predict(X)[0]) if _model_cog else 50
        except Exception as e:
            print("COG MODEL ERROR:", e)
            cog_pred = 50

        cog_pred = int(max(0, min(100, round(cog_pred))))

        if stress_pred == "high" or cog_pred < 40:
            rec = [
                "Take a 5–10 minute break and do breathing exercises.",
                "Reduce distractions and retry shorter sessions."
            ]
        elif stress_pred == "medium" or cog_pred < 70:
            rec = [
                "Try a short focus exercise (5 minutes).",
                "Repeat the game to build familiarity."
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

        reaction_time_avg = None
        memory_score = None
        
        if game_type in REACTION_GAMES or game_type in DUAL_GAMES:
            if raw_reaction is not None:
                reaction_time_avg = float(raw_reaction)
                
        if game_type in MEMORY_GAMES or game_type in DUAL_GAMES:
            if raw_memory is not None:
                memory_score = float(raw_memory)

        session = GameSession(
            user_id=current_user.id,
            game_type=game_type,
            reaction_time_avg=reaction_time_avg,
            memory_score=memory_score,
            errors=int(meta.get("errors", 0)),
            duration=(duration_ms or 0) / 1000.0
        )

        db.session.add(session)
        db.session.commit()

        past_sessions = GameSession.query.filter_by(
            user_id=current_user.id
        ).all()

        ml_reaction = (
            reaction_time_avg
            if reaction_time_avg is not None
            else avg_or_default(
                [s.reaction_time_avg for s in past_sessions],
                DEFAULT_FEATURES["reaction_avg"]
            )
        )

        ml_memory = (
            memory_score
            if memory_score is not None
            else avg_or_default(
                [s.memory_score for s in past_sessions],
                DEFAULT_FEATURES["memory_score"]
            )
        )

        age = current_user.age or DEFAULT_FEATURES["age"]
        gender_enc = 1 if current_user.gender == "Female" else 0

        rt_per_age = ml_reaction / age
        mem_per_age = ml_memory / age
        rt_x_mem = ml_reaction * ml_memory

        features = [[
            ml_reaction,
            ml_memory,
            age,
            gender_enc,
            rt_per_age,
            mem_per_age,
            rt_x_mem
        ]]

        try:
            stress_cont = _model_stress.predict(features)[0]
            if stress_cont <= 3:
                stress_pred = "low"
            elif stress_cont <= 6:
                stress_pred = "medium"
            else:
                stress_pred = "high"
        except Exception as e:
            print("Stress model error:", e)
            stress_pred = "unknown"

        try:
            cog_pred = float(_model_cog.predict(features)[0])
            cog_pred = round(min(100, max(0, cog_pred)))
        except Exception as e:
            print("Cognitive model error:", e)
            cog_pred = round(ml_memory * 0.8)

        if stress_pred == "high" or cog_pred < 40:
            rec = [
                "Take a 5–10 minute break and do breathing exercises.",
                "Reduce distractions and retry shorter sessions."
            ]
        elif stress_pred == "medium" or cog_pred < 70:
            rec = [
                "Try a short focus exercise (5 minutes).",
                "Repeat the game to build familiarity."
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

    except Exception as exc:
        print("submit_game error:", exc)
        return jsonify({"error": "Internal server error"}), 500
