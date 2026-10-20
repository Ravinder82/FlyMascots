/**
 * FlyMascots — Launch film, 16:9 only. 720 frames / 24.000 s @ 30 fps,
 * cut on the measured grid of close-up.mp3 (105.46875 BPM, MUSIC_START 0.093).
 *
 * Footage law: every character in this film is a real frame sequence from
 * the stage viewer (public/<mascot>/<shot>/). Nothing here is drawn by hand
 * and nothing is a mockup — the blinks, the hops and the gold are the product.
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
} from 'remotion';
import { FPS, MUSIC_START, bar, type ShotId, type SfxHit } from '../film/timeline';
import { Mascot } from '../film/ui';
import { Chip, Kicker, MintDash, StageBackdrop, T2, Terminal, Title, usePop } from './launch-ui';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const LAUNCH_LENGTH = 720; // 24.000 s

/* ---------------------------------------------------------------- *\
   Scene map — every cut on a bar, every pop on a beat
\* ---------------------------------------------------------------- */

export interface LaunchScene {
  id: 'hook' | 'what' | 'moods' | 'add' | 'bring' | 'cast' | 'brand';
  from: number;
  to: number;
}

export const LAUNCH_SCENES: LaunchScene[] = [
  { id: 'hook', from: 0, to: bar(2) },
  { id: 'what', from: bar(2), to: bar(3.5) },
  { id: 'moods', from: bar(3.5), to: bar(5) },
  { id: 'add', from: bar(5), to: bar(6.5) },
  { id: 'bring', from: bar(6.5), to: bar(8) },
  { id: 'cast', from: bar(8), to: bar(9) },
  { id: 'brand', from: bar(9), to: LAUNCH_LENGTH },
];

export const LAUNCH_SFX: SfxHit[] = [
  { file: 'pop.wav', at: 0, volume: 0.45 },
  { file: 'whoosh-soft.wav', at: bar(2), volume: 0.45 },
  { file: 'click-coarse.wav', at: bar(2) + 16, volume: 0.38 },
  { file: 'clack.wav', at: bar(3.5), volume: 0.5 },
  { file: 'click-coarse.wav', at: bar(5) + 8, volume: 0.45 },
  { file: 'click-coarse.wav', at: bar(6.5) + 8, volume: 0.45 },
  { file: 'whoosh-soft.wav', at: bar(8), volume: 0.5 },
  { file: 'riser-subtle.wav', at: bar(9) - 60, volume: 1.2 },
  { file: 'impact-soft.wav', at: bar(9), volume: 0.5 },
  { file: 'chime.wav', at: bar(9) + 4, volume: 0.4 },
];

/* ---------------------------------------------------------------- *\
   Small parts
\* ---------------------------------------------------------------- */

