import express from "express";
import {
    getEnrollments,
    updateGrades
} from "../controllers/enrollController.js";
import { isAuthenticatedUser } from "../utils/auth.js";

const router = express.Router();

router.get("/", getEnrollments);
router.post("/import", isAuthenticatedUser, updateGrades);
// router
//   .route("/:id")
//   .get(isAuthenticatedUser, getUserById)
//   .put(isAuthenticatedUser, updateUser)
//   .delete(isAuthenticatedUser, deleteUser);
// router.post("/login", login);

export default router;
