CREATE DATABASE IF NOT EXISTS student_prediction;
USE student_prediction;

CREATE TABLE IF NOT EXISTS student_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(30),
    department VARCHAR(100),
    year_of_study VARCHAR(10),
    previous_marks FLOAT NOT NULL,
    internal_marks FLOAT NOT NULL,
    assignment_score FLOAT NOT NULL,
    attendance FLOAT NOT NULL,
    backlogs INT NOT NULL,
    study_hours FLOAT NOT NULL,
    sleep_hours FLOAT NOT NULL,
    previous_exam_score FLOAT NOT NULL,
    extracurricular TINYINT(1) NOT NULL,
    resource_level INT NOT NULL,
    predicted_marks FLOAT NOT NULL,
    performance VARCHAR(50) NOT NULL,
    grade VARCHAR(5) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS app_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
