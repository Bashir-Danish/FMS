import express from "express";
import {
  createSubject,
  getSubjects,
  getById,
  updateSubject,
  deleteSubjectsBySemester,
  deleteSubjectById,
  addSingleSubject
} from "../controllers/subjectController.js";

const router = express.Router();

router.route("/").get(getSubjects).post(createSubject);
router.route("/new").post(addSingleSubject);
router.route("/:semesterId/:departmentId").delete(deleteSubjectsBySemester);
router.route("/:subjectId").delete(deleteSubjectById);
router.route("/:id").get(getById).put(updateSubject);

export default router;
