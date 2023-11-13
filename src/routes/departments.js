import { Router } from "express";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getHomePageReports, getDepartmentStatistics } from "../controllers/departmentController.js";
import { isAuthenticatedUser } from '../utils/auth.js';

const router = Router();
router.route("/").get(isAuthenticatedUser, getDepartments)
  .post(isAuthenticatedUser, createDepartment);
router.route("/report").get(getHomePageReports);
router.route("/report/:semesterId").get(getDepartmentStatistics);

router.route("/:id")
  .put(isAuthenticatedUser, updateDepartment)
  .delete(isAuthenticatedUser, deleteDepartment);

export default router;
