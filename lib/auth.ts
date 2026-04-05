// Auth context and utilities for managing user sessions

export type UserRole = "minorista" | "mayorista" | "admin";
export type UserStatus = "active" | "inactive" | "pending_approval" | "rejected";

export interface User {
  id: string; // UUID
  auth_id?: string; // UUID
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;

  // Wholesale specific
  company_name?: string;
  company_ruc?: string;
  company_address?: string;

  show_prices: boolean;

  created_at: Date;
  updated_at: Date;
}

// Mock users for demonstration (matching DB schema)
const mockUsers: User[] = [
  {
    id: "uuid-1",
    auth_id: "auth-1",
    email: "admin@donchicho.com",
    name: "Administrador",
    role: "admin",
    status: "active",
    show_prices: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: "uuid-2",
    auth_id: "auth-2",
    email: "cliente@example.com",
    name: "Cliente Demo",
    role: "minorista",
    phone: "+593 99 999 9999",
    status: "active",
    show_prices: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// Simple auth functions (mock implementation)
export async function login(email: string, password: string): Promise<User | null> {
  // In production, this would validate against Supabase
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

  const user = mockUsers.find((u) => u.email === email);
  // Password check is mocked
  if (user && password) {
    return user;
  }
  return null;
}

export async function register(email: string, password: string, name: string, phone?: string): Promise<User | null> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check if user already exists
  if (mockUsers.some((u) => u.email === email)) {
    return null;
  }

  const newUser: User = {
    id: `uuid-${mockUsers.length + 1}`,
    email,
    name,
    role: "minorista", // default
    status: "active",
    phone,
    show_prices: false, // default for minorista
    created_at: new Date(),
    updated_at: new Date(),
  };

  mockUsers.push(newUser);
  return newUser;
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;

  const userJson = localStorage.getItem("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null) {
  if (typeof window === "undefined") return;

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }
}

export function logout() {
  setCurrentUser(null);
}
