import express from 'express';
import { createStudent, getStudents, getStudentById, updateStudent, deleteStudent ,seedStudent,getYears} from '../controllers/studentController.js';
import { isAuthenticatedUser } from '../utils/auth.js';

const router = express.Router();

router.route('/')
    .get(isAuthenticatedUser,getStudents)
    .post(isAuthenticatedUser,createStudent)

router.get("/seed/:ssid/:yearNum",seedStudent );
router.get("/years", getYears );

router.route('/:id')
    .get(isAuthenticatedUser,getStudentById)
    .put(isAuthenticatedUser,updateStudent)
    .delete(isAuthenticatedUser,deleteStudent)

export default router;
