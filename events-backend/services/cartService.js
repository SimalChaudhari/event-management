// events-backend/services/cartService.js
import Cart from '../models/cart.js';

/**
 * Add an event to the cart
 * @param {String} userId - User ID
 * @param {String} eventId - Event ID
 * @returns {Promise<Object>} - Newly created cart item
 */
export const addToCart = async (userId, eventId) => {
    return await Cart.create({ userId, eventId });
};

/**
 * Get all cart items for a user
 * @param {String} userId - User ID
 * @returns {Promise<Array>} - List of cart items
 */
export const getCartItems = async (userId) => {
    return await Cart.findAll({ where: { userId } });
};


/**
 * Remove an event from the cart
 * @param {String} userId - User ID
 * @param {String} cartId - Cart item ID
 * @returns {Promise<Boolean>} - True if deleted, false if not found
 */
export const removeFromCart = async (userId, cartId) => {
    const cartItem = await Cart.findOne({ where: { id: cartId, userId } });
    if (!cartItem) return false;

    await cartItem.destroy();
    return true;
};