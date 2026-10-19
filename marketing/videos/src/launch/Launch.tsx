/**
 * FlyMascots — Launch film, 16:9 only. 720 frames / 24.000 s @ 30 fps,
 * cut on the measured grid of close-up.mp3 (105.46875 BPM, MUSIC_START 0.093).
 *
 * Footage law: the hero and five-face scenes are screen recordings of the
 * live, redesigned site (public/site/*.mp4); the close-up moods are the
 * real stage sequences (public/axo/*). Remotion only carries the titles,
 * chips, terminal and brand frame around them. v2 palette from
 * website/DESIGN.md — porcelain light, graphite dark, mint accent.
 */
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  Video,
} from 'remotion';
import { BEAT, FPS, MUSIC_START, bar, type SfxHit } from '../film/timeline';
import { Mascot } from '../film/ui';
import { Chip, Kicker, MintDash, StageBackdrop, T2, Terminal, Title, usePop } from './launch-ui';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const beatFrames = Math.round(BEAT * FPS); // 17
export const LAUNCH_LENGTH = 720; // 24.000 s

/* ---------------------------------------------------------------- *\
   Scene map — every cut on a bar, every pop on a beat
\* ---------------------------------------------------------------- */

export interface LaunchScene {
  id: 'hook' | 'hero' | 'blink' | 'work' | 'think' | 'moodsite' | 'moodmap' | 'verify' | 'install' | 'brand';
  from: number;
  to: number;
}

export const LAUNCH_SCENES: LaunchScene[] = [
  { id: 'hook', from: 0, to: bar(1) },
  { id: 'hero', from: bar(1), to: bar(2) },
  { id: 'blink', from: bar(2), to: bar(3) },
  { id: 'work', from: bar(3), to: bar(4) },
  { id: 'think', from: bar(4), to: bar(5) },
  { id: 'moodsite', from: bar(5), to: bar(6) },
  { id: 'moodmap', from: bar(6), to: bar(7) },
  { id: 'verify', from: bar(7), to: bar(8) },
  { id: 'install', from: bar(8), to: bar(9) },
  { id: 'brand', from: bar(9), to: LAUNCH_LENGTH },
];

export const LAUNCH_SFX: SfxHit[] = [
  { file: 'pop.wav', at: bar(1), volume: 0.5 },
  { file: 'clack.wav', at: bar(3) + 11, volume: 0.55 },
  { file: 'click-coarse.wav', at: bar(4) + 11, volume: 0.5 },
  { file: 'whoosh-soft.wav', at: bar(5), volume: 0.5 },
  { file: 'click-coarse.wav', at: bar(6), volume: 0.4 },
  { file: 'whoosh-soft.wav', at: bar(7), volume: 0.45 },
  { file: 'click-coarse.wav', at: bar(8), volume: 0.45 },
  { file: 'riser-subtle.wav', at: bar(9) - 60, volume: 1.25 },
  { file: 'impact-soft.wav', at: bar(9), volume: 0.55 },
  { file: 'chime.wav', at: bar(9) + 4, volume: 0.4 },
];

/* ---------------------------------------------------------------- *\
   Scenes
\* ---------------------------------------------------------------- */

const Hook: React.FC = () => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ marginTop: -60, textAlign: 'center' }}>
      <Kicker at={0} align="center" size={21}>
        FlyMascots · an agent skill
      </Kicker>
      <div style={{ marginTop: 26 }}>
        <Title lines={['Add a mascot.']} at={4} align="center" size={138} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <MintDash at={12} width={130} />
      </div>
    </div>
  </AbsoluteFill>
);

/** Full-bleed recording of the live hero — the pill click drives the mascot. */
const Hero: React.FC = () => (
  <AbsoluteFill>
    <Video
      src={staticFile('site/hero.mp4')}
      trimBefore={24}
      muted
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </AbsoluteFill>
);

const Blink: React.FC = () => (
  <AbsoluteFill>
    <Mascot shot="idle-close6" startFrame={95} size={740} x={960} y={440} />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 846,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 26,
      }}
    >
      <Title lines={['It blinks when it feels like it.']} at={2} size={60} align="center" />
      <Chip at={beatFrames}>blink · 3.6 s</Chip>
    </div>
  </AbsoluteFill>
);

