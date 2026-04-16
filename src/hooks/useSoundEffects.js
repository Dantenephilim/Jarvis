import { useCallback, useRef } from 'react';

export const useSoundEffects = () => {
    const audioCtx = useRef(null);

    const initAudio = () => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.current.state === 'suspended') {
            audioCtx.current.resume();
        }
    };

    const playBeep = useCallback((freq, duration, volume = 0.1, type = 'sine') => {
        try {
            initAudio();
            const osc = audioCtx.current.createOscillator();
            const gain = audioCtx.current.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
            
            gain.gain.setValueAtTime(volume, audioCtx.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.current.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.current.destination);

            osc.start();
            osc.stop(audioCtx.current.currentTime + duration);
        } catch (e) {
            console.warn('Audio play suppressed:', e);
        }
    }, []);

    const sounds = {
        click: () => playBeep(800, 0.1, 0.05),
        processing: () => playBeep(200, 0.5, 0.02, 'square'),
        synthStart: () => {
            playBeep(400, 0.2, 0.05);
            setTimeout(() => playBeep(600, 0.2, 0.05), 50);
        },
        error: () => playBeep(150, 0.3, 0.1, 'sawtooth'),
        listening: () => {
             playBeep(1000, 0.05, 0.05);
             setTimeout(() => playBeep(1200, 0.1, 0.05), 40);
        }
    };

    return sounds;
};
