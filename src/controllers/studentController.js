import path from "path";
import fs from "fs";

export const getStudents = async (req, res) => {
  const conn = req.connect;
  try {
    const query = `
        SELECT * FROM Student
      `;
    const [students] = await conn.query(query);

    res.status(200).json({ students: students });
  } catch (error) {
    console.error("Error retrieving students:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
function generateUniqueFilename() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 100000000);

  return `image_${timestamp}_${random}`;
}
export const createStudent = async (req, res) => {
  const { name, fname, ssid, department_id } = req.body;
  const conn = req.connect;
  let uploadPath;
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send({ error: "فایل آپلود نشد" });
    }
    const file = req.files.file;
    const uniqueFilename = generateUniqueFilename();

    let ext = file.name.split(".").filter(Boolean).slice(1).join(".");
    let filePath = path.resolve(
      path.dirname("") + `/src/uploads/student/${uniqueFilename}` + "." + ext
    );
    file.mv(filePath, function (err) {
      if (err) return res.status(500).send(err);
    });
    uploadPath = `/uploads/student/${uniqueFilename}` + "." + ext;
  } catch (error) {
    console.log(error);
  }
  try {
    const checkQuery = `
      SELECT * FROM Student WHERE ssid = ?
    `;
    const [students] = await conn.query(checkQuery, [ssid]);

    if (students.length > 0) {
      console.log(ssid);
      return res
        .status(400)
        .json({ error: "محصل با این ایدی از قبل وجود دارد" });
    } else {
      let student_id;
      let insertQuery = `
        INSERT INTO Student ( name, fname, ssid, department_id,picture)
        VALUES (?, ?, ?, ?,?)
      `;
      const [result] = await conn.query(insertQuery, [
        name,
        fname,
        ssid,
        department_id,
        uploadPath,
      ]);

      student_id = result.insertId;

      const selectQuery = `
        SELECT student_id, name, fname, ssid, department_id,picture,current_semester FROM Student WHERE student_id = ?
      `;
      const [studentData] = await conn.query(selectQuery, [student_id]);
      const student = studentData[0];

      res.status(201).json({ student, message: "محصل موفقانه اضافه شد" });
    }
  } catch (error) {
    console.error("Error creating user:", error);
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
  console.log(req.body);
  const conn = req.connect;
  let newFilePath = null;

  try {
    const getStudentQuery = `
      SELECT * FROM Student
      WHERE student_id = ?
    `;

    const [studentRows] = await conn.query(getStudentQuery, [id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentRows[0];

    if (req.files && req.files.file) {
      const file = req.files.file;
      const ext = file.name.split(".").pop();

      const oldFilePath = path.resolve(
        path.dirname("") + "/src/" + student.picture
      );

      try {
        await fs.promises.unlink(oldFilePath);
      } catch (error) {
        console.error("Error deleting previous user image:", error);
      }

      const uniqueFilename = generateUniqueFilename();
      newFilePath = `/uploads/student/${uniqueFilename}` + "." + ext;
      const filePath = path.resolve(path.dirname("") + "/src" + newFilePath);

      try {
        file.mv(filePath, function (err) {
          if (err) {
            console.error("Error updating student profile picture:", err);
          }
        });
      } catch (error) {
        console.error("Error updating student profile picture:", error);
      }
    }

    fname, ssid, department_id;

    const updatedFields = {
      name: name !== undefined ? name : student.name,
      fname: fname !== undefined ? fname : student.fname,
      ssid: ssid !== undefined ? ssid : student.ssid,
      department_id:
        !isNaN(parseFloat(department_id)) !== undefined
          ? parseFloat(department_id)
          : student.department_id,
      picture: newFilePath !== null ? newFilePath : student.picture,
      current_semester: student.current_semester,
    };

    const updateQuery = `
      UPDATE Student
      SET name = ?, fname = ?, ssid = ?,  department_id = ? ,picture = ?
      WHERE student_id = ?
    `;
    await conn.query(updateQuery, [
      updatedFields.name,
      updatedFields.fname,
      updatedFields.ssid,
      updatedFields.department_id,
      updatedFields.picture,
      id,
    ]);

    res
      .status(200)
      .json({ student: updatedFields, message: "محصل موفقانه ویرایش شد" });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteStudent = async (req, res) => {
  const { id } = req.params;
  const conn = req.connect;

  try {
    const getStudentQuery = `
      SELECT * FROM Student WHERE student_id = ?
    `;
    const [students] = await conn.query(getStudentQuery, [id]);

    if (students.length === 0) {
      return res.status(400).json({ error: "کاربر یافت نشد" });
    }

    const student = students[0];

    const deleteQuery = `
      DELETE FROM Student WHERE student_id = ?
    `;

    await conn.query(deleteQuery, [id]);

    if (student.picture) {
      const filePath = path.resolve(
        path.dirname("") + "/src" + student.picture
      );

      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
        } catch (error) {
          console.error("Error unlinking student image:", error);
        }
      } else {
        console.log("File not found:", filePath);
      }
    }

    res.status(200).json({ message: "کاربر موفانه حذف شد" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
