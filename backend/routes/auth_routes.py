from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from backend.models.user_model import User
from backend.database import db
import jwt
import datetime
from backend.config import SECRET_KEY

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    if not all(k in data for k in ("name", "email", "password", "age", "gender")):
        return jsonify({"error": "Missing fields"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 400

    user = User(
    name=data["name"],
    email=data["email"],
    password=generate_password_hash(data["password"]),
    age=int(data["age"]),
    gender=data["gender"]
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.json or {}

    user = User.query.filter_by(email=data.get("email")).first()
    if not user or not check_password_hash(user.password, data.get("password", "")):
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode({
        "id": user.id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    }, SECRET_KEY, algorithm="HS256")

    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return jsonify({
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "age": user.age,
            "gender": user.gender
        }
    }), 200
    
@auth_bp.route("/auth/profile", methods=["GET"])
def profile():
    token = None
    if "Authorization" in request.headers:
        auth_header = request.headers["Authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    if not token:
        return jsonify({"error": "Token missing"}), 401
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user = User.query.get(data["id"])
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "age": user.age,
            "gender": user.gender
        }})
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except Exception as e:
        return jsonify({"error": "Token invalid", "message": str(e)}), 401

