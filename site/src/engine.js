/**
 * MascotForge Pro runtime engine — exact 1:1 export for "Axo".
 * Local copy of the bundle's src/mascot-engine.js; only addition: the
 * THREE import, because the original expects a page-level global.
 */
import * as THREE from 'three';

export const BAKED_MASCOT_CONFIG = {
  "archetype": "axolotl",
  "name": "Axo",
  "subtitle": "Cyber Axolotl Synthesizer",
  "primaryColor": "#002629",
  "accentColor": "#00422c",
  "glowColor": "#000000",
  "headScale": 1.16,
  "bodyChubbiness": 1.08,
  "earScale": 1.18,
  "wingSpan": 0.95,
  "eyeScale": 1.14,
  "expression": "neutral",
  "goggleMode": "forehead",
  "propType": "none",
  "plinthStyle": "none",
  "surfacePreset": "clay",
  "clearcoat": 0.05,
  "roughness": 0.9,
  "metalness": 0.32,
  "iridescence": 1,
  "stage": "Build",
  "viewMode": "3d",
  "mode2DType": "sheet",
  "pose": "idle",
  "eyeGlowIntensity": 1.5,
  "meshSmoothness": 64,
  "lightRig": "warm",
  "lightAzimuth": 0,
  "rimIntensity": 0,
  "lut": "neutral",
  "fov": 44,
  "exposure": 1.22,
  "contrast": 114,
  "saturation": 120,
  "warmth": 12,
  "backdrop": "dark",
  "breathSpeed": 2,
  "levitation": 0.2,
  "springStiffness": 0.5,
  "trackCursor": true,
  "autoOrbit": false,
  "wireframe": false,
  "lastPrompt": "Polish surface to 8K high-gloss designer vinyl with clearcoat 0.94"
};

export function createStudioEnvTexture(renderer, rigType = 'softbox') {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(rigType === 'cyber' ? 0x0d0b18 : 0x181b24);

      const boxGeo = new THREE.PlaneGeometry(14, 14);
      const keyColor = rigType === 'warm' ? 0xffedd5 : rigType === 'cyber' ? 0xf472b6 : 0xffffff;
      const rimColor = rigType === 'cyber' ? 0x22d3ee : rigType === 'warm' ? 0xfbbf24 : 0x7dd3fc;
      const bounceColor = rigType === 'keynote' ? 0x94a3b8 : 0xfdba74;

      const keyPanel = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: keyColor, side: THREE.DoubleSide }));
      keyPanel.position.set(7, 9, 7);
      keyPanel.lookAt(0, 0, 0);
      envScene.add(keyPanel);

      const rimPanel = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: rimColor, side: THREE.DoubleSide }));
      rimPanel.position.set(-8, 6, -6);
      rimPanel.lookAt(0, 0, 0);
      envScene.add(rimPanel);

      const warmBounce = new THREE.Mesh(boxGeo, new THREE.MeshBasicMaterial({ color: bounceColor, side: THREE.DoubleSide }));
      warmBounce.position.set(0, -8, 4);
      warmBounce.lookAt(0, 0, 0);
      envScene.add(warmBounce);

      const tex = pmrem.fromScene(envScene, 0.035).texture;
      pmrem.dispose();
      return tex;
    }

