# Stage 3 reference: the 8-pass procedural pipeline

Execution commands and self-correction discipline for the img2threejs character pipeline, plus the Rive-parity construction rules each pass enforces.

## img2threejs commands (run from the skill root)

```bash
cd ~/.config/opencode/skills/img2threejs

# resumable state
python3 forge/state.py init --state "<project-dir>/.img2threejs/state.json" \
  --reference "<project-dir>/mascot-reference.png" --profile animated-character
python3 forge/next.py --state "<project-dir>/.img2threejs/state.json"

# intake
python3 forge/stage1_intake/extract_landmarks.py "<project-dir>/mascot-reference.png" \
  --style-heads 2.5 --out "<project-dir>/intake/anatomy.json" --force
python3 forge/stage1_intake/build_detail_inventory.py "<project-dir>/mascot-reference.png" \
  --mode grid-3x3 --out-dir "<project-dir>/intake" --out "<project-dir>/intake/di.json" --force

# spec
python3 forge/stage2_spec/new_pre_spec_assessment.py "AppMascot" \
  --image "<project-dir>/mascot-reference.png" --character --out "<project-dir>/assessment.json"
python3 forge/stage2_spec/new_sculpt_spec.py "AppMascot" \
  --image "<project-dir>/mascot-reference.png" --assessment "<project-dir>/assessment.json" \
  --character --out "<project-dir>/object-sculpt-spec.json"
python3 forge/stage2_spec/validate_sculpt_spec.py "<project-dir>/object-sculpt-spec.json" --strict-quality
```

State commands: `forge/state.py status --state <project>/.img2threejs/state.json`, `forge/state.py mark <step> --state <project>/.img2threejs/state.json --evidence <file>`.

## The 8 passes with Rive-parity responsibilities

| Pass | Name | Responsibility | Rive-parity requirement |
| --- | --- | --- | --- |
| 1 | `blockout` | Root `THREE.Group`, normalized scale (about 1.8 units tall), center of gravity, proportion ratios (`headScale`, `bodyChubbiness`) | 2-head chibi lock so the face reads at 64px |
| 2 | `structural-pass` | Named articulation pivots: `bodyRoot`, `headPivot`, `leftArmPivot`, `rightArmPivot`, `leftFootPivot`, `rightFootPivot`, `tailOrCapePivot`, `propPivot`, plus spring-bone children (`leftEarSpring`, `rightEarSpring`, `tailSpring`, `hatBrimSpring`) | Every pivot is a named group so the state machine can damp it independently |
| 3 | `form-refinement` | Organic high-segment meshes (`seg >= 48`), cheek puffs, snout or beak relief, ear interiors, smooth joint transition collars | Lofted bodies: `CapsuleGeometry(r, len, 24, 48)` or `LatheGeometry` splines, no visible intersection creases |
| 4 | `material-pass` | Centralized PBR registry with `MeshPhysicalMaterial` (`clearcoat`, `clearcoatRoughness`, `sheen`, `sheenRoughness`, `metalness`, `roughness`, `emissiveIntensity`) | 3-color palette: primary 70, apparel 20, accent 10 |
| 5 | `surface-pass` | Apparel seams, collar trim, chest emblem, layered eyes (sclera, iris, pupil, dual catchlights, upper and lower eyelids for blinking), handheld or head props | Extruded props via `THREE.Shape` + `ExtrudeGeometry` with bevel; catchlights offset `+0.015` to `+0.03` in local z |
| 6 | `lighting-pass` | Procedural `PMREMGenerator` studio environment, 3-point rig (warm key with `PCFSoftShadowMap`, cool rim, warm bounce fill), soft radial contact shadow | No external `.hdr` request; gold, clearcoat vinyl, and glossy eyes must not render black |
| 7 | `interaction-pass` | `mascot.userData.tick(delta, elapsed)` plus Rive-parity controllers `setMood`, `setLookTarget`, `scrub`, `bindViewModel`, `triggerBoop`, `updateSpringBone` | Damped cross-fade on every pivot, never a pose snap |
| 8 | `polish-pass` | ACES Filmic tone mapping (`exposure: 1.12`), camera FOV 32 to 38 degrees portrait, disposal on unmount, `THREE.AnimationClip` baking for `.glb` export | Baked clips: Idle, Scan, Think, Celebrate |

## Construction rules that separate collectible-grade from primitive-grade

- **Lofted, not glued**: neck flows into shoulders and belly. `LatheGeometry` spline profiles for torsos, `CapsuleGeometry` with 24 by 48 segments for chubby limbs.
- **Extruded apparel**: hats, visors, collars, wings, tails, badges drawn as 2D bezier profiles then extruded with `{ depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 5 }`.
- **Relief, not decals**: recessed or raised muzzle and cheek plates, 3D sclera domes, iris discs, pupil cores, dual pure-white `MeshBasicMaterial` catchlights.
- **Inline environment**: `PMREMGenerator` over a procedurally built softbox scene, or a `DataTexture` studio map. Never a network `.hdr`.
- **Spring bones**: zero-dependency verlet or damped-harmonic solver for ears, tails, hat brims, capes, antennae. They must lag, sway, and bounce with overshoot when the head or torso rotates or boops.

## Self-correction discipline

Adjust exactly ONE group per iteration, in this order:

```
camera -> silhouette -> face -> clothing -> accessory -> materials -> lighting
```

If the same group fails twice, re-check the SPEC (intake was wrong), not the code. `forge/next.py --state` always tells you the active step and gates; trust it over memory.

## Review evidence

One packaged comparison sheet per pass (`forge/stage4_review/make_comparison_sheet.py`), scored in `forge/stage4_review/append_review.py`. The strict-quality gate blocks codegen on a shallow spec; `--allow-nonstrict` is for legacy fixtures only, never production output.
