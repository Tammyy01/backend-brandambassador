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
