// src/components/molecules/AudioVisualLayer.tsx
import React from "react";
import R3FCanvas from "../audio/R3FCanvas";
import RogueWaveScene from "../audio/scenes/RogueWaveScene";
import DigitalBeachScene from "../audio/scenes/DigitalBeachScene";
// import other scenes as needed
import RecurringDreamScene from "../audio/scenes/RecurringDreamScene";

interface AudioVisualLayerProps {
  songLabel: string | null;
}

const AudioVisualLayer: React.FC<AudioVisualLayerProps> = ({ songLabel }) => {
  const getScene = () => {
    switch (songLabel) {
      case "Rogue Wave":
        return <RogueWaveScene />;
      case "Digital Beach": 
        return <DigitalBeachScene />;
      case "A Recurring Dream":
        return <RecurringDreamScene />; 

      // etc.
      default:
        return null;
    }
  };

  return <R3FCanvas>{getScene()}</R3FCanvas>;
};

export default AudioVisualLayer;
