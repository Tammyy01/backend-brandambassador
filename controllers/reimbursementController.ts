import { Request, Response } from 'express';
import Reimbursement from '../models/Reimbursement';

export const createReimbursement = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { event, date, expenseType, amount, receiptImage, note } = req.body;

    const reimbursement = new Reimbursement({
      applicationId,
      event,
      date,
      expenseType,
      amount,
      receiptImage,
      note,
    });

    await reimbursement.save();

    res.status(201).json({
      success: true,
      data: reimbursement,
    });
  } catch (error: any) {
    console.error('Error creating reimbursement:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating reimbursement',
      error: error.message,
    });
  }
};

export const getReimbursements = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.query;

    const query: any = { applicationId };
    if (status && status !== 'all') {
      query.status = { $regex: new RegExp(`^${status}$`, 'i') }; // Case-insensitive match
    }

    const reimbursements = await Reimbursement.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: reimbursements,
    });
  } catch (error: any) {
    console.error('Error fetching reimbursements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reimbursements',
      error: error.message,
    });
  }
};

export const getReimbursementStats = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;

    const stats = await Reimbursement.aggregate([
      { $match: { applicationId: new (require('mongoose').Types.ObjectId)(applicationId) } },
      {
        $group: {
          _id: null,
          totalSubmitted: { $sum: '$amount' },
          totalApproved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Approved'] }, '$amount', 0],
            },
          },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    const result = stats[0] || { totalSubmitted: 0, totalApproved: 0, totalPaid: 0 };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching reimbursement stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reimbursement stats',
      error: error.message,
    });
  }
};
export const getAllReimbursements = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const query: any = {};
    if (status && status !== 'all') {
      query.status = { $regex: new RegExp(`^${status}$`, 'i') };
    }

    const reimbursements = await Reimbursement.find(query)
      .sort({ date: -1 })
      .populate('applicationId', 'firstName lastName email'); // Assuming UserProfile/Application has these fields

    res.status(200).json({
      success: true,
      data: reimbursements,
    });
  } catch (error: any) {
    console.error('Error fetching all reimbursements:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching all reimbursements',
      error: error.message,
    });
  }
};

export const updateReimbursementStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Paid', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const reimbursement = await Reimbursement.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!reimbursement) {
      return res.status(404).json({
        success: false,
        message: 'Reimbursement not found',
      });
    }

    res.status(200).json({
      success: true,
      data: reimbursement,
    });
  } catch (error: any) {
    console.error('Error updating reimbursement status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating reimbursement status',
      error: error.message,
    });
  }
};
