import mysql from "mysql2/promise";
import { Worker, parentPort, workerData } from "worker_threads";
import { getConnectionPool } from "../../configs/connection.js";

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

let currentDbConfig = dbConfig1;
let totalQueryResponseTime = 0;

async function toggleDbConfig() {
  // currentDbConfig = currentDbConfig === dbConfig1 ? dbConfig2 : dbConfig1;
  currentDbConfig = dbConfig1;
}

async function runQuery(query, params) {
  const conn = await mysql.createConnection(currentDbConfig);

  const startTime = Date.now();
  try {
    const [result] = await conn.query(query, params);
    if (result === undefined) {
      throw new Error("Query result is undefined");
    }
    return result;
  } finally {
    const endTime = Date.now();
    const queryResponseTime = endTime - startTime;
    console.log(`Query response time: ${queryResponseTime} ms`);
    totalQueryResponseTime += queryResponseTime;
    await toggleDbConfig();
  }
}

// async function runQuery(query, params) {
//   try {
//     const conn = await mysql.createConnection(currentDbConfig);

//     const startTime = Date.now();
//     const [result] = await conn.query(query, params);
//     if (result === undefined) {
//       throw new Error("Query result is undefined");
//     }
//     return result;
//   } finally {
//     const endTime = Date.now();
//     const queryResponseTime = endTime - startTime;
//     console.log(`Query response time: ${queryResponseTime} ms`);
//     totalQueryResponseTime += queryResponseTime;
//     conn.end();
//     await toggleDbConfig();
//   }
// }

async function enrollStudents(semesterId) {
  // const conn = await mysql.createConnection(dbConfig1);
  try {
    const semesterQuery =
      "SELECT * FROM Semester WHERE semester_id = ? AND is_passed = 0;";

    const semesters = await runQuery(semesterQuery, [semesterId]);

    if (!semesters || semesters.length === 0) {
      console.error(
        `Semester with ID ${semesterId} not found or query result is empty`
      );
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

    const eligibleStudents = await runQuery(eligibleStudentsQuery, [
      semester.semester_number == 1
        ? semester.semester_number
        : semester.semester_number - 1,
      semesterId,
    ]);

    if (eligibleStudents.length === 0) {
      console.log("No eligible students found.");
      return "No eligible students found for this semester.";
    }

    for (const student of eligibleStudents) {
      console.log(student.current_semester);
      if (semester.semester_number < 2) {
        const subjectsQuery = `
          SELECT s.subject_id, s.credit
          FROM Subject s
          WHERE s.semester_id = ? AND s.department_id = ?
        `;
        const studentSubjects = await runQuery(subjectsQuery, [
          semesterId,
          student.department_id,
        ]);

        for (const subject of studentSubjects) {
          const enrollQuery =
            "INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)";
          await runQuery(enrollQuery, [
            student.student_id,
            subject.subject_id,
            semesterId,
          ]);
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

        // Assuming you have the student's current semester number and student ID
        const currentSemesterSubjects = await runQuery(
          getCurrentSemesterQuery,
          [student.current_semester, student.student_id]
        );
        console.log(currentSemesterSubjects);
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
            await runQuery(updateGraduationQuery, [student.student_id]);
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
          const currentSemesterSubjects = await runQuery(
            currentSemesterCreditsQuery,
            [semesterId, student.department_id]
          );

          // console.log("currentSemesterSubjects");
          // console.log(currentSemesterSubjects);
          if (currentSemesterSubjects.length === 0) {
            return "No Subject found for this semester.";
          }
          for (const subject of currentSemesterSubjects) {
            const enrollQuery = `
              INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)
            `;
            await runQuery(enrollQuery, [
              student.student_id,
              subject.subject_id,
              semesterId,
            ]);
          }

          // Update current semester to the next semester
          const updateCurrentSemesterQuery = `
            UPDATE Student
            SET current_semester = current_semester + 1
            WHERE student_id = ?
          `;
          await runQuery(updateCurrentSemesterQuery, [student.student_id]);
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
  } finally {
    conn.end();
  }
}

// Retrieve semester IDs from workerData
const { semesterIdsArray } = workerData;

(async () => {
  for (const semesterId of semesterIdsArray) {
    const result = await enrollStudents(semesterId);
    parentPort.postMessage(result);
  }
  console.log(totalQueryResponseTime);
})();
