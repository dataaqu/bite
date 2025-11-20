import { sql } from '@vercel/postgres';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface FoodEntryDB {
  id: string;
  user_id: string;
  timestamp: number;
  image_url?: string;
  analysis_data?: any;
  user_provided_weight?: number;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  calorie_goal: number;
  updated_at: string;
}

// Database helper functions
export class Database {
  
  // User operations
  static async createUser(email: string, name: string): Promise<User> {
    const result = await sql`
      INSERT INTO users (email, name) 
      VALUES (${email}, ${name}) 
      RETURNING *
    `;
    return result.rows[0] as User;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `;
    return result.rows[0] as User || null;
  }

  static async getUserById(userId: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `;
    return result.rows[0] as User || null;
  }

  // Food entries operations
  static async createFoodEntry(
    userId: string,
    timestamp: number,
    imageUrl?: string,
    analysisData?: any,
    userProvidedWeight?: number
  ): Promise<FoodEntryDB> {
    const result = await sql`
      INSERT INTO food_entries (user_id, timestamp, image_url, analysis_data, user_provided_weight)
      VALUES (${userId}, ${timestamp}, ${imageUrl}, ${JSON.stringify(analysisData)}, ${userProvidedWeight})
      RETURNING *
    `;
    return result.rows[0] as FoodEntryDB;
  }

  static async getFoodEntries(userId: string, fromDate?: Date, toDate?: Date): Promise<FoodEntryDB[]> {
    let query = sql`
      SELECT * FROM food_entries 
      WHERE user_id = ${userId}
    `;

    if (fromDate && toDate) {
      const fromTimestamp = fromDate.getTime();
      const toTimestamp = toDate.getTime();
      query = sql`
        SELECT * FROM food_entries 
        WHERE user_id = ${userId} 
        AND timestamp >= ${fromTimestamp} 
        AND timestamp <= ${toTimestamp}
      `;
    }

    query = sql`${query} ORDER BY timestamp DESC`;
    
    const result = await query;
    return result.rows as FoodEntryDB[];
  }

  static async updateFoodEntry(
    id: string,
    userId: string,
    analysisData: any
  ): Promise<FoodEntryDB | null> {
    const result = await sql`
      UPDATE food_entries 
      SET analysis_data = ${JSON.stringify(analysisData)}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] as FoodEntryDB || null;
  }

  static async deleteFoodEntry(id: string, userId: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM food_entries 
      WHERE id = ${id} AND user_id = ${userId}
    `;
    return result.rowCount > 0;
  }

  // User settings operations
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    const result = await sql`
      SELECT * FROM user_settings WHERE user_id = ${userId} LIMIT 1
    `;
    return result.rows[0] as UserSettings || null;
  }

  static async createOrUpdateUserSettings(
    userId: string,
    calorieGoal: number
  ): Promise<UserSettings> {
    const result = await sql`
      INSERT INTO user_settings (user_id, calorie_goal)
      VALUES (${userId}, ${calorieGoal})
      ON CONFLICT (user_id)
      DO UPDATE SET 
        calorie_goal = ${calorieGoal},
        updated_at = NOW()
      RETURNING *
    `;
    return result.rows[0] as UserSettings;
  }

  // Initialize database tables (run once)
  static async initializeTables(): Promise<void> {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS food_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        timestamp BIGINT NOT NULL,
        image_url TEXT,
        analysis_data JSONB,
        user_provided_weight INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        calorie_goal INTEGER DEFAULT 2200,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_food_entries_user_timestamp 
      ON food_entries(user_id, timestamp)
    `;
  }
}