const MoodClose: React.FC<{
  shot: 'sw-work' | 'sw-think';
  startFrame: number;
  kicker: string;
  lines: string[];
  chip: string;
}> = ({ shot, startFrame, kicker, lines, chip }) => (
  <AbsoluteFill>
    <Mascot shot={shot} startFrame={startFrame} size={680} x={1420} y={566} />
    <div style={{ position: 'absolute', left: 140, top: 330, width: 900 }}>
      <Kicker at={0}>{kicker}</Kicker>
      <div style={{ marginTop: 20 }}>
        <Title lines={lines} at={3} size={86} />
      </div>
      <div style={{ marginTop: 34 }}>
        <Chip at={beatFrames}>{chip}</Chip>
      </div>
    </div>
  </AbsoluteFill>
);

/**
 * Full-bleed recording of the five-face section, pushed in 1.35× so the
 * tiles own the frame (the next section's player is cropped away).
 */
const MoodsSite: React.FC = () => (
  <AbsoluteFill style={{ overflow: 'hidden', background: T2.paper }}>
    <Video
      src={staticFile('site/journey.mp4')}
      trimBefore={72}
      muted
      style={{
        position: 'absolute',
        width: 1920 * 1.35,
        height: 1080 * 1.35,
        left: (1920 - 1920 * 1.35) / 2,
        top: -60 * 1.35,
        objectFit: 'cover',
      }}
    />
  </AbsoluteFill>
);

const MoodPill: React.FC<{ at: number; from: string; to: string }> = ({ at, from, to }) => {
  const style = usePop(at, { rise: 22, damping: 13, stiffness: 150 });
  return (
    <span
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: T2.mono,
        fontSize: 22,
        color: T2.ink,
        background: T2.snow,
        border: `1px solid ${T2.hairline}`,
        boxShadow: '0 18px 40px -26px rgba(16,32,27,.35)',
        borderRadius: 999,
        padding: '14px 26px 15px',
      }}
    >
      <span style={{ color: T2.inkSoft }}>{from}</span>
      <span style={{ color: T2.mint }}>→</span>
      <span>{to}</span>
    </span>
  );
};

const MoodMap: React.FC = () => {
  const pills = [
    { from: 'start', to: 'working' },
    { from: 'pause', to: 'idle' },
    { from: 'stop', to: 'think' },
    { from: 'quit', to: 'celebrate' },
  ];
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginTop: -70 }}>
        <Kicker at={0} align="center">
          mood sync
        </Kicker>
        <div style={{ marginTop: 22 }}>
          <Title lines={['One word.', "Your app's states."]} at={3} size={92} align="center" />
        </div>
        <div
          style={{
            marginTop: 74,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'center',
            maxWidth: 1500,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {pills.map((p, i) => (
            <MoodPill key={p.from} at={beatFrames + i * beatFrames} from={p.from} to={p.to} />
          ))}
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: T2.mono,
            fontSize: 18,
            letterSpacing: '0.08em',
            color: T2.inkFaint,
            opacity: interpolate(frame, [beatFrames * 5, beatFrames * 5 + 8], [0, 1], clamp),
          }}
        >
          one word · five moods · your app decides
        </div>
      </div>
    </AbsoluteFill>
  );
};

const VerifyRow: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const style = usePop(at, { rise: 22, damping: 14, stiffness: 130 });
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        gap: 16,
        alignItems: 'baseline',
        fontFamily: T2.mono,
        fontSize: 24,
        color: 'rgba(233,237,238,.86)',
      }}
    >
      <span style={{ color: T2.mintBright }}>✓</span>
      <span>{children}</span>
    </div>
  );
};

