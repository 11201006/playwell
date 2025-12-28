import os
import numpy as np
import pandas as pd
import joblib
from feature_engineering import FeatureEngineer

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    mean_squared_error,
    r2_score
)

from xgboost import XGBClassifier, XGBRegressor

BASE_DIR = os.path.dirname(__file__)
DATA_CSV = os.path.join(BASE_DIR, "human_cognitive_performance.csv")
OUT_DIR = BASE_DIR
RANDOM_STATE = 42

df = pd.read_csv(DATA_CSV)

REQUIRED = [
    "Reaction_Time",
    "Memory_Test_Score",
    "Stress_Level",
    "Cognitive_Score",
]

for c in REQUIRED:
    if c not in df.columns:
        raise Exception(f"❌ Missing column: {c}")

if "Age" not in df.columns:
    df["Age"] = 25

if "Gender" not in df.columns:
    df["Gender"] = "Male"

NUM_COLS_RAW = [
    "Reaction_Time",
    "Memory_Test_Score",
    "Stress_Level",
    "Cognitive_Score",
    "Age"
]

for c in NUM_COLS_RAW:
    df[c] = pd.to_numeric(df[c], errors="coerce")

df["Gender"] = (
    df["Gender"]
    .astype(str)
    .str.lower()
    .str.strip()
    .replace({"m": "male", "f": "female"})
)

df["Gender"] = df["Gender"].fillna("male")

df.fillna(df.median(numeric_only=True), inplace=True)

def stress_bucket(x):
    if x <= 3:
        return 0   
    elif x <= 6:
        return 1  
    else:
        return 2  

df["Stress_Label"] = df["Stress_Level"].apply(stress_bucket)

FEATURES_NUM = [
    "Reaction_Time",
    "Memory_Test_Score",
    "Age"
]

FEATURES_CAT = ["Gender"]

X = df[FEATURES_NUM + FEATURES_CAT]
y_stress = df["Stress_Label"]
y_cog = df["Cognitive_Score"] / 100.0 

preprocess = Pipeline([
    ("features", FeatureEngineer()),
    ("columns", ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), FEATURES_NUM + [
                "RT_log",
                "Memory_log",
                "RT_per_Age",
                "Memory_per_Age",
                "RT_x_Memory",
                "RT_to_Memory"
            ]),
            ("cat", OneHotEncoder(handle_unknown="ignore"), FEATURES_CAT),
        ]
    ))
])


X_train, X_test, y_stress_train, y_stress_test, y_cog_train, y_cog_test = train_test_split(
    X,
    y_stress,
    y_cog,
    test_size=0.2,
    random_state=RANDOM_STATE,
    stratify=y_stress
)

class_counts = y_stress_train.value_counts()
class_weights = {
    cls: class_counts.sum() / count
    for cls, count in class_counts.items()
}

sample_weight = y_stress_train.map(class_weights)

stress_model = Pipeline([
    ("prep", preprocess),
    ("model", XGBClassifier(
        objective="multi:softprob",
        num_class=3,
        n_estimators=1200,
        max_depth=8,
        learning_rate=0.02,
        subsample=0.9,
        colsample_bytree=0.9,
        min_child_weight=5,
        gamma=0.3,
        reg_alpha=0.5,
        reg_lambda=1.5,
        eval_metric="mlogloss",
        tree_method="hist",
        random_state=RANDOM_STATE
    ))
])

stress_model.fit(
    X_train,
    y_stress_train,
    model__sample_weight=sample_weight
)

stress_preds = stress_model.predict(X_test)

print("\n================ STRESS MODEL ================")
print("Accuracy:", accuracy_score(y_stress_test, stress_preds))
print(classification_report(y_stress_test, stress_preds))

joblib.dump(stress_model, os.path.join(OUT_DIR, "model_stress.pkl"))

cog_model = Pipeline([
    ("prep", preprocess),
    ("model", XGBRegressor(
        objective="reg:squarederror",
        n_estimators=900,
        max_depth=7,
        learning_rate=0.03,
        subsample=0.9,
        colsample_bytree=0.9,
        min_child_weight=4,
        gamma=0.2,
        reg_alpha=0.4,
        reg_lambda=1.3,
        tree_method="hist",
        random_state=RANDOM_STATE
    ))
])

cog_model.fit(X_train, y_cog_train)

cog_preds = cog_model.predict(X_test)
cog_preds = np.clip(cog_preds * 100, 0, 100)

print("\n============= COGNITIVE MODEL =============")
print("RMSE:", np.sqrt(mean_squared_error(y_cog_test * 100, cog_preds)))
print("R2:", r2_score(y_cog_test * 100, cog_preds))

joblib.dump(cog_model, os.path.join(OUT_DIR, "model_cognitive.pkl"))

print("\n✅ SOTA TRAINING COMPLETE — PLAYWELL READY")
