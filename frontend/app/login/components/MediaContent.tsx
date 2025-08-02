import React from 'react';
import type { MediaMode, VideoType, VideoFormat } from '../types/types';
import { MEDIA_CONFIG } from '../types/constants';
import { YouTubeVideo } from './YouTubeVideo';
import { LocalVideo } from './LocalVideo';

interface MediaContentProps {
  mediaMode: MediaMode;
  videoType: VideoType;
  videoFormat: VideoFormat;
  onVideoError: () => void;
  onVideoFormatDetected: (format: VideoFormat) => void;
}

export const MediaContent: React.FC<MediaContentProps> = ({
  mediaMode,
  videoType,
  videoFormat,
  onVideoError,
  onVideoFormatDetected,
}) => {
  if (mediaMode === "image") {
    return (
      <div
        className="w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${MEDIA_CONFIG.backgroundImage})` }}
      />
    );
  }

  if (videoType === "youtube") {
    return (
      <YouTubeVideo 
        videoId={MEDIA_CONFIG.youtubeVideoId} 
        videoFormat={videoFormat} 
      />
    );
  }

  return (
    <LocalVideo
      videoSrc={MEDIA_CONFIG.localVideo}
      onError={onVideoError}
      onLoadedMetadata={onVideoFormatDetected}
    />
  );
};