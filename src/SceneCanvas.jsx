// src/SceneCanvas.jsx — a 1920x1080 canvas that draws scene time `t` (seconds) every frame, deterministically.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { delayRender, continueRender, cancelRender } from 'remotion';
import { loadAssets } from './assets.js';
import { grain } from './kit/grade.js';
export const SceneCanvas = ({ t, draw, frame }) => {
  const ref = useRef(null);
  const [assets, setAssets] = useState(null);
  const [handle] = useState(() => delayRender('loading rig, backgrounds and fonts'));
  useEffect(() => { loadAssets().then((a) => { setAssets(a); continueRender(handle); }).catch((e) => cancelRender(e)); }, [handle]);
  useLayoutEffect(() => {
    if (!assets || !ref.current) return;
    const g = ref.current.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1920, 1080);
    draw(g, t, assets);
    grain(g, frame);
  }, [assets, t, draw, frame]);
  return <canvas ref={ref} width={1920} height={1080} style={{ width: '100%', height: '100%' }} />;
};
