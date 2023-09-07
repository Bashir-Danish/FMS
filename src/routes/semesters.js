import { Router } from "express";
import { getSemesters, createSemester, updateSemester, deleteSemester,processEnrollment } from "../controllers/semesterController.js";
import { isAuthenticatedUser } from '../utils/auth.js';

const router = Router();

router.route("/")
  .get(isAuthenticatedUser,getSemesters)
  .post(isAuthenticatedUser,createSemester);
router.route("/enrolls")
  .post(isAuthenticatedUser,processEnrollment);

router.route("/:id")
  .put(isAuthenticatedUser,updateSemester)
  .delete(isAuthenticatedUser,deleteSemester);

export default router;
