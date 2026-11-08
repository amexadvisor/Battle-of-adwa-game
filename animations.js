/**
 * ADWA 1896 - ADVANCED BIOMECHANICS, CLOTH & ARTILLERY ENGINE (animations.js)
 * Features: 3-Joint Human Sprint IK, Shield-Wall Brace Pose, 4-Beat Equine Gallop,
 * Dynamic Ground vs Saddle Kabba Cloth Physics, and 3-Combo Shotel Sword Cleaves.
 */
window.ADWA_ANIMATIONS = {
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  smoothstep(t) {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  },

  // 1. REALISTIC 4-BEAT EQUINE GALLOP SOLVER (With Fetlock & Hoof Articulation)
  applyHorseGallop(horse, phase, isRearing = false) {
    if (!horse || !horse.bodyGroup) return;

    if (isRearing) {
      horse.bodyGroup.position.y = 2.38 + Math.sin(phase * 1.4) * 0.15;
      horse.bodyGroup.rotation.x = -0.38 + Math.cos(phase * 1.4) * 0.06;
      horse.neckPivot.rotation.x = 0.26 + Math.sin(phase * 2.0) * 0.1;
      horse.tailPivot.rotation.x = 0.48 + Math.sin(phase * 2.4) * 0.22;
    } else {
      horse.bodyGroup.position.y = 2.06 + Math.sin(phase) * 0.15;
      horse.bodyGroup.rotation.x = Math.cos(phase) * 0.075;
      horse.neckPivot.rotation.x = Math.sin(phase - 0.6) * 0.13;
      horse.tailPivot.rotation.x = 0.22 + Math.cos(phase * 1.6) * 0.18;
    }

    const offsets = [0.0, 0.72, 2.85, 3.55];
    for (let i = 0; i < horse.legs.length; i++) {
      const leg = horse.legs[i];
      const p = phase + offsets[i];
      const s = Math.sin(p);
      const c = Math.cos(p);

      leg.hipJoint.rotation.x = s * 0.76;
      const lift = Math.max(0, c);
      if (leg.isFront) {
        leg.lowerJoint.rotation.x = -lift * 1.02 - 0.08;
        if (leg.fetlockJoint) leg.fetlockJoint.rotation.x = s * 0.38;
      } else {
        leg.lowerJoint.rotation.x = lift * 0.94 + 0.1;
        if (leg.fetlockJoint) leg.fetlockJoint.rotation.x = -s * 0.38;
      }
    }
  },

  // 2. FULL MULTI-JOINTED HUMAN BIOMECHANICS (Solves the "Toy Look" on Foot!)
  // Articulates Thigh -> Knee -> Shin -> Ankle + Pelvis Tilt + Aggressive Sprint Lean
  applyHumanLocomotion(riderLegs, riderGroup, torsoPivot, mode, cycle, isShielding) {
    if (mode === 'ON_FOOT') {
      const stride = cycle * 1.65;
      const bounce = Math.abs(Math.cos(stride)) * 0.22;
      riderGroup.position.y = this.lerp(riderGroup.position.y, 1.08 + bounce, 0.28);

      // Aggressive forward warrior sprint lean (or low braced crouch when shielding)
      const targetLean = isShielding ? 0.36 : 0.28;
      riderGroup.rotation.x = this.lerp(riderGroup.rotation.x, targetLean, 0.2);
      riderGroup.rotation.z = Math.sin(stride) * 0.06; // Natural hip counter-sway

      // Left & Right Multi-Jointed Legs (Thigh + Knee + Boot)
      for (let i = 0; i < 2; i++) {
        const leg = riderLegs[i];
        const p = stride + (i === 0 ? 0 : Math.PI);
        const thighSwing = Math.sin(p) * (isShielding ? 0.65 : 0.98);
        // Knee bends sharply when leg swings forward from behind
        const kneeFlex = Math.max(0, -Math.cos(p - 0.35)) * 1.35 + 0.15;

        leg.hipPivot.rotation.x = thighSwing;
        leg.hipPivot.rotation.z = i === 0 ? 0.06 : -0.06; // Straight running stance (not wide horse straddle!)
        if (leg.kneePivot) leg.kneePivot.rotation.x = -kneeFlex;
        if (leg.anklePivot) leg.anklePivot.rotation.x = Math.sin(p) * 0.25;
      }
    } else {
      // Mounted Cavalry Stirrup Stance
      riderGroup.position.y = this.lerp(riderGroup.position.y, 2.56 + Math.sin(cycle) * 0.14, 0.28);
      riderGroup.rotation.x = this.lerp(riderGroup.rotation.x, 0.04, 0.2);
      riderGroup.rotation.z = 0;

      for (let i = 0; i < 2; i++) {
        const leg = riderLegs[i];
        leg.hipPivot.rotation.x = 0.32;
        leg.hipPivot.rotation.z = i === 0 ? 0.26 : -0.26; // Straddling the saddle
        if (leg.kneePivot) leg.kneePivot.rotation.x = -0.58;
        if (leg.anklePivot) leg.anklePivot.rotation.x = 0.2;
      }
    }
  },

  // 3. COMBAT KINEMATICS: SHIELD WALL BRACE, RIFLE AIM & 3-COMBO SHOTEL SLASHES
  applyCombatKinematics(joints, slashProgress, comboIndex, cycle, isShielding, rifleRecoil, isOnFoot) {
    const { torsoPivot, rightShoulder, rightElbow, rightWrist, leftArm } = joints;

    // A. ACTIVE GASHA SHIELD WALL BLOCK (Deflects Carcano Rifle Volleys & Shrapnel!)
    if (isShielding && slashProgress <= 0) {
      torsoPivot.rotation.set(0.18, 0.38, 0);
      // Swing Left Arm across chest so the Gasha Shield faces straight ahead
      leftArm.rotation.set(-0.65, 1.15, 0.35);
      // Tuck Sword Arm back ready to counter-strike
      rightShoulder.rotation.set(-0.45, -0.35, -0.3);
      rightElbow.rotation.set(-1.1, 0, 0);
      rightWrist.rotation.set(0.2, 0, 0);
      return;
    }

    // B. CARCINE / RIFLE SNAP-SHOT RECOIL
    if (rifleRecoil > 0 && slashProgress <= 0) {
      const r = rifleRecoil / 14;
      torsoPivot.rotation.set(-0.15 * r, -0.2, 0);
      rightShoulder.rotation.set(-1.35 + r * 0.35, 0.15, -0.1);
      rightElbow.rotation.set(-0.35, 0, 0);
      leftArm.rotation.set(-0.5, 0.4, 0.2);
      return;
    }

    // C. NATURAL BREATHING GUARD OR ARM PUMP WHEN SPRINTING ON FOOT
    if (slashProgress <= 0) {
      const breathe = Math.sin(cycle) * 0.055;
      if (isOnFoot) {
        const armPump = Math.sin(cycle * 1.65) * 0.45;
        torsoPivot.rotation.set(0.12, -armPump * 0.35, 0);
        rightShoulder.rotation.set(-0.35 + armPump, 0.2, -0.28);
        rightElbow.rotation.set(-0.85, 0.1, 0);
        rightWrist.rotation.set(0.1, 0, 0);
        leftArm.rotation.set(-0.35 - armPump * 0.8, 0.35, 0.18);
      } else {
        torsoPivot.rotation.set(0.06 + breathe * 0.4, -0.12, 0);
        rightShoulder.rotation.set(-0.28 + breathe, 0.25, -0.32);
        rightElbow.rotation.set(-0.68, 0.1, 0);
        rightWrist.rotation.set(0.15, 0, 0);
        leftArm.rotation.set(-0.2, 0.25, 0.15);
      }
      return;
    }

    // D. 3-STAGE REALISTIC SHOTEL SWORD CLEAVE COMBOS
    const p = slashProgress;
    const mode = comboIndex % 3;

    if (p < 0.24) {
      const w = this.smoothstep(p / 0.24);
      leftArm.rotation.set(-0.45 * w, 0.55 * w, 0.25 * w);

      if (mode === 0) {
        torsoPivot.rotation.set(-0.08 * w, 0.52 * w, 0.08 * w);
        rightShoulder.rotation.set(-1.15 * w, 0.75 * w, -0.65 * w);
        rightElbow.rotation.set(-1.25 * w, 0, 0);
        rightWrist.rotation.set(-0.35 * w, 0, 0.4 * w);
      } else if (mode === 1) {
        torsoPivot.rotation.set(0.1 * w, -0.58 * w, -0.1 * w);
        rightShoulder.rotation.set(-0.45 * w, -0.85 * w, 0.35 * w);
        rightElbow.rotation.set(-1.1 * w, 0, 0);
        rightWrist.rotation.set(0.2 * w, 0, -0.45 * w);
      } else {
        torsoPivot.rotation.set(-0.18 * w, 0.25 * w, 0);
        rightShoulder.rotation.set(-1.65 * w, 0.2 * w, -0.25 * w);
        rightElbow.rotation.set(-0.95 * w, 0, 0);
        rightWrist.rotation.set(-0.4 * w, 0, 0);
      }
    } else if (p < 0.68) {
      const raw = (p - 0.24) / 0.44;
      const ease = 1 - Math.pow(1 - raw, 3);

      if (mode === 0) {
        torsoPivot.rotation.set(
          this.lerp(-0.08, 0.24, ease),
          this.lerp(0.52, -0.68, ease),
          this.lerp(0.08, -0.12, ease)
        );
        rightShoulder.rotation.set(
          this.lerp(-1.15, 0.65, ease),
          this.lerp(0.75, -1.25, ease),
          this.lerp(-0.65, -0.25, ease)
        );
        rightElbow.rotation.set(this.lerp(-1.25, -0.15, ease), 0, 0);
        rightWrist.rotation.set(this.lerp(-0.35, 0.78, ease), 0, this.lerp(0.4, -0.2, ease));
      } else if (mode === 1) {
        torsoPivot.rotation.set(
          this.lerp(0.1, 0.18, ease),
          this.lerp(-0.58, 0.64, ease),
          this.lerp(-0.1, 0.14, ease)
        );
        rightShoulder.rotation.set(
          this.lerp(-0.45, 0.42, ease),
          this.lerp(-0.85, 1.18, ease),
          this.lerp(0.35, -0.48, ease)
        );
        rightElbow.rotation.set(this.lerp(-1.1, -0.12, ease), 0, 0);
        rightWrist.rotation.set(this.lerp(0.2, 0.72, ease), 0, this.lerp(-0.45, 0.35, ease));
      } else {
        torsoPivot.rotation.set(
          this.lerp(-0.18, 0.32, ease),
          this.lerp(0.25, -0.35, ease),
          0
        );
        rightShoulder.rotation.set(
          this.lerp(-1.65, 0.85, ease),
          this.lerp(0.2, -0.45, ease),
          -0.22
        );
        rightElbow.rotation.set(this.lerp(-0.95, -0.08, ease), 0, 0);
        rightWrist.rotation.set(this.lerp(-0.4, 0.88, ease), 0, 0);
      }
    } else {
      const r = this.smoothstep((p - 0.68) / 0.32);
      torsoPivot.rotation.x = this.lerp(torsoPivot.rotation.x, 0.06, r);
      torsoPivot.rotation.y = this.lerp(torsoPivot.rotation.y, -0.12, r);
      torsoPivot.rotation.z = this.lerp(torsoPivot.rotation.z, 0, r);

      rightShoulder.rotation.x = this.lerp(rightShoulder.rotation.x, -0.28, r);
      rightShoulder.rotation.y = this.lerp(rightShoulder.rotation.y, 0.25, r);
      rightShoulder.rotation.z = this.lerp(rightShoulder.rotation.z, -0.32, r);

      rightElbow.rotation.x = this.lerp(rightElbow.rotation.x, -0.68, r);
      rightWrist.rotation.x = this.lerp(rightWrist.rotation.x, 0.15, r);
      rightWrist.rotation.z = this.lerp(rightWrist.rotation.z, 0, r);
      leftArm.rotation.set(this.lerp(-0.45, -0.2, r), this.lerp(0.55, 0.25, r), 0.15);
    }
  },

  // 4. ADAPTIVE KABBA CLOAK SOLVER (Narrows & flows behind legs when on foot; drapes over horse when mounted!)
  updateKabbaCloth(capeGeo, origPos, cycle, isOnFoot) {
    const cPos = capeGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const ox = origPos.getX(i);
      const oy = origPos.getY(i);
      const oz = origPos.getZ(i);

      const drop = Math.min(1, Math.max(0, -oy / 1.58));

      if (isOnFoot) {
        // Taper cloak inward on foot so it never looks like a stiff bell/skirt!
        const narrowFactor = 1.0 - drop * 0.35;
        const sprintBillow = Math.pow(drop, 1.2) * 0.52 + Math.sin(cycle * 2.8 - drop * 5.2 + ox * 3) * 0.16 * drop;
        cPos.setX(i, ox * narrowFactor);
        cPos.setZ(i, oz + sprintBillow);
        cPos.setY(i, oy + drop * 0.18);
      } else {
        // Mounted: wide imperial drape over the white horse's hindquarters
        const rumpCurve = Math.pow(drop, 1.32) * 0.82;
        const windWave = Math.sin(cycle * 2.2 - drop * 4.8 + ox * 3.2) * 0.13 * drop;
        cPos.setX(i, ox);
        cPos.setZ(i, oz + rumpCurve + windWave);
        cPos.setY(i, oy + Math.pow(drop, 1.9) * 0.28);
      }
    }
    cPos.needsUpdate = true;
    capeGeo.computeVertexNormals();
  }
};
