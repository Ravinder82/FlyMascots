import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  BEAT,
  FPS,
  MUSIC_START,
  REEL_LENGTH,
  REEL_SCENES,
  REEL_SFX,
  STORY_LENGTH,
  STORY_SCENES,
  STORY_SFX,
  type SceneDef,
  type SfxHit,
} from './timeline';
import { Chip, Kicker, Mascot, MintDash, StageBackdrop, T, Title, usePop } from './ui';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* ---------------------------------------------------------------- *\
   Layout tokens — wide (16:9) and vertical (9:16)
\* ---------------------------------------------------------------- */

const L = (vertical: boolean) =>
  vertical
    ? {
        margin: 88,
        title: 74,
        kicker: 16,
        chip: 18,
        mascot: 780,
        mascotX: 540,
        mascotY: 1050,
        midX: 540,
      }
    : {
        margin: 140,
        title: 92,
        kicker: 17,
        chip: 19,
        mascot: 680,
        mascotX: 1420,
        mascotY: 566,
        midX: 960,
      };

const beatFrames = Math.round(BEAT * FPS); // 17

/* ---------------------------------------------------------------- *\
   Scenes
\* ---------------------------------------------------------------- */

const Hook: React.FC<{ vertical: boolean }> = ({ vertical }) => {
  const l = L(vertical);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ marginTop: vertical ? -140 : -60, textAlign: 'center' }}>
        <Kicker at={0} align="center" size={vertical ? 20 : 21}>
          FlyMascots · an agent skill
        </Kicker>
        <div style={{ marginTop: 26 }}>
          <Title lines={['Add a mascot.']} at={4} align="center" size={vertical ? 110 : 138} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <MintDash at={12} width={vertical ? 110 : 130} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Reveal: React.FC<{ vertical: boolean; scene: SceneDef }> = ({ vertical, scene }) => {
  const l = L(vertical);
  return (
    <AbsoluteFill>
      <Mascot
        shot={scene.shot!}
        startFrame={scene.shotStart!}
        size={vertical ? 860 : 780}
        x={vertical ? 540 : 1250}
        y={vertical ? 950 : 570}
        entrance="pop"
        at={0}
      />
      <div
        style={{
          position: 'absolute',
          left: vertical ? l.margin : 140,
          top: vertical ? 380 : 820,
          textAlign: vertical ? 'center' : 'left',
          width: vertical ? 904 : undefined,
        }}
      >
        <Kicker at={0} align={vertical ? 'center' : 'left'}>
          the example — axo
        </Kicker>
        <div style={{ marginTop: 18 }}>
          <Title
            lines={['One that feels alive.']}
            at={3}
            size={vertical ? 66 : 72}
            align={vertical ? 'center' : 'left'}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Blink: React.FC<{ vertical: boolean; scene: SceneDef }> = ({ vertical, scene }) => (
  <AbsoluteFill>
    <Mascot
      shot={scene.shot!}
      startFrame={scene.shotStart!}
      size={vertical ? 870 : 840}
      x={vertical ? 540 : 960}
      y={vertical ? 760 : 480}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: vertical ? 1420 : 862,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 26,
      }}
    >
      <Title
        lines={['It blinks when it feels like it.']}
        at={2}
        size={vertical ? 58 : 60}
        align="center"
      />
      <Chip at={beatFrames} size={vertical ? 20 : 19}>
        blink · 3.6 s
      </Chip>
    </div>
  </AbsoluteFill>
);

