-- =====================================================================
-- IIITDM Jabalpur Smart Hostel Portal — MySQL Schema
-- Database: smart_hostel_portal
-- Run this file ONCE to set up the database structure.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS smart_hostel_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_hostel_portal;

-- ---------------------------------------------------------------------
-- 1. STUDENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name          VARCHAR(150)    NOT NULL,
  email         VARCHAR(200)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  roll_number   VARCHAR(30)     DEFAULT NULL,
  hostel        VARCHAR(120)    NOT NULL,
  room_number   VARCHAR(50)     DEFAULT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_students_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. ADMINS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name          VARCHAR(150)    NOT NULL,
  email         VARCHAR(200)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  role          ENUM('admin','caretaker') NOT NULL DEFAULT 'caretaker',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. COMPLAINTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
  id                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  complaint_id      VARCHAR(30)     NOT NULL UNIQUE,
  student_id        INT UNSIGNED    NOT NULL,
  student_name      VARCHAR(150)    NOT NULL,
  student_email     VARCHAR(200)    NOT NULL,
  hostel            VARCHAR(120)    NOT NULL,
  room              VARCHAR(50)     NOT NULL,
  category          VARCHAR(80)     NOT NULL,
  issue_type        VARCHAR(120)    NOT NULL,
  title             VARCHAR(200)    NOT NULL,
  description       TEXT            NOT NULL,
  department        VARCHAR(200)    NOT NULL,
  priority          ENUM('Critical','High','Medium','Low') NOT NULL DEFAULT 'Medium',
  current_status    ENUM('Reported','Assigned','Scheduled','In Progress','Resolved') NOT NULL DEFAULT 'Reported',
  assigned_to       VARCHAR(200)    DEFAULT NULL,
  ai_reason         TEXT            DEFAULT NULL,
  ai_confidence     VARCHAR(10)     DEFAULT NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at       DATETIME        DEFAULT NULL,
  PRIMARY KEY (id),
  INDEX idx_complaints_student_id   (student_id),
  INDEX idx_complaints_student_email(student_email),
  INDEX idx_complaints_status       (current_status),
  INDEX idx_complaints_priority     (priority),
  INDEX idx_complaints_created      (created_at),
  CONSTRAINT fk_complaints_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. COMPLAINT TIMELINE TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_timeline (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  complaint_id  VARCHAR(30)     NOT NULL,
  status        VARCHAR(50)     NOT NULL,
  note          TEXT            DEFAULT NULL,
  updated_by    VARCHAR(150)    DEFAULT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_timeline_complaint (complaint_id),
  CONSTRAINT fk_timeline_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. ANNOUNCEMENTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS announcements (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  title       VARCHAR(255)    NOT NULL,
  message     TEXT            NOT NULL,
  created_by  VARCHAR(150)    NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_announcements_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
