// events-backend/routes/cartRoutes.js
import express from 'express';
import { addEventToCart, deleteEventFromCart, fetchCartItems } from '../controllers/cartController.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';


const router = express.Router();

router.post('/', authorizeRoles(["user", "admin"]), addEventToCart);
router.get('/', authorizeRoles(["user", "admin"]), fetchCartItems);
router.delete('/:cartId', authorizeRoles(["user", "admin"]), deleteEventFromCart); // New route for deleting cart items


export default router;