export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}