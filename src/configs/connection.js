import { createConnectionPool } from "./dbConfig.js";
import { config } from "dotenv";
import bcrypt from "bcrypt";

config();

// const dbConfig1 = {
//   host: process.env.DB_HOST_4,
//   user: process.env.DB_USER_4,
//   password: process.env.DB_PASSWORD_4,
//   database: process.env.DB_NAME_4,
// };

// const dbConfig1 = {
//   host: process.env.DB_HOST_2,
//   user: process.env.DB_USER_2,
//   password: process.env.DB_PASSWORD_2,
//   database: process.env.DB_NAME_2,
// };
const dbConfig1 = {
  host: process.env.DB_HOST_1,
  user: process.env.DB_USER_1,
  password: process.env.DB_PASSWORD_1,
  database: process.env.DB_NAME_1,
};
const dbConfig2 = {
  host: process.env.DB_HOST_2,
  user: process.env.DB_USER_2,
  password: process.env.DB_PASSWORD_2,
  database: process.env.DB_NAME_2,
};
// DB_HOST_1='190.92.190.16'
// DB_USER_1='dos'
// DB_PASSWORD_1='dos1234'
// DB_NAME_1='Fms1'

export let connectionPool1;
export let connectionPool2;
export let currentConnectionPool;

export async function createConnections() {
  try {
    connectionPool1 = await createConnectionPool(dbConfig1);
    connectionPool2 = await createConnectionPool(dbConfig2);
    currentConnectionPool = connectionPool1

    //     await connectionPool1.query(`
    //     CREATE TABLE IF NOT EXISTS Department (
    //       department_id INT AUTO_INCREMENT PRIMARY KEY,
    //       name VARCHAR(255) UNIQUE
    //     );
    //   `);

    //     // ok
    //     await connectionPool1.query(`
    //     CREATE TABLE IF NOT EXISTS Semester (
    //       semester_id INT AUTO_INCREMENT PRIMARY KEY,
    //       name ENUM('بهاری', 'تابستانی', 'خزانی', 'زمستانی'),
    //       year INT,
    //       semester_number INT,
    //       is_passed BOOLEAN DEFAULT 0,
    //       UNIQUE KEY unique_semester (year, semester_number)
    //     );
    //   `);

    //     // ok
    //     await connectionPool1.query(`
    //     CREATE TABLE IF NOT EXISTS Student (
    //       student_id INT AUTO_INCREMENT PRIMARY KEY,
    //       name VARCHAR(255),
    //       fname VARCHAR(255),
    //       ssid INT,
    //       department_id INT,
    //       current_semester INT DEFAULT 1,
    //       picture VARCHAR(255),
    //       year INT,
    //       graduated BOOLEAN DEFAULT 0,
    //       FOREIGN KEY (department_id) REFERENCES Department(department_id)
    //         ON DELETE RESTRICT ON UPDATE RESTRICT,
    //       UNIQUE INDEX unique_ssid (ssid)
    //     );
    //   `);

    //     // ok
    //     await connectionPool1.query(`
    //     CREATE TABLE IF NOT EXISTS User (
    //       user_id INT AUTO_INCREMENT PRIMARY KEY,
    //       name VARCHAR(255),
    //       lastName VARCHAR(255),
    //       email VARCHAR(255) UNIQUE,
    //       password VARCHAR(255),
    //       picture VARCHAR(255),
    //       userType ENUM('admin','user','teacher') DEFAULT 'user'
    //     );
    //   `);
    //     await connectionPool1.query(`
    //     CREATE TABLE IF NOT EXISTS Subject (
    //       subject_id INT AUTO_INCREMENT PRIMARY KEY,
    //       department_id INT,
    //       name VARCHAR(255),
    //       credit INT,
    //       semester_id INT,
    //       FOREIGN KEY (department_id) REFERENCES Department(department_id)
    //         ON DELETE RESTRICT ON UPDATE RESTRICT,
    //       FOREIGN KEY (semester_id) REFERENCES Semester(semester_id)
    //         ON DELETE RESTRICT ON UPDATE RESTRICT
    //     );
    //   `);
    //     await connectionPool1.query(`
    //     CREATE TABLE IF NOT EXISTS Enrollment (
    //       enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    //       student_id INT,
    //       subject_id INT,
    //       semester_id INT,
    //       grade INT,
    //       FOREIGN KEY (student_id) REFERENCES Student(student_id)
    //         ON DELETE RESTRICT ON UPDATE RESTRICT,
    //       FOREIGN KEY (subject_id) REFERENCES Subject(subject_id)
    //         ON DELETE RESTRICT ON UPDATE RESTRICT,
    //       FOREIGN KEY (semester_id) REFERENCES Semester(semester_id)
    //         ON DELETE RESTRICT ON UPDATE RESTRICT,
    //       UNIQUE KEY unique_enrollment (student_id, subject_id, semester_id)
    //     );
    // `);
    //     await connectionPool1.query(`
    //     CREATE TABLE IF NOT EXISTS SemesterRegistration (
    //       registration_id INT AUTO_INCREMENT PRIMARY KEY,
    //       student_id INT,
    //       semester_id INT,
    //       passed BOOLEAN DEFAULT 0,
    //       FOREIGN KEY (student_id) REFERENCES Student(student_id)
    //         ON DELETE RESTRICT ON UPDATE RESTRICT,
    //       FOREIGN KEY (semester_id) REFERENCES Semester(semester_id)
    //         ON DELETE RESTRICT ON UPDATE RESTRICT
    //     );
    //   `);

    //     SELECT d.name AS department_name, COUNT(s.student_id) AS total_students
    // FROM Student s
    // JOIN Enrollment e ON s.student_id = e.student_id
    // JOIN Department d ON s.department_id = d.department_id
    // WHERE e.semester_id = ? --Replace with selected_semester_id
    // GROUP BY d.name;

    //     const insertQuery = `
    //   INSERT IGNORE INTO User (name, lastName, email, password, userType)
    //   VALUES (?, ?, ?, ?, ?)
    // `;

    // Change these values to match your admin user's information
    const adminName = "bashir";
    const adminLastName = "danish";
    const adminEmail = "bashirdanish124@gmail.com";
    const adminPassword = await bcrypt.hash("dos1234", 10);
    const adminUserType = "admin";

    // Execute the insert query
    // const [result] = await connectionPool1.query(insertQuery, [
    //   adminName,
    //   adminLastName,
    //   adminEmail,
    //   adminPassword,
    //   adminUserType,
    // ]);

    console.log("✨ DB connected successfully 💫");
  } catch (error) {
    console.error("Error establishing database connections:", error.message);
    throw error;
  }
}
let connectionName = 'connectionPool1';

export function getConnectionPool() {
  currentConnectionPool = currentConnectionPool === connectionPool1 ? connectionPool2 : connectionPool1;
  connectionName = currentConnectionPool === connectionPool1 ? 'server 1' : 'server 2';
  console.log(`Connection changed to ${connectionName}`);
  return currentConnectionPool;
}