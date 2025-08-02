import { VideoFormat, VideoType } from '../types/types';
import { KNOWN_SHORTS } from '../types/constants';

export const detectYouTubeFormat = (videoId: string): VideoFormat => {
  return KNOWN_SHORTS.includes(videoId as any) ? "short" : "fullhd";
};

export const detectLocalVideoFormat = async (videoSrc: string): Promise<VideoFormat> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
    };

    const handleLoadedMetadata = () => {
      const aspectRatio = video.videoWidth / video.videoHeight;
      cleanup();
      resolve(aspectRatio < 1 ? "short" : "fullhd");
    };

    const handleError = () => {
      cleanup();
      resolve("fullhd");
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);
    video.src = videoSrc;
  });
};