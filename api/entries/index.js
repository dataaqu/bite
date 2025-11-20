import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get food entries
      const { user_id, date } = req.query;

      if (!user_id || typeof user_id !== 'string') {
        return res.status(400).json({ error: 'user_id is required' });
      }

      let entries;
      
      if (date && typeof date === 'string') {
        // Get entries for specific date
        const targetDate = new Date(date);
        const fromTimestamp = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
        const toTimestamp = fromTimestamp + 24 * 60 * 60 * 1000 - 1; // End of day
        
        const result = await sql`
          SELECT * FROM food_entries 
          WHERE user_id = ${user_id} 
          AND timestamp >= ${fromTimestamp} 
          AND timestamp <= ${toTimestamp}
          ORDER BY timestamp DESC
        `;
        entries = result.rows;
      } else {
        // Get all entries for user
        const result = await sql`
          SELECT * FROM food_entries 
          WHERE user_id = ${user_id}
          ORDER BY timestamp DESC
        `;
        entries = result.rows;
      }
      
      res.status(200).json({ entries });

    } else if (req.method === 'POST') {
      // Create new food entry
      const { user_id, timestamp, image_url, analysis_data, user_provided_weight } = req.body;

      if (!user_id || !timestamp) {
        return res.status(400).json({ error: 'user_id and timestamp are required' });
      }

      const result = await sql`
        INSERT INTO food_entries (user_id, timestamp, image_url, analysis_data, user_provided_weight)
        VALUES (${user_id}, ${timestamp}, ${image_url}, ${JSON.stringify(analysis_data)}, ${user_provided_weight})
        RETURNING *
      `;

      res.status(201).json({ entry: result.rows[0] });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Entries API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}