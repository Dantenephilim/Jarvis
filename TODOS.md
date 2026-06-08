# TODOS

Deferred work. Recorded by `/plan-ceo-review` on 2026-06-01 (branch: main).
These are deliberately NOT part of the current clap-to-music / webcam hardening pass.

---

## P2 — Clap on/off toggle
- **What:** A mic/clap enable button in the HUD, mirroring the existing webcam toggle.
- **Why:** Gives an explicit privacy off-switch. Today the clap detector opens the mic on page load and never stops (deliberate "always listening" choice, D3=A).
- **Context:** `useClapDetector` auto-starts on mount. Gate its `getUserMedia` + rAF loop behind an `isEnabled` prop, wired to a new icon button in `App.jsx` next to the camera toggle. The mic-busy-flag arbitration (this pass) is the prerequisite.
- **Effort:** S (human ~3-4h / CC ~35min) · **Depends on:** mic arbitration (current pass)

## P2 — Configurable music (un-hardcode videoId)
- **What:** Move the YouTube `videoId` / `start` / `volume` out of `MusicWidget.jsx` into settings.
- **Why:** Change JARVIS's music without editing code.
- **Context:** `MusicWidget.jsx` hardcodes `videoId: 'AD6wqKo51MU'`, `start: 7`, `setVolume(30)`, playlist `RDAD6wqKo51MU`. Surface via `SettingsModal` + `updateConfig` (the config plumbing already exists in `useJarvisLogic`).
- **Effort:** M (human ~half day / CC ~30min)

## P3 — Extract useMicArbiter hook
- **What:** Promote the mic busy-flag into a dedicated `useMicArbiter` coordination hook.
- **Why:** Cleaner home for arbitration once more mic/sensor consumers exist (multimodal direction).
- **Context:** This pass adds a busy flag inside `useJarvisLogic`. When a 3rd+ mic consumer appears, lift it out so SpeechRecognition + clap + future consumers all subscribe to one arbiter. Premature now.
- **Effort:** M (human ~half day / CC ~45min) · **Depends on:** a third mic consumer existing

## P3 — Unit-test clap detection logic
- **What:** Extract `isExplosiveSpike` + the double-clap state machine into a pure function and add a unit test.
- **Why:** Tune detection thresholds (THRESHOLD, delta, windows) with confidence instead of clapping at the screen.
- **Context:** Logic currently lives inside the rAF closure in `useClapDetector.js`. Pull peak/delta/count decisions into a pure `detectDoubleClap(state, sample)` function. No test harness in the repo yet — needs Vitest setup first.
- **Effort:** M (human ~half day / CC ~30min) · **Depends on:** test harness setup
