// events-backend/routes/withdrawalRoutes.js
import express from 'express';
import { getWithdrawalRequestById, getWithdrawalRequests, manageWithdrawalRequest, requestWithdrawal } from '../controllers/withdrawalController.js';
import { uploadDocument } from '../utils/multerConfig.js';
import { authorizeRoles, isAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Route for requesting a withdrawal
router.post('/request', uploadDocument.single('document'),authorizeRoles(["user", "admin"]), requestWithdrawal);

// Route for getting all withdrawal requests for a user
router.get('/',authorizeRoles(["user", "admin"]),getWithdrawalRequests);

// Route for getting a specific withdrawal request by ID
router.get('/:id' ,authorizeRoles(["user", "admin"]),getWithdrawalRequestById);


// Route for admin to manage withdrawal requests (approve/reject)
router.patch('/manage/:id',authorizeRoles(["user", "admin"]), manageWithdrawalRequest); // Use PATCH for updating status

export default router;