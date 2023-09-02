import { createConnectionPool } from "./dbConfig.js";

const dbConfig1 = {
  host: process.env.DB_HOST || "192.168.172.1",
  user: process.env.DB_USER || "dos",
  password: process.env.DB_PASSWORD || "dos1234",
  database: process.env.DB_NAME || "FMS1",
};

const dbConfig2 = {
  host: process.env.DB_HOST_2 || "localhost",
  user: process.env.DB_USER_2 || "root",
  password: process.env.DB_PASSWORD_2 || "",
  database: process.env.DB_NAME_2 || "FMS2",
};

export let connectionPool1;
export let connectionPool2;
export let currentConnectionPool;

export async function createConnections() {
  try {
    connectionPool1 = await createConnectionPool(dbConfig1);

    // connectionPool2 = await createConnectionPool(dbConfig2);
    await connectionPool1.query(`
    CREATE TABLE IF NOT EXISTS Department (
      department_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE
    );
  `);

    // ok
    await connectionPool1.query(`
  CREATE TABLE IF NOT EXISTS Semester (
    semester_id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('بهاری', 'تابستانی', 'خزانی', 'زمستانی'),
    year INT,
    semester_number INT,
    UNIQUE KEY unique_semester (year, semester_number)
  );
`);
    // ok
    await connectionPool1.query(`
  CREATE TABLE IF NOT EXISTS Student (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    fname VARCHAR(255),
    ssid INT,
    department_id INT,
    current_semester INT DEFAULT 1,
    picture VARCHAR(255),
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE INDEX unique_ssid (ssid)
  );
`);

    // ok
    await connectionPool1.query(`
    CREATE TABLE IF NOT EXISTS User (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      lastName VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      picture VARCHAR(255),
      userType ENUM('ادمین','کاربر','استاد') DEFAULT 'کاربر'
    );
  `);

    // 
    await connectionPool1.query(`
    CREATE TABLE IF NOT EXISTS Subject (
      subject_id INT AUTO_INCREMENT PRIMARY KEY,
      department_id INT,
      name VARCHAR(255),
      credit INT,
      semester_id INT, 
      FOREIGN KEY (department_id) REFERENCES Department(department_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (semester_id) REFERENCES Semester(semester_id)
      ON DELETE CASCADE ON UPDATE CASCADE 
    );
  `);
  
  

    // For Enrollment table
    await connectionPool1.query(`
CREATE TABLE IF NOT EXISTS Enrollment (
  enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  subject_id INT,
  semester_id INT,
  grade INT,
  FOREIGN KEY (student_id) REFERENCES Student(student_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES Subject(subject_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (semester_id) REFERENCES Semester(semester_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, subject_id, semester_id)
);
`);
    await connectionPool1.query(`
    CREATE TABLE IF NOT EXISTS SemesterRegistration (
      registration_id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT,
      semester_id INT,
      passed BOOLEAN DEFAULT 0,
      FOREIGN KEY (student_id) REFERENCES Student(student_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (semester_id) REFERENCES Semester(semester_id)
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

    console.log("✨ DB connected successfully 💫");
  } catch (error) {
    console.error("Error establishing database connections:", error);
    throw error;
  }
}

export function getConnectionPool() {
  // currentConnectionPool = currentConnectionPool === connectionPool1 ? connectionPool2 : connectionPool1;
  return connectionPool1;
}
