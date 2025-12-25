import os

SECRET_KEY = os.getenv("PLAYWELL_SECRET_KEY", "dev-secret-key")
SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
