import React from 'react';
import { Composition } from 'remotion';
import { Film } from './film/Film';
import { FPS, REEL_LENGTH, STORY_LENGTH } from './film/timeline';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel-Wide"
        component={Film}
        durationInFrames={REEL_LENGTH}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ cut: 'reel' as const, vertical: false }}
      />
      <Composition
        id="Reel-Vertical"
        component={Film}
        durationInFrames={REEL_LENGTH}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ cut: 'reel' as const, vertical: true }}
      />
      <Composition
        id="Story-Wide"
        component={Film}
        durationInFrames={STORY_LENGTH}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ cut: 'story' as const, vertical: false }}
      />
      <Composition
        id="Story-Vertical"
        component={Film}
        durationInFrames={STORY_LENGTH}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ cut: 'story' as const, vertical: true }}
      />
    </>
  );
};
