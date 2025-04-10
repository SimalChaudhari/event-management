// events-backend/controllers/cartController.js
import { addToCart, getCartItems, removeFromCart } from "../services/cartService.js";
import { getEventById } from "../services/eventService.js";

/**
 * Controller to add an event to the cart
 */
export const addEventToCart = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from the token
    const { eventId } = req.body;

    // Add the event to the cart
    await addToCart(userId, eventId);

    // Fetch the full event details
    const cartItems = await getCartItems(userId);
    const eventDetails = await getEventById(eventId);

    const eventInCart = cartItems.find((item) => item.eventId === eventId);

    if (eventInCart) {
      return res.status(400).json({ message: "Event is already in the cart" });
    }

    if (!eventDetails) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Respond with a success message, user ID, event details, and total events
    res.status(201).json({
      message: "Event added to cart",
      userId: userId,
      event: eventDetails, // Include the full event details
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller to get all cart items for a user
 */
export const fetchCartItems = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from the token
    const cartItems = await getCartItems(userId);

    // Initialize an array to hold detailed cart items
    const detailedCartItems = [];
    const totalEvents = cartItems.length; // Get the total number of events in the cart

    // Fetch full event details for each cart item sequentially
    for (const item of cartItems) {
      const events = await getEventById(item.eventId);
      if (events) {
        detailedCartItems.push({
          id: item.id, // Include the cart ID
          events, // Include the full event details
        });
      }
    }
    res.status(200).json({ total: totalEvents, CartItems: detailedCartItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEventFromCart = async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from the token
        const { cartId } = req.params; // Get the cart ID from the request parameters

        // Remove the event from the cart
        const deleted = await removeFromCart(userId, cartId);
        if (!deleted) {
            return res.status(404).json({ message: "Cart item not found" });
        }

        res.status(200).json({ message: "Event removed from cart successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};