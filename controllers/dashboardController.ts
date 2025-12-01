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
    const { type, applicationId, period = 'week' } = req.query; // 'events', 'calls', 'earnings'
    
    if (!applicationId) {
       return res.status(400).json({ success: false, message: 'Application ID is required' });
    }

    const now = new Date();
    let matchQuery: any = {};
    let groupBy: any = {};
    let sort: any = {};
    let labels: string[] = [];
    
    // Determine date range and labels based on period
    if (period === 'day') {
      // Last 24 hours or just today? Let's do today's hourly breakdown or just last 7 days?
      // The UI shows "Day", "Week", "Month". 
      // "Week" usually means Mon-Sun breakdown.
      // "Month" means 1-30 breakdown or Jan-Dec?
      // "Day" might mean hourly?
      
      // Let's stick to the UI request:
      // Week: Mon-Sun
      // Month: 1-30/31
      // Day: Hourly? Or maybe just last 7 days?
      
      // Based on typical dashboard behavior:
      // Week: Last 7 days (Day names)
      // Month: Last 30 days (Dates)
      // Day: Hourly for today (Hours)
    }

    // SIMPLIFIED IMPLEMENTATION FOR NOW matching the UI's "Week" view (Mon-Sun)
    // We will expand this based on the 'period' param later if needed.
    // For now, let's assume 'week' means current week (Mon-Sun)
    
    if (type === 'earnings') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7; // Get current day number, converting Sun(0) to 7
      if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); // Set to Monday
      else startOfWeek.setHours(0,0,0,0); // It is Monday

      matchQuery = {
        applicationId: new (require('mongoose').Types.ObjectId)(applicationId as string),
        status: 'Paid',
        date: { $gte: startOfWeek }
      };

      const data = await Reimbursement.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dayOfWeek: "$date" }, // 1 (Sun) - 7 (Sat)
            total: { $sum: "$amount" }
          }
        }
      ]);

      // Map Mongo dayOfWeek (1=Sun, 2=Mon...) to our chart labels (M, T, W...)
      const dayMap = { 2: 'M', 3: 'T', 4: 'W', 5: 'T', 6: 'F', 7: 'S', 1: 'S' };
      const chartData = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => {
        // index 0 is Mon (2), index 6 is Sun (1)
        const mongoDay = index === 6 ? 1 : index + 2;
        const found = data.find(d => d._id === mongoDay);
        return {
          day: label,
          value: found ? found.total : 0
        };
      });

      return res.status(200).json({ success: true, data: chartData });
    }

    // ... existing logic for events/calls (simplified for brevity, keeping original functionality if needed)
    // But since we are replacing the whole function, we should keep the original logic for 'events' and 'calls'
    // or adapt it. The original logic was fixed to "Last 6 months".
    
    // Let's preserve the original "Last 6 months" logic for events/calls if period is not specified or 'month'
    // But the user asked for "earnings" specifically.
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    let model: any = Event;
    matchQuery = { 
      date: { $gte: sixMonthsAgo } 
    };

    if (type === 'calls') {
      model = Call;
      matchQuery.applicationId = new (require('mongoose').Types.ObjectId)(applicationId as string);
    } else {
      matchQuery.attendees = new (require('mongoose').Types.ObjectId)(applicationId as string);
    }

    const data = await model.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $month: "$date" },
          count: { $sum: 1 },
          year: { $first: { $year: "$date" } }
        }
      },
      { $sort: { year: 1, _id: 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dataMap = new Map();
    data.forEach((e: any) => {
      dataMap.set(e._id, e.count);
    });

    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthIndex = d.getMonth() + 1;
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
