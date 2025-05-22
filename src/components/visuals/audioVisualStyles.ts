// src/components/visuals/audioVisualStyles.ts
import type p5 from "p5";


export const audioVisualStyles: Record<string, (p: p5, fft: p5.FFT) => void> = {
  "Rogue Wave": (p, fft) => {
    const waveform = fft.waveform();
    p.stroke(100, 200, 255, 80);
    p.noFill();
    p.beginShape();
    for (let i = 0; i < waveform.length; i++) {
      const x = p.map(i, 0, waveform.length, 0, p.width);
      const y = p.map(waveform[i], -1, 1, 0, p.height);
      p.vertex(x, y);
    }
    p.endShape();
  },

  "Orange Forest": (p, fft) => {
    const bass = fft.getEnergy("bass");
    const mid = fft.getEnergy("mid");
    const hue = p.map(mid, 0, 255, 90, 160);
    const size = p.map(bass, 0, 255, 20, 200);
    p.colorMode(p.HSB);
    p.fill(hue, 80, 90, 0.4);
    p.noStroke();
    p.ellipse(p.width / 2, p.height / 2, size);
  },

  "Digital Beach": (p, fft) => {
    const spectrum = fft.analyze();
    p.background(0, 0, 0, 10);
    p.noStroke();
    for (let i = 0; i < spectrum.length; i++) {
      const x = p.map(i, 0, spectrum.length, 0, p.width);
      const h = p.map(spectrum[i], 0, 255, 0, p.height);
      p.fill(0, 255, 255, 60);
      p.rect(x, p.height - h, 2, h);
    }
  },

  // Add others similarly
};
