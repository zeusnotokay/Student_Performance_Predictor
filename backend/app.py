import os
import sqlite3
from datetime import datetime, timedelta
from functools import wraps
import secrets

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash

import joblib
from dotenv import load_dotenv
from flask import Flask, jsonify, request, g
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", secrets.token_hex(32))
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"], salt="spp-auth")
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_ORIGIN", "*")}})

MODEL_PATH = os.path.join("model", "student_model.pkl")
FEATURE_PATH = os.path.join("model", "feature_columns.pkl")
METADATA_PATH = os.path.join("model", "model_metadata.pkl")
model = joblib.load(MODEL_PATH)
FEATURES = joblib.load(FEATURE_PATH)
try:
    MODEL_METADATA = joblib.load(METADATA_PATH)
except Exception:
    MODEL_METADATA = {"model_name": "Unknown", "r2": 0.0}

FEATURE_LABELS = {
    "study_hours": "Study Hours",
    "attendance": "Attendance",
    "assignment_score": "Assignment Score",
    "internal_marks": "Internal Marks",
    "previous_marks": "Previous Marks",
    "sleep_hours": "Sleep Hours",
    "backlogs": "Backlogs",
    "previous_exam_score": "Previous Exam Score",
    "extracurricular": "Extracurricular",
    "resource_level": "Resource Level",
}

DB_PATH = os.getenv("SQLITE_DB_PATH", "student_prediction.db")


def db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_tables():
    conn = db_connection()
    cur = conn.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS app_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    cur.execute("""CREATE TABLE IF NOT EXISTS student_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT,
        age INTEGER,
        gender TEXT,
        department TEXT,
        year_of_study TEXT,
        previous_marks REAL,
        internal_marks REAL,
        assignment_score REAL,
        attendance REAL,
        backlogs INTEGER,
        study_hours REAL,
        sleep_hours REAL,
        previous_exam_score REAL,
        extracurricular INTEGER,
        resource_level INTEGER,
        predicted_marks REAL,
        performance TEXT,
        grade TEXT,
        risk_level TEXT,
        recommendation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    conn.commit()
    cur.close()
    conn.close()


def require_auth(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"status": "error", "message": "Please sign in to continue."}), 401
        try:
            payload = serializer.loads(header[7:], max_age=60 * 60 * 24 * 7)
            g.user_id = int(payload["user_id"])
        except (BadSignature, SignatureExpired, KeyError, TypeError, ValueError):
            return jsonify({"status": "error", "message": "Your session expired. Please sign in again."}), 401
        return fn(*args, **kwargs)
    return wrapped


@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    student_id = str(data.get("studentId", "")).strip()
    password = str(data.get("password", ""))
    if not name or not student_id or len(password) < 6:
        return jsonify({"status": "error", "message": "Name and student ID are required; password must be at least 6 characters."}), 400
    try:
        ensure_tables()
        conn = db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO app_users (student_id, full_name, password_hash) VALUES (?,?,?)",
                    (student_id, name, generate_password_hash(password)))
        user_id = cur.lastrowid
        conn.commit()
        cur.close()
        conn.close()
        token = serializer.dumps({"user_id": user_id, "student_id": student_id})
        return jsonify({"status": "success", "token": token, "user": {"name": name, "studentId": student_id}}), 201
    except sqlite3.IntegrityError:
        return jsonify({"status": "error", "message": "That student ID is already registered. Please sign in."}), 409
    except Exception as exc:
        return jsonify({"status": "error", "message": f"Database error: {exc}"}), 500


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    student_id = str(data.get("studentId", "")).strip()
    password = str(data.get("password", ""))
    if not student_id or not password:
        return jsonify({"status": "error", "message": "Enter your student ID and password."}), 400
    try:
        ensure_tables()
        conn = db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, student_id, full_name, password_hash FROM app_users WHERE student_id=?", (student_id,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify({"status": "error", "message": "Invalid student ID or password."}), 401
        token = serializer.dumps({"user_id": user["id"], "student_id": user["student_id"]})
        return jsonify({"status": "success", "token": token, "user": {"name": user["full_name"], "studentId": user["student_id"]}})
    except Exception as exc:
        return jsonify({"status": "error", "message": f"Database error: {exc}"}), 500


def performance_for(score):
    if score >= 90:
        return "Excellent Performance"
    if score >= 75:
        return "Good Performance"
    if score >= 60:
        return "Average Performance"
    if score >= 40:
        return "Needs Improvement"
    return "Poor Performance"


def grade_for(score):
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 75: return "B+"
    if score >= 65: return "B"
    if score >= 55: return "C"
    if score >= 45: return "D"
    return "F"


def risk_for(score, attendance, study_hours, backlogs):
    if score < 50 or attendance < 60 or backlogs >= 3:
        return "High"
    if score < 70 or attendance < 75 or study_hours < 3 or backlogs > 0:
        return "Moderate"
    return "Low"


def insights_and_recommendations(d):
    insights = []
    recs = []
    if d["attendance"] >= 80:
        insights.append("Strong attendance is positively supporting the prediction.")
    else:
        insights.append("Attendance below 80% is limiting the predicted score.")
        recs.append({"title": "Attendance", "detail": "Aim for at least 85% attendance in all courses."})
    if d["previous_marks"] >= 70:
        insights.append("Previous marks indicate a solid academic foundation.")
    else:
        insights.append("Previous marks suggest that some core concepts need reinforcement.")
    if d["study_hours"] < 4:
        insights.append("Current study time is relatively low for the target score.")
        recs.append({"title": "Study Consistency", "detail": "Increase focused study time by 45–60 minutes per day."})
    else:
        insights.append("Current daily study time is supporting the expected outcome.")
    if d["assignment_score"] < 70:
        recs.append({"title": "Assignments", "detail": "Improve assignment completion and scores before deadlines."})
    if d["internal_marks"] < 60:
        recs.append({"title": "Internal Assessment", "detail": "Focus on internal tests, revision, and weak topics."})
    if d["backlogs"] > 0:
        insights.append(f"{d['backlogs']} pending backlog(s) are increasing academic risk.")
        recs.append({"title": "Backlog Reduction", "detail": "Prioritize clearing pending subjects with a weekly study plan."})
    if not recs:
        recs.append({"title": "Exam Preparation", "detail": "Maintain your current routine and begin revision before examinations."})
    return insights, recs[:3]


def validate_number(data, key, low, high):
    value = data.get(key)
    if value is None:
        raise ValueError(f"Missing field: {key}")
    try:
        value = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"Invalid number for {key}")
    if not low <= value <= high:
        raise ValueError(f"{key} must be between {low} and {high}")
    return value


@app.get("/api/health")
def health():
    return jsonify({"status": "success", "message": "Student Performance API is running"})


@app.get("/api/feature-importance")
def feature_importance():
    """Return real feature importances from the trained model (Random Forest) or approximation."""
    try:
        importances = model.feature_importances_
        pairs = [
            {"name": FEATURE_LABELS.get(f, f), "value": round(float(v) * 100, 1)}
            for f, v in sorted(zip(FEATURES, importances), key=lambda x: -x[1])
        ]
        return jsonify({"status": "success", "data": pairs})
    except AttributeError:
        # Linear Regression doesn't have feature_importances_; use coef_ magnitude
        try:
            coefs = abs(model.coef_)
            total = coefs.sum() or 1
            pairs = [
                {"name": FEATURE_LABELS.get(f, f), "value": round(float(v / total) * 100, 1)}
                for f, v in sorted(zip(FEATURES, coefs), key=lambda x: -x[1])
            ]
            return jsonify({"status": "success", "data": pairs})
        except Exception as exc:
            return jsonify({"status": "error", "message": str(exc)}), 500


@app.get("/api/model-info")
def model_info():
    """Return metadata about the saved best model."""
    return jsonify({"status": "success", "data": {
        "model_name": MODEL_METADATA.get("model_name", "Unknown"),
        "r2": round(float(MODEL_METADATA.get("r2", 0)), 4),
        "features": [FEATURE_LABELS.get(f, f) for f in FEATURES],
        "feature_count": len(FEATURES),
    }})


@app.post("/api/goal-suggestion")
@require_auth
def goal_suggestion():
    """Given current inputs + a target score, suggest what needs to change."""
    data = request.get_json(silent=True) or {}
    target = float(data.get("targetScore", 80))
    target = max(0, min(100, target))
    suggestions = []

    try:
        current = {
            "study_hours": float(data.get("studyHours", 3)),
            "attendance": float(data.get("attendance", 75)),
            "assignment_score": float(data.get("assignmentScore", 70)),
            "internal_marks": float(data.get("internalMarks", 65)),
            "previous_marks": float(data.get("previousMarks", 70)),
            "sleep_hours": float(data.get("sleepHours", 7)),
            "backlogs": float(data.get("backlogs", 0)),
            "previous_exam_score": float(data.get("previousExamScore", 70)),
            "extracurricular": 1 if data.get("extracurricular") else 0,
            "resource_level": {"none": 0, "limited": 1, "good": 2}.get(data.get("resources"), 1),
        }
        row = [[current[f] for f in FEATURES]]
        current_score = float(model.predict(row)[0])
        current_score = round(max(0, min(100, current_score)), 1)
        gap = target - current_score

        if gap <= 0:
            suggestions.append({"field": "All", "message": "You are already on track to meet or exceed your target score! Keep it up.", "priority": "low"})
        else:
            if current["attendance"] < 85:
                suggestions.append({"field": "Attendance", "message": f"Raise attendance from {current['attendance']:.0f}% to at least 85% — this is the single highest-impact change.", "priority": "high"})
            if current["study_hours"] < 5:
                suggestions.append({"field": "Study Hours", "message": f"Increase daily study time from {current['study_hours']} hrs to 5+ hrs per day.", "priority": "high"})
            if current["assignment_score"] < 80:
                suggestions.append({"field": "Assignment Score", "message": f"Improve assignment completion from {current['assignment_score']:.0f}% to 80%+.", "priority": "medium"})
            if current["internal_marks"] < 75:
                suggestions.append({"field": "Internal Marks", "message": f"Focus on internal tests; aim for 75%+ (current: {current['internal_marks']:.0f}%).", "priority": "medium"})
            if current["backlogs"] > 0:
                suggestions.append({"field": "Backlogs", "message": f"Clear your {int(current['backlogs'])} backlog(s) — they significantly reduce predicted performance.", "priority": "high"})
            if not suggestions:
                suggestions.append({"field": "Consistency", "message": "Maintain your current routine and focus on exam preparation — you are close to the target.", "priority": "low"})

        return jsonify({"status": "success", "data": {
            "currentScore": current_score,
            "targetScore": target,
            "gap": round(gap, 1),
            "suggestions": suggestions,
        }})
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 500


@app.post("/api/predict")
@require_auth
def predict():
    data = request.get_json(silent=True) or {}
    student_id = str(data.get("studentId", "")).strip()
    if not student_id:
        return jsonify({"status": "error", "message": "studentId is required"}), 400

    try:
        d = {
            "study_hours": validate_number(data, "studyHours", 0, 12),
            "attendance": validate_number(data, "attendance", 0, 100),
            "assignment_score": validate_number(data, "assignmentScore", 0, 100),
            "internal_marks": validate_number(data, "internalMarks", 0, 100),
            "previous_marks": validate_number(data, "previousMarks", 0, 100),
            "sleep_hours": validate_number(data, "sleepHours", 3, 12),
            "backlogs": validate_number(data, "backlogs", 0, 20),
            "previous_exam_score": validate_number(data, "previousExamScore", 0, 100),
            "extracurricular": 1 if data.get("extracurricular") else 0,
            "resource_level": {"none": 0, "limited": 1, "good": 2}.get(data.get("resources"), 1),
        }
    except ValueError as exc:
        return jsonify({"status": "error", "message": str(exc)}), 400

    row = [[d[f] for f in FEATURES]]
    score = float(model.predict(row)[0])
    score = round(max(0, min(100, score)), 1)
    status = performance_for(score)
    grade = grade_for(score)
    risk = risk_for(score, d["attendance"], d["study_hours"], int(d["backlogs"]))
    insights, recommendations = insights_and_recommendations(d)

    try:
        ensure_tables()
        conn = db_connection()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO student_records
            (student_id, age, gender, department, year_of_study, previous_marks,
             internal_marks, assignment_score, attendance, backlogs, study_hours,
             sleep_hours, previous_exam_score, extracurricular, resource_level,
             predicted_marks, performance, grade, risk_level, recommendation)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (student_id, int(data.get("age", 0)), str(data.get("gender", "")),
             str(data.get("department", "")), str(data.get("year", "")),
             d["previous_marks"], d["internal_marks"], d["assignment_score"],
             d["attendance"], int(d["backlogs"]), d["study_hours"], d["sleep_hours"],
             d["previous_exam_score"], d["extracurricular"], d["resource_level"],
             score, status, grade, risk, recommendations[0]["detail"]),
        )
        record_id = cur.lastrowid
        conn.commit()
        cur.close()
        conn.close()
    except Exception as exc:
        return jsonify({"status": "error", "message": f"Database error: {exc}"}), 500

    return jsonify({
        "status": "success",
        "data": {
            "id": record_id,
            "studentId": student_id,
            "score": score,
            "status": status,
            "grade": grade,
            "risk": risk,
            "attendance": d["attendance"],
            "studyHours": d["study_hours"],
            "insights": insights,
            "recommendations": recommendations,
        },
    })


@app.get("/api/dashboard")
@require_auth
def dashboard():
    try:
        ensure_tables()
        conn = db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS total, COALESCE(AVG(predicted_marks),0) AS average FROM student_records")
        summary = cur.fetchone()
        cur.execute("SELECT performance, COUNT(*) AS count FROM student_records GROUP BY performance")
        distribution = [dict(row) for row in cur.fetchall()]
        cur.execute("SELECT * FROM student_records ORDER BY created_at DESC LIMIT 1")
        latest_row = cur.fetchone()
        latest = dict(latest_row) if latest_row else None
        cur.close()
        conn.close()
        return jsonify({"status": "success", "data": {
            "total": summary["total"],
            "average": round(float(summary["average"]), 1),
            "distribution": distribution,
            "latest": latest
        }})
    except Exception as exc:
        return jsonify({"status": "error", "message": f"Database error: {exc}"}), 500


@app.get("/api/history")
@require_auth
def history():
    limit = min(max(int(request.args.get("limit", 20)), 1), 100)
    try:
        ensure_tables()
        conn = db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, student_id, predicted_marks, performance, grade, risk_level, created_at FROM student_records ORDER BY created_at DESC LIMIT ?",
            (limit,)
        )
        rows = [dict(r) for r in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({"status": "success", "data": rows})
    except Exception as exc:
        return jsonify({"status": "error", "message": f"Database error: {exc}"}), 500


if __name__ == "__main__":
    ensure_tables()
    app.run(host="0.0.0.0", port=int(os.getenv("FLASK_PORT", 5000)), debug=True)
