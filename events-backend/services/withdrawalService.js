
import WithdrawalRequest from '../models/withdrawalRequest.js';
import RegistraterEvents from '../models/registraterEvents.js';
import AppError from '../utils/AppError.js';

export const createWithdrawalRequest = async (userId, registerID, reason, comment, document) => {
    // Check if the user is registered for the event and if payment is completed
    const registration = await RegistraterEvents.findOne({
        where: { userId, id: registerID, paymentStatus: 'Completed' }, // Use registerID here
    });

    if (!registration) {
        throw new AppError(404, 'Registration not found or payment not completed');
    }
    
    // Create the withdrawal request
    const withdrawalRequest = await WithdrawalRequest.create({
        userId,
        registerID, // Ensure registerID is passed correctly
        reason,
        comment,
        document,
    });
    return withdrawalRequest;
};