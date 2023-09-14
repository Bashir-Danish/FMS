import { Router } from "express";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../controllers/departmentController.js";
import { isAuthenticatedUser } from '../utils/auth.js';

const router = Router();
router.route("/")
  .get(isAuthenticatedUser, getDepartments) 
  .post(isAuthenticatedUser, createDepartment);

router.route("/:id")
  .put(isAuthenticatedUser, updateDepartment)
  .delete(isAuthenticatedUser, deleteDepartment);

export default router;
