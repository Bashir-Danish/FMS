export const createSubject = async (req, res) => {
  const { user_id, department_id, name } = req.body;
  const conn = req.connect;

  try {
    const query = `
        INSERT INTO Subject (user_id, department_id, name)
        VALUES (?, ?, ?)
      `;
    await conn.query(query, [user_id, department_id, name]);

    res.status(201).json({ message: "Subject created successfully" });
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSubjects = async (req, res) => {
  const conn = req.connect;

  try {
    const query = `
        SELECT * FROM Subject
      `;
    const [subjects] = await conn.query(query);

    res.status(200).json(subjects);
  } catch (error) {
    console.error("Error retrieving subjects:", error);
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
  const { user_id, department_id, name } = req.body;
  const conn = req.connect;

  try {
    const query = "SELECT * FROM Subject WHERE subject_id = ?";
    const [Subjects] = await conn.query(query, [id]);

    if (Subjects.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const updateQuery = `
        UPDATE Subject
        SET user_id = ?, department_id = ?, name = ?
        WHERE subject_id = ?
      `;
    await conn.query(updateQuery, [user_id, department_id, name, id]);

    res.status(200).json({ message: "Subject updated successfully" });
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSubject = async (req, res) => {
  const { id } = req.params;
  const conn = req.connect;

  try {
    const checkQuery = "SELECT * FROM Subject WHERE subject_id = ?";
    const [existingSubjects] = await conn.query(checkQuery, [id]);

    if (existingSubjects.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    const deleteQuery = "DELETE FROM Subject WHERE subject_id = ?";
    await conn.query(deleteQuery, [id]);

    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