const MoodScene: React.FC<{
  vertical: boolean;
  scene: SceneDef;
  kicker: string;
  lines: string[];
  chip: string;
}> = ({ vertical, scene, kicker, lines, chip }) => {
  const l = L(vertical);
  return (
    <AbsoluteFill>
      <Mascot
        shot={scene.shot!}
        startFrame={scene.shotStart!}
        size={vertical ? 760 : l.mascot}
        x={vertical ? 540 : l.mascotX}
        y={vertical ? 1120 : l.mascotY}
      />
      <div
        style={{
          position: 'absolute',
          left: vertical ? l.margin : 140,
          top: vertical ? 430 : 330,
          width: vertical ? 904 : 900,
          textAlign: vertical ? 'center' : 'left',
        }}
      >
        <Kicker at={0} align={vertical ? 'center' : 'left'}>
          {kicker}
        </Kicker>
        <div style={{ marginTop: 20 }}>
          <Title lines={lines} at={3} size={vertical ? 72 : 86} align={vertical ? 'center' : 'left'} />
        </div>
        <div style={{ marginTop: 34, display: 'flex', justifyContent: vertical ? 'center' : 'flex-start' }}>
          <Chip at={beatFrames} size={vertical ? 20 : 19}>
            {chip}
          </Chip>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const MoodPill: React.FC<{ at: number; from: string; to: string; vertical: boolean }> = ({
  at,
  from,
  to,
  vertical,
}) => {
  const style = usePop(at, { rise: 22, damping: 13, stiffness: 150 });
  return (
    <span
      style={{
        ...style,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: T.mono,
        fontSize: vertical ? 24 : 22,
        color: T.ink,
        background: T.snow,
        border: `1px solid ${T.hairline}`,
        boxShadow: '0 18px 40px -26px rgba(21,36,31,.35)',
        borderRadius: 999,
        padding: '14px 26px 15px',
      }}
    >
      <span style={{ color: T.inkSoft }}>{from}</span>
      <span style={{ color: T.mint }}>→</span>
      <span>{to}</span>
    </span>
  );
};

const MoodMap: React.FC<{ vertical: boolean }> = ({ vertical }) => {
  const pills = [
    { from: 'start', to: 'working' },
    { from: 'pause', to: 'idle' },
    { from: 'stop', to: 'think' },
    { from: 'quit', to: 'celebrate' },
  ];
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginTop: vertical ? -260 : -70 }}>
        <Kicker at={0} align="center">
          mood sync
        </Kicker>
        <div style={{ marginTop: 22 }}>
          <Title
            lines={['One word.', "Your app's states."]}
            at={3}
            size={vertical ? 78 : 92}
            align="center"
          />
        </div>
        <div
          style={{
            marginTop: vertical ? 90 : 74,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            justifyContent: 'center',
            maxWidth: vertical ? 880 : 1500,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {pills.map((p, i) => (
            <MoodPill
              key={p.from}
              at={beatFrames + i * beatFrames}
              from={p.from}
              to={p.to}
              vertical={vertical}
            />
          ))}
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: T.mono,
            fontSize: vertical ? 19 : 18,
            letterSpacing: '0.08em',
            color: T.inkFaint,
            opacity: interpolate(useCurrentFrame(), [beatFrames * 5, beatFrames * 5 + 8], [0, 1], clamp),
          }}
        >
          one word · five moods · your app decides
        </div>
      </div>
    </AbsoluteFill>
  );
};

const VerifyRow: React.FC<{ at: number; children: React.ReactNode; vertical: boolean }> = ({
  at,
  children,
  vertical,
}) => {
  const style = usePop(at, { rise: 22, damping: 14, stiffness: 130 });
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        gap: 16,
        alignItems: 'baseline',
        fontFamily: T.mono,
        fontSize: vertical ? 23 : 24,
        color: 'rgba(255,254,251,.86)',
      }}
    >
      <span style={{ color: T.mint }}>✓</span>
      <span>{children}</span>
    </div>
  );
};

