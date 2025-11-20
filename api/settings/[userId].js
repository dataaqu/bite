import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const userId = req.query.userId || req.url.split('/').pop();
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get user settings
      const result = await sql`
        SELECT * FROM user_settings WHERE user_id = ${userId} LIMIT 1
      `;
      
      let settings = result.rows[0];
      
      if (!settings) {
        // Create default settings if none exist
        const createResult = await sql`
          INSERT INTO user_settings (user_id, calorie_goal)
          VALUES (${userId}, 2200)
          RETURNING *
        `;
        settings = createResult.rows[0];
      }

      res.status(200).json({ settings });

    } else if (req.method === 'PUT') {
      // Update user settings
      const { calorie_goal } = req.body;

      if (!calorie_goal || typeof calorie_goal !== 'number') {
        return res.status(400).json({ error: 'calorie_goal is required and must be a number' });
      }

      const result = await sql`
        INSERT INTO user_settings (user_id, calorie_goal)
        VALUES (${userId}, ${calorie_goal})
        ON CONFLICT (user_id)
        DO UPDATE SET 
          calorie_goal = ${calorie_goal},
          updated_at = NOW()
        RETURNING *
      `;
      
      res.status(200).json({ settings: result.rows[0] });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Settings API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};