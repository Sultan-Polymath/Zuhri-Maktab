-- Legacy student records imported without full data may not have a known
-- date of birth or gender; these become optional and get filled in later.
ALTER TABLE "Student" ALTER COLUMN "dob" DROP NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "gender" DROP NOT NULL;
