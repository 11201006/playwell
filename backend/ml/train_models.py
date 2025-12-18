import os
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    mean_squared_error
)
from sklearn.pipeline import Pipeline

from xgboost import XGBRegressor

# ======================================================
# PATH
# ======================================================
BASE_DIR = os.path.dirname(__file__)
DATA_CSV = os.path.join(BASE_DIR, "human_cognitive_performance.csv")
OUT_DIR = BASE_DIR

df = pd.read_csv(DATA_CSV)

# ======================================================
# REQUIRED COLUMNS
# ======================================================
required_cols = [
    "Reaction_Time",
    "Memory_Test_Score",
    "Stress_Level",
    "Cognitive_Score",
    "Age",
    "Gender"
]

for c in required_cols:
    if c not in df.columns:
        raise Exception(f"Missing required column: {c}")

# ======================================================
# 1️⃣ NORMALIZE GENDER
# ======================================================
def normalize_gender(g):
    if isinstance(g, str):
        g = g.strip().lower()
        if g in ["male", "m", "man"]:
            return "Male"
        if g in ["female", "f", "woman"]:
            return "Female"
    return None

df["Gender"] = df["Gender"].apply(normalize_gender)
df = df.dropna(subset=["Gender"])
df["Gender_enc"] = df["Gender"].map({"Male": 0, "Female": 1})

# ======================================================
# 2️⃣ NUMERIC CLEANING
# ======================================================
for col in required_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df.fillna(df.median(numeric_only=True), inplace=True)

# ======================================================
# 3️⃣ FEATURE ENGINEERING (IMPORTANT)
# ======================================================
df["RT_per_Age"] = df["Reaction_Time"] / df["Age"]
df["Memory_per_Age"] = df["Memory_Test_Score"] / df["Age"]
df["RT_x_Memory"] = df["Reaction_Time"] * df["Memory_Test_Score"]

FEATURES = [
    "Reaction_Time",
    "Memory_Test_Score",
    "Age",
    "Gender_enc",
    "RT_per_Age",
    "Memory_per_Age",
    "RT_x_Memory"
]

X = df[FEATURES].values.astype(float)

# ======================================================
# 4️⃣ STRESS REGRESSION TARGET
# ======================================================
y_stress_cont = df["Stress_Level"].values.astype(float)

def stress_bucket(x):
    if x <= 3:
        return "low"
    if x <= 6:
        return "medium"
    return "high"

df["Stress_Category"] = df["Stress_Level"].apply(stress_bucket)

le = LabelEncoder()
df["Stress_Encoded"] = le.fit_transform(df["Stress_Category"])
joblib.dump(le, os.path.join(OUT_DIR, "label_encoder_stress.pkl"))

y_stress_cls = df["Stress_Encoded"].values

# ======================================================
# 5️⃣ TRAIN STRESS REGRESSION MODEL
# ======================================================
Xs_tr, Xs_te, ys_tr, ys_te, ycls_tr, ycls_te = train_test_split(
    X,
    y_stress_cont,
    y_stress_cls,
    test_size=0.2,
    random_state=42,
    stratify=y_stress_cls
)

stress_model = Pipeline([
    ("scaler", StandardScaler()),
    ("reg", XGBRegressor(
        objective="reg:squarederror",
        n_estimators=300,
        max_depth=6,
        learning_rate=0.03,
        subsample=0.85,
        colsample_bytree=0.85,
        gamma=0.5,
        min_child_weight=3,
        random_state=42
    ))
])

stress_model.fit(Xs_tr, ys_tr)

# ======================================================
# 6️⃣ STRESS METRICS
# ======================================================
stress_preds_cont = stress_model.predict(Xs_te)
stress_rmse = np.sqrt(mean_squared_error(ys_te, stress_preds_cont))

stress_preds_cls = [stress_bucket(x) for x in stress_preds_cont]
stress_preds_enc = le.transform(stress_preds_cls)

print("\n=== STRESS MODEL (REGRESSION → BUCKET) ===")
print("RMSE:", round(stress_rmse, 3))
print("Accuracy:", accuracy_score(ycls_te, stress_preds_enc))
print(classification_report(ycls_te, stress_preds_enc, target_names=le.classes_))

joblib.dump(stress_model, os.path.join(OUT_DIR, "model_stress.pkl"))

# ======================================================
# 7️⃣ COGNITIVE REGRESSION MODEL
# ======================================================
y_cog = df["Cognitive_Score"].values.astype(float)

Xc_tr, Xc_te, yc_tr, yc_te = train_test_split(
    X, y_cog, test_size=0.2, random_state=42
)

cog_model = Pipeline([
    ("scaler", StandardScaler()),
    ("reg", XGBRegressor(
        objective="reg:squarederror",
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42
    ))
])

cog_model.fit(Xc_tr, yc_tr)

cog_preds = cog_model.predict(Xc_te)
cog_rmse = np.sqrt(mean_squared_error(yc_te, cog_preds))

print("\n=== COGNITIVE MODEL ===")
print("RMSE:", round(cog_rmse, 3))

joblib.dump(cog_model, os.path.join(OUT_DIR, "model_cognitive.pkl"))

print("\n✅ Training complete (XGBoost – optimized)")
