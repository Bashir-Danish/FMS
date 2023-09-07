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
import   cookieParser from 'cookie-parser';
// import { mkdir } from "fs";

config();

const app = express();
createConnections();

app.use(morgan("dev"));

const corsOptions = {
  origin: 'http://localhost:5173', 
  credentials: true, 
};

app.use(cors(corsOptions));
// app.use(cors("*"));

app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload());
app.use(cookieParser());

app.use(
  "/uploads",
  express.static(path.join(path.dirname(""), "./src/uploads/"))
);

app.use((req, res, next) => {
  req.connect = getConnectionPool();
  req.connNum = req.connect === connectionPool1 ? 1 : 2;
  console.log(`Request received with connection number: ${req.connNum}`);
  next();
});

app.use("/api/v1/departments", departmentRouter);
app.use("/api/v1/semesters", semesterRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/students", studentRouter);
app.use("/api/v1/subjects", subjectRouter);
app.use("/api/v1/enrolls", enrollRouter);

app.post("/api/v1/upload", async function (req, res, next) {
  let uploadPath = [];

    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
      const file = req.files.file;
      let ext = file.name.split(".").filter(Boolean).slice(1).join(".");
      let filePath = path.resolve(path.dirname("") + `/src/uploads/users/${req.body.email}` + "." + ext);
      console.log(file + "ddddddddddd");
      file.mv(filePath, function (err) {
        if (err) return res.status(500).send(err);
      });
      uploadPath.push(`/uploads/users/${req.body.email}` + "." + ext);

   
  
      res.json({
        message: "File uploaded!",
        uploadPath,
      });
    } catch (error) {
      next(error);
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

app.use(notFound);
app.use(errorHandler);

export default app;
