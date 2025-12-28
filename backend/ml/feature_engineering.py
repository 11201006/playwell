from sklearn.base import BaseEstimator, TransformerMixin
import numpy as np
import pandas as pd

class FeatureEngineer(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()

        X["RT_log"] = np.log1p(X["Reaction_Time"])
        X["Memory_log"] = np.log1p(X["Memory_Test_Score"])
        X["RT_per_Age"] = X["Reaction_Time"] / (X["Age"] + 1e-6)
        X["Memory_per_Age"] = X["Memory_Test_Score"] / (X["Age"] + 1e-6)
        X["RT_x_Memory"] = X["Reaction_Time"] * X["Memory_Test_Score"]
        X["RT_to_Memory"] = X["Reaction_Time"] / (X["Memory_Test_Score"] + 1e-6)

        return X