/** A plain sentence that fades up. */
const Body: React.FC<{
  children: React.ReactNode;
  at?: number;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ children, at = 0, size = 30, color, style }) => {
  const s = usePop(at, { rise: 18, damping: 15, stiffness: 120 });
  return (
    <div
      style={{
        ...s,
        fontFamily: T2.font,
        fontSize: size,
        lineHeight: 1.45,
        color: color || T2.inkSoft,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** The mark and the word, together. */
const BrandMark: React.FC<{ at?: number; size?: number; dark?: boolean; text?: string }> = ({
  at = 0,
  size = 52,
  dark,
  text = 'FlyMascots',
}) => {
  const s = usePop(at, { rise: 14 });
  return (
    <div style={{ ...s, display: 'flex', alignItems: 'center', gap: 16 }}>
      <Img
        src={staticFile(dark ? 'icon-dark.svg' : 'icon.svg')}
        style={{ width: size, height: size, borderRadius: size * 0.24 }}
      />
      <span
        style={{
          fontFamily: T2.font,
          fontWeight: 600,
          fontSize: size * 0.58,
          letterSpacing: '-0.015em',
          color: dark ? T2.frost : T2.ink,
        }}
      >
        {text}
      </span>
    </div>
  );
};

/** A numbered step in the "how it works" pair. */
const StepNote: React.FC<{ at?: number; children: React.ReactNode; dark?: boolean }> = ({
  at = 0,
  children,
  dark,
}) => {
  const s = usePop(at, { rise: 16, damping: 15, stiffness: 130 });
  return (
    <div
      style={{
        ...s,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        fontFamily: T2.font,
        fontSize: 30,
        lineHeight: 1.4,
        color: dark ? T2.frostSoft : T2.inkSoft,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: T2.mint,
          marginTop: 14,
          flex: '0 0 auto',
        }}
      />
      <span>{children}</span>
    </div>
  );
};

/* ---------------------------------------------------------------- *\
   Scenes
\* ---------------------------------------------------------------- */

/** 1 — the promise. */
const Hook: React.FC = () => (
  <>
    <StageBackdrop />
    <div style={{ position: 'absolute', left: 140, top: 88 }}>
      <BrandMark at={2} />
    </div>
    <div style={{ position: 'absolute', left: 140, top: 360, width: 980 }}>
      <Kicker at={6} size={19}>
        An agent skill
      </Kicker>
      <div style={{ marginTop: 26 }}>
        <Title lines={['Give your App', 'a mascot that', 'feels alive.']} at={14} size={116} />
      </div>
      <MintDash at={44} width={130} />
    </div>
    <Mascot mascot="axo" shot="idle6" startFrame={0} size={790} x={1470} y={600} entrance="pop" at={20} />
  </>
);

/** 2 — what it is. */
const What: React.FC = () => (
  <>
    <StageBackdrop />
    <div style={{ position: 'absolute', left: 140, top: 250, width: 1020 }}>
      <Kicker at={2} size={19}>
        What it is
      </Kicker>
      <div style={{ marginTop: 24 }}>
        <Title
          lines={['An agent skill that makes', 'mascots with many moods —', 'from an idea or an image.']}
          at={8}
          size={80}
        />
      </div>
      <div style={{ marginTop: 34 }}>
        <Body at={30}>It designs the character, rigs it, renders it, and checks it before you ever see it.</Body>
      </div>
    </div>
    <Mascot
      mascot="nicklas"
      shot="idle6"
      startFrame={0}
      size={640}
      x={1470}
      y={600}
      entrance="rise"
      at={16}
    />
  </>
);

/** 3 — five moods, one word each. */
const MOOD_CARDS: { shot: ShotId; label: string; note: string; start: number }[] = [
  { shot: 'idle6', label: 'idle', note: 'resting', start: 30 },
  { shot: 'sw-work', label: 'working', note: 'goggles down', start: 60 },
  { shot: 'sw-think', label: 'think', note: 'chin in hand', start: 60 },
  { shot: 'sw-celebrate', label: 'celebrate', note: 'a hop and a wave', start: 60 },
  { shot: 'sw-sleep', label: 'sleep', note: 'eyes closed', start: 60 },
];

const MoodCard: React.FC<{
  shot: ShotId;
  label: string;
  note: string;
  x: number;
  at: number;
  start: number;
}> = ({ shot, label, note, x, at, start }) => {
  const s = usePop(at, { rise: 46, scale: 0.05, damping: 13, stiffness: 130 });
  return (
    <div style={{ position: 'absolute', left: x, top: 470, width: 300, ...s }}>
      <div
        style={{
          position: 'relative',
          width: 300,
          height: 330,
          borderRadius: 26,
          background: 'rgba(16,32,27,.04)',
          border: `1px solid ${T2.hairline}`,
          overflow: 'hidden',
        }}
      >
        <Mascot mascot="axo" shot={shot} startFrame={start} size={272} x={150} y={166} />
      </div>
      <div style={{ marginTop: 20, fontFamily: T2.font, fontWeight: 600, fontSize: 28, color: T2.ink }}>
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: T2.mono,
          fontSize: 16,
          letterSpacing: '0.05em',
          color: T2.inkFaint,
        }}
      >
        {note}
      </div>
    </div>
  );
};

const Moods: React.FC = () => (
  <>
    <StageBackdrop />
    <div style={{ position: 'absolute', left: 140, top: 170 }}>
      <Kicker at={2} size={19}>
        Five moods, one word each
      </Kicker>
      <div style={{ marginTop: 22 }}>
        <Title lines={['Your app’s state, on its face.']} at={8} size={78} />
      </div>
    </div>
    {MOOD_CARDS.map((card, i) => (
      <MoodCard key={card.label} {...card} x={130 + i * 340} at={16 + i * 7} />
    ))}
  </>
);

/** 4 — how it works, part one. */
const Add: React.FC = () => (
  <>
    <StageBackdrop dark />
    <div style={{ position: 'absolute', left: 140, top: 210 }}>
      <Kicker at={2} dark size={19}>
        How it works · 1
      </Kicker>
      <div style={{ marginTop: 24 }}>
        <Title lines={['Add the skills']} at={8} dark size={112} />
      </div>
      <div style={{ marginTop: 30 }}>
        <Body at={22} dark color={T2.frostSoft}>
          One command. Both skills land in your project — no account, no key.
        </Body>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 140, top: 640 }}>
      <Terminal text="npx skills add Ravinder82/FlyMascots" at={34} />
    </div>
  </>
);

