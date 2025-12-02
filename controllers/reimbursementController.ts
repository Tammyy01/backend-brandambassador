import { Request, Response } from 'express'
import User from '../models/User'
import Reimbursement from '../models/Reimbursement'
import { sendSuccessResponse, sendBadRequestResponse, sendNotFoundResponse, sendServerErrorResponse } from '../helpers/responses/httpResponses'

export class ReimbursementController {
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params
      const { status } = req.query

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const filter: any = { applicationId: user._id }
      if (status) {
        filter.status = status
      }

      const reimbursements = await Reimbursement.find(filter).sort({ createdAt: -1 })
      return sendSuccessResponse(res, 'Reimbursements retrieved', { reimbursements })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve reimbursements: ' + error.message)
    }
  }

  static async create(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params
      const { amount, description, category, receiptUrl, date } = req.body

      if (!amount || !description || !category || !date) {
        return sendBadRequestResponse(res, 'Amount, description, category, and date are required')
      }

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const reimbursement = await Reimbursement.create({
        applicationId: user._id,
        amount,
        description,
        category,
        receiptUrl,
        date,
        status: 'pending'
      })

      return sendSuccessResponse(res, 'Reimbursement request created', { reimbursement })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to create reimbursement request: ' + error.message)
    }
  }

  static async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params

      const user = await User.findById(userId)
      if (!user) {
        return sendNotFoundResponse(res, 'User not found')
      }

      const stats = await Reimbursement.aggregate([
        { $match: { applicationId: user._id } },
        {
          $group: {
            _id: null,
            totalPending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
            },
            totalApproved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0] }
            },
            totalPaid: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
            },
            totalRejected: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0] }
            }
          }
        }
      ])

      return sendSuccessResponse(res, 'Reimbursement stats retrieved', {
        stats: stats[0] || { totalPending: 0, totalApproved: 0, totalPaid: 0, totalRejected: 0 }
      })
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve reimbursement stats: ' + error.message)
    }
  }

  // Admin: List all reimbursements
  static async listAll(req: Request, res: Response): Promise<Response> {
    try {
      const { status } = req.query;
      const filter: any = {};
      
      if (status && status !== 'all') {
        filter.status = status;
      }

      const reimbursements = await Reimbursement.find(filter)
        .populate('applicationId', 'name email') // Populate user details
        .sort({ createdAt: -1 });

      return sendSuccessResponse(res, 'All reimbursements retrieved', { reimbursements });
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve all reimbursements: ' + error.message);
    }
  }

  // Admin: Update status
  static async updateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const reimbursementId = id;
      const { status, adminNote } = req.body;

      if (!['pending', 'approved', 'rejected', 'paid'].includes(status)) {
        return sendBadRequestResponse(res, 'Invalid status');
      }

      const reimbursement = await Reimbursement.findByIdAndUpdate(
        reimbursementId,
        { 
          status, 
          adminNote,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!reimbursement) {
        return sendNotFoundResponse(res, 'Reimbursement not found');
      }

      return sendSuccessResponse(res, 'Reimbursement status updated', { reimbursement });
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to update reimbursement status: ' + error.message);
    }
  }
}
