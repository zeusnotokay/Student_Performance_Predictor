# Flask + ML + MySQL Backend

## 1. Create environment
Windows:
```bash
python -m venv venv
venv\Scripts\activate
```
Linux/macOS:
```bash
python3 -m venv venv
source venv/bin/activate
```

## 2. Install dependencies
```bash
pip install -r requirements.txt
```

## 3. Train the model
```bash
python train_model.py
```
This compares Linear Regression, Decision Tree Regression and Random Forest Regression and saves the best model in `model/student_model.pkl`.

## 4. Configure MySQL
Run `database/schema.sql` in MySQL Workbench.
Copy `.env.example` to `.env` and set your MySQL password.

## 5. Start API
```bash
python app.py
```
Health check: http://localhost:5000/api/health

## Student accounts
The frontend opens at the login screen. Use **Create an account** the first time, then sign in with the same student ID and password. Passwords are stored as secure hashes in the `app_users` table; the backend creates this table automatically when auth is first used (or you can run the updated `database/schema.sql`). Set a long random `SECRET_KEY` in `.env` before real use. Keep `.env` private.

## API
- GET `/api/health` (public health check)
- POST `/api/auth/register` (public)
- POST `/api/auth/login` (public)
- POST `/api/predict` (requires `Authorization: Bearer <token>`)
- GET `/api/dashboard` (requires token)
- GET `/api/history` (requires token)
