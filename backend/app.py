from flask import Flask
from flask_cors import CORS
from .database import init_db, db
from .routes.auth_routes import auth_bp
from .routes.game_routes import game_bp
from .routes.user_routes import user_bp
from .config import SECRET_KEY

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = SECRET_KEY

    # Init DB
    init_db(app)

    with app.app_context():
        db.create_all()

    # CORS
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"]
    )

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(game_bp, url_prefix="/api")
    app.register_blueprint(user_bp, url_prefix="/api")

    @app.route("/")
    def root():
        return {"message": "PlayWell Backend Running"}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000)
