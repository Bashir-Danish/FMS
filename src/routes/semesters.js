import { Router } from "express";
import { getSemesters, createSemester, updateSemester, deleteSemester } from "../controllers/semesterController.js";

const router = Router();

router.route("/")
  .get(getSemesters)
  .post(createSemester);

router.route("/:id")
  .put(updateSemester)
  .delete(deleteSemester);

export default router;
