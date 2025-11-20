import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Check if user exists
    let user = await Database.getUserByEmail(email);
    
    if (!user) {
      // Create new user
      user = await Database.createUser(email, name);
      
      // Create default settings
      await Database.createOrUpdateUserSettings(user.id, 2200);
    }

    res.status(200).json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}