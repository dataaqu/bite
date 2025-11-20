import { v4 as uuidv4 } from 'uuid';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export class AuthService {
  private static readonly USER_KEY = 'bite_user';
  private static readonly TEMP_USER_KEY = 'bite_temp_user_id';

  // Check if user is logged in
  static getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    
    return null;
  }

  // Get or create temporary user ID for anonymous usage
  static getTempUserId(): string {
    if (typeof window === 'undefined') return uuidv4();
    
    let tempId = localStorage.getItem(this.TEMP_USER_KEY);
    if (!tempId) {
      tempId = uuidv4();
      localStorage.setItem(this.TEMP_USER_KEY, tempId);
    }
    return tempId;
  }

  // Login with email and name
  static async login(email: string, name: string): Promise<AuthUser> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { user } = await response.json();
    
    // Store user data in localStorage
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    // Remove temporary user ID
    localStorage.removeItem(this.TEMP_USER_KEY);
    
    return user;
  }

  // Logout
  static logout(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.USER_KEY);
    // Generate new temp ID
    localStorage.setItem(this.TEMP_USER_KEY, uuidv4());
  }

  // Get current user ID (authenticated or temporary)
  static getCurrentUserId(): string {
    const user = this.getCurrentUser();
    if (user) {
      return user.id;
    }
    return this.getTempUserId();
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}