import type { UserData } from '../types/types';
import { ROLE_ROUTES } from '../types/constants';

export const getRedirectPath = (userData: UserData): string => {
  const allRoles = [
    userData.primaryRole.toLowerCase(),
    ...userData.additionalRoles.map((role: string) => role.toLowerCase()),
  ];

  for (const role of Object.keys(ROLE_ROUTES)) {
    if (allRoles.includes(role)) {
      return ROLE_ROUTES[role as keyof typeof ROLE_ROUTES];
    }
  }
  
  throw new Error("Rol de usuario no reconocido");
};

export const saveRememberedUsername = (username: string, remember: boolean) => {
  try {
    if (remember) {
      localStorage.setItem("rememberedUsername", username);
    } else {
      localStorage.removeItem("rememberedUsername");
    }
  } catch (error) {
    console.warn("Error saving username to localStorage:", error);
  }
};

export const getRememberedUsername = (): string | null => {
  try {
    return localStorage.getItem("rememberedUsername");
  } catch (error) {
    console.warn("Error reading username from localStorage:", error);
    return null;
  }
};

export const saveUserData = (userData: UserData) => {
  try {
    localStorage.setItem("user", JSON.stringify(userData));
  } catch (error) {
    console.warn("Error saving user data to localStorage:", error);
  }
};