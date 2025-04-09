import express from 'express';
import { 
    updateUserDetails,
     getAllUsers, 
     removeUser, 
     getUserDetails } from '../controllers/userController.js';
import upload from '../config/multer.js';

const router = express.Router();

// Update user details with file upload
router.put('/update/:id', upload.single('profilePicture'), updateUserDetails);

router.get('/', getAllUsers);
router.delete('/delete/:id', removeUser);
router.get('/get/:id', getUserDetails);


export default router;