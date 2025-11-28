import { Request, Response } from 'express';
import Call from '../models/Call';

export const logCall = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { contactId, notes } = req.body;

    const call = new Call({
      applicationId,
      contactId,
      notes,
      status: 'Initiated',
    });

    await call.save();

    res.status(201).json({
      success: true,
      data: call,
    });
  } catch (error: any) {
    console.error('Error logging call:', error);
    res.status(500).json({
      success: false,
      message: 'Server error logging call',
      error: error.message,
    });
  }
};

export const getCalls = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;

    const calls = await Call.find({ applicationId })
      .sort({ date: -1 })
      .populate('contactId', 'name avatar company'); // Populate contact details

    res.status(200).json({
      success: true,
      data: calls,
    });
  } catch (error: any) {
    console.error('Error fetching calls:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching calls',
      error: error.message,
    });
  }
};
