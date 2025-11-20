import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get user settings
      const settings = await Database.getUserSettings(userId);
      
      if (!settings) {
        // Create default settings if none exist
        const newSettings = await Database.createOrUpdateUserSettings(userId, 2200);
        return res.status(200).json({ settings: newSettings });
      }

      res.status(200).json({ settings });

    } else if (req.method === 'PUT') {
      // Update user settings
      const { calorie_goal } = req.body;

      if (!calorie_goal || typeof calorie_goal !== 'number') {
        return res.status(400).json({ error: 'calorie_goal is required and must be a number' });
      }

      const settings = await Database.createOrUpdateUserSettings(userId, calorie_goal);
      
      res.status(200).json({ settings });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Settings API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}