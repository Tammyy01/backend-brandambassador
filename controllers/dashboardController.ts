import { Request, Response } from 'express';
import Event from '../models/Event';
import Contact from '../models/Contact';
import UserProfile from '../models/UserProfile';
import Reimbursement from '../models/Reimbursement';
import Call from '../models/Call';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // In a real app, we would filter by the current user's applicationId
    // For now, we'll just count total documents or assume some context if available
    // Ideally, we should pass applicationId in query or headers
    
    const totalEvents = await Event.countDocuments();
    const totalContacts = await Contact.countDocuments();
    const activeUsers = await UserProfile.countDocuments({ isProfileCompleted: true });

    // New stats
    const totalCalls = await Call.countDocuments();
    
    // Calculate total rewards (paid reimbursements)
    const rewardsStats = await Reimbursement.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRewards = rewardsStats[0]?.total || 0;

    // Calculate engagement rate
    const avgContactsPerUser = activeUsers > 0 ? (totalContacts / activeUsers) : 0;
    const engagementRate = avgContactsPerUser.toFixed(1);

    res.status(200).json({
      totalEvents,
      totalContacts,
      activeUsers,
      engagementRate: `${engagementRate}%`,
      totalCalls,
      totalRewards
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

export const getChartData = async (req: Request, res: Response) => {
  try {
    // In a real app, filter by user. For now, global events.
    // We want to group events by month for the last 6 months or so.
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Go back 5 months + current = 6
    
    const events = await Event.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $month: "$date" },
          count: { $sum: 1 },
          year: { $first: { $year: "$date" } } // Keep year to sort correctly if needed
        }
      },
      { $sort: { year: 1, _id: 1 } }
    ]);

    // Map month numbers to labels (e.g., 1 -> Jan)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Create a map of existing data
    const dataMap = new Map();
    events.forEach((e: any) => {
      dataMap.set(e._id, e.count);
    });

    // Generate last 6 months labels and values (filling 0 for missing months)
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthIndex = d.getMonth() + 1; // 1-based for mongo aggregation match
      const label = monthNames[d.getMonth()];
      
      chartData.push({
        period: label,
        value: dataMap.get(monthIndex) || 0
      });
    }

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Server error fetching chart data' });
  }
};
