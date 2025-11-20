import { FoodLogEntry, AnalysisResult } from '../types';

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DBFoodEntry {
  id: string;
  user_id: string;
  timestamp: number;
  image_url?: string;
  analysis_data?: AnalysisResult;
  user_provided_weight?: number;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  calorie_goal: number;
  updated_at: string;
}

export class APIService {
  
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Food Entries API
  static async getFoodEntries(userId: string, date?: Date): Promise<APIResponse<DBFoodEntry[]>> {
    const params = new URLSearchParams({ user_id: userId });
    if (date) {
      params.append('date', date.toISOString().split('T')[0]);
    }

    const response = await this.request<{ entries: DBFoodEntry[] }>(
      `/api/entries?${params}`
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.entries
      };
    }

    return response as APIResponse<DBFoodEntry[]>;
  }

  static async createFoodEntry(
    userId: string,
    timestamp: number,
    imageUrl?: string,
    analysisData?: AnalysisResult,
    userProvidedWeight?: number
  ): Promise<APIResponse<DBFoodEntry>> {
    const response = await this.request<{ entry: DBFoodEntry }>('/api/entries', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        timestamp,
        image_url: imageUrl,
        analysis_data: analysisData,
        user_provided_weight: userProvidedWeight
      })
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.entry
      };
    }

    return response as APIResponse<DBFoodEntry>;
  }

  static async updateFoodEntry(
    entryId: string,
    userId: string,
    analysisData: AnalysisResult
  ): Promise<APIResponse<DBFoodEntry>> {
    const response = await this.request<{ entry: DBFoodEntry }>(`/api/entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify({
        user_id: userId,
        analysis_data: analysisData
      })
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.entry
      };
    }

    return response as APIResponse<DBFoodEntry>;
  }

  static async deleteFoodEntry(entryId: string, userId: string): Promise<APIResponse<void>> {
    return this.request(`/api/entries/${entryId}`, {
      method: 'DELETE',
      body: JSON.stringify({
        user_id: userId
      })
    });
  }

  // User Settings API
  static async getUserSettings(userId: string): Promise<APIResponse<UserSettings>> {
    const response = await this.request<{ settings: UserSettings }>(`/api/settings/${userId}`);

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.settings
      };
    }

    return response as APIResponse<UserSettings>;
  }

  static async updateUserSettings(
    userId: string,
    calorieGoal: number
  ): Promise<APIResponse<UserSettings>> {
    const response = await this.request<{ settings: UserSettings }>(`/api/settings/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        calorie_goal: calorieGoal
      })
    });

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.settings
      };
    }

    return response as APIResponse<UserSettings>;
  }

  // Helper function to convert DB entry to FoodLogEntry
  static convertDBEntryToFoodLogEntry(dbEntry: DBFoodEntry): FoodLogEntry {
    return {
      id: dbEntry.id,
      timestamp: dbEntry.timestamp,
      imageUrl: dbEntry.image_url,
      analysis: dbEntry.analysis_data || null,
      loading: false,
      userProvidedWeight: dbEntry.user_provided_weight || null,
      // Don't include error field if it doesn't exist
    };
  }

  // Helper function to convert multiple DB entries
  static convertDBEntriesToFoodLogEntries(dbEntries: DBFoodEntry[]): FoodLogEntry[] {
    return dbEntries.map(this.convertDBEntryToFoodLogEntry);
  }
}