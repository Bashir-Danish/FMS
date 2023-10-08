export const getDepartments = async (req, res) => {
  
  try {
    const conn = req.connect;
    const query = "SELECT * FROM Department";
    const [rows] = await conn.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error retrieving departments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const createDepartment = async (req, res) => {
  const { name } = req.body;
  
  try {
    const conn = req.connect;
    const checkQuery = "SELECT * FROM Department WHERE name = ?";
    const [departments] = await conn.query(checkQuery, [name]);

    if (departments.length > 0) {
      return res.status(400).json({ error: "Department with this name already exists" });
    }
    
    const insertQuery = "INSERT INTO Department (name) VALUES (?)";
    const [result] = await conn.query(insertQuery, [name]);
    const departmentId = result.insertId;

    res.status(201).json({ departmentId, message: "Department created successfully" });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  try {
    const conn = req.connect;
    const query = "UPDATE Department SET name = ? WHERE department_id = ?";
    await conn.query(query, [name, id]);
    res.status(200).json({ message: "Department updated successfully" });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    const conn = req.connect;
    const checkQuery = "SELECT * FROM Department WHERE department_id = ?";
    const [departments] = await conn.query(checkQuery, [id]);

    if (departments.length == 0) {
      return res.status(400).json({ error: "Department doesn't exists" });
    }
    const query = "DELETE FROM Department WHERE department_id = ?";
    await conn.query(query, [id]);
    return res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
