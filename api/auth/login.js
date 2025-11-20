import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Check if user exists
    let result = await sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `;
    
    let user = result.rows[0];
    
    if (!user) {
      // Create new user
      result = await sql`
        INSERT INTO users (email, name) 
        VALUES (${email}, ${name}) 
        RETURNING *
      `;
      user = result.rows[0];
      
      // Create default settings
      await sql`
        INSERT INTO user_settings (user_id, calorie_goal)
        VALUES (${user.id}, 2200)
        ON CONFLICT (user_id) DO NOTHING
      `;
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
};