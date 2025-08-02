export type LoginStage = "idle" | "loading" | "success" | "redirecting";
export type MediaMode = "video" | "image";
export type VideoFormat = "fullhd" | "short";
export type VideoType = "youtube" | "local";

export interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
  showPassword: boolean;
  usernameError?: string;
}

export interface UserData {
  primaryRole: string;
  additionalRoles: string[];
}