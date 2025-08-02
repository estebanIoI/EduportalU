import { useState, useEffect } from 'react';
import type { VideoFormat, VideoType } from '../types/types';
import { detectYouTubeFormat, detectLocalVideoFormat } from '../utils/video';
import { MEDIA_CONFIG } from '../types/constants';

export const useMediaDetection = (videoType: VideoType) => {
  const [videoFormat, setVideoFormat] = useState<VideoFormat>("fullhd");

  useEffect(() => {
    const detectFormat = async () => {
      try {
        if (videoType === "youtube") {
          const format = detectYouTubeFormat(MEDIA_CONFIG.youtubeVideoId);
          setVideoFormat(format);
        } else {
          const format = await detectLocalVideoFormat(MEDIA_CONFIG.localVideo);
          setVideoFormat(format);
        }
      } catch (error) {
        console.warn("Error detecting video format:", error);
        setVideoFormat("fullhd"); // fallback
      }
    };

    detectFormat();
  }, [videoType]);

  return { videoFormat, setVideoFormat };
};