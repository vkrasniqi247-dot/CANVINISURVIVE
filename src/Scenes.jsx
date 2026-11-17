// src/Scenes.jsx — one test composition per script-v2 scene (silent until the narration files are in public/audio/vo/).
import React from 'react';
import { AbsoluteFill, Audio, Composition, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { VO_FILES } from './voFiles.js';
import { SceneCanvas } from './SceneCanvas.jsx';
import * as s00 from './scenes/s00_coldopen.js';
import * as s01 from './scenes/s01_day1.js';
import * as s03 from './scenes/s03_day3.js';
import * as s07 from './scenes/s07_day7.js';
import * as s12 from './scenes/s12_day12.js';
import * as s18 from './scenes/s18_day18.js';
import * as s24 from './scenes/s24_day24.js';
import * as s30 from './scenes/s30_day30.js';
export const SCENES = { S00: s00, S01: s01, S03: s03, S07: s07, S12: s12, S18: s18, S24: s24, S30: s30 };
const make = (mod) => () => { const frame = useCurrentFrame(), { fps } = useVideoConfig();
  return <AbsoluteFill style={{ backgroundColor: '#000' }}><SceneCanvas t={frame / fps} draw={mod.draw} frame={frame} />
    {(mod.VO || []).filter(([k]) => VO_FILES.includes(k)).map(([k, at]) => <Sequence key={k} from={Math.round(at * fps)}><Audio src={staticFile(`audio/vo/${k}.mp3`)} /></Sequence>)}</AbsoluteFill>; };
const COMPS = Object.fromEntries(Object.entries(SCENES).map(([id, mod]) => [id, make(mod)]));
export const SceneComps = () => <>{Object.entries(SCENES).map(([id, mod]) =>
  <Composition key={id} id={id} component={COMPS[id]} durationInFrames={Math.max(1, Math.round(mod.DUR * 30))} fps={30} width={1920} height={1080} />)}</>;
