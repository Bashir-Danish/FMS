import path from "path";
import fs from "fs";
import { catchAsync } from "../middlewares.js";
import { runQuery } from "../utils/query.js";
import { getConnectionPool } from "../configs/connection.js";

export const getStudents = catchAsync(async (req, res) => {
  const { departmentId, year } = req.query;
  try {
    const query = `
    SELECT * FROM Student
    WHERE department_id = ? AND year = ?
  `;
    const { result: students, resTime } = await runQuery(query, [
      departmentId,
      year,
    ]);
    // const yearsQuery = `
    //   SELECT DISTINCT year FROM Student
    // `;
    // const [yearsResult] = await await runQuery(yearsQuery);
    // console.log(yearsResult);
    console.log(`Response time : ${resTime} ms`);
    res.status(200).json({ students: students });
  } catch (error) {
    console.error("Error retrieving students:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
export const getYears = catchAsync(async (req, res) => {
  try {
    const yearsQuery = `
      SELECT DISTINCT year FROM Student
    `;
    const { result: yearsResult, resTime } = await runQuery(yearsQuery);

    console.log(`Response time : ${resTime} ms`);
    res.status(200).json({ years: yearsResult });
  } catch (error) {
    console.error("Error retrieving years:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
function generateUniqueFilename() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 100000000);

  return `image_${timestamp}_${random}`;
}
export const createStudent = async (req, res) => {
  const {
    name,
    fname,
    ssid,
    department_id,
    current_semester,
    imagePath,
    year,
  } = req.body;
  // console.log(req.body);

  let responseTime = 0;
  try {
    const checkQuery = `
      SELECT * FROM Student WHERE ssid = ?
    `;
    const { result: students, resTime: t1 } = await runQuery(checkQuery, [
      ssid,
    ]);
    responseTime += t1;
    if (students.length > 0) {
      return res
        .status(400)
        .json({ error: "محصل با این ایدی از قبل وجود دارد" });
    } else {
      let student_id;
      let insertQuery;
      const queryValues = [
        name,
        fname,
        ssid,
        department_id,
        imagePath,
        parseFloat(year),
      ];

      if (parseFloat(current_semester) !== 0) {
        insertQuery = `
          INSERT INTO Student (name, fname, ssid, department_id, current_semester, picture,year)
          VALUES (?, ?, ?, ?, ?, ?,?)
        `;
        queryValues.splice(4, 0, parseFloat(current_semester));
      } else {
        insertQuery = `
          INSERT INTO Student (name, fname, ssid, department_id, picture,year)
          VALUES (?, ?, ?, ?, ?,?)
        `;
      }

      const { result, resTime: t2 } = await runQuery(insertQuery, queryValues);
      student_id = result.insertId;
      responseTime += t2;

      const selectQuery = `
        SELECT * FROM Student WHERE student_id = ?
      `;
      const { result: studentData, resTime: t3 } = await runQuery(selectQuery, [
        student_id,
      ]);
      const student = studentData[0];
      responseTime += t3;

      // console.log(student);
      console.log(`Response time : ${responseTime} ms`);
      res.status(201).json({ student, message: "محصل موفقانه اضافه شد" });
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStudentById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT * FROM Student WHERE student_id = ?
    `;
    const { result: students, resTime } = await runQuery(query, [id]);

    if (students.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    console.log(`Response time : ${resTime} ms`);

    res.status(200).json(students[0]);
  } catch (error) {
    console.error("Error retrieving student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, fname, ssid, department_id, current_semester, imagePath } =
    req.body;
  let responseTime = 0;

  try {
    const getStudentQuery = `
      SELECT * FROM Student
      WHERE student_id = ?
    `;

    const { result: studentRows, resTime: t1 } = await runQuery(
      getStudentQuery,
      [id]
    );
    responseTime += t1;
    if (studentRows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentRows[0];

    // if (req.files && req.files.file) {
    //   const file = req.files.file;
    //   const ext = file.name.split(".").pop();
    //   const oldFilePath = path.resolve(
    //     path.dirname("") + "/src/" + student.picture
    //   );
    //   try {
    //     await fs.promises.unlink(oldFilePath);
    //   } catch (error) {
    //     console.error("Error deleting previous user image:", error);
    //   }
    //   const uniqueFilename = generateUniqueFilename();
    //   newFilePath = `/uploads/student/${uniqueFilename}` + "." + ext;
    //   const filePath = path.resolve(path.dirname("") + "/src" + newFilePath);
    //   try {
    //     file.mv(filePath, function (err) {
    //       if (err) {
    //         console.error("Error updating student profile picture:", err);
    //       }
    //     });
    //   } catch (error) {
    //     console.error("Error updating student profile picture:", error);
    //   }
    // }

    fname, ssid, department_id;

    const updatedFields = {
      name: name ?? student.name,
      fname: fname ?? student.fname,
      ssid: ssid ?? student.ssid,
      department_id:
        !isNaN(parseFloat(department_id)) !== undefined
          ? parseFloat(department_id)
          : student.department_id,
      picture: imagePath !== null ? imagePath : student.picture,
      current_semester:
        !isNaN(parseFloat(current_semester)) !== undefined
          ? parseFloat(current_semester)
          : student.current_semester,
    };

    const updateQuery = `
      UPDATE Student
      SET name = ?, fname = ?, ssid = ?,  department_id = ? ,picture = ? ,current_semester =?
      WHERE student_id = ?
    `;
    const { resTime: t2 } = await runQuery(updateQuery, [
      updatedFields.name,
      updatedFields.fname,
      updatedFields.ssid,
      updatedFields.department_id,
      updatedFields.picture,
      updatedFields.current_semester,
      id,
    ]);
    responseTime += t2;
    console.log(`Response time : ${responseTime} ms`);
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
  let responseTime = 0;
  try {
    const getStudentQuery = `
      SELECT * FROM Student WHERE student_id = ?
    `;
    const { result: students, resTime: t1 } = await runQuery(getStudentQuery, [
      id,
    ]);
    responseTime += t1;
    if (students.length === 0) {
      return res.status(400).json({ error: "کاربر یافت نشد" });
    }

    const student = students[0];

    const deleteQuery = `
      DELETE FROM Student WHERE student_id = ?
    `;

    const { resTime: t2 } = await runQuery(deleteQuery, [id]);
    responseTime += t2;

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
    console.log(`Response time : ${responseTime} ms`);

    res.status(200).json({ message: "کاربر موفانه حذف شد" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

let names_array = [
  "امیر",
  "محمد",
  "علی",
  "حسین",
  "مهدی",
  "سعید",
  "سامان",
  "محمود",
  "رضا",
  "صادق",
  "امید",
  "فرهاد",
  "کیان",
  "مهراد",
  "سیامک",
  "بهروز",
  "یوسف",
  "فریدون",
  "شاهین",
  "عباس",
  "رامین",
  "بابک",
  "پویا",
  "رامتین",
  "میلاد",
  "علیرضا",
  "امین",
  "کاوه",
  "کامران",
  "شهروز",
  "بهزاد",
  "مازیار",
  "علی‌اکبر",
  "ناصر",
  "بهمن",
  "مهران",
  "ماهان",
  "سجاد",
  "سعادت",
  "محسن",
  "احسان",
  "مهدیار",
  "سروش",
  "مرتضی",
  "محمدرضا",
  "نوید",
  "امیرحسین",
  "آرش",
  "سید",
  "نیما",
  "علی‌اصغر",
  "محمدعلی",
  "مصطفی",
  "عماد",
  "علی‌رضا",
  "رضوان",
  "علی‌رضا",
  "وحید",
  "جواد",
  "محمدحسین",
  "میثم",
  "کمال",
  "جمشید",
  "احمد",
  "فرزاد",
  "مهرزاد",
  "سام",
  "محمدجواد",
  "رضا",
  "حمید",
  "مهدی",
  "حسن",
  "قاسم",
  "محمدصادق",
  "جعفر",
  "حمزه",
  "عبدالله",
  "رحیم",
  "عباسعلی",
  "محمدصالح",
  "ابراهیم",
  "حسینعلی",
  "علیرضا",
  "محمدرضا",
  "علی‌محمد",
  "محمدعباس",
  "رضاحسین",
  "سعیدمحمد",
  "حسن",
  "حسین",
  "محمد",
  "علی",
  "حمید",
  "مهدی",
  "رضا",
  "صادق",
  "امیر",
  "فرهاد",
  "کیان",
  "مهراد",
  "سیامک",
  "بهروز",
  "یوسف",
  "فریدون",
  "شاهین",
  "عباس",
  "رامین",
  "بابک",
  "پویا",
  "رامتین",
  "میلاد",
  "علیرضا",
  "امین",
  "کاوه",
  "کامران",
  "شهروز",
  "بهزاد",
  "مازیار",
  "علی‌اکبر",
  "ناصر",
  "بهمن",
  "مهران",
  "ماهان",
  "سجاد",
  "سعادت",
  "محسن",
  "احسان",
  "مهدیار",
  "سروش",
  "مرتضی",
  "محمدرضا",
  "نوید",
  "امیرحسین",
  "آرش",
  "سید",
  "علی‌اصغر",
  "محمدعلی",
  "مصطفی",
  "عماد",
  "علی‌رضا",
  "رضوان",
  "علی‌رضا",
  "وحید",
  "جواد",
  "محمدحسین",
  "میثم",
  "کمال",
  "جمشید",
  "احمد",
  "فرزاد",
  "مهرزاد",
  "سام",
  "محمدجواد",
  "رضا",
  "حمید",
  "مهدی",
  "حسن",
  "قاسم",
  "محمدصادق",
  "جعفر",
  "حمزه",
  "عبدالله",
  "رحیم",
  "عباسعلی",
  "محمدصالح",
  "ابراهیم",
  "حسینعلی",
  "علیرضا",
  "محمدرضا",
  "علی‌محمد",
  "محمدعباس",
  "رضاحسین",
  "سعیدمحمد",
];
let father_names = [
  "محمدرضا",
  "علی‌اکبر",
  "حسن",
  "قاسم",
  "جواد",
  "کریم",
  "حسینعلی",
  "احمد",
  "محمد",
  "حمید",
  "نورمحمد",
  "رضا",
  "امیرحسین",
  "محمدجواد",
  "عبدالله",
  "اکبر",
  "محسن",
  "محمدعلی",
  "اسماعیل",
  "محمود",
  "محمدحسین",
  "مصطفی",
  "رحیم",
  "محمدرضوان",
  "قاسمعلی",
  "ابراهیم",
  "جعفر",
  "محمدصادق",
  "ابراهیمعلی",
  "علیرضا",
  "محمد کیان",
  "محمدصالح",
  "احمدعلی",
  "حسنعلی",
  "عباسعلی",
  "شریف",
  "حمزه",
  "عبدالحمید",
  "ابراهیمحسین",
  "جوادعلی",
  "احمدحسین",
  "محمدحسن",
  "ابراهیمرضا",
  "حسینرضا",
  "محمدباقر",
  "علی‌محمد",
  "محمدعباس",
  "رضاحسین",
  "سعیدمحمد",
  "حسن",
  "حسین",
  "محمد",
  "علی",
  "حمید",
  "مهدی",
  "رضا",
  "صادق",
  "امیر",
  "فرهاد",
  "کیان",
  "مهراد",
  "سیامک",
  "بهروز",
  "یوسف",
  "فریدون",
  "شاهین",
  "عباس",
  "رامین",
  "بابک",
  "پویا",
  "رامتین",
  "میلاد",
  "علیرضا",
  "امین",
  "کاوه",
  "کامران",
  "شهروز",
  "بهزاد",
  "مازیار",
  "علی‌اکبر",
  "ناصر",
  "بهمن",
];

export const seedStudent = async (req, res) => {
  const { ssid, yearNum } = req.params;
  const departmentIds = [1, 2, 3];
  let year = yearNum;

  const conn = req.connect;
  // year += 1;
  let startingSsid = ssid;

  const folderPath = "./src/uploads/images";
  const sourceImageFolder = path.resolve(folderPath);
  const imageFiles = fs.readdirSync(sourceImageFolder);

  for (const departmentId of departmentIds) {
    const students = [];
    const numberOfStudents = Math.floor(Math.random() * (41 - 35) + 35);

    const usedNames = new Set();

    for (let i = 0; i < numberOfStudents; i++) {
      let name;
      do {
        name = names_array[Math.floor(Math.random() * names_array.length)];
      } while (usedNames.has(name));

      let fname;
      do {
        fname = father_names[Math.floor(Math.random() * father_names.length)];
      } while (usedNames.has(fname));

      usedNames.add(name);
      usedNames.add(fname);

      const ssid = startingSsid++;

      const randomImage =
        imageFiles[Math.floor(Math.random() * imageFiles.length)];
      const imagePath = `/uploads/students/${ssid}.jpg`;

      const sourceImagePath = path.join(sourceImageFolder, randomImage);
      const targetImagePath = path.join(
        path.dirname(""),
        `./src/uploads/students/${ssid}.jpg`
      );
      fs.copyFileSync(sourceImagePath, targetImagePath);

      const picture = imagePath;
      const currentSemester = 1;

      const student = [
        name,
        fname,
        ssid,
        departmentId,
        currentSemester,
        picture,
        year,
      ];
      students.push(student);
    }

    const insertQuery = `
      INSERT INTO Student (name, fname, ssid, department_id, current_semester, picture, year)
      VALUES ?;
    `;

    const valuesToInsert = students.map((student) => [
      student[0],
      student[1],
      student[2],
      student[3],
      student[4],
      student[5],
      student[6],
    ]);

    try {
      // await runQuery(insertQuery, [valuesToInsert]);
      await conn.query(insertQuery, [valuesToInsert]);
      console.log(
        `Inserted ${numberOfStudents} students into Department ${departmentId}`
      );
    } catch (error) {
      console.error(
        `Error inserting students into Department ${departmentId}:`,
        error
      );
    }
  }
};

// import path from "path";
// import fs from "fs";

// export const getStudents = async (req, res) => {
//   const conn = req.connect;
//   const { departmentId, year } = req.query;
//   try {
//     const query = `
//     SELECT * FROM Student
//     WHERE department_id = ? AND year = ?
//   `;
//   const [students] = await conn.query(query, [departmentId, year]);
//     // const yearsQuery = `
//     //   SELECT DISTINCT year FROM Student
//     // `;
//     // const [yearsResult] = await await conn.query(yearsQuery);
//     // console.log(yearsResult);
//     res.status(200).json({ students: students });
//   } catch (error) {
//     console.error("Error retrieving students:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
// export const getYears = async (req, res) => {
//   const conn = req.connect;
//   try {
//     const yearsQuery = `
//       SELECT DISTINCT year FROM Student
//     `;
//     const [yearsResult] = await await conn.query(yearsQuery);

//     res.status(200).json({ years: yearsResult });
//   } catch (error) {
//     console.error("Error retrieving years:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
// function generateUniqueFilename() {
//   const timestamp = new Date().getTime();
//   const random = Math.floor(Math.random() * 100000000);

//   return `image_${timestamp}_${random}`;
// }
// export const createStudent = async (req, res) => {
//   const {
//     name,
//     fname,
//     ssid,
//     department_id,
//     current_semester,
//     imagePath,
//     year,
//   } = req.body;
//   console.log(req.body);
//   const conn = req.connect;

//   try {
//     const checkQuery = `
//       SELECT * FROM Student WHERE ssid = ?
//     `;
//     const [students] = await conn.query(checkQuery, [ssid]);

//     if (students.length > 0) {
//       return res
//         .status(400)
//         .json({ error: "محصل با این ایدی از قبل وجود دارد" });
//     } else {
//       let student_id;
//       let insertQuery;
//       const queryValues = [
//         name,
//         fname,
//         ssid,
//         department_id,
//         imagePath,
//         parseFloat(year),
//       ];

//       if (parseFloat(current_semester) !== 0) {
//         insertQuery = `
//           INSERT INTO Student (name, fname, ssid, department_id, current_semester, picture,year)
//           VALUES (?, ?, ?, ?, ?, ?,?)
//         `;
//         queryValues.splice(4, 0, parseFloat(current_semester));
//       } else {
//         insertQuery = `
//           INSERT INTO Student (name, fname, ssid, department_id, picture,year)
//           VALUES (?, ?, ?, ?, ?,?)
//         `;
//       }

//       const [result] = await conn.query(insertQuery, queryValues);
//       student_id = result.insertId;

//       const selectQuery = `
//         SELECT * FROM Student WHERE student_id = ?
//       `;
//       const [studentData] = await conn.query(selectQuery, [student_id]);
//       const student = studentData[0];

//       console.log(student);

//       res.status(201).json({ student, message: "محصل موفقانه اضافه شد" });
//     }
//   } catch (error) {
//     console.error("Error creating user:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const getStudentById = async (req, res) => {
//   const { id } = req.params;
//   const conn = req.connect;

//   try {
//     const query = `
//       SELECT * FROM Student WHERE student_id = ?
//     `;
//     const [students] = await conn.query(query, [id]);

//     if (students.length === 0) {
//       return res.status(404).json({ error: "Student not found" });
//     }

//     res.status(200).json(students[0]);
//   } catch (error) {
//     console.error("Error retrieving student:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const updateStudent = async (req, res) => {
//   const { id } = req.params;
//   const { name, fname, ssid, department_id, current_semester, imagePath } =
//     req.body;
//   try {
//     const conn = req.connect;
//     const getStudentQuery = `
//       SELECT * FROM Student
//       WHERE student_id = ?
//     `;

//     const [studentRows] = await conn.query(getStudentQuery, [id]);
//     if (studentRows.length === 0) {
//       return res.status(404).json({ error: "Student not found" });
//     }

//     const student = studentRows[0];

//     // if (req.files && req.files.file) {
//     //   const file = req.files.file;
//     //   const ext = file.name.split(".").pop();

//     //   const oldFilePath = path.resolve(
//     //     path.dirname("") + "/src/" + student.picture
//     //   );

//     //   try {
//     //     await fs.promises.unlink(oldFilePath);
//     //   } catch (error) {
//     //     console.error("Error deleting previous user image:", error);
//     //   }

//     //   const uniqueFilename = generateUniqueFilename();
//     //   newFilePath = `/uploads/student/${uniqueFilename}` + "." + ext;
//     //   const filePath = path.resolve(path.dirname("") + "/src" + newFilePath);

//     //   try {
//     //     file.mv(filePath, function (err) {
//     //       if (err) {
//     //         console.error("Error updating student profile picture:", err);
//     //       }
//     //     });
//     //   } catch (error) {
//     //     console.error("Error updating student profile picture:", error);
//     //   }
//     // }

//     fname, ssid, department_id;

//     const updatedFields = {
//       name: name ?? student.name,
//       fname: fname ?? student.fname,
//       ssid: ssid ?? student.ssid,
//       department_id:
//         !isNaN(parseFloat(department_id)) !== undefined
//           ? parseFloat(department_id)
//           : student.department_id,
//       picture: imagePath !== null ? imagePath : student.picture,
//       current_semester:
//         !isNaN(parseFloat(current_semester)) !== undefined
//           ? parseFloat(current_semester)
//           : student.current_semester,
//     };

//     const updateQuery = `
//       UPDATE Student
//       SET name = ?, fname = ?, ssid = ?,  department_id = ? ,picture = ? ,current_semester =?
//       WHERE student_id = ?
//     `;
//     await conn.query(updateQuery, [
//       updatedFields.name,
//       updatedFields.fname,
//       updatedFields.ssid,
//       updatedFields.department_id,
//       updatedFields.picture,
//       updatedFields.current_semester,
//       id,
//     ]);

//     res
//       .status(200)
//       .json({ student: updatedFields, message: "محصل موفقانه ویرایش شد" });
//   } catch (error) {
//     console.error("Error updating student:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const deleteStudent = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const conn = req.connect;
//     const getStudentQuery = `
//       SELECT * FROM Student WHERE student_id = ?
//     `;
//     const [students] = await conn.query(getStudentQuery, [id]);

//     if (students.length === 0) {
//       return res.status(400).json({ error: "کاربر یافت نشد" });
//     }

//     const student = students[0];

//     const deleteQuery = `
//       DELETE FROM Student WHERE student_id = ?
//     `;

//     await conn.query(deleteQuery, [id]);

//     if (student.picture) {
//       const filePath = path.resolve(
//         path.dirname("") + "/src" + student.picture
//       );

//       if (fs.existsSync(filePath)) {
//         try {
//           await fs.promises.unlink(filePath);
//         } catch (error) {
//           console.error("Error unlinking student image:", error);
//         }
//       } else {
//         console.log("File not found:", filePath);
//       }
//     }

//     res.status(200).json({ message: "کاربر موفانه حذف شد" });
//   } catch (error) {
//     console.error("Error deleting student:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// let names_array = [
//   "امیر",
//   "محمد",
//   "علی",
//   "حسین",
//   "مهدی",
//   "سعید",
//   "سامان",
//   "محمود",
//   "رضا",
//   "صادق",
//   "امید",
//   "فرهاد",
//   "کیان",
//   "مهراد",
//   "سیامک",
//   "بهروز",
//   "یوسف",
//   "فریدون",
//   "شاهین",
//   "عباس",
//   "رامین",
//   "بابک",
//   "پویا",
//   "رامتین",
//   "میلاد",
//   "علیرضا",
//   "امین",
//   "کاوه",
//   "کامران",
//   "شهروز",
//   "بهزاد",
//   "مازیار",
//   "علی‌اکبر",
//   "ناصر",
//   "بهمن",
//   "مهران",
//   "ماهان",
//   "سجاد",
//   "سعادت",
//   "محسن",
//   "احسان",
//   "مهدیار",
//   "سروش",
//   "مرتضی",
//   "محمدرضا",
//   "نوید",
//   "امیرحسین",
//   "آرش",
//   "سید",
//   "نیما",
//   "علی‌اصغر",
//   "محمدعلی",
//   "مصطفی",
//   "عماد",
//   "علی‌رضا",
//   "رضوان",
//   "علی‌رضا",
//   "وحید",
//   "جواد",
//   "محمدحسین",
//   "میثم",
//   "کمال",
//   "جمشید",
//   "احمد",
//   "فرزاد",
//   "مهرزاد",
//   "سام",
//   "محمدجواد",
//   "رضا",
//   "حمید",
//   "مهدی",
//   "حسن",
//   "قاسم",
//   "محمدصادق",
//   "جعفر",
//   "حمزه",
//   "عبدالله",
//   "رحیم",
//   "عباسعلی",
//   "محمدصالح",
//   "ابراهیم",
//   "حسینعلی",
//   "علیرضا",
//   "محمدرضا",
//   "علی‌محمد",
//   "محمدعباس",
//   "رضاحسین",
//   "سعیدمحمد",
//   "حسن",
//   "حسین",
//   "محمد",
//   "علی",
//   "حمید",
//   "مهدی",
//   "رضا",
//   "صادق",
//   "امیر",
//   "فرهاد",
//   "کیان",
//   "مهراد",
//   "سیامک",
//   "بهروز",
//   "یوسف",
//   "فریدون",
//   "شاهین",
//   "عباس",
//   "رامین",
//   "بابک",
//   "پویا",
//   "رامتین",
//   "میلاد",
//   "علیرضا",
//   "امین",
//   "کاوه",
//   "کامران",
//   "شهروز",
//   "بهزاد",
//   "مازیار",
//   "علی‌اکبر",
//   "ناصر",
//   "بهمن",
//   "مهران",
//   "ماهان",
//   "سجاد",
//   "سعادت",
//   "محسن",
//   "احسان",
//   "مهدیار",
//   "سروش",
//   "مرتضی",
//   "محمدرضا",
//   "نوید",
//   "امیرحسین",
//   "آرش",
//   "سید",
//   "علی‌اصغر",
//   "محمدعلی",
//   "مصطفی",
//   "عماد",
//   "علی‌رضا",
//   "رضوان",
//   "علی‌رضا",
//   "وحید",
//   "جواد",
//   "محمدحسین",
//   "میثم",
//   "کمال",
//   "جمشید",
//   "احمد",
//   "فرزاد",
//   "مهرزاد",
//   "سام",
//   "محمدجواد",
//   "رضا",
//   "حمید",
//   "مهدی",
//   "حسن",
//   "قاسم",
//   "محمدصادق",
//   "جعفر",
//   "حمزه",
//   "عبدالله",
//   "رحیم",
//   "عباسعلی",
//   "محمدصالح",
//   "ابراهیم",
//   "حسینعلی",
//   "علیرضا",
//   "محمدرضا",
//   "علی‌محمد",
//   "محمدعباس",
//   "رضاحسین",
//   "سعیدمحمد",
// ];
// let father_names = [
//   "محمدرضا",
//   "علی‌اکبر",
//   "حسن",
//   "قاسم",
//   "جواد",
//   "کریم",
//   "حسینعلی",
//   "احمد",
//   "محمد",
//   "حمید",
//   "نورمحمد",
//   "رضا",
//   "امیرحسین",
//   "محمدجواد",
//   "عبدالله",
//   "اکبر",
//   "محسن",
//   "محمدعلی",
//   "اسماعیل",
//   "محمود",
//   "محمدحسین",
//   "مصطفی",
//   "رحیم",
//   "محمدرضوان",
//   "قاسمعلی",
//   "ابراهیم",
//   "جعفر",
//   "محمدصادق",
//   "ابراهیمعلی",
//   "علیرضا",
//   "محمد کیان",
//   "محمدصالح",
//   "احمدعلی",
//   "حسنعلی",
//   "عباسعلی",
//   "شریف",
//   "حمزه",
//   "عبدالحمید",
//   "ابراهیمحسین",
//   "جوادعلی",
//   "احمدحسین",
//   "محمدحسن",
//   "ابراهیمرضا",
//   "حسینرضا",
//   "محمدباقر",
//   "علی‌محمد",
//   "محمدعباس",
//   "رضاحسین",
//   "سعیدمحمد",
//   "حسن",
//   "حسین",
//   "محمد",
//   "علی",
//   "حمید",
//   "مهدی",
//   "رضا",
//   "صادق",
//   "امیر",
//   "فرهاد",
//   "کیان",
//   "مهراد",
//   "سیامک",
//   "بهروز",
//   "یوسف",
//   "فریدون",
//   "شاهین",
//   "عباس",
//   "رامین",
//   "بابک",
//   "پویا",
//   "رامتین",
//   "میلاد",
//   "علیرضا",
//   "امین",
//   "کاوه",
//   "کامران",
//   "شهروز",
//   "بهزاد",
//   "مازیار",
//   "علی‌اکبر",
//   "ناصر",
//   "بهمن",
// ];
// let startingSsid = 89100;
// let year = 1389;

// export const seedStudent = async (req, res) => {
//   const { id } = req.params;
//   const departmentIds = [1, 2, 3];

//   const conn = req.connect;
//   year += 1;
//   startingSsid += 1000;
//   const folderPath = "./src/uploads/images";
//   const sourceImageFolder = path.resolve(folderPath);
//   const imageFiles = fs.readdirSync(sourceImageFolder);

//   for (const departmentId of departmentIds) {
//     const students = [];
//     const numberOfStudents = Math.floor(Math.random() * (41 - 35) + 35);

//     const usedNames = new Set();

//     for (let i = 0; i < numberOfStudents; i++) {
//       let name;
//       do {
//         name = names_array[Math.floor(Math.random() * names_array.length)];
//       } while (usedNames.has(name));

//       let fname;
//       do {
//         fname = father_names[Math.floor(Math.random() * father_names.length)];
//       } while (usedNames.has(fname));

//       usedNames.add(name);
//       usedNames.add(fname);

//       const ssid = startingSsid++;

//       const randomImage =
//         imageFiles[Math.floor(Math.random() * imageFiles.length)];
//       const imagePath = `/uploads/students/${ssid}.jpg`;

//       const sourceImagePath = path.join(sourceImageFolder, randomImage);
//       const targetImagePath = path.join(
//         path.dirname(""),
//         `./src/uploads/students/${ssid}.jpg`
//       );
//       fs.copyFileSync(sourceImagePath, targetImagePath);

//       const picture = imagePath;
//       const currentSemester = 1;

//       const student = [
//         name,
//         fname,
//         ssid,
//         departmentId,
//         currentSemester,
//         picture,
//         year,
//       ];
//       students.push(student);
//     }

//     const insertQuery = `
//       INSERT INTO Student (name, fname, ssid, department_id, current_semester, picture, year)
//       VALUES ?
//     `;

//     try {
//       await conn.query(insertQuery, [students]);
//       console.log(
//         `Inserted ${numberOfStudents} students into Department ${departmentId}`
//       );
//     } catch (error) {
//       console.error(
//         `Error inserting students into Department ${departmentId}:`,
//         error
//       );
//     }
//   }
// };