const Verify: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = ['every mood pose, measured', '60 mood changes, all checked', 'checked against your reference'];
  return (
    <AbsoluteFill>
      <StageBackdrop dark />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(52% 44% at 76% 32%, rgba(63,210,189,.14) 0%, rgba(63,210,189,0) 100%)',
        }}
      />
      <div style={{ position: 'absolute', left: 140, top: 300, width: 1640 }}>
        <Kicker at={0} dark>
          verified every run
        </Kicker>
        <div style={{ marginTop: 22 }}>
          <Title lines={['Every pose tested', 'before you see it.']} at={3} dark size={92} />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 660,
          width: 1500,
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
        }}
      >
        {rows.map((row, i) => (
          <VerifyRow key={row} at={beatFrames + i * beatFrames}>
            {row}
          </VerifyRow>
        ))}
        <div
          style={{
            marginTop: 8,
            width: 420,
            height: 1,
            background: 'rgba(233,237,238,.16)',
            opacity: interpolate(frame, [beatFrames * 3 + 10, beatFrames * 4 - 4], [0, 1], clamp),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Install: React.FC = () => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -50 }}>
      <Kicker at={0} align="center">
        install
      </Kicker>
      <div style={{ marginTop: 22 }}>
        <Title lines={['Drop it into any project.']} at={3} size={88} align="center" />
      </div>
      <div style={{ marginTop: 76 }}>
        <Terminal text="npx skills add Ravinder82/FlyMascots" />
      </div>
      <div
        style={{
          marginTop: 44,
          fontFamily: T2.mono,
          fontSize: 19,
          letterSpacing: '0.08em',
          color: T2.inkFaint,
          opacity: interpolate(useCurrentFrame(), [52, 62], [0, 1], clamp),
        }}
      >
        MIT · npm i flymascots
      </div>
    </div>
  </AbsoluteFill>
);

/** Endcard — the new goggles mark, the wordmark, the character. */
const Brand: React.FC = () => {
  const icon = usePop(2, { rise: 26, scale: 0.1, damping: 12, stiffness: 130 });
  return (
    <AbsoluteFill>
      <Mascot shot="idle6" startFrame={40} size={500} x={960} y={366} entrance="rise" at={0} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 636,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          <Img
            src={staticFile('icon.svg')}
            style={{ width: 96, height: 96, borderRadius: '26%', ...icon }}
            alt=""
          />
          <Title lines={['FlyMascots']} at={3} size={116} align="left" />
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: T2.font,
            fontWeight: 500,
            fontSize: 34,
            letterSpacing: '-0.01em',
            color: T2.inkSoft,
            ...usePop(11, { rise: 18 }),
          }}
        >
          Mascots that feel alive.
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: T2.mono,
            fontSize: 19,
            letterSpacing: '0.06em',
            color: T2.inkFaint,
            ...usePop(19, { rise: 14 }),
          }}
        >
          github.com/Ravinder82/FlyMascots · MIT
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- *\
   Composition root
\* ---------------------------------------------------------------- */

const SceneBody: React.FC<{ id: LaunchScene['id'] }> = ({ id }) => {
  switch (id) {
    case 'hook':
      return <Hook />;
    case 'hero':
      return <Hero />;
    case 'blink':
      return <Blink />;
    case 'work':
      return (
        <MoodClose
          shot="sw-work"
          startFrame={30}
          kicker="start → working"
          lines={['Press play.', 'It gets to work.']}
          chip="mood · working"
        />
      );
    case 'think':
      return (
        <MoodClose
          shot="sw-think"
          startFrame={40}
          kicker="stop → think"
          lines={['Hit stop.', 'It thinks.']}
          chip="mood · think"
        />
      );
    case 'moodsite':
      return <MoodsSite />;
    case 'moodmap':
      return <MoodMap />;
    case 'verify':
      return <Verify />;
    case 'install':
      return <Install />;
    case 'brand':
      return <Brand />;
    default:
      return null;
  }
};

export const LaunchFilm: React.FC = () => (
  <AbsoluteFill style={{ background: T2.paper, fontFamily: T2.font }}>
    {LAUNCH_SCENES.map((scene) => (
      <Sequence
        key={scene.id}
        from={scene.from}
        durationInFrames={scene.to - scene.from}
        premountFor={15}
      >
        {scene.id === 'verify' ? <StageBackdrop dark /> : <StageBackdrop />}
        <SceneBody id={scene.id} />
      </Sequence>
    ))}
    <Audio
      src={staticFile('music/close-up.mp3')}
      startFrom={Math.round(MUSIC_START * FPS)}
      volume={(f) => {
        const inF = interpolate(f, [0, 5], [0, 0.92], clamp);
        const outF = interpolate(f, [LAUNCH_LENGTH - 14, LAUNCH_LENGTH - 2], [1, 0], clamp);
        return inF * outF;
      }}
    />
    {LAUNCH_SFX.map((hit, i) => (
      <Sequence key={`${hit.file}-${i}`} from={hit.at} durationInFrames={140} premountFor={10}>
        <Audio src={staticFile(`sfx/${hit.file}`)} volume={hit.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
