import RegistraterEvents from "../models/registraterEvents.js";
import WithdrawalRequest from "../models/withdrawalRequest.js";
import { createWithdrawalRequest } from "../services/withdrawalService.js";
import { handleError } from "../utils/AppError.js";

export const requestWithdrawal = async (req, res) => {
  try {
    const { registerID, reason, comment } = req.body; // Ensure registerID is included
    const userId = req.user.id; // Assuming user ID is in the token
    const document = req.file ? req.file.path : null; // Get the uploaded document path

    // Use the service to create the withdrawal request
    await createWithdrawalRequest(userId, registerID, reason, comment, document);
    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully",
    });
  } catch (error) {
    return handleError(error, req, res);
  }
};

export const getWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is in the token
    const userRole = req.user.role; // Assuming user role is in the token

    let withdrawalRequests;

    if (userRole === "admin") {
      // If the user is an admin, return all withdrawal requests
      withdrawalRequests = await WithdrawalRequest.findAll();
    } else {
      // If the user is a regular user, return only their requests
      withdrawalRequests = await WithdrawalRequest.findAll({
        where: { userId },
      });
    }

    return res.status(200).json({
      success: true,
      data: withdrawalRequests,
    });
  } catch (error) {
    return handleError(error, req, res);
  }
};

// New function to get a specific withdrawal request by ID
export const getWithdrawalRequestById = async (req, res) => {
  try {
    const { id } = req.params; // Withdrawal request ID from the request parameters
    const withdrawalRequest = await WithdrawalRequest.findByPk(id);

    if (!withdrawalRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal request not found" });
    }

    return res.status(200).json({
      success: true,
      data: withdrawalRequest,
    });
  } catch (error) {
    return handleError(error, req, res);
  }
};

// Function to manage withdrawal request status
export const manageWithdrawalRequest = async (req, res) => {
    try {
        const { id } = req.params; // Withdrawal request ID from the request parameters
        const { action } = req.body; // Action can be 'approve' or 'reject'

        // Find the withdrawal request
        const withdrawalRequest = await WithdrawalRequest.findByPk(id);
   
        if (!withdrawalRequest) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
        }

        if (action === 'Approved') {
            // Update the withdrawal request status to Approved
            withdrawalRequest.status = 'Approved';
            await withdrawalRequest.save();

            // Remove the user from the registered event
            await RegistraterEvents.destroy({
                where: {
                    id: withdrawalRequest.registerID
                },
            });

            return res.status(200).json({
                success: true,
                message: 'Withdrawal request approved and user removed from the event',
                data: withdrawalRequest,
            });
        } else if (action === 'Rejected') {
            // Update the withdrawal request status to Rejected
            withdrawalRequest.status = 'Rejected';
            await withdrawalRequest.save();

            return res.status(200).json({
                success: true,
                message: 'Withdrawal request rejected',
                data: withdrawalRequest,
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        return handleError(error, req, res);
    }
};
 