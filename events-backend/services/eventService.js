import Event from "../models/event.js";
/**
 * Get all events with optional filters
 * @param {Object} filters - Filters for retrieving events (e.g., by type, startDate)
 * @returns {Promise<Array>} - List of events
 */
export const getAllEvents = async (filters = {}) => {
    return await Event.findAll({ where: filters });
};

/**
 * Get event details by ID
 * @param {String} id - Event ID
 * @returns {Promise<Object>} - Event details
 */
export const getEventById = async (id) => {
    return await Event.findByPk(id);
};

/**
 * Create a new event
 * @param {Object} eventData - Event details to create
 * @returns {Promise<Object>} - Newly created event
 */
export const createEvent = async (eventData) => {
    return await Event.create(eventData);
};

/**
 * Update an existing event
 * @param {String} id - Event ID
 * @param {Object} updatedData - Updated event details
 * @returns {Promise<Object>} - Updated event or null if not found
 */
export const updateEvent = async (id, updatedData) => {
    const event = await Event.findByPk(id);
    if (!event) return null;

    await event.update(updatedData);
    return event;
};

/**
 * Delete an event by ID
 * @param {String} id - Event ID
 * @returns {Promise<Boolean>} - True if deleted, false if not found
 */
export const deleteEvent = async (id) => {
    const event = await Event.findByPk(id);
    if (!event) return false;

    await event.destroy();
    return true;
};
