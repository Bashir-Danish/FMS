import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import bodyParser from "body-parser";
import { config } from "dotenv";
import { notFound, errorHandler } from "./middlewares.js";
import departmentRouter from "./routes/departments.js";
import {
  createConnections,
  getConnectionPool,
  connectionPool1,
} from "./configs/connection.js";
import semesterRouter from "./routes/semesters.js";
import userRouter from "./routes/users.js";
import studentRouter from "./routes/students.js";
import subjectRouter from "./routes/subject.js";
import enrollRouter from "./routes/enrolls.js";
import fileUpload from "express-fileupload";
import path from "path";
import cookieParser from "cookie-parser";
import fs from "fs";


config();


const app = express();


createConnections();

app.use(morgan("dev"));




const allowedDomains = [
  "https://api.kdanish.com",
  "https://app.kdanish.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (req, callback) {
      var corsOptions;
      if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true } 
      } else {
        corsOptions = { origin: false } 
      }
      callback(null, corsOptions) 
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, 
    optionsSuccessStatus: 204, 
  })
);


app.use(helmet());
app.use(express.json());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  req.connect = getConnectionPool();
  req.connNum = req.connect === connectionPool1 ? 1 : 2;
  console.log(`Request received with connection number: ${req.connNum}`);
  next();
});


app.use(fileUpload());
app.use(cookieParser());


app.use(
  "/uploads",
  express.static(path.join(path.dirname(""), "./src/uploads/"))
);


app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨👋🌎🌍🌏✨🌈🦄',
  });
});

function generateUniqueFilename() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 100000000);

  return `image_${timestamp}_${random}`;
}


app.post("/api/v1/upload", async (req, res) => {
  const { fileType, id } = req.body;
  console.log(id);
  console.log(fileType);
  console.log(req.files);

  if (!req.files || !fileType) {
    return res.status(400).json({
      error:
        "Please provide a file and fileType (user, updateuser, student, or updatestudent)",
    });
  }

  const file = req.files.file;
  const uniqueFilename = generateUniqueFilename();
  const ext = file.name.split(".").filter(Boolean).slice(1).join(".");

  let folder = "";
  let imagePath;

  if (fileType === "user" || fileType === "updateuser") {
    folder = "users";
  } else if (fileType === "student" || fileType === "updatestudent") {
    folder = "students";
  } else {
    return res.status(400).json({ error: "Invalid 'fileType' value" });
  }

  try {
    if (id) {
      const query = `SELECT picture FROM ${
        fileType === "user" ? "User" : "Student"
      } WHERE ${fileType === "user" ? "user_id" : "student_id"} = ?`;
      const [rows] = await req.connect.query(query, [id]);

      if (rows && rows.length > 0) {
        const oldImagePath = rows[0].picture.replace("/uploads/", "");
        console.log(oldImagePath);
        const oldFilePath = path.resolve(
          path.dirname("") + `/src/uploads/${oldImagePath}`
        );

        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (error) {
            console.error(`Error deleting old file: ${error}`);
          }
        }
      }
    }

    imagePath = `/uploads/${folder}/${uniqueFilename}.${ext}`;
    const updateQuery = `UPDATE ${
      fileType === "user" ? "User" : "Student"
    } SET picture = ? WHERE ${
      fileType === "user" ? "user_id" : "student_id"
    } = ?`;
    await req.connect.query(updateQuery, [imagePath, id]);

    const filePath = path.resolve(
      path.dirname("") + `/src/uploads/${folder}/${uniqueFilename}` + "." + ext
    );
    file.mv(filePath, (err) => {
      if (err) return res.status(500).json({ mverror: err.message });
      res
        .status(200)
        .json({ message: "File uploaded successfully", imagePath: imagePath });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ catcherror: error });
  }
});


app.get("/test", async (req, res) => {
  try {
    const [result] = await req.connect.query("SELECT * FROM User");
    console.log(result);
    return res.status(200).json({ message: `Database connection is working ${result}` });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: `Database connection ${error}` });
  }
});


app.get("/seed", async (req, res) => {
  try {
    // await req.connect.query("SET FOREIGN_KEY_CHECKS = 0");
    // await req.connect.query("DROP TABLE IF EXISTS Department");
    // await req.connect.query("DROP TABLE IF EXISTS Semester");
    // await req.connect.query("DROP TABLE IF EXISTS Student");
    // await req.connect.query("DROP TABLE IF EXISTS User");
    // await req.connect.query("DROP TABLE IF EXISTS Subject");
    await req.connect.query("DROP TABLE IF EXISTS Enrollment");
    // await req.connect.query("DROP TABLE IF EXISTS SemesterRegistration");
    // await req.connect.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("All tables dropped successfully");
  } catch (error) {
    console.error("Error dropping tables:", error);
  }

  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄",
  });
});

app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/semesters", semesterRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/subjects", subjectRouter);
app.use("/api/v1/enrolls", enrollRouter);


app.use(errorHandler);

export default app;
