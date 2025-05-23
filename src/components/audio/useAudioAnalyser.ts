import { useEffect, useRef, useState } from "react";

let cachedAnalyser: AnalyserNode | null = null;

export const useAudioAnalyser = () => {
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(0));
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
  if (cachedAnalyser) {
    // start loop with existing analyser
    const dataArray = new Uint8Array(cachedAnalyser.frequencyBinCount);

    const update = () => {
      cachedAnalyser!.getByteFrequencyData(dataArray);
      setFrequencyData(new Uint8Array(dataArray));
      frameRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }

  // only create once
  const audioEl = document.querySelector("audio");
  if (!audioEl) return;

  const ctx = new AudioContext();
  const source = ctx.createMediaElementSource(audioEl);
  const analyser = ctx.createAnalyser();

  source.connect(analyser);
  analyser.connect(ctx.destination);
  analyser.fftSize = 256;

  cachedAnalyser = analyser;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  const update = () => {
    analyser.getByteFrequencyData(dataArray);
    setFrequencyData(new Uint8Array(dataArray));
    frameRef.current = requestAnimationFrame(update);
  };

  update();

  return () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  };
}, []);


  return frequencyData;
};