/** 5 — how it works, part two. */
const Bring: React.FC = () => (
  <>
    <StageBackdrop />
    <div style={{ position: 'absolute', left: 140, top: 230, width: 1000 }}>
      <Kicker at={2} size={19}>
        How it works · 2
      </Kicker>
      <div style={{ marginTop: 24 }}>
        <Title lines={['Bring a mascot']} at={8} size={112} />
      </div>
      <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <StepNote at={22}>Start with an idea or an image.</StepNote>
        <StepNote at={32}>The skill starts building your mascot.</StepNote>
      </div>
    </div>
    <Mascot
      mascot="axo"
      shot="idle-close6"
      startFrame={0}
      size={720}
      x={1470}
      y={570}
      entrance="rise"
      at={18}
    />
  </>
);

/** 6 — the cast. */
const Cast: React.FC = () => (
  <>
    <StageBackdrop />
    <div style={{ position: 'absolute', left: 140, top: 120 }}>
      <Kicker at={2} size={19}>
        The cast
      </Kicker>
      <div style={{ marginTop: 20 }}>
        <Title lines={['Two characters. One set of words.']} at={8} size={76} />
      </div>
    </div>
    <Mascot mascot="axo" shot="idle6" startFrame={30} size={620} x={690} y={690} entrance="pop" at={18} />
    <Mascot
      mascot="nicklas"
      shot="idle6"
      startFrame={30}
      size={720}
      x={1340}
      y={700}
      entrance="pop"
      at={30}
    />
    <div
      style={{
        position: 'absolute',
        left: 140,
        bottom: 92,
        display: 'flex',
        gap: 22,
      }}
    >
      <Chip at={40}>Axo — built in code</Chip>
      <Chip at={48}>Nicklas — sculpted in the studio</Chip>
    </div>
  </>
);

/** 7 — the brand. */
const Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const s = usePop(6, { rise: 30, scale: 0.04, damping: 12, stiffness: 110 });
  const glow = interpolate(frame, [0, 40], [0, 1], clamp);
  return (
    <>
      <StageBackdrop dark />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 168,
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ ...s, opacity: glow }}>
          <Img
            src={staticFile('icon-dark.svg')}
            style={{ width: 128, height: 128, borderRadius: 31, display: 'block' }}
          />
        </div>
        <div style={{ marginTop: 34 }}>
          <Title lines={['FlyMascots']} at={16} dark size={132} align="center" />
        </div>
        <div style={{ marginTop: 18 }}>
          <MintDash at={30} width={150} />
        </div>
        <div style={{ marginTop: 30 }}>
          <Body at={38} dark color={T2.frostSoft} size={34} style={{ textAlign: 'center' }}>
            Give your app a mascot that feels alive.
          </Body>
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: T2.mono,
            fontSize: 30,
            color: T2.mintBright,
            letterSpacing: '0.01em',
          }}
        >
          <span style={{ opacity: interpolate(frame, [48, 56], [0, 1], clamp) }}>
            npx skills add Ravinder82/FlyMascots
          </span>
        </div>
      </div>
    </>
  );
};

/* ---------------------------------------------------------------- *\
   Film
\* ---------------------------------------------------------------- */

const SceneBody: React.FC<{ id: LaunchScene['id'] }> = ({ id }) => {
  switch (id) {
    case 'hook':
      return <Hook />;
    case 'what':
      return <What />;
    case 'moods':
      return <Moods />;
    case 'add':
      return <Add />;
    case 'bring':
      return <Bring />;
    case 'cast':
      return <Cast />;
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
