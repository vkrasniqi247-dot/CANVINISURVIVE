import React from 'react';
import { Composition } from 'remotion';
import { Day1Test, DAY1_FRAMES } from './Day1Test.jsx';
import { RigTest } from './RigTest.jsx';
export const FPS = 30;
export const Root = () => (
  <>
    <Composition id="Day1Test" component={Day1Test} durationInFrames={DAY1_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="RigTest" component={RigTest} durationInFrames={1} fps={FPS} width={1920} height={1080} />
  </>
);
