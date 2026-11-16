// src/MarketTest.jsx — 12.6 s motion test in the supermarket (no sound yet).
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneCanvas } from './SceneCanvas.jsx';
import { drawMarket, MARKET_T1 } from './scenes/market.js';
export const MARKET_FRAMES = Math.round(MARKET_T1 * 30);
export const MarketTest = () => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  return <AbsoluteFill style={{ backgroundColor: '#000' }}><SceneCanvas t={frame / fps} draw={drawMarket} frame={frame} /></AbsoluteFill>;
};
