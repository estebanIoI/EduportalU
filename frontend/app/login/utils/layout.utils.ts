import type { VideoFormat } from '../types/types';

export const getLayoutClasses = (videoFormat: VideoFormat) => {
  if (videoFormat === "short") {
    return {
      container: "min-h-screen flex flex-col items-center justify-center px-4 py-6 relative md:py-8 lg:px-24 lg:py-12 xl:px-32 xl:py-16",
      mainCard: "flex flex-col lg:flex-row w-full max-w-6xl shadow-2xl rounded-2xl overflow-hidden relative z-10",
      mediaSection: "relative flex items-center justify-center w-full md:w-3/4",
      loginSection: "lg:w-2/5 flex flex-col justify-center",
    };
  } else {
    return {
      container: "min-h-screen flex flex-col items-center justify-center px-8 py-6 md:px-16 md:py-8 lg:px-24 lg:py-12 xl:px-32 xl:py-16 relative",
      mainCard: "flex flex-col md:flex-row w-full max-w-9xl shadow-xl rounded-xl overflow-hidden relative z-10",
      mediaSection: "relative flex items-center justify-center w-full md:w-3/4",
      loginSection: "w-full md:w-1/4 flex flex-col justify-center",
    };
  }
};