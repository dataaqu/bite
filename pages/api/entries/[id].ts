import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Entry ID is required' });
  }

  try {
    if (req.method === 'PUT') {
      // Update food entry
      const { user_id, analysis_data } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      const entry = await Database.updateFoodEntry(id, user_id, analysis_data);
      
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.status(200).json({ entry });

    } else if (req.method === 'DELETE') {
      // Delete food entry
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      const deleted = await Database.deleteFoodEntry(id, user_id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.status(200).json({ message: 'Entry deleted successfully' });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Entry API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}