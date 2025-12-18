# backend/ml/preprocessing.py
import pandas as pd
import numpy as np

def df_from_game_output(payload):
    """
    Menerima payload game dari frontend dan mengubahnya menjadi DataFrame
    untuk model ML.
    """
    reaction_times = payload.get("reaction_times", [])
    memory_score = payload.get("memory_score", 0)
    errors = payload.get("errors", 0)
    duration = payload.get("duration", 0)

    reaction_avg = float(np.mean(reaction_times)) if reaction_times else 0.0

    df = pd.DataFrame([{
        "Reaction_Time": reaction_avg,
        "Memory_Test_Score": memory_score,
        "Errors": errors,
        "Duration": duration
    }])

    return df
