import { useState, useCallback } from 'react';
import type { LoginFormData, LoginStage, UserData } from '../types/types';
import { authService } from '@/services/evaluacionITP/auth/auth.service';
import { getRedirectPath, saveRememberedUsername, saveUserData } from '../utils/auth';

interface UseLoginFormProps {
  onSuccess: (redirectPath: string) => void;
  onError: (message: string) => void;
}

export const useLoginForm = ({ onSuccess, onError }: UseLoginFormProps) => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    rememberMe: false,
    showPassword: false,
  });

  const [loginStage, setLoginStage] = useState<LoginStage>("idle");

  const updateFormData = useCallback((field: keyof LoginFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStage("loading");

    try {
      const response = await authService.login({
        user_username: formData.username,
        user_password: formData.password,
      });

      if (response.success) {
        setLoginStage("success");
        
        saveRememberedUsername(formData.username, formData.rememberMe);
        saveUserData(response.data.user);
        
        const redirectPath = getRedirectPath(response.data.user);
        
        setTimeout(() => setLoginStage("redirecting"), 800);
        onSuccess(redirectPath);
      }
    } catch (error: any) {
      setLoginStage("idle");
      onError(error.message || "Credenciales incorrectas");
    }
  }, [formData, onSuccess, onError]);

  return {
    formData,
    loginStage,
    updateFormData,
    handleLogin,
    isDisabled: loginStage !== "idle",
  };
};