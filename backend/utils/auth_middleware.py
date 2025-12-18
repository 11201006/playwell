# backend/utils/auth_middleware.py

from functools import wraps
from flask import request, jsonify
from backend.models.user_model import User
from backend.config import SECRET_KEY
import jwt

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Token must be sent in headers
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token missing"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = User.query.get(data["id"])
            if not current_user:
                return jsonify({"error": "User not found"}), 401
        except Exception as e:
            print("token decode error:", e)
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated
