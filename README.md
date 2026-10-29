# Student Performance Predictor — Full Stack AIML Project

This package connects your existing Lovable frontend to a Python Flask API, a trained scikit-learn model, and MySQL.

## Architecture

Lovable/React frontend → Flask REST API → trained ML model → MySQL → frontend results

## Folder structure

- `frontend/` — your Lovable frontend, updated to call the real API
- `backend/` — Flask API, training code, dataset, trained model, and MySQL schema

## Quick start

### A. MySQL
1. Open MySQL Workbench.
2. Run `backend/database/schema.sql`.
3. Copy `backend/.env.example` to `backend/.env` and put your MySQL password in it.

### B. Backend
Open a terminal in `backend/`:

Windows:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python train_model.py
python app.py
```

Linux/macOS:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train_model.py
python app.py
```

Test: http://localhost:5000/api/health

### C. Frontend
Open a second terminal in `frontend/`:

```bash
npm install
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`.

The frontend uses `VITE_API_URL=http://localhost:5000` by default. To change it, copy `frontend/.env.example` to `frontend/.env` and edit the value.

## What happens when Predict Performance is clicked?

1. The frontend sends the form values to `POST /api/predict`.
2. Flask loads `backend/model/student_model.pkl`.
3. The model predicts final marks.
4. Flask calculates performance, grade, risk, insights, and recommendations.
5. The result is saved to MySQL.
6. The API response is displayed in your existing Lovable result UI.

## Model

The training script compares:
- Linear Regression
- Decision Tree Regression
- Random Forest Regression

It saves the best model by R² score. The included dataset contains 1,000 synthetic/demo student records so the project can be tested immediately. For your final academic submission, replace it with a properly sourced real dataset and retrain the model.

## Important

The backend must be running for the Predict button to work. MySQL must also be running and configured in `backend/.env`.


## Login and registration
The app now opens on the student login screen. New students can create an account with a name, unique student ID, and password of at least 6 characters. Account credentials are stored in MySQL (`app_users`) with hashed passwords. After signing in, the dashboard and prediction pages are available; use **Log out** to end the browser session. The Subject Performance chart has been removed.

Before starting the backend, copy `backend/.env.example` to `backend/.env`, set your MySQL password and a private random `SECRET_KEY`, and ensure `FRONTEND_ORIGIN` matches the frontend URL you use. The existing student prediction model, dataset, and student records are retained.
