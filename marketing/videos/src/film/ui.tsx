import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { SHOT_LENGTH, type ShotId } from './timeline';

/* ---------------------------------------------------------------- *\
   Tokens — see marketing/design.md
\* ---------------------------------------------------------------- */

export const T = {
  paper: '#F6F1E7',
  snow: '#FFFEFB',
  ink: '#15241F',
  inkSoft: 'rgba(21,36,31,.62)',
  inkFaint: 'rgba(21,36,31,.36)',
  mint: '#2AB5A2',
  mintDeep: '#0F7D6F',
  lavender: '#B7BAE0',
  sand: '#EDE4D3',
  hairline: 'rgba(21,36,31,.10)',
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif',
  mono: '"SF Mono", ui-monospace, "JetBrains Mono", Menlo, monospace',
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Spring-driven rise + fade. `at` is the local frame the element pops on. */
export const usePop = (at: number, opts: { rise?: number; scale?: number; damping?: number; stiffness?: number } = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { rise = 30, scale = 0.03, damping = 13, stiffness = 140 } = opts;
  const s = spring({ frame: frame - at, fps, config: { damping, stiffness, mass: 0.7 } });
  const opacity = interpolate(frame - at, [0, 3], [0, 1], clamp);
  return {
    opacity,
    transform: `translateY(${(1 - s) * rise}px) scale(${1 - (1 - s) * scale})`,
  };
};

export const Kicker: React.FC<{
  children: React.ReactNode;
  at?: number;
  dark?: boolean;
  size?: number;
  align?: 'left' | 'center';
}> = ({ children, at = 0, dark, size = 17, align = 'left' }) => {
  const style = usePop(at, { rise: 12 });
  return (
    <div
      style={{
        ...style,
        fontFamily: T.mono,
        fontSize: size,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color: dark ? 'rgba(255,254,251,.55)' : T.mintDeep,
        textAlign: align,
      }}
    >
      {children}
    </div>
  );
};

/** Title lines stagger 8 frames apart, each popping on its own beat. */
export const Title: React.FC<{
  lines: string[];
  at?: number;
  stagger?: number;
  dark?: boolean;
  size: number;
  align?: 'left' | 'center';
  color?: string;
  lineHeight?: number;
}> = ({ lines, at = 0, stagger = 8, dark, size, align = 'left', color, lineHeight = 1.05 }) => {
  return (
    <div
      style={{
        fontFamily: T.font,
        fontWeight: 600,
        fontSize: size,
        lineHeight,
        letterSpacing: '-0.022em',
        color: color || (dark ? T.snow : T.ink),
        textAlign: align,
      }}
    >
      {lines.map((line, i) => (
        <TitleLine key={line} text={line} at={at + i * stagger} />
      ))}
    </div>
  );
};

const TitleLine: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const style = usePop(at, { rise: 36, scale: 0.015, damping: 12, stiffness: 130 });
  return <div style={style}>{text}</div>;
};

export const Chip: React.FC<{
  children: React.ReactNode;
  at?: number;
  dark?: boolean;
  size?: number;
}> = ({ children, at = 0, dark, size = 19 }) => {
  const style = usePop(at, { rise: 16, damping: 14, stiffness: 150 });
  return (
    <span
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: T.mono,
        fontSize: size,
        color: dark ? 'rgba(255,254,251,.78)' : T.inkSoft,
        background: dark ? 'rgba(255,254,251,.08)' : 'rgba(21,36,31,.045)',
        border: `1px solid ${dark ? 'rgba(255,254,251,.14)' : T.hairline}`,
        borderRadius: 999,
        padding: '10px 20px 11px',
      }}
    >
      {children}
    </span>
  );
};

/** The mascot — real frames from the stage viewer, boxed with a soft shadow. */
export const Mascot: React.FC<{
  shot: ShotId;
  startFrame: number;
  size: number;
  x: number;
  y: number;
  entrance?: 'none' | 'pop' | 'rise';
  at?: number;
  mascot?: string;
}> = ({ shot, startFrame, size, x, y, entrance = 'none', at = 0, mascot = 'axo' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const index = Math.min(SHOT_LENGTH[shot] - 1, Math.max(0, startFrame + frame));

  let transform = '';
  let opacity = 1;
  if (entrance === 'pop') {
    const s = spring({ frame: frame - at, fps, config: { damping: 11, stiffness: 90, mass: 0.9 } });
    opacity = interpolate(frame - at, [0, 3], [0, 1], clamp);
    transform = `translateY(${(1 - s) * 70}px) scale(${0.74 + s * 0.26})`;
  } else if (entrance === 'rise') {
    const s = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 110, mass: 0.8 } });
    opacity = interpolate(frame - at, [0, 4], [0, 1], clamp);
    transform = `translateY(${(1 - s) * 90}px)`;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        transform,
        opacity,
      }}
    >
      <Img
        src={staticFile(`${mascot}/${shot}/f${String(index).padStart(4, '0')}.png`)}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

/** Full-bleed cream studio with the same soft light as the stage. */
export const StageBackdrop: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <AbsoluteFill
    style={{
      background: dark
        ? `radial-gradient(90% 70% at 50% 30%, #1D3129 0%, ${T.ink} 60%)`
        : `radial-gradient(85% 70% at 50% 26%, #FFFEFB 0%, ${T.paper} 58%, #EEE5D4 100%)`,
    }}
  />
);

/** Thin mint underline that draws itself (used once per film). */
export const MintDash: React.FC<{ at: number; width?: number }> = ({ at, width = 96 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 16, stiffness: 90 } });
  return (
    <div
      style={{
        height: 7,
        borderRadius: 999,
        background: T.mint,
        width: width * s,
        marginTop: 26,
      }}
    />
  );
};
