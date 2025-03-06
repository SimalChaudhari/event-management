import { getRegisterEvents, registerForEvent} from '../services/eventRegistrationService.js';
import  {handleError } from '../utils/AppError.js';

// Register for an event
export const createEventRegistration = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const eventId = req.params.id;
        const { amount, name } = req.body; // Simple payment details

        const result = await registerForEvent(userId, eventId, userRole, { amount, name });
        
        res.status(201).json({
            success: true,
            message: 'Successfully registered for the event',
            data: {
                registration: result.registration,
                payment: result.paymentDetails
            }
        });
    } catch (error) {
        return handleError(error, req, res);
    }
};

export const getRegistrations = async (req, res) => {
    try {
        const registrations = await getRegisterEvents(req);
        res.status(200).json({
            success: true,
            message: "Successfully fetched registrations",
            registrations: registrations
        });
    } catch (error) {
        return handleError(error, req, res);
    }
};
 
