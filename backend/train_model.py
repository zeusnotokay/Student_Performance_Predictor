import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

DATA_PATH = "dataset/student_data.csv"
MODEL_DIR = "model"
FEATURES = [
    "study_hours", "attendance", "assignment_score", "internal_marks",
    "previous_marks", "sleep_hours", "backlogs", "previous_exam_score",
    "extracurricular", "resource_level"
]

data = pd.read_csv(DATA_PATH)
required = FEATURES + ["final_marks"]
missing = [c for c in required if c not in data.columns]
if missing:
    raise ValueError(f"Missing columns in dataset: {missing}")

X = data[FEATURES]
y = data["final_marks"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

models = {
    "Linear Regression": LinearRegression(),
    "Decision Tree": DecisionTreeRegressor(max_depth=8, random_state=42),
    "Random Forest": RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42),
}

best_name = None
best_model = None
best_r2 = float("-inf")
print(f"Dataset rows: {len(data)}")
for name, model in models.items():
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, pred)
    rmse = mean_squared_error(y_test, pred) ** 0.5
    r2 = r2_score(y_test, pred)
    print(f"\n{name}\n  MAE: {mae:.2f}\n  RMSE: {rmse:.2f}\n  R2: {r2:.3f}")
    if r2 > best_r2:
        best_r2, best_model, best_name = r2, model, name

os.makedirs(MODEL_DIR, exist_ok=True)
joblib.dump(best_model, f"{MODEL_DIR}/student_model.pkl")
joblib.dump(FEATURES, f"{MODEL_DIR}/feature_columns.pkl")
joblib.dump({"model_name": best_name, "r2": best_r2}, f"{MODEL_DIR}/model_metadata.pkl")
print(f"\nBest model: {best_name} (R2={best_r2:.3f})")
print("Saved model/student_model.pkl")
