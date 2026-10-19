/**
 * Timeline for both cuts — everything is derived from the measured music grid
 * of `close-up.mp3` (105.46875 BPM). Cuts land on bars; events land on beats.
 */

export const FPS = 30;
const BPM = 105.46875;
export const BEAT = 60 / BPM; // 0.568888… s
export const BAR = 4 * BEAT; // 2.275555… s
export const MUSIC_START = 0.093; // seconds into the track where film t=0 sits

/** Film frame of bar n / beat n on the music grid. */
export const bar = (n: number) => Math.round(n * BAR * FPS);
export const beat = (n: number) => Math.round(n * BEAT * FPS);

export const REEL_LENGTH = 720; // 24.0 s
export const STORY_LENGTH = 1024; // 34.13 s

export type ShotId =
  | 'idle6'
  | 'idle-close6'
  | 'sw-work'
  | 'sw-think'
  | 'sw-celebrate'
  | 'sw-sleep';

export const SHOT_LENGTH: Record<ShotId, number> = {
  idle6: 180,
  'idle-close6': 180,
  'sw-work': 108,
  'sw-think': 108,
  'sw-celebrate': 108,
  'sw-sleep': 126,
};

export type SceneId =
  | 'hook'
  | 'reveal'
  | 'blink'
  | 'work'
  | 'think'
  | 'celebrate'
  | 'sleep'
  | 'moodmap'
  | 'verify'
  | 'diagram'
  | 'platforms'
  | 'install'
  | 'brand';

export interface SceneDef {
  id: SceneId;
  from: number;
  to: number;
  shot?: ShotId;
  shotStart?: number;
  dark?: boolean;
}

const scene = (
  id: SceneId,
  from: number,
  to: number,
  extra: Partial<SceneDef> = {}
): SceneDef => ({ id, from, to, ...extra });

/** Launch reel — 24.0 s, 11 cuts. */
export const REEL_SCENES: SceneDef[] = [
  scene('hook', 0, bar(1)),
  scene('reveal', bar(1), bar(2), { shot: 'idle6', shotStart: 30 }),
  scene('blink', bar(2), bar(3), { shot: 'idle-close6', shotStart: 95 }),
  scene('work', bar(3), bar(4), { shot: 'sw-work', shotStart: 186 }),
  scene('think', bar(4), bar(5), { shot: 'sw-think', shotStart: 254 }),
  scene('celebrate', bar(5), bar(6), { shot: 'sw-celebrate', shotStart: 322 }),
  scene('sleep', bar(6), bar(7), { shot: 'sw-sleep', shotStart: 391 }),
  scene('moodmap', bar(7), bar(8)),
  scene('verify', bar(8), bar(9), { dark: true }),
  scene('install', bar(9), bar(10)),
  scene('brand', bar(10), REEL_LENGTH, { shot: 'idle6', shotStart: 120 }),
];

/** Story cut — 34.13 s, adds the diagram, the platforms and a longer close. */
export const STORY_SCENES: SceneDef[] = [
  scene('hook', 0, bar(1)),
  scene('reveal', bar(1), bar(2), { shot: 'idle6', shotStart: 30 }),
  scene('blink', bar(2), bar(3), { shot: 'idle-close6', shotStart: 95 }),
  scene('work', bar(3), bar(4), { shot: 'sw-work', shotStart: 186 }),
  scene('think', bar(4), bar(5), { shot: 'sw-think', shotStart: 254 }),
  scene('celebrate', bar(5), bar(6), { shot: 'sw-celebrate', shotStart: 322 }),
  scene('sleep', bar(6), bar(7), { shot: 'sw-sleep', shotStart: 391 }),
  scene('moodmap', bar(7), bar(8)),
  scene('verify', bar(8), bar(9), { dark: true }),
  scene('diagram', bar(9), bar(10)),
  scene('platforms', bar(10), bar(11)),
  scene('install', bar(11), bar(13), { shot: 'idle6', shotStart: 40 }),
  scene('brand', bar(13), STORY_LENGTH, { shot: 'idle6', shotStart: 40 }),
];

export interface SfxHit {
  file: string;
  at: number;
  volume: number;
}

const sharedSfx = (): SfxHit[] => [
  { file: 'pop.wav', at: bar(1), volume: 0.5 },
  { file: 'clack.wav', at: bar(3) + 11, volume: 0.55 },
  { file: 'click-coarse.wav', at: bar(4) + 11, volume: 0.5 },
  { file: 'pop.wav', at: bar(5) + 11, volume: 0.45 },
  { file: 'whoosh-soft.wav', at: bar(6) + 11, volume: 0.5 },
  { file: 'click-coarse.wav', at: bar(7), volume: 0.4 },
  { file: 'whoosh-soft.wav', at: bar(8), volume: 0.45 },
];

export const REEL_SFX: SfxHit[] = [
  ...sharedSfx(),
  { file: 'click-coarse.wav', at: bar(9), volume: 0.45 },
  { file: 'riser-subtle.wav', at: bar(10) - 60, volume: 0.42 },
  { file: 'impact-soft.wav', at: bar(10), volume: 0.55 },
  { file: 'chime.wav', at: bar(10) + 4, volume: 0.4 },
];

export const STORY_SFX: SfxHit[] = [
  ...sharedSfx(),
  { file: 'whoosh-soft.wav', at: bar(9), volume: 0.45 },
  { file: 'click-coarse.wav', at: bar(10), volume: 0.35 },
  { file: 'clack.wav', at: bar(10) + 17, volume: 0.35 },
  { file: 'click-coarse.wav', at: bar(10) + 34, volume: 0.35 },
  { file: 'clack.wav', at: bar(10) + 51, volume: 0.35 },
  { file: 'click-coarse.wav', at: bar(11), volume: 0.45 },
  { file: 'clack.wav', at: bar(11) + 20, volume: 0.22 },
  { file: 'clack.wav', at: bar(11) + 42, volume: 0.22 },
  { file: 'clack.wav', at: bar(11) + 64, volume: 0.22 },
  { file: 'clack.wav', at: bar(11) + 88, volume: 0.22 },
  { file: 'riser-subtle.wav', at: bar(13) - 60, volume: 0.42 },
  { file: 'impact-soft.wav', at: bar(13), volume: 0.55 },
  { file: 'chime.wav', at: bar(13) + 4, volume: 0.4 },
];
