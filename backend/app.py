from flask import Flask
from flask_cors import CORS  
from .database import init_db, db
from .routes.auth_routes import auth_bp
from .routes.game_routes import game_bp
from .routes.user_routes import user_bp
import os

def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.getenv("PLAYWELL_SECRET_KEY", "dev-secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")

    init_db(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True
    )

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(game_bp, url_prefix="/api")
    app.register_blueprint(user_bp, url_prefix="/api")

    @app.route("/")
    def root():
        return {"message": "PlayWell Backend Running"}
    
    from sqlalchemy import text
    
    @app.route("/health/db")
    def db_health():
        db.session.execute(text("SELECT 1"))
        return {"db": "ok"}

    return app
