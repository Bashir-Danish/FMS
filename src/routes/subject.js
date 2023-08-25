import express from 'express';
import { 
    createSubject, 
    getSubjects, 
    getById, 
    updateSubject, 
    deleteSubject 
} from '../controllers/subjectController.js';

const router = express.Router();

router.route('/')
    .get(getSubjects)
    .post(createSubject)
router.route('/:id')
    .get(getById)
    .put(updateSubject)
    .delete(deleteSubject)

export default router;
