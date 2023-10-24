import { catchAsync } from "../middlewares.js";
import { runQuery } from "../utils/query.js";


export const getHomePageReports = async (req, res) => {
  try {
    // Total Student Count
    const totalStudentsQuery = `
      SELECT COUNT(*) AS total_students
      FROM Student;
    `;

    // Number of Graduated Students
    const graduatedStudentsQuery = `
      SELECT COUNT(*) AS graduated_students
      FROM Student
      WHERE graduated = 1;
    `;

    // Number of Ungraduated Students
    const ungraduatedStudentsQuery = `
      SELECT COUNT(*) AS ungraduated_students
      FROM Student
      WHERE graduated = 0;
    `;

    // Number of Students by Department
    const studentsByDepartmentQuery = `
      SELECT d.name AS department_name, COUNT(*) AS department_students
      FROM Student s
      JOIN Department d ON s.department_id = d.department_id
      GROUP BY department_name;
    `;

    // Count of Users
    const totalUsersQuery = `
      SELECT COUNT(*) AS total_users
      FROM User;
    `;

    // Count of Semesters
    const totalSemestersQuery = `
      SELECT COUNT(*) AS total_semesters
      FROM Semester;
    `;
    const totalDepartmentQuery = `
      SELECT COUNT(*) AS total_Department
      FROM Department;
    `;
    const unPassedSemestersQuery = `
      SELECT COUNT(*) AS unpassed_semesters
      FROM Semester
      WHERE is_passed = 0;
    `;

    const { result: totalStudents, resTime: t1 } = await runQuery(totalStudentsQuery);
    const { result: graduatedStudents, resTime: t2 } = await runQuery(graduatedStudentsQuery)
    const { result: unraduatedStudents, resTime: t3 } = await runQuery(ungraduatedStudentsQuery);
    const { result: studentsByDepartment, resTime: t4 } = await runQuery(studentsByDepartmentQuery);
    const { result: totalUsers, resTime: t5 } = await runQuery(totalUsersQuery);
    const { result: totalSemesters, resTime: t6 } = await runQuery(totalSemestersQuery);
    const { result: totalDepartment, resTime: t7 } = await runQuery(totalDepartmentQuery);
    const { result: unPassedSemesters, resTime: t8 } = await runQuery(unPassedSemestersQuery)
    const response = {
      total_students: totalStudents[0].total_students,
      graduated_students: graduatedStudents[0].graduated_students,
      ungraduated_students: unraduatedStudents[0].ungraduated_students,
      students_by_department: studentsByDepartment,
      total_users: totalUsers[0].total_users,
      total_semesters: totalSemesters[0].total_semesters,
      total_Department: totalDepartment[0].total_Department,
      unPassedSemesters: unPassedSemesters[0].unpassed_semesters
    };
    res.status(200).json(response);



    // }
    // [{ total_students: 1696 }]
    // [{ graduated_students: 1332 }]
    // [{ ungraduated_students: 364 }]
    // [
    //   { department_name: 'دیتابیس', department_students: 567 },
    //   { department_name: 'سافت', department_students: 566 },
    //   { department_name: 'نتورک', department_students: 563 }
    // ]
    // [{ total_users: 1 }]
    // [{ total_semesters: 108 }]


  } catch (error) {
    console.error("Error retrieving data for home page reports:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


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
