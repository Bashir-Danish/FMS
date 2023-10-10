import mysql from "mysql2/promise";
import { Worker, parentPort, workerData } from "worker_threads";
import { getConnectionPool } from "../../configs/connection.js";
import { runQuery } from "../../utils/query.js";
// Database configuration
// const dbConfig = {
//   host: process.env.DB_HOST_1,
//   user: process.env.DB_USER_1,
//   password: process.env.DB_PASSWORD_1,
//   database: process.env.DB_NAME_1,
// };
// const dbConfig = {
//   host: "192.168.1.250",
//   user: "dos",
//   password: "dos1234",
//   database: "Fms1",
// };
async function updateStudentGrades(enrollmentsData, semesterId, departmentId) {
  // const conn = await mysql.createConnection(dbConfig);
  let responseTime = 0;
  try {
    const findSubjectsQuery = `
      SELECT subject_id, name
      FROM Subject
      WHERE semester_id = ? AND department_id = ?
    `;

    const { result: subjects, resTime: t1 } = await runQuery(
      findSubjectsQuery,
      [semesterId, departmentId]
    );
    responseTime += t1;
    const subjectMap = new Map(
      subjects.map((subject) => [subject.name, subject.subject_id])
    );
    // console.log("subjectMap");
    // console.log(subjectMap);

    for (const enrollment of enrollmentsData) {
      const { ssid, name, fname, ...grades } = enrollment;

      const findStudentQuery = `
      SELECT student_id
      FROM Student
      WHERE ssid = ? AND department_id = ?
    `;

      const { result: studentRow, resTime: t2 } = await runQuery(
        findStudentQuery,
        [ssid, departmentId]
      );
      responseTime += t2;

      if (studentRow.length === 0) {
        console.error(
          `Student with ssid ${ssid} not found for department ${departmentId}`
        );
        continue;
      }

      const studentId = studentRow[0].student_id;
      // console.log("grades");
      // console.log(grades);

      for (const subjectName in grades) {
        if (grades.hasOwnProperty(subjectName)) {
          const grade = grades[subjectName];
          // console.log("grade");
          // console.log(grade);

          if (subjectMap.has(subjectName)) {
            const subjectId = subjectMap.get(subjectName);

            const updateEnrollmentQuery = `
              UPDATE Enrollment
              SET grade = ?
              WHERE student_id = ? AND subject_id = ? AND semester_id = ?;
            `;

            const { resTime: t3 } = await runQuery(updateEnrollmentQuery, [
              grade,
              studentId,
              subjectId,
              semesterId,
            ]);
            responseTime += t3;
          } else {
            // Subject not found in the specified semester and department, skip it
            console.error(
              `Subject ${subjectName} not found for semester ${semesterId} and department ${departmentId}`
            );
          }
        }
      }
    }
    console.log(`Response time : ${responseTime} ms`);

    return "Grades updated successfully.";
  } catch (error) {
    console.error("Error updating grades:", error);
    return `Error updating grades: ${error.message}`;
  } finally {
    // conn.end();
  }
}

// Receive enrollment data (grades), semesterId, and departmentId from workerData
const { enrollmentsData, semesterId, departmentId } = workerData;

(async () => {
  const result = await updateStudentGrades(
    enrollmentsData,
    semesterId,
    departmentId
  );
  parentPort.postMessage(result);
})();
