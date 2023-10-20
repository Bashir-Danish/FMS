import { createConnection } from "mysql2/promise";

export let connectionPool1;
export let connectionPool2;
export let currentConnectionPool;
import { Worker, parentPort, workerData } from "worker_threads";

// const dbConfig1 = {
//   host: process.env.DB_HOST_1,
//   user: process.env.DB_USER_1,
//   password: process.env.DB_PASSWORD_1,
//   database: process.env.DB_NAME_1,
// };
// const dbConfig1 = {
//   host: process.env.DB_HOST_2,
//   user: process.env.DB_USER_2,
//   password: process.env.DB_PASSWORD_2,
//   database: process.env.DB_NAME_2,
// };

const dbConfig1 = {
  host: process.env.DB_HOST_3,
  user: process.env.DB_USER_3,
  password: process.env.DB_PASSWORD_3,
  database: process.env.DB_NAME_3,
};

export async function createConnections() {
  try {
    currentConnectionPool = await createConnection(dbConfig1);
    // connectionPool1 = await createConnectionPool(dbConfig2);
  } catch {}
}
export function getConnectionPool() {
  // currentConnectionPool = currentConnectionPool === connectionPool1 ? connectionPool2 : connectionPool1;
  return currentConnectionPool;
}

const runQuery = async (query, params = []) => {
  let conn = getConnectionPool();
  try {
    // console.log(query);
    // console.log(params);
    if (!conn) {
      throw new Error("Database connection is undefined.");
    }
    const startTime = Date.now();
    const [result] = await conn.query(query, params);
    // console.log(result);

    if (result === undefined) {
      throw new Error("Query result is undefined");
    }
    const endTime = Date.now();
    const queryResponseTime = endTime - startTime;

    console.log(`Query executed in ${queryResponseTime} ms`);
    return {
      res: result,
      resTime: queryResponseTime,
    };
  } catch (error) {
    console.error("Error running query:", error);
    throw error;
  }
};

