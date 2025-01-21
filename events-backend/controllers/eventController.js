
import { Op } from 'sequelize';
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
} from '../services/eventService.js';

/**
 * Controller to fetch all events
 */
export const fetchAllEvents = async (req, res) => {
    try {
        const {
            location,
            type,
            startDateFrom,
            startDateTo,
            name,
            minPrice,
            maxPrice,
            ...otherFilters
        } = req.query;

        const filters = { ...otherFilters };

        // Add location filter (case-insensitive partial match)
        if (location) {
            filters.location = { [Op.iLike]: `%${location}%` }; // Case-insensitive match
        }

        // Add type filter (case-insensitive match)
        if (type) {
            filters.type = type;
        }


        // Add name filter (case-insensitive partial match)
        if (name) {
            filters.name = { [Op.iLike]: `%${name}%` }; // Case-insensitive match
        }

        // Add date range filter for startDate
        if (startDateFrom || startDateTo) {
            filters.startDate = {};
            if (startDateFrom) filters.startDate[Op.gte] = startDateFrom;
            if (startDateTo) filters.startDate[Op.lte] = startDateTo;
        }

        // Add price range filter
        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice) filters.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) filters.price[Op.lte] = parseFloat(maxPrice);
        }

        // Fetch events with filters
        const events = await getAllEvents(filters);

        // Handle no matching events
        if (events.length === 0) {
            return res.status(404).json({ message: 'No events found matching the specified filters' });
        }

        // Return matched events
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



/**
 * Controller to fetch event by ID
 */
export const fetchEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await getEventById(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Controller to create a new event
 */
export const createNewEvent = async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from the token
        const eventData = { ...req.body, createdBy: userId }; // Add userId to event data
        const newEvent = await createEvent(eventData);

        res.status(201).json({ message: 'Event created successfully', event: newEvent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Controller to update an event
 */
export const modifyEvent = async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from the token
        const { id } = req.params;
        const updatedData = { ...req.body, createdBy: userId }; // Add userId to event data


        const updatedEvent = await updateEvent(id, updatedData);
        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Controller to delete an event
 */
export const removeEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deleteEvent(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
