
import { Worker } from 'worker_threads';
;

export const processEnrollment = async (req, res) => {
  try {
    const semesterIdsToProcess = req.body.semesterIdsToProcess; 


    const worker = new Worker('./src/controllers/process/enrollmentProcessor.js', {
      workerData: {
        semesterIdsArray: semesterIdsToProcess,
      },
    });

    let enrollmentMessages = [];

    worker.on('message', (message) => {
      console.log(message);
      enrollmentMessages.push(message);
    });

    worker.on('exit', (code) => {
      if (code === 0) {
        // Worker process completed successfully
        res.json({ messages: enrollmentMessages[0] });
      } else {
        // Worker process encountered an error
        res.status(500).json({ error: 'Error processing enrollment' });
      }
    });
  } catch (error) {
    console.error('Error processing enrollment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSemesters = async (req, res) => {
  const conn = req.connect;

  try {
    const query = "SELECT * FROM Semester";
    const [rows] = await conn.query(query);
    console.log(rows);
    res.json(rows);
  } catch (error) {
    console.error("Error retrieving semesters:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const createSemester = async (req, res) => {
  const { name, year ,semester_number} = req.body;
  const conn = req.connect;

  try {

    const queryCheck = "SELECT semester_id FROM Semester WHERE name = ? AND year = ? AND semester_number = ?";
    const [rows] = await conn.query(queryCheck, [name, year,semester_number]);
    if (rows.length > 0) {
      return res.status(409).json({ error: "این ترم از قبل وجود دارد" });
    }

    const query = "INSERT INTO Semester (name, year ,semester_number) VALUES (?, ?, ?)";
    const [result] = await req.connect.query(query, [name, year ,semester_number]);
    const semesterId = result.insertId;

    res.status(201).json({ semesterId, message: "سمستر موفقانه اضافه شد" });
  } catch (error) {
    console.error("Error creating semester:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const updateSemester = async (req, res) => {
  const conn = req.connect;
  const { id } = req.params;
  const { name, year, semester_number,is_passed } = req.body;
  console.log(req.body);
  console.log(id);

  try {
    // const queryCheck = "SELECT semester_id FROM Semester WHERE name = ? AND year = ? AND semester_number = ?";
    // const [existingRows] = await conn.query(queryCheck, [name, year, semester_number]);
    
    // console.log(existingRows);

    // if (existingRows.length === 0) {
    //   return res.status(404).json({ error: "این ترم یافت نشد" });
    // }

    const updateQuery = "UPDATE Semester SET name = ?, year = ?, semester_number = ? ,is_passed = ?  WHERE semester_id = ?";
    const [updateResult] = await conn.query(updateQuery, [name, year, semester_number,is_passed, id]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: "ترم مورد نظر یافت نشد" });
    }

    res.status(200).json({ message: "سمستر موفقانه ویرایش شد" });
  } catch (error) {
    console.error("Error updating semester:", error);
    if (error.sqlMessage) {
      return res.status(500).json({ error: `خطا در بروزرسانی ترم: ${error.sqlMessage}` });
    }

    res.status(500).json({ error: "خطای داخلی سرور" });
  }
};


export const deleteSemester = async (req, res) => {
  const conn = req.connect;
  const { id } = req.params;

  try {
    const query = "DELETE FROM Semester WHERE semester_id = ?";
    await conn.query(query, [id]);
    res.json({ message: "سمستر موفقانه حذف شد" });
  } catch (error) {
    console.error("Error deleting semester:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
