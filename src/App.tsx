import React, { useRef } from "react";
import SongLink from "./components/atoms/SongLink";
import GlassCard from "./components/molecules/GlassCard";

const App: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSong = (src: string) => {
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.play();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-image cutive-mono-regular">
      <GlassCard className="w-full max-w-4xl">
        <h1 className="text-lg  font-extralight leading-snug tracking-wide text-pink-300 text-center w-full max-w-lg mx-auto mb-11">
          BarkWanderer: The Flowers Of Afterthought
        </h1>
        <SongLink
          label="Scene = The_Block"
          songSrc="/assets/tunes/Scene=The_Block.wav"
          onPlay={playSong}
        />
        <SongLink
          label="Orange Forest"
          songSrc="/assets/tunes/Orange-Forest.wav"
          onPlay={playSong}
        />
        <SongLink
          label="Rogue Wave"
          songSrc="/assets/tunes/Rogue-Wave.wav"
          onPlay={playSong}
        />
        <SongLink
          label="Zero ++"
          songSrc="/assets/tunes/Zero++.wav"
          onPlay={playSong}
        />
        <SongLink
          label="A Recurring Dream"
          songSrc="/assets/tunes/A-Recurring-Dream.wav"
          onPlay={playSong}
        />
        <SongLink
          label="Digital Beach"
          songSrc="/assets/tunes/Digital-Beach.wav"
          onPlay={playSong}
        />
        <SongLink
          label="Endors Gambit"
          songSrc="/assets/tunes/Endors-Gambit.wav"
          onPlay={playSong}
        />
        <SongLink
          label="The Flowers Of Afterthought"
          songSrc="/assets/tunes/The-Flowers-Of-Afterthought.wav"
          onPlay={playSong}
        />
        <audio
          ref={audioRef}
          controls
          className="mt-11 w-full max-w-lg mx-auto block"
        />
      </GlassCard>
    </div>
  );
};

export default App;
