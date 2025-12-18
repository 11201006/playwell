# backend/models/user_model.py
from backend.database import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    age = db.Column(db.Integer)
    gender = db.Column(db.String(10))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relasi ke game session
    sessions = db.relationship(
        "GameSession",
        backref="user",
        cascade="all, delete",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"
