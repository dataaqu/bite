import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const id = req.query.id || req.url.split('/').pop();
  
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

      const result = await sql`
        UPDATE food_entries 
        SET analysis_data = ${JSON.stringify(analysis_data)}
        WHERE id = ${id} AND user_id = ${user_id}
        RETURNING *
      `;
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.status(200).json({ entry: result.rows[0] });

    } else if (req.method === 'DELETE') {
      // Delete food entry
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
      }

      const result = await sql`
        DELETE FROM food_entries 
        WHERE id = ${id} AND user_id = ${user_id}
      `;
      
      if (result.rowCount === 0) {
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
};