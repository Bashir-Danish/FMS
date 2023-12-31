import { Worker, isMainThread } from "worker_threads";
import { catchAsync } from "../middlewares.js";
import { runQuery } from "../utils/query.js";

export const getEnrollments = catchAsync(async (req, res) => {
  const { semesterId, departmentId } = req.query;
  let responseTime = 0;
  try {
    const subjectsQuery = `
            SELECT DISTINCT
                Subject.subject_id,
                Subject.name AS subject_name,
                Subject.credit,
                Department.name AS department_name
            FROM Subject
            INNER JOIN Department ON Subject.department_id = Department.department_id
            WHERE Subject.semester_id = ? AND Department.department_id = ?
        `;

    const { result: subjectsResult, resTime: t1 } = await runQuery(
      subjectsQuery,
      [semesterId, departmentId]
    );
    responseTime += t1;
    const enrollments = {};
    const subjectList = subjectsResult.map((row) => ({
      subject_id: row.subject_id,
      subject_name: row.subject_name,
      credit: row.credit,
    }));

    const enrollmentQuery = `
            SELECT
                Enrollment.enrollment_id,
                Enrollment.grade,
                Student.ssid,
                Student.name AS student_name,
                Student.fname AS father_name,
                Department.name AS department_name,
                Enrollment.subject_id
            FROM Enrollment
            INNER JOIN Student ON Enrollment.student_id = Student.student_id
            INNER JOIN Department ON Student.department_id = Department.department_id 
            WHERE Enrollment.semester_id = ? AND Student.department_id = ?
        `;

    const { result: enrollmentsResult, resTime: t2 } = await runQuery(
      enrollmentQuery,
      [semesterId, departmentId]
    );
    responseTime += t2;

    enrollmentsResult.forEach((row) => {
      const studentKey = `${row.student_name} ${row.father_name}`;
      if (!enrollments[studentKey]) {
        enrollments[studentKey] = {
          ssid: row.ssid,
          name: row.student_name,
          fname: row.father_name,
          department_name: row.department_name,
          grades: [],
        };
      }
      const subjectIndex = subjectList.findIndex(
        (subject) => subject.subject_id === row.subject_id
      );
      if (subjectIndex !== -1) {
        enrollments[studentKey].grades.push({
          enrollment_id: row.enrollment_id,
          subject_name: subjectList[subjectIndex].subject_name,
          grade: row.grade,
          credit: subjectList[subjectIndex].credit,
        });
      }
    });

    Object.values(enrollments).forEach((student) => {
      const totalCredits = student.grades.reduce(
        (total, gradeInfo) => total + gradeInfo.grade * gradeInfo.credit,
        0
      );
      const totalCreditUnits = student.grades.reduce(
        (total, gradeInfo) => total + gradeInfo.credit,
        0
      );
      student.percentage = (totalCredits / totalCreditUnits).toFixed(2);
    });

    console.log(`Response time : ${responseTime} ms`);
    res
      .status(200)
      .json({ enrollments: Object.values(enrollments), subjects: subjectList });
  } catch (error) {
    console.error("Error retrieving enrollments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const updateGrades = catchAsync(async (req, res) => {
  const { semesterId, departmentId, enrollmentsData } = req.body;
  if (isMainThread) {
    const worker = new Worker("./src/controllers/process/importEnrolls.js", {
      workerData: { semesterId, departmentId, enrollmentsData },
    });

    worker.on("message", (message) => {
      res.status(200).json({ message });
    });

    worker.on("error", (error) => {
      console.error("Worker error:", error);
      res.status(500).json({ error: "Internal server error" });
    });
  } else {
  }
});
