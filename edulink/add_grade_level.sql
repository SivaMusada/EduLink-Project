-- Run these one at a time on your MySQL server

ALTER TABLE edulink_identity.users ADD COLUMN grade_level VARCHAR(50) NULL;

ALTER TABLE edulink_student.students ADD COLUMN grade_level VARCHAR(50) NULL;
