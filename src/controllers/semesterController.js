import { Worker } from "worker_threads";
import { catchAsync } from "../middlewares.js";
import { runQuery } from "../utils/query.js";
export const processEnrollment = catchAsync(async (req, res) => {
  try {
    const semesterIdsToProcess = req.body.semesterIdsToProcess;

    const worker = new Worker(
      "./src/controllers/process/enrollmentProcessor.js",
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

export const createSemester = catchAsync(async (req, res) => {
  const { name, year, semester_number } = req.body;
  let responseTime = 0
  try {
    const queryCheck =
      "SELECT semester_id FROM Semester WHERE name = ? AND year = ? AND semester_number = ?";
    const {result:rows,resTime:t1} = await runQuery(queryCheck, [name, year, semester_number]);
    responseTime += t1
    if (rows.length > 0) {
      console.log(`Response time : ${responseTime} ms`);

      return res.status(409).json({ error: "این ترم از قبل وجود دارد" });
    }

    const query =
      "INSERT INTO Semester (name, year ,semester_number) VALUES (?, ?, ?)";
    const {result,resTime:t2} = await runQuery(query, [
      name,
      year,
      semester_number,
    ]);
    responseTime += t2
    const semesterId = result.insertId;

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
    console.log(`Response time : ${resTime} ms`);

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
