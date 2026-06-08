import { useEffect, useRef, useState } from 'react';

// Detection tuning. A physical clap is an explosive transient: it must jump
// massively in a single ~16ms frame. Human speech ramps over several frames,
// so its per-frame delta stays well below the spike threshold.
const PEAK_THRESHOLD = 200;   // Absolute loudness required (0-255 scale, doubled)
const SPIKE_DELTA = 150;      // Min single-frame jump to count as a transient
const CLAP_WINDOW_MS = 1500;  // Max gap between the two claps of a double-clap
const CLAP_COOLDOWN_MS = 150; // Debounce to avoid one clap registering as two
const RETRIGGER_LOCK_MS = 2000; // Quiet period after a successful double-clap

/**
 * Listens for a double-clap on a dedicated mic stream.
 *
 * @param {Object}   opts
 * @param {Function} opts.onClap     Called when a double-clap is detected.
 * @param {Object}   opts.isBusyRef  React ref; when .current is truthy (JARVIS
 *                                   speaking or music playing) detection is
 *                                   muted so audio output can't trigger itself.
 * @param {Function} opts.onError    Called with a user-facing string if the
 *                                   mic can't be acquired (denied / missing).
 */
export const useClapDetector = ({ onClap, isBusyRef, onError } = {}) => {
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const sourceRef = useRef(null);
    const requestRef = useRef(null);
    const lastClapTimeRef = useRef(0);
    const clapCountRef = useRef(0);
    const lastPeakRef = useRef(0);
    const [isListening, setIsListening] = useState(false);

    // Keep callbacks in refs so changing their identity never re-acquires the mic.
    // Synced in an effect (not during render) per React's rules-of-refs.
    const onClapRef = useRef(onClap);
    const isBusyRefHolder = useRef(isBusyRef);
    const onErrorRef = useRef(onError);
    useEffect(() => {
        onClapRef.current = onClap;
        isBusyRefHolder.current = isBusyRef;
        onErrorRef.current = onError;
    });

    useEffect(() => {
        let mounted = true;
        const gestureCleanups = [];

        const startListening = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (!mounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = stream;

                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioContext();
                audioContextRef.current = audioCtx;

                // Browsers start an AudioContext 'suspended' until a user gesture
                // (autoplay policy). Without this, detection silently never works
                // on a fresh page load. Resume on the first click/keypress.
                if (audioCtx.state === 'suspended') {
                    const resume = () => {
                        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                            audioContextRef.current.resume().catch(() => {});
                        }
                    };
                    window.addEventListener('click', resume, { once: true });
                    window.addEventListener('keydown', resume, { once: true });
                    gestureCleanups.push(() => {
                        window.removeEventListener('click', resume);
                        window.removeEventListener('keydown', resume);
                    });
                }

                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.0; // ZERO smoothing to catch raw transients
                analyserRef.current = analyser;

                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);
                sourceRef.current = source;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const detectClap = () => {
                    if (!mounted) return;
                    requestRef.current = requestAnimationFrame(detectClap);

                    analyser.getByteTimeDomainData(dataArray);

                    let maxVal = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        const val = Math.abs(dataArray[i] - 128);
                        if (val > maxVal) maxVal = val;
                    }

                    const peak = maxVal * 2;
                    const delta = peak - lastPeakRef.current; // jump in exactly 1 frame (~16ms)
                    lastPeakRef.current = peak;

                    // Mute detection while JARVIS speaks or music plays, otherwise
                    // its own audio output (drum transients, TTS) would self-trigger.
                    if (isBusyRefHolder.current && isBusyRefHolder.current.current) {
                        clapCountRef.current = 0;
                        return;
                    }

                    const isExplosiveSpike = peak > PEAK_THRESHOLD && delta > SPIKE_DELTA;

                    if (isExplosiveSpike) {
                        const now = Date.now();
                        const timeSinceLast = now - lastClapTimeRef.current;

                        if (timeSinceLast > CLAP_COOLDOWN_MS) {
                            if (timeSinceLast < CLAP_WINDOW_MS) {
                                clapCountRef.current++;
                                if (clapCountRef.current >= 2) {
                                    if (onClapRef.current) onClapRef.current();
                                    clapCountRef.current = 0;
                                    lastClapTimeRef.current = now + RETRIGGER_LOCK_MS;
                                }
                            } else {
                                clapCountRef.current = 1;
                                lastClapTimeRef.current = now;
                            }
                        }
                    } else if (clapCountRef.current === 1 && Date.now() - lastClapTimeRef.current > CLAP_WINDOW_MS) {
                        clapCountRef.current = 0;
                    }
                };

                detectClap();
                setIsListening(true);

            } catch (err) {
                console.error("Error initializing clap detector:", err);
                setIsListening(false);
                // Surface the failure instead of dying silently.
                let msg = "SYSTEM: Clap detection unavailable.";
                if (err && err.name === 'NotAllowedError') {
                    msg = "SYSTEM: Mic denied — clap detection off.";
                } else if (err && err.name === 'NotFoundError') {
                    msg = "SYSTEM: No microphone found — clap detection off.";
                }
                if (onErrorRef.current) onErrorRef.current(msg);
            }
        };

        startListening();

        return () => {
            mounted = false;
            gestureCleanups.forEach(fn => fn());
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (sourceRef.current) sourceRef.current.disconnect();
            if (analyserRef.current) analyserRef.current.disconnect();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []); // Mount once — callbacks read through refs, so identity changes don't re-acquire the mic.

    return { isListening };
};
