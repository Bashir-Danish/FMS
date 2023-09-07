import express from "express";
import {
    getEnrollments
} from "../controllers/enrollController.js";
import { isAuthenticatedUser } from "../utils/auth.js";

const router = express.Router();

router.get("/", getEnrollments);
// router.post("/register", isAuthenticatedUser, createUser);
// router
//   .route("/:id")
//   .get(isAuthenticatedUser, getUserById)
//   .put(isAuthenticatedUser, updateUser)
//   .delete(isAuthenticatedUser, deleteUser);
// router.post("/login", login);

export default router;
