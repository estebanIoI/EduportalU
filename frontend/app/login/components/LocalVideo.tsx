import React from 'react';
import type { VideoFormat } from '../types/types';

interface LocalVideoProps {
  videoSrc: string;
  onError: () => void;
  onLoadedMetadata: (format: VideoFormat) => void;
}

export const LocalVideo: React.FC<LocalVideoProps> = ({ 
  videoSrc, 
  onError, 
  onLoadedMetadata 
}) => {
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const aspectRatio = video.videoWidth / video.videoHeight;
    onLoadedMetadata(aspectRatio < 1 ? "short" : "fullhd");
  };

  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-full object-cover"
      onError={onError}
      onLoadedMetadata={handleLoadedMetadata}
    >
      <source src={videoSrc} type="video/mp4" />
      Tu navegador no soporta el elemento de video.
    </video>
  );
};
