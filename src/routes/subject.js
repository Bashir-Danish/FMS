import express from "express";
import {
  createSubject,
  getSubjects,
  getById,
  updateSubject,
  deleteSubjectsBySemester,
  deleteSubjectById,
  addSingleSubject,
} from "../controllers/subjectController.js";
import { isAuthenticatedUser } from "../utils/auth.js";

const router = express.Router();

router.route("/").get(isAuthenticatedUser, getSubjects).post(isAuthenticatedUser,createSubject);
router.route("/new").post(isAuthenticatedUser,addSingleSubject);
router.route("/:semesterId/:departmentId").delete(isAuthenticatedUser,deleteSubjectsBySemester);
router.route("/:subjectId").delete(isAuthenticatedUser,deleteSubjectById);
router.route("/:id").get(isAuthenticatedUser,getById).put(isAuthenticatedUser,updateSubject);

export default router;
