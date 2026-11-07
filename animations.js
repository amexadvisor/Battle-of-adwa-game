/**
 * ADWA 1896 - PROCEDURAL SKELETAL KEYFRAME & ANATOMY ENGINE (animations.js)
 * Zero external downloads required. Upload directly next to index.html.
 */
window.ADWA_ANIMATIONS = {
  // Smooth Hermite interpolation for natural muscle & joint motion
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  smoothstep(t) {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  },

  // 1. REALISTIC 4-BEAT HORSE GALLOP KEYFRAME SOLVER
  // Uses true equine biomechanics: Suspension -> Left Hind -> Right Hind -> Left Fore -> Right Fore
  applyHorseGallop(horse, phase, isRearing = false) {
    if (!horse || !horse.bodyGroup) return;

    if (isRearing) {
      horse.bodyGroup.position.y = 2.35 + Math.sin(phase * 1.4) * 0.15;
      horse.bodyGroup.rotation.x = -0.38 + Math.cos(phase * 1.4) * 0.06;
      horse.neckPivot.rotation.x = 0.25 + Math.sin(phase * 2) * 0.1;
      horse.tailPivot.rotation.x = 0.45 + Math.sin(phase * 2.5) * 0.2;
    } else {
      horse.bodyGroup.position.y = 2.06 + Math.sin(phase) * 0.15;
      horse.bodyGroup.rotation.x = Math.cos(phase) * 0.075;
      horse.neckPivot.rotation.x = Math.sin(phase - 0.6) * 0.13;
      horse.tailPivot.rotation.x = 0.22 + Math.cos(phase * 1.6) * 0.18;
    }

    // 4-Beat Gallop Phase Offsets: [Front-Left, Front-Right, Back-Left, Back-Right]
    const offsets = [0.0, 0.72, 2.85, 3.55];
    for (let i = 0; i < horse.legs.length; i++) {
      const leg = horse.legs[i];
      const p = phase + offsets[i];
      const s = Math.sin(p);
      const c = Math.cos(p);

      // Shoulder / Hip swing
      leg.hipJoint.rotation.x = s * 0.74;

      // Carpal (Knee) & Hock articulation: bends sharply when hoof lifts off ground
      const lift = Math.max(0, c);
      if (leg.isFront) {
        leg.lowerJoint.rotation.x = -lift * 0.98 - 0.08;
        if (leg.fetlockJoint) leg.fetlockJoint.rotation.x = s * 0.35;
      } else {
        leg.lowerJoint.rotation.x = lift * 0.92 + 0.1;
        if (leg.fetlockJoint) leg.fetlockJoint.rotation.x = -s * 0.35;
      }
    }
  },

  // 2. REALISTIC 3-COMBO ETHIOPIAN SHOTEL SWORD KINEMATICS
  // Combo 0: High Diagonal Right-to-Left Cavalry Cleave
  // Combo 1: Low Rising Backhand Slash
  // Combo 2: Overhead Crushing Imperial Strike
  applySwordCombatIK(joints, slashProgress, comboIndex, cycle) {
    const { torsoPivot, rightShoulder, rightElbow, rightWrist, leftArm } = joints;

    if (slashProgress <= 0) {
      // Natural breathing cavalry guard pose (sword held ready at right flank, shield angled left)
      const breathe = Math.sin(cycle) * 0.055;
      torsoPivot.rotation.set(0.06 + breathe * 0.4, -0.12, 0);
      rightShoulder.rotation.set(-0.28 + breathe, 0.25, -0.32);
      rightElbow.rotation.set(-0.68, 0.1, 0);
      rightWrist.rotation.set(0.15, 0, 0);
      leftArm.rotation.set(-0.2, 0.25, 0.15);
      return;
    }

    const p = slashProgress;
    const mode = comboIndex % 3;

    if (p < 0.24) {
      // STAGE 1: Coiled Wind-up (muscles tense, torso rotates back, shield braces forward)
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
      // STAGE 2: Explosive Whip-Through Cleave (full shoulder extension + wrist snap)
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
      // STAGE 3: Follow-Through & Return to Guard
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

  // 3. TAILORED CONICAL KABBA CLOTH VERTEX SOLVER (Pins top strictly below neck!)
  updateKabbaCloth(capeGeo, origPos, cycle) {
    const cPos = capeGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const ox = origPos.getX(i);
      const oy = origPos.getY(i); // 0.0 at shoulder collar down to -1.58 at bottom hem
      const oz = origPos.getZ(i);

      const drop = Math.min(1, Math.max(0, -oy / 1.58));
      // Drape backward over the white horse's hindquarters + harmonic wind waves
      const rumpCurve = Math.pow(drop, 1.32) * 0.82;
      const windWave = Math.sin(cycle * 2.2 - drop * 4.8 + ox * 3.2) * 0.13 * drop;

      cPos.setZ(i, oz + rumpCurve + windWave);
      // Lift bottom back edge so it rests above the horse's croup without clipping
      cPos.setY(i, oy + Math.pow(drop, 1.9) * 0.28);
    }
    cPos.needsUpdate = true;
    capeGeo.computeVertexNormals();
  }
};
