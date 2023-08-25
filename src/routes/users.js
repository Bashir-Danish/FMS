import express from 'express';
import { getAllUsers,createUser, getUserById, updateUser, deleteUser, login } from '../controllers/userController.js';

const router = express.Router();

router.get('/', getAllUsers);
router.post('/register', createUser);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);
router.post('/login', login);

export default router;
