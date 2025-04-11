
import { getRegisterEvents, registerForEvent } from '../services/eventRegistrationService.js';
import  {handleError } from '../utils/AppError.js';

// Register for an event
export const createEventRegistration = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role; // This is the role from the token
        const eventId = req.params.id;
        const { role, amount, name, cardNumber } = req.body;

        // Determine the role for registration
        const registrationRole = role === 'Exhibitor' ? 'Exhibitor' : 'Attendee';

        // If the role is Exhibitor, we don't need payment details
        if (registrationRole === 'Exhibitor') {
            const result = await registerForEvent(userId, eventId, userRole, registrationRole, {
                registerCode: req.body.registerCode // Only require the registration code
            });

            return res.status(201).json({
                success: true,
                message: 'Successfully registered for the event as Exhibitor',
                data: {
                    registration: result.registration,
                    payment: result.paymentDetails
                }
            });
        } else {
            // For Attendees, we need to pass payment details
            const result = await registerForEvent(userId, eventId, userRole, registrationRole, {
                amount,
                name,
                cardNumber
            });

            return res.status(201).json({
                success: true,
                message: 'Successfully registered for the event as Attendee',
                data: {
                    registration: result.registration,
                    payment: result.paymentDetails
                }
            });
        }
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


