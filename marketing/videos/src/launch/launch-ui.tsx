/**
 * Launch-film UI — v2 palette lifted straight from website/DESIGN.md
 * (cool porcelain light, neutral graphite dark, mint as accent only).
 * Color-free primitives (Mascot, usePop) come from ../film/ui; everything
 * that carries pigment is re-declared here so the old cuts never change.
 */
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const T2 = {
  paper: '#F3F6F5', // porcelain
  snow: '#FFFFFF',
  ink: '#10201B', // deep pine text
  inkSoft: 'rgba(16,32,27,.62)',
  inkFaint: 'rgba(16,32,27,.40)',
  mint: '#2AB5A2',
  mintBright: '#3FD2BD', // on dark
  mintDeep: '#0E7A6B',
  dark: '#141719', // graphite — never green
  darkSurface: '#1C2124',
  frost: '#E9EDEE',
  frostSoft: 'rgba(233,237,238,.62)',
  frostFaint: 'rgba(233,237,238,.40)',
  hairline: 'rgba(16,32,27,.10)',
  hairlineDark: 'rgba(233,237,238,.14)',
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif',
  mono: '"SF Mono", ui-monospace, "JetBrains Mono", Menlo, monospace',
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Spring-driven rise + fade — same feel as the original film system. */
export const usePop = (
  at: number,
  opts: { rise?: number; scale?: number; damping?: number; stiffness?: number } = {}
) => {
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
        fontFamily: T2.mono,
        fontSize: size,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
        color: dark ? 'rgba(233,237,238,.55)' : T2.mintDeep,
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
}> = ({ lines, at = 0, stagger = 8, dark, size, align = 'left', color, lineHeight = 1.05 }) => (
  <div
    style={{
      fontFamily: T2.font,
      fontWeight: 600,
      fontSize: size,
      lineHeight,
      letterSpacing: '-0.022em',
      color: color || (dark ? T2.frost : T2.ink),
      textAlign: align,
    }}
  >
    {lines.map((line, i) => (
      <TitleLine key={line} text={line} at={at + i * stagger} />
    ))}
  </div>
);

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
        fontFamily: T2.mono,
        fontSize: size,
        color: dark ? 'rgba(233,237,238,.78)' : T2.inkSoft,
        background: dark ? 'rgba(233,237,238,.08)' : 'rgba(16,32,27,.045)',
        border: `1px solid ${dark ? T2.hairlineDark : T2.hairline}`,
        borderRadius: 999,
        padding: '10px 20px 11px',
      }}
    >
      {children}
    </span>
  );
};

/** Full-bleed studio light — cool porcelain, or neutral graphite. */
export const StageBackdrop: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <AbsoluteFill
    style={{
      background: dark
        ? `radial-gradient(90% 70% at 50% 30%, #20262A 0%, ${T2.dark} 62%)`
        : `radial-gradient(85% 70% at 50% 26%, #FFFEFB 0%, ${T2.paper} 58%, #E7ECEA 100%)`,
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
        background: T2.mint,
        width: width * s,
        marginTop: 26,
      }}
    />
  );
};

/** Graphite terminal with a mint prompt — matches the site's install block. */
export const Terminal: React.FC<{ text: string; at?: number }> = ({ text, at = 6 }) => {
  const frame = useCurrentFrame();
  const style = usePop(at, { rise: 30, damping: 14, stiffness: 120 });
  const chars = Math.round(interpolate(frame, [at + 2, at + 40], [0, text.length], clamp));
  const caretOn = Math.floor(frame / 14) % 2 === 0;
  return (
    <div
      style={{
        ...style,
        width: 1120,
        borderRadius: 20,
        background: T2.dark,
        border: `1px solid ${T2.hairlineDark}`,
        boxShadow: '0 60px 120px -50px rgba(16,32,27,.5)',
        padding: '32px 40px',
        display: 'flex',
        alignItems: 'baseline',
        gap: 18,
        fontFamily: T2.mono,
        fontSize: 27,
        color: T2.frost,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <span style={{ color: T2.mintBright }}>❯</span>
      <span>
        {text.slice(0, chars)}
        <span style={{ opacity: caretOn ? 0.9 : 0, color: T2.mintBright }}>▌</span>
      </span>
    </div>
  );
};
