export const getStudents = async (req, res) => {
  const conn = req.connect;

  try {
    const query = `
        SELECT * FROM Student
      `;
    const [students] = await conn.query(query);

    res.status(200).json(students);
  } catch (error) {
    console.error("Error retrieving students:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createStudent = async (req, res) => {
  const { name, fname, ssid, department_id } = req.body;
  const conn = req.connect;

  try {
    const checkQuery = "SELECT * FROM Student WHERE ssid = ?";
    const [students] = await conn.query(checkQuery, [ssid]);

    if (students.length > 0) {
      return res
        .status(400)
        .json({ error: "Student with this ssid already exists" });
    }else{
      const insertQuery = `
          INSERT INTO Student (name, fname, ssid, department_id)
          VALUES (?, ?, ?, ?)
        `;
      await conn.query(insertQuery, [name, fname, ssid, department_id]);
  
      res.status(201).json({ message: "Student created successfully" });
    }

  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStudentById = async (req, res) => {
  const { id } = req.params;
  const conn = req.connect;

  try {
    const query = `
      SELECT * FROM Student WHERE student_id = ?
    `;
    const [students] = await conn.query(query, [id]);

    if (students.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.status(200).json(students[0]);
  } catch (error) {
    console.error("Error retrieving student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, fname, ssid, department_id } = req.body;
  const conn = req.connect;

  try {
    const query = `
      UPDATE Student
      SET name = ?, fname = ?, ssid = ?, department_id = ?
      WHERE student_id = ?
    `;
    await conn.query(query, [name, fname, ssid, department_id, id]);

    res.status(200).json({ message: "Student updated successfully" });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteStudent = async (req, res) => {
  const { id } = req.params;
  const conn = req.connect;

  try {
    const query = `
      DELETE FROM Student WHERE student_id = ?
    `;
    await conn.query(query, [id]);

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
