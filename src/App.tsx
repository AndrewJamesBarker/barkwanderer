import React, { useRef } from "react";
import SongLink from "./components/atoms/SongLink";
import GlassCard from "./components/molecules/GlassCard";
import PoemBlock from "./components/organisms/PoemBlock";
import Footer from "./components/organisms/Footer";
import AudioVisualLayer from "./components/molecules/AudioVisualLayer";

const songs = [
  { label: "Scene = The_Block", src: "/assets/tunes/Scene=The_Block.mp3" },
  { label: "Orange Forest", src: "/assets/tunes/Orange-Forest.mp3" },
  { label: "Rogue Wave", src: "/assets/tunes/Rogue-Wave.mp3" },
  { label: "Zero ++", src: "/assets/tunes/Zero++.mp3" },
  { label: "A Recurring Dream", src: "/assets/tunes/A-Recurring-Dream.mp3" },
  { label: "Digital Beach", src: "/assets/tunes/Digital-Beach.mp3" },
  { label: "Endors Gambit", src: "/assets/tunes/Endors-Gambit.mp3" },
  { label: "The Flowers Of Afterthought", src: "/assets/tunes/The-Flowers-Of-Afterthought.mp3" },
];
const App: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [nowPlaying, setNowPlaying] = React.useState<string | null>(null);

  const playSong = (src: string, label: string) => {
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.load();
      audioRef.current.play();
      setNowPlaying(label);
    }
  };

  return (
  <div className="bg-black min-h-screen flex flex-col justify-between p-8 bg-image cutive-mono-regular">

    {/* Centered content wrapper */}
    <div className="flex flex-col items-center">
      <GlassCard className="w-full max-w-4xl relative overflow-hidden">
        <AudioVisualLayer songLabel={nowPlaying} />

        <h1 className="text-lg font-extralight leading-snug tracking-wide text-pink-200 text-center w-full max-w-lg mx-auto mb-11 z-10">
          BarkWanderer: The Flowers Of Afterthought
        </h1>
        {songs.map((song) => (
          <SongLink
            key={song.label}
            label={song.label}
            songSrc={song.src}
            onPlay={(src) => playSong(src, song.label)}
            isActive={nowPlaying === song.label}
          />
        ))}

        <audio
          ref={audioRef}
          controls
          className="mt-11 w-full max-w-lg mx-auto block z-10"
        />
      </GlassCard>
      <PoemBlock nowPlaying={nowPlaying} />
    </div>

    {/* Footer stays separate and aligned how you want */}
    <Footer />
  </div>
);

};

export default App;