export function createSoftShadowMap() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(128, 128, 18, 128, 128, 120);
      g.addColorStop(0, 'rgba(0,0,0,0.65)');
      g.addColorStop(0.55, 'rgba(0,0,0,0.22)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    }

export function buildProceduralMascot(state, envMap) {
      const root = new THREE.Group();
      root.name = 'MascotForge_Root';

      const seg = state.meshSmoothness || 64;
      const chub = state.bodyChubbiness || 1.0;
      const earSc = state.earScale || 1.0;
      const wingSc = state.wingSpan || 1.0;
      const eyeSc = state.eyeScale || 1.0;
      const isGlass = state.surfacePreset === 'glass';

      const primaryMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(state.primaryColor),
        roughness: state.roughness,
        metalness: state.metalness,
        clearcoat: state.clearcoat,
        clearcoatRoughness: Math.max(0.04, state.roughness * 0.65),
        reflectivity: 0.9,
        transparent: isGlass,
        opacity: isGlass ? 0.78 : 1.0,
        envMap: envMap,
        envMapIntensity: 1.25 + (state.iridescence || 0) * 0.6,
        wireframe: state.wireframe,
      });

      const bellyMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(state.primaryColor).lerp(new THREE.Color(0xffffff), 0.35),
        roughness: Math.min(0.92, state.roughness + 0.08),
        metalness: 0.02,
        clearcoat: state.clearcoat * 0.6,
        envMap: envMap,
        envMapIntensity: 1.0,
        wireframe: state.wireframe,
      });

      const accentMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(state.accentColor),
        roughness: 0.22,
        metalness: 0.82,
        clearcoat: 0.55,
        clearcoatRoughness: 0.16,
        envMap: envMap,
        envMapIntensity: 1.5,
        wireframe: state.wireframe,
      });

      const darkTrimMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x1e222d),
        roughness: 0.55,
        metalness: 0.25,
        envMap: envMap,
        wireframe: state.wireframe,
      });

      const visorGlassMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0x070a12),
        roughness: 0.03,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        reflectivity: 1.0,
        envMap: envMap,
        envMapIntensity: 2.0,
        wireframe: state.wireframe,
      });

      const eyeGlowMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(state.glowColor),
        emissive: new THREE.Color(state.glowColor),
        emissiveIntensity: state.eyeGlowIntensity,
        roughness: 0.08,
        wireframe: state.wireframe,
      });

      const holoMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(state.glowColor),
        emissive: new THREE.Color(state.glowColor),
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.42,
        roughness: 0.08,
        clearcoat: 1.0,
        side: THREE.DoubleSide,
        envMap: envMap,
      });

      // 1. Turntable Plinth
      const plinthGroup = new THREE.Group();
      plinthGroup.name = 'plinthGroup';
      plinthGroup.position.y = -1.42;
      if (state.plinthStyle !== 'none') {
        if (state.plinthStyle === 'holo') {
          const holoRing = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.03, 16, 64), eyeGlowMat);
          holoRing.rotation.x = Math.PI / 2;
          plinthGroup.add(holoRing);
          const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.015, 16, 64), holoMat);
          innerRing.rotation.x = Math.PI / 2;
          plinthGroup.add(innerRing);
        } else {
          const plinthDisc = new THREE.Mesh(
            new THREE.CylinderGeometry(1.52, 1.64, 0.14, 64),
            state.plinthStyle === 'aluminum' ? accentMat : darkTrimMat
          );
          plinthDisc.receiveShadow = true;
          plinthGroup.add(plinthDisc);

          const plinthRim = new THREE.Mesh(new THREE.TorusGeometry(1.54, 0.022, 16, 64), accentMat);
          plinthRim.rotation.x = Math.PI / 2;
          plinthRim.position.y = 0.06;
          plinthGroup.add(plinthRim);
        }
      }
      root.add(plinthGroup);

      // 2. Character Body Root
      const bodyRoot = new THREE.Group();
      bodyRoot.name = 'bodyRoot';
      root.add(bodyRoot);

      const torsoGeo = new THREE.SphereGeometry(1.06, seg, seg);
      torsoGeo.scale(1.04 * chub, 0.96, 0.94 * chub);
      const torsoMesh = new THREE.Mesh(torsoGeo, primaryMat);
      torsoMesh.position.set(0, -0.36, 0);
      torsoMesh.castShadow = true;
      torsoMesh.receiveShadow = true;
      bodyRoot.add(torsoMesh);

      const bellyGeo = new THREE.SphereGeometry(0.84, seg, seg);
      bellyGeo.scale(0.92 * chub, 0.88, 0.42 * chub);
      const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
      bellyMesh.position.set(0, -0.40, 0.72 * chub);
      bodyRoot.add(bellyMesh);

      const collarMesh = new THREE.Mesh(new THREE.TorusGeometry(0.82 * chub, 0.038, 20, 64), accentMat);
      collarMesh.rotation.x = Math.PI / 2;
      collarMesh.scale.set(1.04, 0.94, 1.0);
      collarMesh.position.set(0, 0.24, 0);
      bodyRoot.add(collarMesh);

      const chestBadge = new THREE.Group();
      chestBadge.position.set(0, -0.02, 0.98 * chub);
      chestBadge.rotation.x = -0.14;
      chestBadge.add(new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.026, 20, 48), accentMat));
      const badgeCore = new THREE.Mesh(new THREE.CircleGeometry(0.12, 32), eyeGlowMat);
      badgeCore.position.z = 0.01;
      chestBadge.add(badgeCore);
      bodyRoot.add(chestBadge);

      // 3. Head Pivot & Oversized Chibi Head Dome
      const headPivot = new THREE.Group();
      headPivot.name = 'headPivot';
      headPivot.position.set(0, 0.28, 0);
      headPivot.scale.setScalar(state.headScale);
      bodyRoot.add(headPivot);

      const headGeo = new THREE.SphereGeometry(1.08, seg, seg);
      headGeo.scale(1.10, 0.94, 0.98);
      const headMesh = new THREE.Mesh(headGeo, primaryMat);
      headMesh.position.set(0, 0.56, 0);
      headMesh.castShadow = true;
      headMesh.receiveShadow = true;
      headPivot.add(headMesh);

      const visorGeo = new THREE.SphereGeometry(0.95, seg, seg);
      visorGeo.scale(0.94, 0.62, 0.52);
      const visorMesh = new THREE.Mesh(visorGeo, visorGlassMat);
      visorMesh.position.set(0, 0.54, 0.64);
      headPivot.add(visorMesh);

      // 4. Expressive LED Eyes
      const eyesGroup = new THREE.Group();
      eyesGroup.position.set(0, 0.56, 1.11);
      headPivot.add(eyesGroup);

      [-1, 1].forEach((side) => {
        const eyeHolder = new THREE.Group();
        eyeHolder.position.set(side * 0.34, 0, 0);
        eyeHolder.rotation.y = side * 0.20;
        eyeHolder.scale.setScalar(eyeSc);

        let eyeMesh;
        if (state.expression === 'happy') {
          eyeMesh = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.032, 16, 32, Math.PI), eyeGlowMat);
          eyeMesh.position.y = -0.02;
        } else if (state.expression === 'focused') {
          const g = new THREE.SphereGeometry(0.135, 32, 32);
          g.scale(1.15, 0.52, 0.25);
          eyeMesh = new THREE.Mesh(g, eyeGlowMat);
          eyeMesh.rotation.z = side * -0.12;
        } else if (state.expression === 'sleepy') {
          eyeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.038, 0.04), eyeGlowMat);
        } else if (state.expression === 'wink' && side === 1) {
          eyeMesh = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.032, 16, 32, Math.PI), eyeGlowMat);
        } else if (state.expression === 'star') {
          const g = new THREE.OctahedronGeometry(0.15, 0);
          g.scale(1.0, 1.15, 0.3);
          eyeMesh = new THREE.Mesh(g, eyeGlowMat);
        } else {
          const g = new THREE.SphereGeometry(0.135, 32, 32);
          g.scale(1.0, 1.18, 0.25);
          eyeMesh = new THREE.Mesh(g, eyeGlowMat);
        }
        eyeHolder.add(eyeMesh);

        if (state.expression !== 'sleepy') {
          const catchlight = new THREE.Mesh(
            new THREE.CircleGeometry(0.036, 20),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
          catchlight.position.set(side * -0.035, 0.05, 0.038);
          eyeHolder.add(catchlight);
        }
        eyesGroup.add(eyeHolder);
      });

      // 5. Archetype Head Features & Goggles
      const gogglesPivot = new THREE.Group();
      gogglesPivot.name = 'gogglesPivot';
      gogglesPivot.position.set(0, 0.56, 0);
      headPivot.add(gogglesPivot);

      if (state.archetype === 'owl') {
        [-1, 1].forEach((side) => {
          const tuftGeo = new THREE.SphereGeometry(0.28, 32, 32);
          tuftGeo.scale(0.75 * earSc, 1.35 * earSc, 0.65 * earSc);
          const tuft = new THREE.Mesh(tuftGeo, primaryMat);
          tuft.position.set(side * 0.78, 1.18, 0.04);
          tuft.rotation.z = side * -0.45;
          headPivot.add(tuft);
        });
        const beakGeo = new THREE.ConeGeometry(0.11, 0.20, 32);
        beakGeo.scale(1.05, 1.0, 0.85);
        const beak = new THREE.Mesh(beakGeo, accentMat);
        beak.position.set(0, 0.29, 1.13);
        beak.rotation.x = Math.PI * 0.82;
        headPivot.add(beak);
      } else if (state.archetype === 'bot') {
        [-1, 1].forEach((side) => {
          const earCup = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * earSc, 0.28 * earSc, 0.18, 36), accentMat);
          earCup.rotation.z = Math.PI / 2;
          earCup.position.set(side * 1.16, 0.56, 0);
          headPivot.add(earCup);
        });
        const antStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.36 * earSc, 20), accentMat);
        antStem.position.set(0, 1.56, 0);
        headPivot.add(antStem);
        const antBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11 * earSc, 24, 24), eyeGlowMat);
        antBulb.position.set(0, 1.56 + 0.22 * earSc, 0);
        headPivot.add(antBulb);
      } else if (state.archetype === 'cat' || state.archetype === 'fox') {
        [-1, 1].forEach((side) => {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(0.32 * earSc, 0.54 * earSc, 32), primaryMat);
          ear.scale.set(1.0, 1.0, 0.65);
          ear.position.set(side * 0.72, 1.28, 0.05);
          ear.rotation.z = side * -0.36;
          headPivot.add(ear);

          const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.18 * earSc, 0.36 * earSc, 24), accentMat);
          innerEar.scale.set(1.0, 1.0, 0.45);
          innerEar.position.set(side * 0.72, 1.26, 0.14);
          innerEar.rotation.z = side * -0.36;
          headPivot.add(innerEar);
        });
      } else if (state.archetype === 'axolotl') {
        [-1, 1].forEach((side) => {
          for (let b = 0; b < 3; b++) {
            const frond = new THREE.Mesh(new THREE.SphereGeometry(0.14 * earSc, 20, 20), accentMat);
            frond.scale.set(1.9, 0.48, 0.45);
            frond.position.set(side * (1.08 + b * 0.06), 0.85 - b * 0.22, -0.05);
            frond.rotation.z = side * (0.35 - b * 0.28);
            headPivot.add(frond);
          }
        });
      } else if (state.archetype === 'spirit') {
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.56 * earSc, 0.045, 24, 64), accentMat);
        halo.rotation.x = Math.PI / 2;
        halo.position.set(0, 1.66, 0);
        headPivot.add(halo);
      }

      if (state.goggleMode !== 'hidden') {
        const goggleFront = new THREE.Group();
        goggleFront.position.set(0, 0.44, 0.90);
        goggleFront.rotation.x = -0.32;
        gogglesPivot.add(goggleFront);

        const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 24), accentMat);
        bridge.rotation.z = Math.PI / 2;
        goggleFront.add(bridge);

        [-1, 1].forEach((side) => {
          const pod = new THREE.Group();
          pod.position.set(side * 0.36, 0, 0.04);
          pod.rotation.y = side * 0.20;
          pod.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.042, 24, 48), accentMat));
          const lens = new THREE.Mesh(
            new THREE.SphereGeometry(0.21, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.42),
            visorGlassMat
          );
          lens.rotation.x = Math.PI / 2;
          lens.position.z = -0.04;
          pod.add(lens);
          goggleFront.add(pod);
        });
      }

      // 6. Wings / Arms & Handheld Prop
      const leftArmPivot = new THREE.Group();
      leftArmPivot.name = 'leftArmPivot';
      leftArmPivot.position.set(-1.04 * chub, -0.08, 0.06);
      bodyRoot.add(leftArmPivot);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.name = 'rightArmPivot';
      rightArmPivot.position.set(1.04 * chub, -0.08, 0.06);
      bodyRoot.add(rightArmPivot);

      [-1, 1].forEach((side) => {
        const armGeo = new THREE.SphereGeometry(0.36, 36, 32);
        armGeo.scale(0.52 * wingSc, 1.25 * wingSc, 0.72 * wingSc);
        const armMesh = new THREE.Mesh(armGeo, primaryMat);
        armMesh.position.set(side * 0.08, -0.28, 0);
        armMesh.rotation.z = side * 0.18;
        armMesh.castShadow = true;
        if (side === -1) leftArmPivot.add(armMesh);
        else rightArmPivot.add(armMesh);
      });

      const propPivot = new THREE.Group();
      propPivot.name = 'propPivot';
      propPivot.position.set(0.30, -0.24, 0.56);
      propPivot.rotation.set(-0.20, -0.35, -0.10);
      propPivot.visible = state.propType !== 'none';
      rightArmPivot.add(propPivot);

      if (state.propType === 'orb') {
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 32), eyeGlowMat);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.02, 16, 48), accentMat);
        ring.rotation.x = 1.1;
        propPivot.add(orb, ring);
      } else if (state.propType === 'macbook') {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.03, 0.44), accentMat);
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.42, 0.025), darkTrimMat);
        screen.position.set(0, 0.20, -0.20);
        screen.rotation.x = 0.25;
        propPivot.add(base, screen);
      } else {
        const padMesh = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.76, 0.028), holoMat);
        propPivot.add(padMesh);
        for (let i = 0; i < 3; i++) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.38 - i * 0.06, 0.028, 0.01), eyeGlowMat);
          bar.position.set(0, 0.18 - i * 0.14, 0.022);
          propPivot.add(bar);
        }
      }

      // 7. Feet
      [-1, 1].forEach((side) => {
        const footGeo = new THREE.SphereGeometry(0.24, 32, 24);
        footGeo.scale(0.95, 0.55, 1.35);
        const foot = new THREE.Mesh(footGeo, accentMat);
        foot.position.set(side * 0.42, -1.25, 0.16);
        foot.castShadow = true;
        bodyRoot.add(foot);
      });

      // 8. Tick & Spring Boop Physics
      root.userData = {
        blinkTimer: 0,
        isBlinking: false,
        boopVelocity: 0,
        boopOffset: 0,
        pointerX: 0,
        pointerY: 0,
        materials: { primaryMat, bellyMat, accentMat, visorGlassMat, eyeGlowMat, holoMat, darkTrimMat },
        pivots: { plinthGroup, bodyRoot, headPivot, gogglesPivot, leftArmPivot, rightArmPivot, propPivot, chestBadge },
        boop() {
          this.boopVelocity = 0.22 * (state.springStiffness || 1.0);
        },
        tick(delta, elapsed, currentState) {
          const dt = Math.min(delta, 0.1);
          const pose = currentState.pose || 'idle';
          const speed = currentState.breathSpeed || 1.0;
          const lev = currentState.levitation || 0.0;

          this.boopOffset += this.boopVelocity;
          this.boopVelocity -= this.boopOffset * 18.0 * dt;
          this.boopVelocity *= 0.86;

          this.blinkTimer += dt;
          if (!this.isBlinking && this.blinkTimer > 3.6) {
            this.isBlinking = true;
            this.blinkTimer = 0;
          } else if (this.isBlinking && this.blinkTimer > 0.12) {
            this.isBlinking = false;
            this.blinkTimer = 0;
          }
          eyesGroup.scale.y = THREE.MathUtils.lerp(eyesGroup.scale.y, this.isBlinking ? 0.08 : 1.0, dt * 24);

          const goggleDown = pose === 'work' || currentState.goggleMode === 'eyes';
          gogglesPivot.rotation.x = THREE.MathUtils.lerp(gogglesPivot.rotation.x, goggleDown ? 0.44 : 0.0, dt * 8);

          const cursorYaw = currentState.trackCursor ? this.pointerX * 0.35 : 0;
          const cursorPitch = currentState.trackCursor ? this.pointerY * 0.22 : 0;

          if (pose === 'idle') {
            bodyRoot.position.y = lev + this.boopOffset + Math.sin(elapsed * 2.2 * speed) * 0.04;
            bodyRoot.rotation.z = Math.sin(elapsed * 1.1 * speed) * 0.015;
            headPivot.rotation.y = THREE.MathUtils.lerp(headPivot.rotation.y, cursorYaw + Math.sin(elapsed * 0.9 * speed) * 0.10, dt * 7);
            headPivot.rotation.x = THREE.MathUtils.lerp(headPivot.rotation.x, cursorPitch, dt * 7);
            headPivot.rotation.z = Math.cos(elapsed * 1.3 * speed) * 0.03;
            leftArmPivot.rotation.z = Math.sin(elapsed * 2.2 * speed) * 0.06;
            rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, currentState.propType !== 'none' ? -0.52 : 0, dt * 6);
          } else if (pose === 'work') {
            bodyRoot.position.y = lev + this.boopOffset + Math.sin(elapsed * 4.0 * speed) * 0.03;
            headPivot.rotation.y = cursorYaw + Math.sin(elapsed * 2.5 * speed) * 0.24;
            leftArmPivot.rotation.z = 0.18 + Math.sin(elapsed * 5.0 * speed) * 0.08;
            rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, -0.48, dt * 6);
          } else if (pose === 'think') {
            bodyRoot.position.y = lev + this.boopOffset + Math.sin(elapsed * 2.6 * speed) * 0.04;
            headPivot.rotation.z = -0.15 + Math.sin(elapsed * 1.8 * speed) * 0.04;
            headPivot.rotation.y = THREE.MathUtils.lerp(headPivot.rotation.y, 0.22 + cursorYaw, dt * 5);
            rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, -0.78, dt * 6);
          } else if (pose === 'celebrate') {
            bodyRoot.position.y = lev + this.boopOffset + Math.abs(Math.sin(elapsed * 5.8 * speed)) * 0.16;
            bodyRoot.rotation.z = Math.sin(elapsed * 5.8 * speed) * 0.06;
            headPivot.rotation.y = Math.sin(elapsed * 3.8 * speed) * 0.18;
            leftArmPivot.rotation.z = 0.55 + Math.sin(elapsed * 10.0 * speed) * 0.22;
            rightArmPivot.rotation.x = -0.85 + Math.cos(elapsed * 8.0 * speed) * 0.18;
          }
        },
      };

      return root;
    }
