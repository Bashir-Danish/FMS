import mysql from "mysql2/promise";
import { Worker, parentPort, workerData } from "worker_threads";
import { getConnectionPool } from "../../configs/connection.js";
import { runQuery } from "../../utils/query.js";

// const dbConfig1 = {
//   host: process.env.DB_HOST_1,
//   user: process.env.DB_USER_1,
//   password: process.env.DB_PASSWORD_1,
//   database: process.env.DB_NAME_1,
//   connectionLimit: 1500,
// };

// const dbConfig2 = {
//   host: process.env.DB_HOST_2,
//   user: process.env.DB_USER_2,
//   password: process.env.DB_PASSWORD_2,
//   database: process.env.DB_NAME_2,
//   connectionLimit: 1500,
// };

// let currentDbConfig = dbConfig1;
// let totalQueryResponseTime = 0;

// let conn;
// async function toggleDbConfig() {
//     // if (conn) {
//     //   conn.close(); // Release the connection back to the pool
//     // }
//   // currentDbConfig = currentDbConfig === dbConfig1 ? dbConfig2 : dbConfig1;
//   currentDbConfig = dbConfig1;
// }

async function enrollStudents(semesterId) {
  // const conn = await mysql.createConnection(dbConfig1);
  let totalQueryResponseTime = 0;

  try {
    const semesterQuery =
      "SELECT * FROM Semester WHERE semester_id = ? AND is_passed = 0;";

    const { result: semesters, resTime: t1 } = await runQuery(
      semesterQuery,
      [semesterId]
    );
    totalQueryResponseTime += t1;

    if (!semesters || semesters.length === 0) {
      // console.error(`Semester with ID ${semesterId} not found or query result is empty`);
      return `Semester with ID ${semesterId} not found or query result is empty`;
    }
    const semester = semesters[0];

    // if (!semester || !semester.semester_number) {
    //   console.error(`Semester with ID ${semesterId} is missing semester_number`);
    //   return `Semester with ID ${semesterId} is missing semester_number`;
    // }
    const eligibleStudentsQuery = `
    SELECT s.student_id, s.department_id, s.current_semester
    FROM Student s
    WHERE 
    s.current_semester = ? 
    AND s.graduated = 0
      AND s.department_id IN (
      SELECT department_id FROM Subject WHERE semester_id = ?
    )
  `;

    const { result: eligibleStudents, resTime: t2 } = await runQuery(
      eligibleStudentsQuery,
      [
        semester.semester_number == 1
          ? semester.semester_number
          : semester.semester_number - 1,
        semesterId,
      ]
    );
    totalQueryResponseTime += t2;

    if (eligibleStudents.length === 0) {
      console.log("No eligible students found.");
      return "No eligible students found for this semester.";
    }

    for (const student of eligibleStudents) {
      // console.log(student.current_semester);
      if (semester.semester_number < 2) {
        const subjectsQuery = `
          SELECT s.subject_id, s.credit
          FROM Subject s
          WHERE s.semester_id = ? AND s.department_id = ?
        `;
        const { result: studentSubjects, resTime: t3 } = await runQuery(
          
          subjectsQuery,
          [semesterId, student.department_id]
        );
        totalQueryResponseTime += t3;

        for (const subject of studentSubjects) {
          const enrollQuery =
            "INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)";
          const { resTime: t4 } = await runQuery( enrollQuery, [
            student.student_id,
            subject.subject_id,
            semesterId,
          ]);
          totalQueryResponseTime += t4;
        }
      } else {
        const getCurrentSemesterQuery = `
          SELECT 
              s.subject_id, 
              s.name, 
              s.credit, 
              e.grade,
              CASE
                  WHEN e.grade >= 55 THEN 'Passed'
                  ELSE 'Not Passed'
              END AS status
          FROM Subject s
          LEFT JOIN Enrollment e ON s.subject_id = e.subject_id
          JOIN Semester sem ON s.semester_id = sem.semester_id
          WHERE sem.semester_number = ? AND e.student_id = ?;
        `;

        const {result:currentSemesterSubjects,resTime:t5} = await runQuery(
          
          getCurrentSemesterQuery,
          [student.current_semester, student.student_id]
        );
    totalQueryResponseTime += t5;

        // console.log(currentSemesterSubjects);
        const totalCredits = currentSemesterSubjects.reduce(
          (sum, subject) => sum + subject.credit,
          0
        );
        const passedSubjects = currentSemesterSubjects.filter(
          (subject) => subject.status === "Passed"
        );
        const totalCreditsPassed = passedSubjects.reduce(
          (sum, subject) => sum + subject.credit,
          0
        );

        // console.log("Total credits in the current semester:", totalCredits);
        // console.log("Half of the total credits:", Math.round(totalCredits / 2));
        //  // console.log("Total credits of passed subjects:", totalCreditsPassed);
        // console.log(
        //   "Total credits of passed subjects:",
        //   totalCreditsPassed >= Math.round(totalCredits / 2)
        // );

        if (totalCreditsPassed >= Math.round(totalCredits / 2)) {
          if (student.current_semester === 8) {
            const updateGraduationQuery = `
              UPDATE Student
              SET graduated = 1
              WHERE student_id = ?
            `;
           const {resTime:t6}= await runQuery( updateGraduationQuery, [student.student_id]);
    totalQueryResponseTime += t6;

            // console.log(`Student ID ${student.student_id} has graduated`);
          }
          // console.log(
          //   "this student can pass the semester" + student.student_id + " :",
          //   totalCreditsPassed >= Math.round(totalCredits / 2)
          // );

          const currentSemesterCreditsQuery = `
          SELECT s.subject_id, s.credit
          FROM Subject s
          WHERE s.semester_id = ? AND s.department_id = ?
          `;
          const {result:currentSemesterSubjects,resTime:t7} = await runQuery(
            
            currentSemesterCreditsQuery,
            [semesterId, student.department_id]
          );
    totalQueryResponseTime += t7;


          // console.log("currentSemesterSubjects");
          // console.log(currentSemesterSubjects);
          if (currentSemesterSubjects.length === 0) {
            return "No Subject found for this semester.";
          }
          for (const subject of currentSemesterSubjects) {
            const enrollQuery = `
              INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)
            `;
           const {resTime:t8} = await runQuery( enrollQuery, [
              student.student_id,
              subject.subject_id,
              semesterId,
            ]);
            totalQueryResponseTime += t8;
          }

          const updateCurrentSemesterQuery = `
            UPDATE Student
            SET current_semester = current_semester + 1
            WHERE student_id = ?
          `;
          const {resTime:t9} = await runQuery( updateCurrentSemesterQuery, [
            student.student_id,
          ]);
          totalQueryResponseTime += t9;
          console.log(
            `Enrolling student ID ${student.student_id} to the next semester`
          );
        } else {
          console.log(
            "can't passed the semester Student Id" + student.student_id
          );
          //   const incrementYearQuery = `
          //   UPDATE Student
          //   SET year = year + 1
          //   WHERE student_id = ?
          // `;
          // await runQuery(incrementYearQuery, [student.student_id]);
          // console.log(`Year incremented for student ID ${student.student_id}`);
        }
      }
    }

    return `تغیرات روی سمستر ${semester.semester_number} ${semester.year} اعمال شد`;
  } catch (error) {
    console.error("Error enrolling students:", error);
    return `Error enrolling students for semester ID ${semesterId}: ${error.message}`;
  }
}

// Retrieve semester IDs from workerData
const { semesterIdsArray } = workerData;

// Import necessary modules and setup your code...

(async () => {
  for (const semesterId of semesterIdsArray) {
    const result = await enrollStudents(semesterId);
    parentPort.postMessage(result);
  }
  process.exit(0);
})();
