import { catchAsync } from "../middlewares.js";
import { runQuery } from "../utils/query.js";

export const getSubjects = catchAsync(async (req, res) => {
  try {
    const query = `
    SELECT
    Semester.semester_id,
    Semester.name AS semester_name,
    Semester.year,
    Semester.semester_number,
    Subject.subject_id,
    Subject.name AS subject_name,
    Subject.credit,
    Subject.department_id
    FROM Semester
    INNER JOIN Subject ON Semester.semester_id = Subject.semester_id
    ORDER BY Semester.semester_id, Subject.subject_id;
    `;
    const { result, resTime } = await runQuery(query);
    const semestersMap = new Map();
    result.forEach((row) => {
      const semesterKey = `${row.semester_id}_${row.department_id}`;
      if (!semestersMap.has(semesterKey)) {
        semestersMap.set(semesterKey, {
          semester_id: row.semester_id,
          semester_name: row.semester_name,
          year: row.year,
          semester_number: row.semester_number,
          department_id: row.department_id,
          subjects: [],
        });
      }

      if (row.subject_id !== null) {
        semestersMap.get(semesterKey).subjects.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          credit: row.credit,
        });
      }
    });

    const semestersWithSubjects = Array.from(semestersMap.values());

    console.log(`Response time : ${resTime} ms`);
    res.status(200).json({ subjects: semestersWithSubjects });
  } catch (error) {
    console.error(
      "Error retrieving subjects by semester and department:",
      error
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

export const createSubject = catchAsync(async (req, res) => {
  const { department_id, semester_id, subjects } = req.body;
  let responseTime = 0;
  try {
    const checkExistingSubjectsQuery = `
      SELECT * FROM Subject
      WHERE department_id = ? AND semester_id = ?
    `;
    const { result: existingSubjects, resTime: t1 } = await runQuery(
      checkExistingSubjectsQuery,
      [department_id, semester_id]
    );
    responseTime += t1;
    if (existingSubjects.length > 0) {
      return res.status(400).json({
        error: "Subjects with the same department and semester already exist",
      });
    }
    for (const [name, credit] of subjects) {
      const query = `
        INSERT INTO Subject (department_id, semester_id, name, credit)
        VALUES (?, ?, ?, ?)
      `;
      const { resTime: t2 } = await runQuery(query, [
        department_id,
        semester_id,
        name,
        credit,
      ]);
      responseTime += t2;
    }

    const selectQuery = `
    SELECT
      Semester.semester_id,
      Semester.name AS semester_name,
      Semester.year,
      Semester.semester_number,
      Subject.subject_id,
      Subject.name AS subject_name,
      Subject.credit,
      Subject.department_id
    FROM Semester
    INNER JOIN Subject ON Semester.semester_id = Subject.semester_id
    WHERE Semester.semester_id = ? AND Subject.department_id = ?
    ORDER BY Semester.semester_id, Subject.subject_id;
  `;
    const { result, resTime: t3 } = await runQuery(selectQuery, [
      semester_id,
      department_id,
    ]);
    responseTime += t3;
    const semesterMap = new Map();
    result.forEach((row) => {
      const semesterKey = row.semester_id;
      if (!semesterMap.has(semesterKey)) {
        semesterMap.set(semesterKey, {
          semester_id: row.semester_id,
          semester_name: row.semester_name,
          year: row.year,
          semester_number: row.semester_number,
          department_id: row.department_id,
          subjects: [],
        });
      }

      semesterMap.get(semesterKey).subjects.push({
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        credit: row.credit,
      });
    });

    const updatedSemester = Array.from(semesterMap.values())[0];
    console.log(`Response time : ${responseTime} ms`);

    res.status(201).json({
      message: "Subject created successfully",
      semesterWithSubjects: updatedSemester,
    });
  } catch (error) {
    console.error("Error creating subjects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const getById = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
        SELECT * FROM Subject WHERE subject_id = ?
      `;
    const { result: subject, resTime } = await runQuery(query, [id]);

    if (subject.length === 0) {
      console.log(`Response time : ${resTime} ms`);
      return res.status(404).json({ error: "Subject not found" });
    }
    console.log(`Response time : ${resTime} ms`);
    res.status(200).json(subject[0]);
  } catch (error) {
    console.error("Error retrieving subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const updateSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, credit } = req.body;
  let responseTime = 0;
  try {
    const query = "SELECT * FROM Subject WHERE subject_id = ?";
    const { result: Subjects, resTime: t1 } = await runQuery(query, [id]);
    responseTime += t1;
    if (Subjects.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const updateQuery = `
        UPDATE Subject
        SET  name = ? ,credit = ?
        WHERE subject_id = ?
      `;
    const { resTime: t2 } = await runQuery(updateQuery, [name, credit, id]);
    responseTime += t2;
    console.log(`Response time : ${responseTime} ms`);

    res.status(200).json({ message: "Subject updated successfully" });
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const deleteSubjectsBySemester = catchAsync(async (req, res) => {
  const { semesterId, departmentId } = req.params;
  let responseTime = 0;
  try {
    const checkSemesterQuery = "SELECT * FROM Semester WHERE semester_id = ?";
    const { result: existingSemesters, resTime: t1 } = await runQuery(
      checkSemesterQuery,
      [semesterId]
    );
    responseTime += t1;
    if (existingSemesters.length === 0) {
      return res.status(404).json({ error: "Semester not found" });
    }

    const deleteSubjectQuery =
      "DELETE FROM Subject WHERE semester_id = ? AND department_id = ?";
    const { resTime: t2 } = await runQuery(deleteSubjectQuery, [
      semesterId,
      departmentId,
    ]);
    responseTime += t2;
    console.log(`Response time : ${responseTime} ms`);
    res
      .status(200)
      .json({ message: "All subjects for the semester deleted successfully" });
  } catch (error) {
    console.error("Error deleting subjects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const deleteSubjectById = catchAsync(async (req, res) => {
  const { subjectId } = req.params;

  try {
    const deleteSubjectQuery = "DELETE FROM Subject WHERE subject_id = ?";
    const { resTime } = await runQuery(deleteSubjectQuery, [subjectId]);

    if (result.affectedRows === 0) {
      console.log(`Response time : ${resTime} ms`);
      return res.status(404).json({ error: "Subject not found" });
    }
    console.log(`Response time : ${resTime} ms`);

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const addSingleSubject = catchAsync(async (req, res) => {
  const { department_id, semester_id, name, credit } = req.body;
  let responseTime = 0
  try {
    const insertQuery = `
      INSERT INTO Subject (department_id, semester_id, name, credit)
      VALUES (?, ?, ?, ?)
    `;
    const {result:insertResult ,resTime:t1} = await runQuery(insertQuery, [
      department_id,
      semester_id,
      name,
      credit,
    ]);
    responseTime +=t1
    const subject_id = insertResult.insertId;

    const selectQuery = `
      SELECT
        subject_id,
        department_id,
        semester_id,
        name as subject_name,
        credit
      FROM Subject
      WHERE subject_id = ?
    `;
    const {result:subject,resTime:t2} = await runQuery(selectQuery, [subject_id]);
    responseTime +=t2
    console.log(`Response time : ${responseTime} ms`);

    res
      .status(201)
      .json({ message: "Subject created successfully", subject: subject[0] });
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
