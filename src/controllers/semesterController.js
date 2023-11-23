import { Worker } from "worker_threads";
import { catchAsync } from "../middlewares.js";
import { runQuery } from "../utils/query.js";
export const processEnrollment = catchAsync(async (req, res) => {
  try {
    const semesterIdsToProcess = req.body.semesterIdsToProcess;

    const worker = new Worker(
      "./src/controllers/process/enrollmentProcessor.js",
      // "./src/controllers/process/test.js",
      {
        workerData: {
          semesterIdsArray: semesterIdsToProcess,
        },
      }
    );

    let enrollmentMessages = [];

    worker.on("message", (message) => {
      console.log(message);
      enrollmentMessages.push(message);
    });

    worker.on("exit", (code) => {
      if (code === 0) {
        res.json({ messages: enrollmentMessages[0] });
      } else {
        res.status(500).json({ error: "Error processing enrollment" });
      }
    });
  } catch (error) {
    console.error("Error processing enrollment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const getSemesters = catchAsync(async (req, res) => {
  try {
    const query = "SELECT * FROM Semester";
    const { result: rows, resTime } = await runQuery(query);
    console.log(`Response time : ${resTime} ms`);

    res.json(rows);
  } catch (error) {
    console.error("Error retrieving semesters:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// export const createSemester = catchAsync(async (req, res) => {
//   const { name, year, semester_number } = req.body;
//   let responseTime = 0;
//   try {
//     const queryCheck =
//       "SELECT semester_id FROM Semester WHERE name = ? AND year = ? AND semester_number = ?";
//     const { result: rows, resTime: t1 } = await runQuery(queryCheck, [
//       name,
//       year,
//       semester_number,
//     ]);
//     responseTime += t1;
//     if (rows.length > 0) {
//       console.log(`Response time : ${responseTime} ms`);

//       return res.status(409).json({ error: "این ترم از قبل وجود دارد" });
//     }

//     const query =
//       "INSERT INTO Semester (name, year ,semester_number) VALUES (?, ?, ?)";
//     const { result, resTime: t2 } = await runQuery(query, [
//       name,
//       year,
//       semester_number,
//     ]);
//     responseTime += t2;
//     const semesterId = result.insertId;

//     console.log(`Response time : ${responseTime} ms`);
//     res.status(201).json({ semesterId, message: "سمستر موفقانه اضافه شد" });
//   } catch (error) {
//     console.error("Error creating semester:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
const subjectData = {
  1: {
    1: [
      { name: "Computer Eng", credit: 5 },
      { name: "جھان بینی اسلامی", credit: 2 },
      { name: "تجوید", credit: 2 },
      { name: "Mathematics", credit: 3 },
      { name: "programming", credit: 5 },
      { name: "English", credit: 2 },
    ],
    2: [
      { name: "Computer Eng", credit: 5 },
      { name: "جھان بینی اسلامی", credit: 2 },
      { name: "تجوید", credit: 2 },
      { name: "Mathematics", credit: 3 },
      { name: "programming", credit: 5 },
      { name: "English", credit: 2 },
    ],
    3: [
      { name: "Computer Eng", credit: 5 },
      { name: "جھان بینی اسلامی", credit: 2 },
      { name: "تجوید", credit: 2 },
      { name: "Mathematics", credit: 3 },
      { name: "programming", credit: 5 },
      { name: "English", credit: 2 },
    ],
  },
  2: {
    1: [
      { name: "English", credit: 2 },
      { name: "سيرت النبى", credit: 2 },
      { name: "فلسفه عبادات", credit: 2 },
      { name: "programming", credit: 5 },
      { name: "Computer Eng", credit: 5 },
      { name: "Mathematics", credit: 3 },
    ],
    2: [
      { name: "English", credit: 2 },
      { name: "سيرت النبى", credit: 2 },
      { name: "فلسفه عبادات", credit: 2 },
      { name: "programming", credit: 5 },
      { name: "Computer Eng", credit: 5 },
      { name: "Mathematics", credit: 3 },
    ],
    3: [
      { name: "English", credit: 2 },
      { name: "سيرت النبى", credit: 2 },
      { name: "فلسفه عبادات", credit: 2 },
      { name: "programming", credit: 5 },
      { name: "Computer Eng", credit: 5 },
      { name: "Mathematics", credit: 3 },
    ],
  },
  3: {
    1: [
      { name: "English", credit: 2 },
      { name: "نظام اجتماعى", credit: 2 },
      { name: "نظام اخلاقى", credit: 2 },
      { name: "Algorithm", credit: 4 },
      { name: "Database", credit: 4 },
      { name: "OS", credit: 4 },
      { name: "mathematics", credit: 3 },
    ],
    2: [
      { name: "English", credit: 2 },
      { name: "نظام اجتماعى", credit: 2 },
      { name: "نظام اخلاقى", credit: 2 },
      { name: "Algorithm", credit: 4 },
      { name: "Database", credit: 4 },
      { name: "OS", credit: 4 },
      { name: "mathematics", credit: 3 },
    ],
    3: [
      { name: "English", credit: 2 },
      { name: "نظام اجتماعى", credit: 2 },
      { name: "نظام اخلاقى", credit: 2 },
      { name: "Algorithm", credit: 4 },
      { name: "Database", credit: 4 },
      { name: "OS", credit: 4 },
      { name: "mathematics", credit: 3 },
    ],
  },
  4: {
    1: [
      { name: "English", credit: 2 },
      { name: "تربيت فكرى", credit: 2 },
      { name: "اديان و مذاهب", credit: 2 },
      { name: "Data Structure", credit: 4 },
      { name: "mathematics", credit: 3 },
      { name: "Network", credit: 4 },
      { name: "C", credit: 4 },
    ],
    2: [
      { name: "English", credit: 2 },
      { name: "تربيت فكرى", credit: 2 },
      { name: "اديان و مذاهب", credit: 2 },
      { name: "Data Structure", credit: 4 },
      { name: "mathematics", credit: 3 },
      { name: "Network", credit: 4 },
      { name: "C", credit: 4 },
    ],
    3: [
      { name: "English", credit: 2 },
      { name: "تربيت فكرى", credit: 2 },
      { name: "اديان و مذاهب", credit: 2 },
      { name: "Data Structure", credit: 4 },
      { name: "mathematics", credit: 3 },
      { name: "Network", credit: 4 },
      { name: "C", credit: 4 },
    ],
  },
  5: {
    1: [
      { name: "Database System", credit: 5 },
      { name: "Web Eng #I", credit: 5 },
      { name: "نظام اداری", credit: 2 },
      { name: "نظام سياسى", credit: 2 },
      { name: "Project Management", credit: 2 },
      { name: "Scientific Writing", credit: 2 },
      { name: "Mathematics", credit: 4 },
    ],
    2: [
      { name: "Project management", credit: 2 },
      { name: "نظام اداری", credit: 2 },
      { name: "نظام سیاسی", credit: 2 },
      { name: "Web Eng #I", credit: 5 },
      { name: "Scientific Writing", credit: 2 },
      { name: "Mathematics", credit: 4 },
      { name: "Software Eng#I", credit: 5 },
    ],
    3: [
      { name: "Project Management", credit: 2 },
      { name: "نظام اداری", credit: 2 },
      { name: "نظام سیاسی", credit: 2 },
      { name: "Net Programming", credit: 5 },
      { name: "Distributed Systems", credit: 5 },
      { name: "Scientific Writing", credit: 2 },
      { name: "Mathematics", credit: 4 },
    ],
  },
  6: {
    1: [
      { name: "Scientific Writing", credit: 2 },
      { name: "اقتصادى اسلامى", credit: 2 },
      { name: "Web", credit: 5 },
      { name: "Database", credit: 5 },
      { name: "HCI", credit: 5 },
    ],
    2: [
      { name: "Scientific Writing", credit: 2 },
      { name: "اقتصادى اسلامى", credit: 2 },
      { name: "Web", credit: 5 },
      { name: "Java", credit: 5 },
      { name: "Software Eng", credit: 5 },
    ],
    3: [
      { name: "Scientific Writing", credit: 2 },
      { name: "اقتصادى اسلامى", credit: 2 },
      { name: "Network Protocol", credit: 5 },
      { name: "Wireless", credit: 5 },
      { name: "Security", credit: 5 },
    ],
  },
  7: {
    1: [
      { name: "Data Warehousing", credit: 5 },
      { name: "Web Eng#3", credit: 5 },
      { name: "Mobile Development", credit: 5 },
      { name: "اسلامی", credit: 2 },
      { name: "Scientific Writing", credit: 2 },
    ],
    2: [
      { name: "Enterprise", credit: 5 },
      { name: "HCI", credit: 5 },
      { name: "Architecture", credit: 5 },
      { name: "Scientific Writing", credit: 2 },
      { name: "اسلامی", credit: 2 },
    ],
    3: [
      { name: "Security #2", credit: 5 },
      { name: "Resource Management", credit: 5 },
      { name: "Network Programming II", credit: 5 },
      { name: "Scientific Writing", credit: 2 },
      { name: "اسلامی", credit: 2 },
    ],
  },
  8: {
    1: [
      { name: "Advance Database", credit: 5 },
      { name: "تمدن اسلامى", credit: 2 },
      { name: "laravel", credit: 5 },
    ],
    2: [
      { name: "Spring boot", credit: 5 },
      { name: "Architecture", credit: 5 },
      { name: "تمدن اسلامى", credit: 2 },
    ],
    3: [
      { name: "Virtualization", credit: 5 },
      { name: "Routing", credit: 5 },
      { name: "تمدن اسلامى", credit: 2 },
    ],
  },
};

export const createSemester = catchAsync(async (req, res) => {
  const { name, year, semester_number } = req.body;
  let responseTime = 0;
  try {
    const queryCheck =
      "SELECT semester_id FROM Semester WHERE name = ? AND year = ? AND semester_number = ?";
    const { result: rows, resTime: t1 } = await runQuery(queryCheck, [
      name,
      year,
      semester_number,
    ]);
    responseTime += t1;
    if (rows.length > 0) {
      console.log(`Response time : ${responseTime} ms`);
      return res.status(409).json({ error: "این ترم از قبل وجود دارد" });
    }

    const query =
      "INSERT IGNORE  INTO Semester (name, year, semester_number) VALUES (?, ?, ?)";
    const { result, resTime: t2 } = await runQuery(query, [
      name,
      year,
      semester_number,
    ]);
    responseTime += t2;
    const semesterId = result.insertId;
    console.log(`semesterId: ${semesterId}`);

    const semesterSubjects = subjectData[semester_number];
    setTimeout(async () => {
      const checkSemesterIdQuery = "SELECT semester_id FROM Semester WHERE semester_id = ?";
      const { result: semesterRows } = await runQuery(checkSemesterIdQuery, [semesterId]);
      if (semesterRows.length > 0) {
        if (semesterSubjects) {
          for (const departmentId in semesterSubjects) {
            const subjects = semesterSubjects[departmentId];
            for (const subject of subjects) {
              const { name, credit } = subject;
              const insertSubjectQuery = `
            INSERT IGNORE INTO Subject (department_id, semester_id, name, credit)
            VALUES (?, ?, ?, ?)
          `;
              const { resTime: t3 } = await runQuery(insertSubjectQuery, [
                departmentId,
                semesterId,
                name,
                credit,
              ]);
              responseTime += t3;
            }
          }
        }
      }
    }, 3000);


    console.log(`Response time : ${responseTime} ms`);
    res.status(201).json({ semesterId, message: "سمستر موفقانه اضافه شد" });
  } catch (error) {
    console.error("Error creating semester:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const updateSemester = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, year, semester_number, is_passed } = req.body;

  try {
    // const queryCheck = "SELECT semester_id FROM Semester WHERE name = ? AND year = ? AND semester_number = ?";
    // const [existingRows] = await runQuery(queryCheck, [name, year, semester_number]);

    // console.log(existingRows);

    // if (existingRows.length === 0) {
    //   return res.status(404).json({ error: "این ترم یافت نشد" });
    // }

    const updateQuery =
      "UPDATE Semester SET name = ?, year = ?, semester_number = ? ,is_passed = ?  WHERE semester_id = ?";
    const { result: updateResult, resTime } = await runQuery(updateQuery, [
      name,
      year,
      semester_number,
      is_passed,
      id,
    ]);

    if (updateResult.affectedRows === 0) {
      console.log(`Response time : ${resTime} ms`);
      return res.status(404).json({ error: "ترم مورد نظر یافت نشد" });
    }
    console.log(`Response time : ${resTime} ms dd`);

    res.status(200).json({ message: "سمستر موفقانه ویرایش شد" });
  } catch (error) {
    console.error("Error updating semester:", error);
    if (error.sqlMessage) {
      return res
        .status(500)
        .json({ error: `خطا در بروزرسانی ترم: ${error.sqlMessage}` });
    }

    res.status(500).json({ error: "خطای داخلی سرور" });
  }
});

export const deleteSemester = catchAsync(async (req, res) => {
  const { id } = req.params;
  try {
    const query = "DELETE FROM Semester WHERE semester_id = ?";
    const { resTime } = await runQuery(query, [id]);
    console.log(`Response time : ${resTime} ms`);

    res.json({ message: "سمستر موفقانه حذف شد" });
  } catch (error) {
    console.error("Error deleting semester:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
