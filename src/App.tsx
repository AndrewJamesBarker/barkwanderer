import React, { useRef } from "react";
import SongLink from "./components/atoms/SongLink";
import GlassCard from "./components/molecules/GlassCard";
import PoemBlock from "./components/organisms/PoemBlock";

const songs = [
  { label: "Scene = The_Block", src: "/assets/tunes/Scene=The_Block.wav" },
  { label: "Orange Forest", src: "/assets/tunes/Orange-Forest.wav" },
  { label: "Rogue Wave", src: "/assets/tunes/Rogue-Wave.wav" },
  { label: "Zero ++", src: "/assets/tunes/Zero++.wav" },
  { label: "A Recurring Dream", src: "/assets/tunes/A-Recurring-Dream.wav" },
  { label: "Digital Beach", src: "/assets/tunes/Digital-Beach.wav" },
  { label: "Endors Gambit", src: "/assets/tunes/Endors-Gambit.wav" },
  { label: "The Flowers Of Afterthought", src: "/assets/tunes/The-Flowers-Of-Afterthought.wav" },
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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-image cutive-mono-regular">

      <GlassCard className="w-full max-w-4xl relative overflow-hidden">
        <h1 className="text-lg  font-extralight leading-snug tracking-wide text-pink-300 text-center w-full max-w-lg mx-auto mb-11 z-10">
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
  );
};

export default App;
