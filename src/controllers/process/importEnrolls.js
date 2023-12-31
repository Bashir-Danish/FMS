import { createConnection } from "mysql2/promise";

export let connectionPool1;
export let connectionPool2;
export let currentConnectionPool;
import { Worker, parentPort, workerData } from "worker_threads";

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

export async function createConnections() {
  try {
    connectionPool1 = await createConnection(dbConfig1);
    connectionPool2 = await createConnection(dbConfig2);
  } catch { }
}
let connectionName = 'server 1';

export function getConnectionPool() {
  currentConnectionPool = currentConnectionPool === connectionPool1 ? connectionPool2 : connectionPool1;
  connectionName = currentConnectionPool === connectionPool1 ? 'server 1' : 'server 2';
  console.log(`Connection changed to ${connectionName}`);
  return currentConnectionPool;
}


const runQuery = async (query, params = []) => {
  let conn = getConnectionPool();
  try {
    if (!conn) {
      throw new Error("Database connection is undefined.");
    }
    const startTime = Date.now();
    const [result] = await conn.query(query, params);

    if (result === undefined) {
      throw new Error("Query result is undefined");
    }
    const endTime = Date.now();
    const queryResponseTime = endTime - startTime;

    console.log(`Query executed in ${queryResponseTime} ms`);
    return {
      result,
      resTime: queryResponseTime,
    };
  } catch (error) {
    console.error("Error running query:", error);
    throw error;
  }
};



// function isWriteOperation(query) {
//   const firstWord = query.trim().split(" ")[0].toUpperCase();
//   return ["INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP"].includes(
//     firstWord
//   );
// }
// export const runQuery = async (query, params = []) => {
//   const isWriteOp = isWriteOperation(query);
//   let conn = isWriteOp ? connectionPool1 : connectionPool2;

//   try {
//     if (!conn || !conn.connection || conn.connection._closing) {
//       console.info("Connection is in a closed state, getting a new connection");
//       await createConnections();
//       conn = isWriteOp ? connectionPool1 : connectionPool2;
//     }

//     const startTime = Date.now();
//     const [result] = await conn.query(query, params);
//     if (result === undefined) {
//       throw new Error("Query result is undefined");
//     }
//     const endTime = Date.now();
//     const queryResponseTime = endTime - startTime;

//     const connectionType = isWriteOp ? "Master" : "Slave";
//     console.log(
//       `Query executed in ${queryResponseTime} ms using ${connectionType} connection pool`
//     );

//     return {
//       result,
//       resTime: queryResponseTime,
//       connectionType,
//     };
//   } catch (error) {
//     console.error("Error running query:", error);
//     throw error;
//   }
// };






async function updateStudentGrades(enrollmentsData, semesterId, departmentId) {

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
        console.error(`Student with ssid ${ssid} not found for department ${departmentId}`);
        continue;
      }

      const studentId = studentRow[0].student_id;

      for (const subjectName in grades) {
        if (grades.hasOwnProperty(subjectName)) {
          const grade = grades[subjectName];

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
            console.error(
              `Subject ${subjectName} not found for semester ${semesterId} and department ${departmentId}`
            );
          }
        }
      }
    }

    return "Grades updated successfully.";
  } catch (error) {
    console.error("Error updating grades:", error);
    return `Error updating grades: ${error.message}`;
  } finally {
    console.log(`Response time : ${responseTime} ms`);
    // conn.end();
  }
}

const { enrollmentsData, semesterId, departmentId } = workerData;

(async () => {
  try {
    await createConnections();

    if (!currentConnectionPool) {
      throw new Error("Database connection pool is not initialized.");
    }

    const result = await updateStudentGrades(
      enrollmentsData,
      semesterId,
      departmentId
    );
    parentPort.postMessage(result);
  } catch (error) {
    console.error("Error initializing database connections:", error);
  } finally {
    process.exit(0);
  }
})();
