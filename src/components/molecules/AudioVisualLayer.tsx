import React from "react";
import clsx from "clsx";

interface AudioVisualLayerProps {
  songLabel: string | null;
}

const AudioVisualLayer: React.FC<AudioVisualLayerProps> = ({ songLabel }) => {
  const effectClass = clsx(
    "absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000",
    {
      "animate-subtle-wave bg-gradient-to-r from-blue-400/10 via-white/10 to-purple-500/10":
        songLabel === "Rogue Wave",
      "animate-pulse-flicker bg-yellow-200/10": songLabel === "Orange Forest",
      "animate-scanline bg-pink-300/10": songLabel === "Digital Beach",
      // Default fallback
      "opacity-0": !songLabel,
    }
  );
  return <div className={effectClass} />;
};


export default AudioVisualLayer;
