import Event from "../models/event.js";
import RegistraterEvents from "../models/registraterEvents.js";
import AppError from "../utils/AppError.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

export const registerForEvent = async (userId, eventId, userRole) => {
  try {

    if (isAdmin(userRole)) {
        throw new AppError(
          "FORBIDDEN",
          "Administrators cannot register for events"
        );
      }

    const existingRegistration = await RegistraterEvents.findOne({
      where: { userId, eventId },
    });

    if (existingRegistration) {
      throw new AppError(
        "ALREADY_EXISTS",
        "You are already registered for this event"
      );
    }

    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      throw new AppError("NOT_FOUND", "Event not found");
    }

    // Check event date
    const today = new Date().toISOString().split("T")[0];
    if (event.startDate < today) {
      throw new AppError(
        "EVENT_EXPIRED",
        "This event has already started or ended"
      );
    }

    // Validate payment details if event is paid
    if (event.price > 0) {
        if (!paymentDetails?.amount || !paymentDetails?.name) {
          throw new AppError("PAYMENT_REQUIRED", "Amount and name are required for paid events");
        }
  
        // Verify amount matches event price
        if (parseFloat(paymentDetails.amount) !== parseFloat(event.price)) {
          throw new AppError("INVALID_PAYMENT", "Payment amount does not match event price");
        }
      }
  
      // Create registration with pending payment status for paid events
      const registration = await RegistraterEvents.create({
        userId,
        eventId,
        registeredAt: new Date(),
        paymentStatus: event.price > 0 ? 'Pending' : 'Free',
        amount: event.price > 0 ? event.price : 0,
        currency: event.currency,
        payerName: paymentDetails?.name || null
      });
  
      return {
        registration,
        paymentDetails: event.price > 0 ? {
          amount: event.price,
          currency: event.currency,
          status: 'Pending',
          payerName: paymentDetails.name
        } : null
      };
  
  } catch (error) {
    // If it's our custom error, throw it directly
    if (error instanceof AppError) {
      throw error;
    }
  
    throw new AppError("SERVER_ERROR", "Unable to process registration");
  }
};

export const getRegisterEvents = async (req) => {
    try {
        let registrations;
        // If admin, get all registrations with user and event details
        if (isAdmin(req.user.role)) {
            registrations = await RegistraterEvents.findAll();
        } 
        // If regular user, only get their registrations
        else {
            registrations = await RegistraterEvents.findAll({
                where: { userId: req.user.id }
            });
        }
        return registrations;
    } catch (error) {
        throw new AppError("SERVER_ERROR", "Unable to fetch registrations");
    }
};