async function enrollStudents(semesterId) {
  let totalQueryResponseTime = 0;

  try {
    const semesterQuery =
      "SELECT * FROM Semester WHERE semester_id = ? AND is_passed = 0;";

    const { res: semesters, resTime: t1 } = await runQuery(semesterQuery, [
      semesterId.semester_id,
    ]);
    console.log("semesters ", semesters);

    totalQueryResponseTime += t1;

    if (!semesters || semesters.length === 0) {
      return `Semester with ID ${semesterId} not found or query result is empty`;
    }
    const semester = semesters[0];

    if (semester.semester_number == 8 && semesterId.isFinished) {
      const elStuQuery = `
        SELECT s.student_id, s.department_id, s.current_semester
        FROM Student s
        WHERE
        s.current_semester = 8
        AND s.graduated = 0
        AND s.department_id IN (SELECT department_id FROM Subject WHERE semester_id = ?)
      `;
      const { res: eligibleStudents, resTime: t2 } = await runQuery(
        elStuQuery,
        [semesterId.semester_id]
      );

      totalQueryResponseTime += t2;
      if (eligibleStudents.length === 0) {
        console.log("No eligible students found.");
        return "No eligible students found for this semester.";
      }
      for (const student of eligibleStudents) {
        // console.log(student.current_semester);

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

        const { res: currentSemesterSubjects, resTime: t5 } = await runQuery(
          getCurrentSemesterQuery,
          [student.current_semester, student.student_id]
        );
        totalQueryResponseTime += t5;

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

        if (totalCreditsPassed >= Math.round(totalCredits / 2)) {
          const updateGraduationQuery = `
              UPDATE Student
              SET graduated = 1
              WHERE student_id = ?
            `;
          const { resTime: t6 } = await runQuery(updateGraduationQuery, [
            student.student_id,
          ]);
          totalQueryResponseTime += t6;

          console.log(`Enrolling student ID ${student.student_id} graduated`);
        } else {
          console.log(
            "can't passed the semester Student " + student.student_id
          );
        }
      }
      return;
    }
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
    const { res: eligibleStudents, resTime: t2 } = await runQuery(
      eligibleStudentsQuery,
      [
        semester.semester_number == 1
          ? semester.semester_number
          : semester.semester_number - 1,
        semesterId.semester_id,
      ]
    );
    totalQueryResponseTime += t2;

    if (eligibleStudents.length === 0) {
      console.log("No eligible students found.");
      return "No eligible students found for this semester.";
    }

    for (const student of eligibleStudents) {
      console.log(student);
      if (semester.semester_number < 2) {
        const subjectsQuery = `
          SELECT s.subject_id, s.credit
          FROM Subject s
          WHERE s.semester_id = ? AND s.department_id = ?
        `;
        const { res: studentSubjects, resTime: t3 } = await runQuery(
          subjectsQuery,
          [semesterId.semester_id, student.department_id]
        );
        totalQueryResponseTime += t3;

        for (const subject of studentSubjects) {
          const enrollQuery =
            "INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)";
          const { resTime: t4 } = await runQuery(enrollQuery, [
            student.student_id,
            subject.subject_id,
            semesterId.semester_id,
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

        const { res: currentSemesterSubjects, resTime: t5 } = await runQuery(
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
          // if (student.current_semester === 8) {
          //   const updateGraduationQuery = `
          //     UPDATE Student
          //     SET graduated = 1
          //     WHERE student_id = ?
          //   `;
          //   const { resTime: t6 } = await runQuery(updateGraduationQuery, [
          //     student.student_id,
          //   ]);
          //   totalQueryResponseTime += t6;

          //   // console.log(`Student ID ${student.student_id} has graduated`);
          // }
          // console.log(
          //   "this student can pass the semester" + student.student_id + " :",
          //   totalCreditsPassed >= Math.round(totalCredits / 2)
          // );

          const currentSemesterCreditsQuery = `
          SELECT s.subject_id, s.credit
          FROM Subject s
          WHERE s.semester_id = ? AND s.department_id = ?
          `;
          const { res: currentSemesterSubjects, resTime: t7 } = await runQuery(
            currentSemesterCreditsQuery,
            [semesterId.semester_id, student.department_id]
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
            const { resTime: t8 } = await runQuery(enrollQuery, [
              student.student_id,
              subject.subject_id,
              semesterId.semester_id,
            ]);
            totalQueryResponseTime += t8;
          }

          const updateCurrentSemesterQuery = `
            UPDATE Student
            SET current_semester = current_semester + 1
            WHERE student_id = ?
          `;
          const { resTime: t9 } = await runQuery(updateCurrentSemesterQuery, [
            student.student_id,
          ]);
          totalQueryResponseTime += t9;
          console.log(
            `Enrolling student ID ${student.student_id} to the next semester`
          );
        } else {
          console.log(
            "can't passed the semester Student " + student.student_id
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
    return `Error enrolling students for semester ID ${semesterId.semester_id}: ${error.message}`;
  }
}

const { semesterIdsArray } = workerData;

(async () => {
  try {
    await createConnections();

    if (!currentConnectionPool) {
      throw new Error("Database connection pool is not initialized.");
    }

    for (const semester of semesterIdsArray) {
      const result = await enrollStudents(semester);
      parentPort.postMessage(result);
    }
  } catch (error) {
    console.error("Error initializing database connections:", error);
  } finally {
    process.exit(0);
  }
})();

// import mysql from "mysql2/promise";
// import { Worker, parentPort, workerData } from "worker_threads";
// import { getConnectionPool } from "../../configs/connection.js";

// const dbConfig2 = {
//   host: process.env.DB_HOST_1,
//   user: process.env.DB_USER_1,
//   password: process.env.DB_PASSWORD_1,
//   database: process.env.DB_NAME_1,
//   connectionLimit: 1500,
// };

// const dbConfig1 = {
//   host: process.env.DB_HOST_3,
//   user: process.env.DB_USER_3,
//   password: process.env.DB_PASSWORD_3,
//   database: process.env.DB_NAME_3,
//   connectionLimit: 1500,
// };

// async function toggleDbConfig() {
//     // if (conn) {
//     //   conn.close(); // Release the connection back to the pool
//     // }
//   // currentDbConfig = currentDbConfig === dbConfig1 ? dbConfig2 : dbConfig1;
//   currentDbConfig = dbConfig1;
// }

// async function enrollStudents(semesterId) {
//   const conn = await mysql.createConnection(dbConfig1);

//   try {
//     const semesterQuery =
//       "SELECT * FROM Semester WHERE semester_id = ? AND is_passed = 0;";

//     const semesters = await runQuery(conn,semesterQuery, [semesterId]);

//     if (!semesters || semesters.length === 0) {

//       return `Semester with ID ${semesterId} not found or query result is empty`;
//     }
//     const semester = semesters[0];

//     const eligibleStudentsQuery = `
//     SELECT s.student_id, s.department_id, s.current_semester
//     FROM Student s
//     WHERE
//     s.current_semester = ?
//     AND s.graduated = 0
//       AND s.department_id IN (
//       SELECT department_id FROM Subject WHERE semester_id = ?
//     )
//   `;

//     const eligibleStudents =await runQuery(conn,eligibleStudentsQuery, [
//       semester.semester_number == 1
//         ? semester.semester_number
//         : semester.semester_number - 1,
//       semesterId,
//     ]);

//     if (eligibleStudents.length === 0) {
//       console.log("No eligible students found.");
//       return "No eligible students found for this semester.";
//     }

//     for (const student of eligibleStudents) {
//       // console.log(student.current_semester);
//       if (semester.semester_number < 2) {

//         const subjectsQuery = `
//           SELECT s.subject_id, s.credit
//           FROM Subject s
//           WHERE s.semester_id = ? AND s.department_id = ?
//         `;
//         const studentSubjects = await runQuery(conn,subjectsQuery, [
//           semesterId,
//           student.department_id,
//         ]);

//         for (const subject of studentSubjects) {
//           const enrollQuery =
//             "INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)";
//           await runQuery(conn,enrollQuery, [
//             student.student_id,
//             subject.subject_id,
//             semesterId,
//           ]);
//         }

//       } else {

//         const getCurrentSemesterQuery = `
//           SELECT
//               s.subject_id,
//               s.name,
//               s.credit,
//               e.grade,
//               CASE
//                   WHEN e.grade >= 55 THEN 'Passed'
//                   ELSE 'Not Passed'
//               END AS status
//           FROM Subject s
//           LEFT JOIN Enrollment e ON s.subject_id = e.subject_id
//           JOIN Semester sem ON s.semester_id = sem.semester_id
//           WHERE sem.semester_number = ? AND e.student_id = ?;
//         `;

//         const currentSemesterSubjects = await runQuery(conn,
//           getCurrentSemesterQuery,
//           [student.current_semester, student.student_id]
//         );
//         // console.log(currentSemesterSubjects);
//         const totalCredits = currentSemesterSubjects.reduce(
//           (sum, subject) => sum + subject.credit,
//           0
//         );
//         const passedSubjects = currentSemesterSubjects.filter(
//           (subject) => subject.status === "Passed"
//         );
//         const totalCreditsPassed = passedSubjects.reduce(
//           (sum, subject) => sum + subject.credit,
//           0
//         );

//         // console.log("Total credits in the current semester:", totalCredits);
//         // console.log("Half of the total credits:", Math.round(totalCredits / 2));
//         //  // console.log("Total credits of passed subjects:", totalCreditsPassed);
//         // console.log(
//         //   "Total credits of passed subjects:",
//         //   totalCreditsPassed >= Math.round(totalCredits / 2)
//         // );

//         if (totalCreditsPassed >= Math.round(totalCredits / 2)) {
//           if (student.current_semester === 8) {
//             const updateGraduationQuery = `
//               UPDATE Student
//               SET graduated = 1
//               WHERE student_id = ?
//             `;
//             await runQuery(conn,updateGraduationQuery, [student.student_id]);
//             // console.log(`Student ID ${student.student_id} has graduated`);
//           }
//           // console.log(
//           //   "this student can pass the semester" + student.student_id + " :",
//           //   totalCreditsPassed >= Math.round(totalCredits / 2)
//           // );

//           const currentSemesterCreditsQuery = `
//           SELECT s.subject_id, s.credit
//           FROM Subject s
//           WHERE s.semester_id = ? AND s.department_id = ?
//           `;
//           const currentSemesterSubjects = await runQuery(conn,
//             currentSemesterCreditsQuery,
//             [semesterId, student.department_id]
//           );

//           // console.log("currentSemesterSubjects");
//           // console.log(currentSemesterSubjects);
//           if (currentSemesterSubjects.length === 0) {
//             return "No Subject found for this semester.";
//           }
//           for (const subject of currentSemesterSubjects) {
//             const enrollQuery = `
//               INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)
//             `;
//             await runQuery(conn,enrollQuery, [
//               student.student_id,
//               subject.subject_id,
//               semesterId,
//             ]);
//           }

//           // Update current semester to the next semester
//           const updateCurrentSemesterQuery = `
//             UPDATE Student
//             SET current_semester = current_semester + 1
//             WHERE student_id = ?
//           `;
//           await runQuery(updateCurrentSemesterQuery, [student.student_id]);
//           console.log(
//             `Enrolling student ID ${student.student_id} to the next semester`
//           );
//         } else {
//           console.log(
//             "can't passed the semester Student Id" + student.student_id
//           );
//         //   const incrementYearQuery = `
//         //   UPDATE Student
//         //   SET year = year + 1
//         //   WHERE student_id = ?
//         // `;
//           // await runQuery(conn,incrementYearQuery, [student.student_id]);
//           // console.log(`Year incremented for student ID ${student.student_id}`);
//         }
//       }
//     }

//     return `تغیرات روی سمستر ${semester.semester_number} ${semester.year} اعمال شد`;
//   } catch (error) {
//     console.error("Error enrolling students:", error);
//     return `Error enrolling students for semester ID ${semesterId}: ${error.message}`;
//   }
// }

// // Retrieve semester IDs from workerData
// const { semesterIdsArray } = workerData;

// // Import necessary modules and setup your code...

// (async () => {
//   for (const semesterId of semesterIdsArray) {
//     const result = await enrollStudents(semesterId);
//     parentPort.postMessage(result);
//   }
//   process.exit(0);
// })();
