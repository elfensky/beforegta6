import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Bangers } from './video.jsx';
import timing from '../timing.json';

function Root() {
  return (
    <Composition
      id="Bangers"
      component={Bangers}
      width={1080}
      height={1920}
      fps={timing.fps}
      durationInFrames={Math.round(timing.duration * timing.fps)}
    />
  );
}
registerRoot(Root);
