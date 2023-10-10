import { catchAsync } from "../middlewares.js";
import { runQuery } from "../utils/query.js";

export const getDepartments = catchAsync(async (req, res) => {
  try {
    const query = "SELECT * FROM Department";
    const { result: rows, resTime } = await runQuery(query);
    console.log(`Response time : ${resTime} ms`);
    res.json(rows);
  } catch (error) {
    console.error("Error retrieving departments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const createDepartment = catchAsync(async (req, res) => {
  const { name } = req.body;
  let responseTime = 0;
  try {
    const checkQuery = "SELECT * FROM Department WHERE name = ?";
    const { result: departments, resTime: t1 } = await runQuery(checkQuery, [
      name,
    ]);
    responseTime += t1;
    if (departments.length > 0) {
      console.log(`Response time : ${responseTime} ms`);
      return res
        .status(400)
        .json({ error: "Department with this name already exists" });
    }

    const insertQuery = "INSERT INTO Department (name) VALUES (?)";
    const { result, resTime: t2 } = await runQuery(insertQuery, [name]);
    responseTime += t2;

    const departmentId = result.insertId;
    console.log(`Response time : ${responseTime} ms`);
    res
      .status(201)
      .json({ departmentId, message: "Department created successfully" });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const updateDepartment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const query = "UPDATE Department SET name = ? WHERE department_id = ?";
    const { resTime } = await runQuery(query, [name, id]);

    console.log(`Response time : ${resTime} ms`);
    res.status(200).json({ message: "Department updated successfully" });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const deleteDepartment = catchAsync(async (req, res) => {
  const { id } = req.params;
  let responseTime = 0;
  try {
    const checkQuery = "SELECT * FROM Department WHERE department_id = ?";
    const { result: departments, resTime: t1 } = await runQuery(checkQuery, [
      id,
    ]);
    responseTime += t1;

    if (departments.length == 0) {
      return res.status(400).json({ error: "Department doesn't exists" });
    }
    const query = "DELETE FROM Department WHERE department_id = ?";
    const { result, resTime: t2 } = await runQuery(query, [id]);
    responseTime += t2;

    console.log(`Response time : ${responseTime} ms`);
    return res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
