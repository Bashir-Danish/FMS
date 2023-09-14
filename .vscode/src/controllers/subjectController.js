
export const getSubjects = async (req, res) => {
  const conn = req.connect;

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
    const [results] = await conn.query(query);
    const semestersMap = new Map();
    results.forEach((row) => {
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

    console.log(semestersWithSubjects);
    res.status(200).json({ subjects: semestersWithSubjects });
  } catch (error) {
    console.error(
      "Error retrieving subjects by semester and department:",
      error
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createSubject = async (req, res) => {
  const { department_id, semester_id, subjects } = req.body;
  const conn = req.connect;

  try {
    const checkExistingSubjectsQuery = `
      SELECT * FROM Subject
      WHERE department_id = ? AND semester_id = ?
    `;
    const [existingSubjects] = await conn.query(checkExistingSubjectsQuery, [
      department_id,
      semester_id,
    ]);

    if (existingSubjects.length > 0) {
      return res
        .status(400)
        .json({
          error: "Subjects with the same department and semester already exist",
        });
    }
    for (const [name, credit] of subjects) {
      const query = `
        INSERT INTO Subject (department_id, semester_id, name, credit)
        VALUES (?, ?, ?, ?)
      `;
      await conn.query(query, [department_id, semester_id, name, credit]);
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
    const [results] = await conn.query(selectQuery, [
      semester_id,
      department_id,
    ]);
    const semesterMap = new Map();
    results.forEach((row) => {
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

    console.log(updatedSemester);
    res.status(201).json({
      message: "Subject created successfully",
      semesterWithSubjects: updatedSemester,
    });
  } catch (error) {
    console.error("Error creating subjects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getById = async (req, res) => {
  const { id } = req.params;
  const conn = req.connect;

  try {
    const query = `
        SELECT * FROM Subject WHERE subject_id = ?
      `;
    const [subject] = await conn.query(query, [id]);

    if (subject.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.status(200).json(subject[0]);
  } catch (error) {
    console.error("Error retrieving subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateSubject = async (req, res) => {
  const { id } = req.params;
  const { name ,credit} = req.body;
  const conn = req.connect;

  try {
    const query = "SELECT * FROM Subject WHERE subject_id = ?";
    const [Subjects] = await conn.query(query, [id]);

    if (Subjects.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const updateQuery = `
        UPDATE Subject
        SET  name = ? ,credit = ?
        WHERE subject_id = ?
      `;
    await conn.query(updateQuery, [  name, credit, id]);

    res.status(200).json({ message: "Subject updated successfully" });
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSubjectsBySemester = async (req, res) => {
  const { semesterId, departmentId } = req.params;
  const conn = req.connect;

  try {
    const checkSemesterQuery = "SELECT * FROM Semester WHERE semester_id = ?";
    const [existingSemesters] = await conn.query(checkSemesterQuery, [
      semesterId,
    ]);

    if (existingSemesters.length === 0) {
      return res.status(404).json({ error: "Semester not found" });
    }

    const deleteSubjectQuery =
      "DELETE FROM Subject WHERE semester_id = ? AND department_id = ?";
    await conn.query(deleteSubjectQuery, [semesterId, departmentId]);

    res
      .status(200)
      .json({ message: "All subjects for the semester deleted successfully" });
  } catch (error) {
    console.error("Error deleting subjects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSubjectById = async (req, res) => {
  const { subjectId } = req.params;
  const conn = req.connect;

  try {
    const deleteSubjectQuery = "DELETE FROM Subject WHERE subject_id = ?";
    const [result] = await conn.query(deleteSubjectQuery, [subjectId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const addSingleSubject = async (req, res) => {
  const { department_id, semester_id, name, credit } = req.body;
  const conn = req.connect;

  try {
    const insertQuery = `
      INSERT INTO Subject (department_id, semester_id, name, credit)
      VALUES (?, ?, ?, ?)
    `;
    const [insertResult] = await conn.query(insertQuery, [
      department_id,
      semester_id,
      name,
      credit,
    ]);

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
    const [subject] = await conn.query(selectQuery, [subject_id]);
  
    res.status(201).json({ message: "Subject created successfully", subject:subject[0] });
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
