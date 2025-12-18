# backend/routes/user_routes.py
from flask import Blueprint, request, jsonify
from backend.models.user_model import User
from backend.models.game_model import GameSession, AnalysisResult
from backend.database import db
from backend.utils.auth_middleware import token_required

user_bp = Blueprint("user_bp", __name__)

@user_bp.route("/user/profile/<int:user_id>")
@token_required
def get_profile(current_user, user_id):
    if current_user.id != user_id:
        return jsonify({"error": "Unauthorized access"}), 403

    return jsonify({
        "id": current_user.id,
        "name": current_user.name,
        "age": current_user.age,
        "email": current_user.email,
        "gender": current_user.gender
    })

@user_bp.route("/user/history/<int:user_id>")
@token_required
def get_history(current_user, user_id):
    if current_user.id != user_id:
        return jsonify({"error": "Unauthorized access"}), 403

    sessions = (
        GameSession.query
        .filter_by(user_id=user_id)
        .order_by(GameSession.id.desc())
        .all()
    )

    output = []
    for session in sessions:
        result = AnalysisResult.query.filter_by(session_id=session.id).first()

        output.append({
            "session_id": session.id,
            "game_type": session.game_type,
            "reaction_time_avg": session.reaction_time_avg,
            "memory_score": session.memory_score,
            "errors": session.errors,
            "duration": session.duration,
            "created_at": session.created_at.strftime("%Y-%m-%d %H:%M:%S") if session.created_at else None,
            "stress_level": result.stress_level if result else None,
            "cognitive_score": result.cognitive_score if result else None,
            "recommendations": result.recommendations if result else None
        })

    return jsonify(output)

@user_bp.route("/user/update/<int:user_id>", methods=["PUT"])
@token_required
def update_profile(current_user, user_id):
    if current_user.id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    current_user.name = data.get("name", current_user.name)
    current_user.age = data.get("age", current_user.age)
    current_user.email = data.get("email", current_user.email)

    db.session.commit()

    return jsonify({
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "age": current_user.age
        }
    })

@user_bp.route("/user/stats/<int:user_id>")
@token_required
def get_user_stats(current_user, user_id):
    if current_user.id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    from datetime import datetime, timedelta

    one_week_ago = datetime.utcnow() - timedelta(days=7)

    # Ambil semua session 7 hari terakhir
    sessions = (
        GameSession.query.filter(
            GameSession.user_id == user_id,
            GameSession.created_at >= one_week_ago
        ).all()
    )

    # Hitung favorite game
    game_count = {}
    for s in sessions:
        game_count[s.game_type] = game_count.get(s.game_type, 0) + 1

    favorite_game = max(game_count, key=game_count.get) if game_count else None

    # Ambil stress level dari AnalysisResult
    stress_levels = []
    for s in sessions:
        res = AnalysisResult.query.filter_by(session_id=s.id).first()
        if res:
            stress_levels.append(res.stress_level)

    # Modus stress
    if stress_levels:
        from statistics import mode, StatisticsError
        try:
            mood = mode(stress_levels)
        except StatisticsError:
            mood = stress_levels[0]  # kalau data sama rata
    else:
        mood = None

    return jsonify({
        "mood": mood,
        "favorite_game": favorite_game,
    })