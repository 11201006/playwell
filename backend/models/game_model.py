# backend/models/game_model.py
from backend.database import db
from datetime import datetime

class GameSession(db.Model):
    __tablename__ = "game_session"

    id = db.Column(db.Integer, primary_key=True)

    # FK ke user
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    game_type = db.Column(db.String(50), nullable=False)

    reaction_time_avg = db.Column(db.Float)
    memory_score = db.Column(db.Float)
    errors = db.Column(db.Integer)
    duration = db.Column(db.Float)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relasi One-to-One ke AnalysisResult
    analysis = db.relationship(
        "AnalysisResult",
        backref="session",
        uselist=False,
        cascade="all, delete",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<GameSession id={self.id} user={self.user_id} type={self.game_type}>"


class AnalysisResult(db.Model):
    __tablename__ = "analysis_result"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(
        db.Integer,
        db.ForeignKey("game_session.id", ondelete="CASCADE"),
        nullable=False
    )

    stress_level = db.Column(db.String(50))
    cognitive_score = db.Column(db.Float)
    recommendations = db.Column(db.Text)

    def __repr__(self):
        return f"<AnalysisResult session_id={self.session_id}>"
