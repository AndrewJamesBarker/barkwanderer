import React, { useRef } from "react";
import SongLink from "./components/atoms/SongLink";

const App: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSong = (src: string) => {
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl mb-8">BarkWanderer = The Flowers Of Afterthought</h1>

      <SongLink label="Scene = The_Block" songSrc="/assets/tunes/Scene=The_Block.wav" onPlay={playSong} />
      <SongLink label="Orange Forest" songSrc="/assets/tunes/Orange-Forest.wav" onPlay={playSong} />
      <SongLink label="Rogue Wave" songSrc="/assets/tunes/Rogue-Wave.wav" onPlay={playSong} />
      <SongLink label="Zero ++" songSrc="/assets/tunes/Zero++.wav" onPlay={playSong} />
      <SongLink label="A Recurring Dream" songSrc="/assets/tunes/A-Recurring-Dream.wav" onPlay={playSong} />
      <SongLink label="Digital Beach" songSrc="/assets/tunes/Digital-Beach.wav" onPlay={playSong} />
      <SongLink label="Endors Gambit" songSrc="/assets/tunes/Endors-Gambit.wav" onPlay={playSong} />
      <SongLink label="The Flowers Of Afterthought" songSrc="/assets/tunes/The-Flowers-Of-Afterthought.wav" onPlay={playSong} />

    <audio ref={audioRef} controls className="mt-8 w-full max-w-md" />
    </div>
  );
};

export default App;
