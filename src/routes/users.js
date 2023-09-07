import express from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  login,
} from "../controllers/userController.js";
import { isAuthenticatedUser } from "../utils/auth.js";

const router = express.Router();

router.get("/", isAuthenticatedUser, getAllUsers);
router.post("/register", isAuthenticatedUser, createUser);
router
  .route("/:id")
  .get(isAuthenticatedUser, getUserById)
  .put(isAuthenticatedUser, updateUser)
  .delete(isAuthenticatedUser, deleteUser);
router.post("/login", login);

export default router;