const Verify: React.FC<{ vertical: boolean }> = ({ vertical }) => {
  const frame = useCurrentFrame();
  const rows = [
    'per-mood assertions · numeric targets',
    '60-transition NaN / vanish health check',
    'pose renders compared with your reference',
  ];
  return (
    <AbsoluteFill>
      <StageBackdrop dark />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(52% 44% at 76% 32%, rgba(42,181,162,.16) 0%, rgba(42,181,162,0) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: vertical ? 88 : 140,
          top: vertical ? 560 : 300,
          width: vertical ? 904 : 1640,
          textAlign: vertical ? 'center' : 'left',
        }}
      >
        <Kicker at={0} dark align={vertical ? 'center' : 'left'}>
          verified every run
        </Kicker>
        <div style={{ marginTop: 22 }}>
          <Title
            lines={['Every pose tested', 'before you see it.']}
            at={3}
            dark
            size={vertical ? 76 : 92}
            align={vertical ? 'center' : 'left'}
          />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: vertical ? 88 : 140,
          top: vertical ? 1020 : 660,
          width: vertical ? 904 : 1500,
          display: 'flex',
          flexDirection: 'column',
          gap: vertical ? 34 : 26,
          alignItems: vertical ? 'center' : 'flex-start',
        }}
      >
        {rows.map((row, i) => (
          <VerifyRow key={row} at={beatFrames + i * beatFrames} vertical={vertical}>
            {row}
          </VerifyRow>
        ))}
        <div
          style={{
            marginTop: 8,
            width: vertical ? 300 : 420,
            height: 1,
            background: 'rgba(255,254,251,.16)',
            opacity: interpolate(frame, [beatFrames * 3 + 10, beatFrames * 4 - 4], [0, 1], clamp),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Diagram: React.FC<{ vertical: boolean }> = ({ vertical }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center' }}>
      <div
        style={{
          position: 'absolute',
          top: vertical ? 470 : 240,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <Kicker at={0} align="center">
          every run
        </Kicker>
        <div style={{ marginTop: 20 }}>
          <Title
            lines={vertical ? ['It leaves a process', 'diagram behind.'] : ['It leaves a process diagram behind.']}
            at={3}
            size={vertical ? 70 : 74}
            align="center"
          />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: vertical ? 800 : 470,
          left: '50%',
          width: vertical ? 620 : 560,
          height: vertical ? 592 : 534,
          marginLeft: vertical ? -310 : -280,
          transform: `scale(${zoom})`,
          borderRadius: 28,
          overflow: 'hidden',
          border: `1px solid ${T.hairline}`,
          boxShadow: '0 60px 120px -50px rgba(21,36,31,.35)',
          background: T.snow,
        }}
      >
        <img
          src={staticFile('pipeline/pipeline-light.png')}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          alt=""
        />
      </div>
      <div
        style={{
          position: 'absolute',
          top: vertical ? 1440 : 962,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: T.mono,
          fontSize: vertical ? 20 : 19,
          letterSpacing: '0.1em',
          color: T.inkFaint,
          opacity: interpolate(frame, [beatFrames * 3, beatFrames * 3 + 10], [0, 1], clamp),
        }}
      >
        open it · follow the run, step by step
      </div>
    </AbsoluteFill>
  );
};

const PlatformChip: React.FC<{ at: number; label: string; vertical: boolean }> = ({
  at,
  label,
  vertical,
}) => {
  const style = usePop(at, { rise: 20, damping: 13, stiffness: 150 });
  return (
    <span
      style={{
        ...style,
        fontFamily: T.mono,
        fontSize: vertical ? 24 : 22,
        color: T.ink,
        background: T.snow,
        border: `1px solid ${T.hairline}`,
        boxShadow: '0 18px 40px -26px rgba(21,36,31,.35)',
        borderRadius: 999,
        padding: '14px 28px 15px',
      }}
    >
      {label}
    </span>
  );
};

const Platforms: React.FC<{ vertical: boolean }> = ({ vertical }) => {
  const chips = ['Website', 'macOS', 'iOS', 'React Native', 'Electron'];
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginTop: vertical ? -300 : -90 }}>
        <Kicker at={0} align="center">
          one mascot — five homes
        </Kicker>
        <div style={{ marginTop: 20 }}>
          <Title
            lines={vertical ? ['It ships where', 'your app lives.'] : ['It ships where your app lives.']}
            at={3}
            size={vertical ? 74 : 86}
            align="center"
          />
        </div>
        <div
          style={{
            marginTop: vertical ? 84 : 66,
            display: 'flex',
            flexWrap: 'wrap',
            gap: vertical ? 16 : 18,
            justifyContent: 'center',
            maxWidth: vertical ? 880 : 1500,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {chips.map((c, i) => (
            <PlatformChip key={c} at={beatFrames + i * beatFrames} label={c} vertical={vertical} />
          ))}
        </div>
        <div
          style={{
            marginTop: 42,
            fontFamily: T.mono,
            fontSize: vertical ? 19 : 18,
            letterSpacing: '0.08em',
            color: T.inkFaint,
            opacity: interpolate(frame, [beatFrames * 6, beatFrames * 6 + 8], [0, 1], clamp),
          }}
        >
          one engine · five adapters
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Terminal: React.FC<{ vertical: boolean; text: string; at?: number }> = ({
  vertical,
  text,
  at = 6,
}) => {
  const frame = useCurrentFrame();
  const style = usePop(at, { rise: 30, damping: 14, stiffness: 120 });
  const chars = Math.round(interpolate(frame, [at + 2, at + 40], [0, text.length], clamp));
  const caretOn = Math.floor(frame / 14) % 2 === 0;
  return (
    <div
      style={{
        ...style,
        width: vertical ? 904 : 1120,
        borderRadius: 20,
        background: '#0F1B17',
        border: '1px solid rgba(255,254,251,.08)',
        boxShadow: '0 60px 120px -50px rgba(21,36,31,.5)',
        padding: vertical ? '30px 34px' : '32px 40px',
        display: 'flex',
        alignItems: 'baseline',
        gap: 18,
        fontFamily: T.mono,
        fontSize: vertical ? 24 : 27,
        color: T.snow,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <span style={{ color: T.mint }}>❯</span>
      <span>
        {text.slice(0, chars)}
        <span style={{ opacity: caretOn ? 0.9 : 0, color: T.mint }}>▌</span>
      </span>
    </div>
  );
};

const Install: React.FC<{ vertical: boolean; story: boolean }> = ({ vertical, story }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: vertical ? -180 : -50,
      }}
    >
      <Kicker at={0} align="center">
        install
      </Kicker>
      <div style={{ marginTop: 22 }}>
        <Title
          lines={['Drop it into any project.']}
          at={3}
          size={vertical ? 76 : 88}
          align="center"
        />
      </div>
      <div style={{ marginTop: vertical ? 90 : 76 }}>
        <Terminal vertical={vertical} text="npx skills add Ravinder82/FlyMascots" />
      </div>
      <div
        style={{
          marginTop: 44,
          fontFamily: T.mono,
          fontSize: vertical ? 20 : 19,
          letterSpacing: '0.08em',
          color: T.inkFaint,
          opacity: interpolate(useCurrentFrame(), [52, 62], [0, 1], clamp),
        }}
      >
        {story ? 'MIT · works with any agent · npm i flymascots' : 'MIT · npm i flymascots'}
      </div>
    </div>
  </AbsoluteFill>
);

const Brand: React.FC<{ vertical: boolean; scene: SceneDef }> = ({ vertical, scene }) => (
  <AbsoluteFill>
    <Mascot
      shot={scene.shot!}
      startFrame={scene.shotStart!}
      size={vertical ? 620 : 520}
      x={vertical ? 540 : 960}
      y={vertical ? 640 : 388}
      entrance="rise"
      at={0}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: vertical ? 1040 : 676,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Title lines={['FlyMascots']} at={3} size={vertical ? 96 : 126} align="center" />
      <div
        style={{
          marginTop: vertical ? 22 : 18,
          fontFamily: T.font,
          fontWeight: 500,
          fontSize: vertical ? 30 : 34,
          letterSpacing: '-0.01em',
          color: T.inkSoft,
          ...usePop(11, { rise: 18 }),
        }}
      >
        Mascots that feel alive.
      </div>
      <div
        style={{
          marginTop: vertical ? 34 : 30,
          fontFamily: T.mono,
          fontSize: vertical ? 18 : 19,
          letterSpacing: '0.06em',
          color: T.inkFaint,
          ...usePop(19, { rise: 14 }),
        }}
      >
        github.com/Ravinder82/FlyMascots · MIT
      </div>
    </div>
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- *\
   Scene switch + film + audio
\* ---------------------------------------------------------------- */

const Scene: React.FC<{ scene: SceneDef; vertical: boolean; cut: 'reel' | 'story' }> = ({
  scene,
  vertical,
  cut,
}) => {
  switch (scene.id) {
    case 'hook':
      return <Hook vertical={vertical} />;
    case 'reveal':
      return <Reveal vertical={vertical} scene={scene} />;
    case 'blink':
      return <Blink vertical={vertical} scene={scene} />;
    case 'work':
      return (
        <MoodScene
          vertical={vertical}
          scene={scene}
          kicker="start → working"
          lines={['Press play.', 'It gets to work.']}
          chip="mood · working"
        />
      );
    case 'think':
      return (
        <MoodScene
          vertical={vertical}
          scene={scene}
          kicker="stop → think"
          lines={['Hit stop.', 'It thinks.']}
          chip="mood · think"
        />
      );
    case 'celebrate':
      return (
        <MoodScene
          vertical={vertical}
          scene={scene}
          kicker="quit → celebrate"
          lines={['Quit.', 'It celebrates.']}
          chip="mood · celebrate"
        />
      );
    case 'sleep':
      return (
        <MoodScene
          vertical={vertical}
          scene={scene}
          kicker="rest → sleep"
          lines={['Then it rests.', 'Eyes closed.']}
          chip="mood · sleep"
        />
      );
    case 'moodmap':
      return <MoodMap vertical={vertical} />;
    case 'verify':
      return <Verify vertical={vertical} />;
    case 'diagram':
      return <Diagram vertical={vertical} />;
    case 'platforms':
      return <Platforms vertical={vertical} />;
    case 'install':
      return <Install vertical={vertical} story={cut === 'story'} />;
    case 'brand':
      return <Brand vertical={vertical} scene={scene} />;
    default:
      return null;
  }
};

const AudioLayer: React.FC<{ sfx: SfxHit[]; length: number }> = ({ sfx, length }) => (
  <>
    <Audio
      src={staticFile('music/close-up.mp3')}
      startFrom={Math.round(MUSIC_START * FPS)}
      volume={(f) => {
        const inF = interpolate(f, [0, 5], [0, 0.92], clamp);
        const outF = interpolate(f, [length - 14, length - 2], [1, 0], clamp);
        return inF * outF;
      }}
    />
    {sfx.map((hit, i) => (
      <Sequence key={`${hit.file}-${i}`} from={hit.at} durationInFrames={140}>
        <Audio src={staticFile(`sfx/${hit.file}`)} volume={hit.volume} />
      </Sequence>
    ))}
  </>
);

export const Film: React.FC<{ cut: 'reel' | 'story'; vertical: boolean }> = ({ cut, vertical }) => {
  const scenes = cut === 'reel' ? REEL_SCENES : STORY_SCENES;
  const length = cut === 'reel' ? REEL_LENGTH : STORY_LENGTH;
  const sfx = cut === 'reel' ? REEL_SFX : STORY_SFX;
  return (
    <AbsoluteFill style={{ background: T.paper, fontFamily: T.font }}>
      {scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.to - scene.from}>
          {scene.dark ? <StageBackdrop dark /> : <StageBackdrop />}
          <Scene scene={scene} vertical={vertical} cut={cut} />
        </Sequence>
      ))}
      <AudioLayer sfx={sfx} length={length} />
    </AbsoluteFill>
  );
};
