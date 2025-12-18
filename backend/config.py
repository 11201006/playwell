import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SECRET_KEY = os.getenv("PLAYWELL_SECRET_KEY", "PlayWell_1235")

# MySQL connection
DB_USER = os.getenv("PLAYWELL_DB_USER", "root")
DB_PASSWORD = os.getenv("PLAYWELL_DB_PASSWORD", "")
DB_HOST = os.getenv("PLAYWELL_DB_HOST", "localhost")
DB_PORT = os.getenv("PLAYWELL_DB_PORT", "3306")
DB_NAME = os.getenv("PLAYWELL_DB_NAME", "playwell_db")

SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
