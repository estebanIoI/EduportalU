"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/evaluacionITP/auth/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginForm } from "./components/LoginForm";
import { LoginHeader } from "./components/LoginHeader";
import { LoginFooter } from "./components/LoginFooter";
import { LoginButton } from "./components/LoginButton";
import { MediaContent } from "./components/MediaContent";
import { MediaToggleButton } from "./components/MediaToggleButton";
import { useMediaDetection } from "./hooks/useMediaDetection";
import { getLayoutClasses } from "./utils/layout.utils";
import { ROLE_ROUTES, MEDIA_CONFIG, LOGOS } from "./types/constants";
import type { LoginFormData, LoginStage, MediaMode, VideoType, VideoFormat } from "./types/types";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    rememberMe: false,
    showPassword: false,
  });

  const [loginStage, setLoginStage] = useState<LoginStage>("idle");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaMode>("video");
  const [videoType, setVideoType] = useState<VideoType>("youtube");
  const [isFormValid, setIsFormValid] = useState(false); // Added state for form validation
  const { videoFormat } = useMediaDetection(videoType);

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setFormData((prev) => ({
        ...prev,
        username: savedUsername,
        rememberMe: true,
      }));
    }
    setTimeout(() => setIsPageLoaded(true), 100);
  }, []);

  const updateFormData = useCallback((field: keyof LoginFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleMediaMode = useCallback(() => {
    setMediaMode((prev) => (prev === "video" ? "image" : "video"));
  }, []);

  // Added callback for video format detection
  const handleVideoFormatDetected = useCallback((format: VideoFormat) => {
    // Handle video format detection if needed
    console.log("Video format detected:", format);
  }, []);

  // Added the missing handleValidationChange function
  const handleValidationChange = useCallback((isValid: boolean) => {
    setIsFormValid(isValid);
  }, []);

  const getRedirectPath = useCallback((userData: any): string => {
    const allRoles = [
      userData.primaryRole.toLowerCase(),
      ...userData.additionalRoles.map((rol: string) => rol.toLowerCase()),
    ];

    for (const role of Object.keys(ROLE_ROUTES)) {
      if (allRoles.includes(role)) {
        return ROLE_ROUTES[role as keyof typeof ROLE_ROUTES];
      }
    }
    throw new Error("Rol de usuario no reconocido");
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

        if (formData.rememberMe) {
          localStorage.setItem("rememberedUsername", formData.username);
        } else {
          localStorage.removeItem("rememberedUsername");
        }

        localStorage.setItem("user", JSON.stringify(response.data.user));

        const redirectPath = getRedirectPath(response.data.user);

        toast({
          title: "Bienvenido",
          description: response.message,
        });

        setTimeout(() => setLoginStage("redirecting"), 800);
        setTimeout(() => router.replace(redirectPath), 1500);
      }
    } catch (error: any) {
      setLoginStage("idle");
      toast({
        title: "Error de autenticación",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      });
    }
  }, [formData, getRedirectPath, router, toast]);

  const isDisabled = loginStage !== "idle";
  const animationClass = `transition-all duration-700 ease-out ${
    isPageLoaded
      ? "translate-y-0 opacity-100 scale-100"
      : "translate-y-8 opacity-0 scale-95"
  }`;

  const layoutClasses = getLayoutClasses(videoFormat);

  return (
    <div className={layoutClasses.container}>
      {/* Background Overlay */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 scale-110">
          <MediaContent
            mediaMode={mediaMode}
            videoType={videoType}
            videoFormat={videoFormat}
            onVideoError={() => setVideoType("youtube")}
            onVideoFormatDetected={handleVideoFormatDetected}
          />
        </div>
        <div className="absolute inset-0 backdrop-blur-3xl bg-gradient-to-br from-slate-900/40 via-slate-800/30 to-slate-900/40"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-slate-900/20"></div>
      </div>

      <div className={`${layoutClasses.mainCard} ${animationClass} backdrop-blur-sm bg-white/95 shadow-2xl`}>
        {/* Media Section */}
        <div className={`${layoutClasses.mediaSection} transition-all duration-500 delay-200 ease-out 
            transform duration-300 overflow-hidden bg-black/5 backdrop-blur-none
            ${isPageLoaded ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"}`}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <MediaContent
              mediaMode={mediaMode}
              videoType={videoType}
              videoFormat={videoFormat}
              onVideoError={() => setVideoType("youtube")}
              onVideoFormatDetected={handleVideoFormatDetected}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5"></div>
          <MediaToggleButton mediaMode={mediaMode} onToggle={toggleMediaMode} />
        </div>

        {/* Login Section */}
        <div className={`${layoutClasses.loginSection} transition-all duration-500 delay-400 ease-out 
            backdrop-blur-sm bg-white/98 border-l border-white/40
            ${isPageLoaded ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"}`}>
          <div className="pt-0 px-10 pb-8">
            <LoginHeader videoFormat={videoFormat} />
            
            <LoginForm
              formData={formData}
              onUpdateFormData={updateFormData}
              onSubmit={handleLogin}
              isDisabled={isDisabled}
              videoFormat={videoFormat}
              onValidationChange={handleValidationChange}
            >
              <div className="mt-6">
                <LoginButton 
                  loginStage={loginStage} 
                  isDisabled={isDisabled} 
                  videoFormat={videoFormat}
                  isFormValid={isFormValid} 
                />
              </div>
            </LoginForm>

            <LoginFooter videoFormat={videoFormat}>
              {/* Additional footer content can be added here */}
              <div>
              </div>
            </LoginFooter>
          </div>
        </div>
      </div>
    </div>
  );
}