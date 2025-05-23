import React, { JSX } from "react";

type PoemChunk = {
  label: string;
  lines: string[];
  children?: PoemChunk[];
};

// 🌳 Nested poem structure
const poemChunks: PoemChunk[] = [
  {
    label: "Scene = The_Block",
    lines: ["— Scene = The_Block(‘purple sky’, streetlights_on → true)"],
    children: [
      {
        label: "Orange Forest",
        lines: ["— Orange Forest"],
        children: [
          {
            label: "Rogue Wave",
            lines: [
              "— Rogue Wave",
              "    invoke wind(soft, eastward)",
              "    if sun == ‘golden hour’",
              "        scatter_leaves_on_sand(vibrant, restless, electricity)",
              "    else if sun == ‘Dusk’",
              "        streetlight_flicker()",
              "        animal(‘fox mother’, 1, ‘fox cub’, 3, ‘june bugs’, generative(t, 1000))",
              "    endif",
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Zero ++",
    lines: ["— Zero ++"],
    children: [
      {
        label: "A Recurring Dream",
        lines: [
          "— A Recurring Dream",
          "    loop (until fade)",
          "        recall(Scene.past)",
          "        manifest dreamform",
          "    endloop",
        ],
      },
    ],
  },
  {
    label: "Digital Beach",
    lines: ["— Digital Beach"],
    children: [
      {
        label: "Endors Gambit",
        lines: [
          "— Endors Gambit",
          "    play move(Barkwanderer)",
          "    if success",
          "        mark Olly Olly Oxen Free ++",
          "    else",
          "        Barkwanderer = [‘r\\Red’, ‘Bird’]",
          "    endif",
        ],
      },
    ],
  },
  {
    label: "The Flowers Of Afterthought",
    lines: [
      "— The Flowers Of Afterthought → (Stay_Golden_Ponyboy())",
      "    render memory(‘premonition’)",
      "    sadness(exposure, fading, 3)",
      "    bbq(‘steak’, ‘sizzle’)",
    ],
  },
];


interface PoemBlockProps {
  nowPlaying: string | null;
}

const renderChunk = (
  chunk: PoemChunk,
  nowPlaying: string | null,
  indentLevel = 0
): JSX.Element => {
  const isActive = nowPlaying === chunk.label;
  const indent = " ".repeat(indentLevel * 4);

  return (
    <React.Fragment key={chunk.label}>
      {chunk.lines.map((line, i) => (
        <div
          key={i}
          className={`${
            isActive ? "text-slate-200 font-extrabold" : "text-pink-200"
          }`}
        >
          {indent}
          {line}
        </div>
      ))}
      {chunk.children?.map((child) =>
        renderChunk(child, nowPlaying, indentLevel + 1)
      )}
    </React.Fragment>
  );
};

const PoemBlock: React.FC<PoemBlockProps> = ({ nowPlaying }) => {
  return (
    <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap mt-10">
      {poemChunks.map((chunk) => renderChunk(chunk, nowPlaying))}
    </pre>
  );
};

export default PoemBlock;
