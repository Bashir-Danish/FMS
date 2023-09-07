import express from 'express';
import { createStudent, getStudents, getStudentById, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { isAuthenticatedUser } from '../utils/auth.js';

const router = express.Router();

router.route('/')
    .get(isAuthenticatedUser,getStudents)
    .post(isAuthenticatedUser,createStudent)

router.route('/:id')
    .get(isAuthenticatedUser,getStudentById)
    .put(isAuthenticatedUser,updateStudent)
    .delete(isAuthenticatedUser,deleteStudent)

export default router;
