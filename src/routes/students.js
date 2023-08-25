import express from 'express';
import { createStudent, getStudents, getStudentById, updateStudent, deleteStudent } from '../controllers/studentController.js';

const router = express.Router();

router.route('/')
    .get(getStudents)
    .post(createStudent)

router.route('/:id')
    .get(getStudentById)
    .put(updateStudent)
    .delete(deleteStudent)

export default router;
