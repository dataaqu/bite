import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get food entries
      const { user_id, date } = req.query;

      if (!user_id || typeof user_id !== 'string') {
        return res.status(400).json({ error: 'user_id is required' });
      }

      let fromDate, toDate;
      
      if (date && typeof date === 'string') {
        // Get entries for specific date
        const targetDate = new Date(date);
        fromDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        toDate = new Date(fromDate.getTime() + 24 * 60 * 60 * 1000 - 1); // End of day
      }

      const entries = await Database.getFoodEntries(user_id, fromDate, toDate);
      
      res.status(200).json({ entries });

    } else if (req.method === 'POST') {
      // Create new food entry
      const { user_id, timestamp, image_url, analysis_data, user_provided_weight } = req.body;

      if (!user_id || !timestamp) {
        return res.status(400).json({ error: 'user_id and timestamp are required' });
      }

      const entry = await Database.createFoodEntry(
        user_id,
        timestamp,
        image_url,
        analysis_data,
        user_provided_weight
      );

      res.status(201).json({ entry });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Entries API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}