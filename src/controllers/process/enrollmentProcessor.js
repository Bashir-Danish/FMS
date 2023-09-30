import mysql from "mysql2/promise";
import { Worker, parentPort, workerData } from "worker_threads";
import { getConnectionPool } from "../../configs/connection.js";

const dbConfig1 = {
  host: process.env.DB_HOST_1,
  user: process.env.DB_USER_1,
  password: process.env.DB_PASSWORD_1,
  database: process.env.DB_NAME_1,
};
// const dbConfig = {
//   host:  "192.168.1.250",
//   user:  "dos",
//   password:  "dos1234",
//   database: "Fms1",
// };
async function enrollStudentsInSubjects(semesterId) {
  const conn = await mysql.createConnection(dbConfig1);
  try {
    // console.log(semesterId);
    console.log(semesterId);
    const semesterQuery =
      "SELECT * FROM Semester WHERE semester_id = ? AND is_passed = 0;";
    const [semesters] = await conn.query(semesterQuery, [semesterId]);
    console.log("semesters");
    console.log(semesters);
    if (semesters.length === 0) {
      console.error(`Semester with ID ${semesterId} not found`);
      return `Semester with ID ${semesterId} not found`;
    }

    const semester = semesters[0];
    const eligibleStudentsQuery = `
    SELECT s.student_id, s.department_id, s.current_semester
    FROM Student s
    WHERE 
    s.current_semester = ? 
    AND s.graduated = 0

  `;
    //  AND s.department_id IN (
    //   SELECT department_id FROM Subject WHERE semester_id = ?
    // )
    const [eligibleStudents] = await conn.query(eligibleStudentsQuery, [
      semester.semester_number == 1 ? semester.semester_number : semester.semester_number - 1 ,
      semesterId,
    ]);
    console.log("Query:", eligibleStudentsQuery);
    console.log("Parameters:", [semester.semester_number - 1, semesterId]);
    console.log("eligibleStudents");
    console.log(eligibleStudents);

    if (eligibleStudents.length === 0) {
      console.log("No eligible students found.");
      return "No eligible students found for this semester.";
    }

    for (const student of eligibleStudents) {
      if (student.current_semester === 1) {
        const subjectsQuery = `
          SELECT s.subject_id, s.credit
          FROM Subject s
          WHERE s.semester_id = ? AND s.department_id = ?
        `;
        const [studentSubjects] = await conn.query(subjectsQuery, [
          semesterId,
          student.department_id,
        ]);

        for (const subject of studentSubjects) {
          const enrollQuery =
            "INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)";
          await conn.query(enrollQuery, [
            student.student_id,
            subject.subject_id,
            semesterId,
          ]);
        }
        // const updateCurrentSemesterQuery = `
        // UPDATE Student
        // SET current_semester = 1
        // WHERE student_id = ?
        // `;
        // await conn.query(updateCurrentSemesterQuery, [student.student_id]);
        // console.log(
        //   `Subjects for student ID  ${student.student_id} current semester 0`
        // );
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
        const [currentSemesterSubjects] = await conn.query(
          getCurrentSemesterQuery,
          [student.current_semester, student.student_id]
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

        // console.log("Total credits in the current semester:", totalCredits);
        // console.log("Half of the total credits:", Math.round(totalCredits / 2));
        // console.log("Total credits of passed subjects:", totalCreditsPassed);

        if (totalCreditsPassed >= Math.round(totalCredits / 2)) {
          if (student.current_semester === 8) {
            const updateGraduationQuery = `
              UPDATE Student
              SET graduated = 1
              WHERE student_id = ?
            `;
            await conn.query(updateGraduationQuery, [student.student_id]);
            console.log(`Student ID ${student.student_id} has graduated`);
          }
          console.log(
            "this student can pass the semester" + student.student_id + " :",
            totalCreditsPassed >= Math.round(totalCredits / 2)
          );

          const currentSemesterCreditsQuery = `
          SELECT s.subject_id, s.credit
          FROM Subject s
          WHERE s.semester_id = ? AND s.department_id = ?
          `;
          const [currentSemesterSubjects] = await conn.query(
            currentSemesterCreditsQuery,
            [semesterId, student.department_id]
          );

          console.log("currentSemesterSubjects");
          console.log(currentSemesterSubjects);
          if (currentSemesterSubjects.length === 0) {
            return "No Subject found for this semester.";
          }
          for (const subject of currentSemesterSubjects) {
            const enrollQuery = `
              INSERT IGNORE INTO Enrollment (student_id, subject_id, semester_id) VALUES (?, ?, ?)
            `;
            await conn.query(enrollQuery, [
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
          await conn.query(updateCurrentSemesterQuery, [student.student_id]);
          console.log(
            `Enrolling student ID ${student.student_id} to the next semester`
          );
        } else {
          console.log(
            "can't passed the semester Student Id" + student.student_id
          );
          // const updatedCurrentSemester =
          //   student.current_semester > 0 ? student.current_semester - 1 : 0;

          // const updateCurrentSemesterQuery = `
          //   UPDATE Student
          //   SET current_semester = ?
          //   WHERE student_id = ?
          // `;
          // await conn.query(updateCurrentSemesterQuery, [
          //   updatedCurrentSemester,
          //   student.student_id,
          // ]);
          // console.log(
          //   `Decreased current semester for student ID ${student.student_id}`
          // );
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
    const result = await enrollStudentsInSubjects(semesterId);
    parentPort.postMessage(result);
  }
})();
