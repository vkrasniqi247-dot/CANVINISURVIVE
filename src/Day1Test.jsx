// src/Day1Test.jsx — 31.6 s test: DAY 1 wake-up → shouting → instinct (freeze) → RULE 1 notebook page.
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneCanvas } from './SceneCanvas.jsx';
import { drawDay1, T0, T1 } from './scenes/day1.js';
export const DAY1_FRAMES = Math.round((T1 - T0) * 30);
export const Day1Test = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <SceneCanvas t={T0 + frame / fps} draw={drawDay1} frame={frame} />
      {/* placeholder sound: the v1 opening mix (voice + music + sfx) for the same window */}
      <Audio src={staticFile('audio/day1_v1mix.wav')} />
    </AbsoluteFill>
  );
};
