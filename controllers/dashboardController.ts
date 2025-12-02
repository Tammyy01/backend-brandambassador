import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Contact from '../models/Contact';
import Reimbursement from '../models/Reimbursement';
import Call from '../models/Call';
import Event from '../models/Event';
import { sendSuccessResponse, sendNotFoundResponse, sendServerErrorResponse } from '../helpers/responses/httpResponses';

export class DashboardController {
  static async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      // Get contacts count
      const contactsCount = await Contact.countDocuments({ applicationId: user._id });

      // Get reimbursements stats
      const reimbursementStats = await Reimbursement.aggregate([
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
            }
          }
        }
      ]);

      const stats = reimbursementStats[0] || { totalPending: 0, totalApproved: 0, totalPaid: 0 };
      const totalEarnings = stats.totalApproved + stats.totalPaid;

      // Get completed calls count
      const callsCount = await Call.countDocuments({ applicationId: user._id });

      return sendSuccessResponse(res, 'Dashboard stats retrieved', {
        contactsCount,
        totalEarnings,
        pendingReimbursements: stats.totalPending,
        callsCount
      });
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve dashboard stats: ' + error.message);
    }
  }

  static async getChartData(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { type } = req.query;

      const user = await User.findById(userId);
      if (!user) {
        return sendNotFoundResponse(res, 'User not found');
      }

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1); // Start of the month
      sixMonthsAgo.setHours(0, 0, 0, 0);

      let model: any;
      let matchQuery: any = {
        createdAt: { $gte: sixMonthsAgo }
      };

      if (type === 'calls') {
        model = Call;
        matchQuery.applicationId = user._id;
      } else if (type === 'earnings') {
        model = Reimbursement;
        matchQuery.applicationId = user._id;
        matchQuery.status = { $in: ['approved', 'paid'] };
      } else if (type === 'events') {
        model = Event;
        matchQuery.attendees = user._id;
        matchQuery.date = { $gte: sixMonthsAgo }; // Events use 'date' instead of 'createdAt' usually
        delete matchQuery.createdAt;
      } else {
        // Default to contacts
        model = Contact;
        matchQuery.applicationId = user._id;
      }

      const aggregatePipeline: any[] = [
        { $match: matchQuery },
        {
          $group: {
            _id: { 
              month: { $month: type === 'events' ? "$date" : "$createdAt" }, 
              year: { $year: type === 'events' ? "$date" : "$createdAt" } 
            },
            value: { $sum: type === 'earnings' ? "$amount" : 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ];

      const data = await model.aggregate(aggregatePipeline);

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dataMap = new Map();
      data.forEach((e: any) => {
        const key = `${e._id.year}-${e._id.month}`;
        dataMap.set(key, e.value);
      });

      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const key = `${year}-${month}`;
        const label = monthNames[d.getMonth()];
        
        chartData.push({
          period: label,
          value: dataMap.get(key) || 0
        });
      }

      return sendSuccessResponse(res, 'Chart data retrieved', { chartData });
    } catch (error: any) {
      return sendServerErrorResponse(res, 'Failed to retrieve chart data: ' + error.message);
    }
  }
}
