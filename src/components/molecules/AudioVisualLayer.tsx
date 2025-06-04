// src/components/molecules/AudioVisualLayer.tsx
import React from "react";
import R3FCanvas from "../audio/R3FCanvas";
import RogueWaveScene from "../audio/scenes/RogueWaveScene";
import DigitalBeachScene from "../audio/scenes/DigitalBeachScene";
import ZeroScene from "../audio/scenes/ZeroScene";
import TheBlockScene from "../audio/scenes/TheBlockScene";
import OrangeForestScene from "../audio/scenes/OrangeForest";
import RecurringDreamScene from "../audio/scenes/RecurringDreamScene";
import EndorsGambitScene from "../audio/scenes/EndorsGambitScene";

interface AudioVisualLayerProps {
  songLabel: string | null;
}

const AudioVisualLayer: React.FC<AudioVisualLayerProps> = ({ songLabel }) => {
  const getScene = () => {
    switch (songLabel) {
      case "Scene = The_Block":
        return <TheBlockScene key={songLabel} />;
      case "Rogue Wave":
        return <RogueWaveScene key={songLabel} />;
      case "Digital Beach": 
        return <DigitalBeachScene key={songLabel} />;
      case "A Recurring Dream":
        return <RecurringDreamScene key={songLabel} />; 
      case "Zero ++":
        return <ZeroScene key={songLabel} />;
      case "Orange Forest":
        return <OrangeForestScene key={songLabel} />;
      case "Endors Gambit":
        return <EndorsGambitScene key={songLabel} />;
      // etc.
      default:
        return null;
    }
  };

  return <R3FCanvas>{getScene()}</R3FCanvas>;
};

export default AudioVisualLayer;
