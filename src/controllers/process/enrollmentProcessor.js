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
  host: process.env.DB_HOST_1,
  user: process.env.DB_USER_1,
  password: process.env.DB_PASSWORD_1,
  database: process.env.DB_NAME_1,
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

let totalQueryResponseTime = 0;
let queryCount = 0;

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

    // console.log(`Query executed in ${queryResponseTime} ms`);
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
  try {
    const semesterQuery =
      "SELECT * FROM Semester WHERE semester_id = ? AND is_passed = 0;";

    const { res: semesters, resTime: t1 } = await runQuery(semesterQuery, [
      semesterId.semester_id,
    ]);
    console.log("semesters ", semesters);

    totalQueryResponseTime += t1;
    queryCount++;
    console.log(
      `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
    );

    if (!semesters || semesters.length === 0) {
      return `Semester with ID ${semesterId} not found or query result is empty`;
    }
    const semester = semesters[0];
    // Step  1
    // to graduate students
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
      queryCount++;
      console.log(
        `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
      );
      console.log(eligibleStudents);
      if (eligibleStudents.length === 0) {
        console.log("No eligible students found.");
        return "No eligible students found for this semester.";
      }
      for (const student of eligibleStudents) {
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
                WHERE sem.semester_id = ? AND e.student_id = ?;
                `;

        const { res: currentSemesterSubjects, resTime: t5 } = await runQuery(
          getCurrentSemesterQuery,
          [semesterId.semester_id, student.student_id]
        );

        console.log(currentSemesterSubjects);
        totalQueryResponseTime += t5;
        queryCount++;
        console.log(
          `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
        );

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
          queryCount++;
          console.log(
            `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
          );

          console.log(`Enrolling student ID ${student.student_id} graduated`);
          // return `Enrolling student ID ${student.student_id} graduated`;
        } else {
          console.log(
            "can't passed the semester Student " + student.student_id
          );
        }
      }
      //   return `The 8th semester students graduated`;
      // return `تغیرات روی سمستر ${semester.semester_number} ${semester.year} اعمال شد`;
    }

    const eligibleStudentsQuery = `
        SELECT s.student_id, s.department_id, s.current_semester
        FROM Student s
        WHERE 
            (s.current_semester = ? OR s.current_semester = ?)
            AND s.graduated = 0
            AND s.department_id IN (
            SELECT department_id FROM Subject WHERE semester_id = ?
            )
        `;

    let parameters = [];
    if (semester.semester_number === 1) {
      parameters = [
        semester.semester_number, // 1
        semester.semester_number, // 1
        semesterId.semester_id,
      ];
    } else if (semester.semester_number === 8) {
      parameters = [
        8, // 8
        7, // 7
        semesterId.semester_id,
      ];
    } else {
      // Ex  2
      parameters = [
        semester.semester_number,
        semester.semester_number - 1,
        semesterId.semester_id,
      ];
    }

    const { res: eligibleStudents, resTime: t7 } = await runQuery(
      eligibleStudentsQuery,
      parameters
    );

    totalQueryResponseTime += t7;
    queryCount++;
    console.log(
      `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
    );

    if (eligibleStudents.length === 0) {
      console.log("No eligible students found.");
      return "No eligible students found for this semester.";
    }

    // const { res: eligibleStudents, resTime: t2 } = await runQuery(
    //   eligibleStudentsQuery,
    //   [
    //     semester.semester_number == 1
    //       ? semester.semester_number
    //       : semester.semester_number - 1,
    //     semesterId.semester_id,
    //   ]
    // );

    // const eligibleStudentsQuery = `
    //   SELECT s.student_id, s.department_id, s.current_semester
    //   FROM Student s
    //   WHERE
    //     s.current_semester = ?
    //     AND s.graduated = 0
    //     AND s.department_id IN (
    //       SELECT department_id FROM Subject WHERE semester_id = ?
    //     )
    // `;

    for (const student of eligibleStudents) {
      if (semester.semester_number == 1) {
        console.log(student);
        const subjectsQuery = `
                SELECT s.subject_id, s.credit
                FROM Subject s
                WHERE s.semester_id = ? AND s.department_id = ?
                `;
        const { res: studentSubjects, resTime: t8 } = await runQuery(
          subjectsQuery,
          [semesterId.semester_id, student.department_id]
        );
        totalQueryResponseTime += t8;
        queryCount++;
        console.log(
          `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
        );

        for (const subject of studentSubjects) {
          //    const { resTime: t4 } = await runQuery(enrollQuery, [
          //     student.student_id,
          //     subject.subject_id,
          //     semesterId.semester_id,
          //   ]);const enrollQuery =
          //     "INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)";

          const enrollQuery =
            "INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id, grade) VALUES (?, ?, ?, ?)";
          function generateRandomGrade() {
            const random = Math.random();
            if (random < 0.12) {
              return Math.floor(Math.random() * (56 - 50) + 50);
            } else {
              return Math.floor(Math.random() * (100 - 56) + 56);
            }
          }
          const randomGrade = generateRandomGrade();

          const { resTime: t9, res } = await runQuery(enrollQuery, [
            student.student_id,
            subject.subject_id,
            semesterId.semester_id,
            randomGrade,
          ]);
          totalQueryResponseTime += t9;
          queryCount++;
          console.log(
            `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
          );
        }
        // return `تغیرات روی سمستر ${semester.semester_number} ${semester.year} اعمال شد`;
      } else {
        if (student.current_semester == semester.semester_number) {
          // if student is in 8th semester
          const subjectsQuery = `
                        SELECT s.subject_id, s.credit
                        FROM Subject s
                        WHERE s.semester_id = ? AND s.department_id = ?
                    `;
          const { res: studentSubjects, resTime: t10 } = await runQuery(
            subjectsQuery,
            [semesterId.semester_id, student.department_id]
          );
          totalQueryResponseTime += t10;
          queryCount++;
          console.log(
            `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
          );

          for (const subject of studentSubjects) {
            // const enrollQuery =
            //     "INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)";
            // const { resTime: t4 } = await runQuery(enrollQuery, [
            //     student.student_id,
            //     subject.subject_id,
            //     semesterId.semester_id,
            // ]);

            const enrollQuery =
              "INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id, grade) VALUES (?, ?, ?, ?)";
            function generateRandomGrade() {
              const random = Math.random();
              if (random < 0.2) {
                return Math.floor(Math.random() * (56 - 50) + 50);
              } else {
                return Math.floor(Math.random() * (100 - 56) + 56);
              }
            }
            const randomGrade = generateRandomGrade();

            const { resTime: t11, res } = await runQuery(enrollQuery, [
              student.student_id,
              subject.subject_id,
              semesterId.semester_id,
              randomGrade,
            ]);
            totalQueryResponseTime += t11;
            queryCount++;
            console.log(
              `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
            );
          }
          // return `تغیرات روی سمستر ${semester.semester_number} ${semester.year} اعمال شد`;
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

          const { res: currentSemesterSubjects, resTime: t12 } = await runQuery(
            getCurrentSemesterQuery,
            [student.current_semester, student.student_id]
          );
          totalQueryResponseTime += t12;
          queryCount++;
          console.log(
            `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
          );

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

          if (totalCreditsPassed >= Math.round(totalCredits / 2)) {
            const currentSemesterCreditsQuery = `
                        SELECT s.subject_id, s.credit
                        FROM Subject s
                        WHERE s.semester_id = ? AND s.department_id = ?
                        `;
            const { res: currentSemesterSubjects, resTime: t13 } =
              await runQuery(currentSemesterCreditsQuery, [
                semesterId.semester_id,
                student.department_id,
              ]);
            totalQueryResponseTime += t13;
            queryCount++;
            console.log(
              `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
            );

            if (currentSemesterSubjects.length === 0) {
              return "No Subject found for this semester.";
            }
            for (const subject of currentSemesterSubjects) {
              // const enrollQuery = `
              //   INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)
              // `;
              // const { resTime: t8 } = await runQuery(enrollQuery, [
              //   student.student_id,
              //   subject.subject_id,
              //   semesterId.semester_id,
              // ]);
              const enrollQuery =
                "INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id, grade) VALUES (?, ?, ?, ?)";

              function generateRandomGrade() {
                const random = Math.random();

                if (random < 0.12) {
                  return Math.floor(Math.random() * (56 - 50) + 50);
                } else {
                  return Math.floor(Math.random() * (100 - 56) + 56);
                }
              }
              const randomGrade = generateRandomGrade();

              const { resTime: t14, res } = await runQuery(enrollQuery, [
                student.student_id,
                subject.subject_id,
                semesterId.semester_id,
                randomGrade,
              ]);
              totalQueryResponseTime += t14;
              queryCount++;
              console.log(
                `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
              );
            }

            const updateCurrentSemesterQuery = `
                            UPDATE Student
                            SET current_semester = current_semester + 1
                            WHERE student_id = ?
                        `;
            const { resTime: t15 } = await runQuery(
              updateCurrentSemesterQuery,
              [student.student_id]
            );
            totalQueryResponseTime += t15;
            queryCount++;
            console.log(
              `Queries : ${queryCount}, Response Time: ${totalQueryResponseTime} ms`
            );
            console.log(
              `Enrolling student ID ${student.student_id} to the next semester`
            );
          } else {
            console.log(
              "can't passed the semester Student " + student.student_id
            );
          }
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
    totalQueryResponseTime = 0;
    queryCount = 0;

    if (!currentConnectionPool) {
      throw new Error("Database connection pool is not initialized.");
    }

    for (const semester of semesterIdsArray) {
      const result = await enrollStudents(semester);
      parentPort.postMessage(result);
    }
    console.log("Queries ", totalQueryResponseTime);
    console.log("Response Time", queryCount);
  } catch (error) {
    console.error("Error initializing database connections:", error);
  } finally {
    process.exit(0);
  }
})();
