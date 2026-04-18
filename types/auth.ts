// types/auth.ts - TypeScript type definitions for authentication

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  department?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserRole = 'admin' | 'manager' | 'employee' | 'inventory_staff';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  refreshToken?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  error: string | null;
}

export interface SupplyLog {
  id: string;
  employeeId: string;
  employeeName: string;
  supplyId: string;
  supplyName: string;
  quantity: number;
  issuedDate: Date;
  returnedDate?: Date;
  issuedBy: string;
  status: SupplyStatus;
  notes?: string;
}

export type SupplyStatus = 'available' | 'issued' | 'returned' | 'damaged';

export interface Supply {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  status: SupplyStatus;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  extensionName?: string;
  email: string;
  department: string;
  role: string;
  phone?: string;
  status: 'active' | 'inactive' | 'on-leave';
  createdAt: Date;
  updatedAt: Date;
}
