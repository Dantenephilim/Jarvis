import { useState, useCallback, useEffect, useRef } from 'react';

// Global audio context for Jarvis's voice output
let sharedAudioCtx = null;
let sharedAnalyser = null;

export const getJarvisAnalyser = () => sharedAnalyser;

export const useJarvisLogic = () => {
    const envWebhook = import.meta.env.VITE_N8N_WEBHOOK_URL;
    const DEFAULT_N8N_URL = envWebhook ? envWebhook : "http://10.0.0.141:5678/webhook/fbb90c0a-03c0-4c21-a5bf-dc85cf102a2a";

    // Auto-migrate from old nexotechx or stale endpoints to local n8n
    const normalizeN8nUrl = (url) => {
        if (!url || url.includes('1faaf855') || url.includes('nexotechx.com')) {
            return DEFAULT_N8N_URL;
        }
        return url;
    };

    const storedUrl = localStorage.getItem('n8n_webhook_url');
    const initialUrl = normalizeN8nUrl(storedUrl);
    if (storedUrl !== initialUrl) {
        localStorage.setItem('n8n_webhook_url', initialUrl);
    }

    const [n8nUrl, setN8nUrl] = useState(initialUrl);
    const getInitialLogs = () => {
        try {
            const stored = localStorage.getItem('jarvis_console_logs');
            if (stored) return JSON.parse(stored);
        } catch (e) { }
        return ['SYSTEM: J.A.R.V.I.S. initialized.', 'SYSTEM: Core linked to Local n8n [10.0.0.141].'];
    };

    const [status, setStatus] = useState('idle');
    const [transcript, setTranscript] = useState('SYSTEM ONLINE. WAITING FOR COMMAND.');
    const [logs, setLogs] = useState(getInitialLogs);
    const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('jarvis_theme') || 'VoiceCore');

    const addLog = (text) => {
        setLogs(prev => {
            const timeString = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const newLog = { text, timestamp: timeString };
            const updated = [...prev, newLog];
            // Keep last 100 entries to prevent memory limits
            const limited = updated.slice(-100);
            localStorage.setItem('jarvis_console_logs', JSON.stringify(limited));
            return limited;
        });
        setTranscript(text);
    };

    // Pre-warm Web Speech voices for 0ms speech synthesis start
    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    }, []);

    const recognitionRef = useRef(null);
    const audioRef = useRef(null);

    const [isMuted, setIsMuted] = useState(true);

    const isMutedRef = useRef(isMuted);
    const statusRef = useRef(status);
    // Synchronous flag: prevents onend from restarting mic after a not-allowed block
    const isBlockedRef = useRef(false);

    // Sync latest state to refs to avoid closure staleness without triggering re-initialization
    useEffect(() => {
        isMutedRef.current = isMuted;
        statusRef.current = status;
    }, [isMuted, status]);

    // Initialize Speech Recognition once
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            addLog("ERROR: Browser does not support Web Speech API (Use Chrome/Edge).");
            return;
        }

        const createRecognition = () => {
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.lang = 'es-ES';
            rec.interimResults = false;

            rec.onstart = () => {
                if (!isMutedRef.current && statusRef.current !== 'speaking' && statusRef.current !== 'processing') {
                    setStatus('listening');
                }
            };

            rec.onend = () => {
                // Auto restart logic — skip if mic is blocked, muted, or jarvis is busy.
                setTimeout(() => {
                    if (!isBlockedRef.current && !isMutedRef.current && statusRef.current !== 'speaking' && statusRef.current !== 'processing') {
                        try { recognitionRef.current?.start(); } catch(e) {}
                    }
                }, 200);
            };

            rec.onerror = (event) => {
                if (event.error === 'no-speech' || event.error === 'aborted') return;

                console.error('Speech recognition error', event.error);

                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    isBlockedRef.current = true;
                    isMutedRef.current = true;
                    const isHttps = window.location.protocol === 'https:';
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    
                    if (!isHttps && !isLocal) {
                        addLog("SECURITY: Web Speech requires HTTPS or chrome://flags for LAN IPs.");
                        addLog(`TIP: Connect via https://${window.location.hostname} or enable chrome://flags`);
                    } else {
                        addLog("SYSTEM: Microphone permission denied. Click the Mic icon to allow.");
                    }
                    setIsMuted(true);
                    setStatus('idle');
                    return;
                }

                // For transient errors, quietly restart
                setTimeout(() => {
                    if (!isBlockedRef.current && !isMutedRef.current && statusRef.current !== 'speaking' && statusRef.current !== 'processing') {
                        try { recognitionRef.current?.start(); } catch(e) {}
                    }
                }, 400);
            };

            rec.onresult = (event) => {
                if (isMutedRef.current || statusRef.current === 'speaking' || statusRef.current === 'processing') return; 
                const text = event.results[0][0].transcript;
                addLog(`USER: ${text}`);
                enviarAJarvis(text);
            };

            return rec;
        };

        const recognition = createRecognition();
        recognitionRef.current = recognition;

        // Auto unlock audio context & mic on first user click or keypress
        const handleInitialInteraction = () => {
            if (statusRef.current === 'idle' && !isMutedRef.current) {
                try { recognitionRef.current?.start(); } catch(e) {}
            }
        };
        window.addEventListener('click', handleInitialInteraction, { once: true });
        window.addEventListener('keydown', handleInitialInteraction, { once: true });

        // Kick off with slight delay
        setTimeout(() => {
            if (!isMutedRef.current && statusRef.current === 'idle') {
                try { recognitionRef.current?.start(); } catch(e) {}
            }
        }, 800);

        return () => {
            window.removeEventListener('click', handleInitialInteraction);
            window.removeEventListener('keydown', handleInitialInteraction);
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, []);

    // Push-to-Talk (PTT) with Alt key
    const isAltPressedRef = useRef(false);
    const wasMutedBeforeAltRef = useRef(isMutedRef.current);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Alt' && !isAltPressedRef.current) {
                e.preventDefault();
                isAltPressedRef.current = true;
                wasMutedBeforeAltRef.current = isMutedRef.current;
                
                if (isMutedRef.current) {
                    setIsMuted(false);
                    isMutedRef.current = false;
                    isBlockedRef.current = false;
                    
                    if (statusRef.current !== 'speaking' && statusRef.current !== 'processing') {
                        setTimeout(() => {
                            try { recognitionRef.current?.start(); } catch(e) {}
                        }, 50);
                    }
                }
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Alt') {
                e.preventDefault();
                isAltPressedRef.current = false;
                
                if (wasMutedBeforeAltRef.current && !isMutedRef.current) {
                    setIsMuted(true);
                    isMutedRef.current = true;
                    try { recognitionRef.current?.abort(); } catch(e) {}
                    setStatus('idle');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Auto-resume logic:
    // Because we no longer destroy and recreate the microphone on every state change,
    // we must explicitly tell the microphone to wake up when Jarvis goes silent.
    useEffect(() => {
        if (status === 'idle' && !isMuted) {
            const wakeUpTimer = setTimeout(() => {
                if (statusRef.current === 'idle' && !isMutedRef.current) {
                    try { recognitionRef.current?.start(); } catch(e) {}
                }
            }, 600);
            return () => clearTimeout(wakeUpTimer);
        }
    }, [status, isMuted]);

    const enviarAJarvis = async (texto) => {
        setStatus('processing');

        try {
            const response = await fetch(n8nUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatInput: texto,
                    message: texto,
                    text: texto,
                    query: texto,
                    prompt: texto,
                    input: texto,
                    sessionId: 'jarvis-session'
                })
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    const textToSpeak = data.output || data.response || data.text || data.message || JSON.stringify(data);
                    addLog(`JARVIS: ${textToSpeak}`);
                    await speakWithElevenLabs(textToSpeak);
                } else {
                    // n8n returned audio directly
                    const audioBlob = await response.blob();
                    const audioUrl = URL.createObjectURL(audioBlob);
                    playAudio(audioUrl);
                }
            } else {
                const errText = `System error ${response.status}`;
                addLog(`ERROR: ${errText}`);
                await speakWithElevenLabs(errText);
            }
        } catch (error) {
            console.error("Connection error:", error, "URL attempted:", n8nUrl);
            const errText = "Connection lost.";
            addLog(`CONNECTION ERROR: ${error.message} | URL: ${n8nUrl}`);
            await speakWithElevenLabs(errText);
        }
    };

    const speakWithElevenLabs = async (text) => {
        setStatus('speaking');

        const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
        const savedVoiceId = localStorage.getItem('eleven_voice_id');
        const defaultVoiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || 'DMyrgzQFny3JI1Y1paM5';
        const voiceId = savedVoiceId || defaultVoiceId;

        if (!apiKey) {
            console.warn('No ElevenLabs API key found, falling back to browser TTS');
            speakWithBrowser(text);
            return;
        }

        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                playAudio(audioUrl);
            } else {
                console.error('ElevenLabs TTS error:', response.status, response.statusText);
                speakWithBrowser(text);
            }
        } catch (error) {
            console.error('ElevenLabs TTS error:', error);
            speakWithBrowser(text);
        }
    };

    // Fallback browser TTS
    const speakWithBrowser = (text) => {
        setStatus('speaking');
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';

        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find(v => v.lang.includes('es'));
        if (esVoice) utterance.voice = esVoice;

        // Failsafe timeout in case browser TTS silently blocks without firing onend
        const blockFailsafe = setTimeout(() => {
            if (statusRef.current === 'speaking') {
                setStatus('idle');
            }
        }, Math.max(text.length * 100, 5000));
        
        utterance.onend = () => {
            clearTimeout(blockFailsafe);
            setStatus('idle');
        };
        utterance.onerror = () => {
            clearTimeout(blockFailsafe);
            setStatus('idle');
        };

        window.speechSynthesis.speak(utterance);
    };

    const playAudio = (audioUrl) => {
        setStatus('speaking');

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audio.crossOrigin = "anonymous";
        audioRef.current = audio;

        // Route audio through Web Audio API to extract frequency data for visualizer
        try {
            if (!sharedAudioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                sharedAudioCtx = new AudioContext();
                sharedAnalyser = sharedAudioCtx.createAnalyser();
                sharedAnalyser.fftSize = 256;
                sharedAnalyser.smoothingTimeConstant = 0.5;
            }

            if (sharedAudioCtx.state === 'suspended') {
                sharedAudioCtx.resume().catch(() => {});
            }

            const source = sharedAudioCtx.createMediaElementSource(audio);
            source.connect(sharedAnalyser);
            sharedAnalyser.connect(sharedAudioCtx.destination);
        } catch (e) {
            console.warn("Could not hook audio context for visualizer", e);
        }

        audio.onended = () => {
            setStatus('idle');
            URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = (err) => {
            console.error("Audio playback error:", err);
            addLog("ERROR: AUDIO PLAYBACK FAILED.");
            setStatus('idle');
        };

        audio.play().catch(e => {
            console.error("Autoplay prevented:", e);
            addLog("SYSTEM: Click any button to unlock audio!");
            setStatus('idle'); // UNLOCK MIC IF AUTOPLAY BLOCKS
        });
    };

    const toggleMute = useCallback(async () => {
        if (isMutedRef.current) {
            // Unmuting: Request hardware microphone access first
            try {
                if (navigator?.mediaDevices?.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    // Keep audio track open briefly or stop to unlock browser permission
                    stream.getTracks().forEach(t => t.stop());
                }
            } catch (err) {
                console.warn("Microphone hardware permission:", err);
                if (err.name === 'NotAllowedError') {
                    addLog("SYSTEM: Microphone permission denied by browser.");
                }
            }

            isBlockedRef.current = false;
            isMutedRef.current = false;
            setIsMuted(false);

            if (statusRef.current !== 'speaking' && statusRef.current !== 'processing') {
                setTimeout(() => {
                    try { 
                        recognitionRef.current?.start(); 
                    } catch(e) {
                        console.log("Recognition start catch:", e);
                    }
                }, 150);
            }
        } else {
            // Muting: abort current listening
            isBlockedRef.current = false;
            isMutedRef.current = true;
            setIsMuted(true);
            try { recognitionRef.current?.abort(); } catch(e) {}
            setStatus('idle');
        }
    }, []);

    const setMuteState = (newState) => {
        setIsMuted(newState);
        isMutedRef.current = newState;
    };

    const sendTextMessage = useCallback((text) => {
        if (!text.trim()) return;
        addLog(`USER: ${text}`);
        enviarAJarvis(text);
    }, [n8nUrl]);

    const updateConfig = ({ n8nUrl: newUrl, theme }) => {
        if (newUrl !== undefined) setN8nUrl(normalizeN8nUrl(newUrl));
        if (theme !== undefined) {
            localStorage.setItem('jarvis_theme', theme);
            setActiveTheme(theme);
        }
    };

    // Stable identities for callbacks consumed by external hooks (e.g. useClapDetector).
    // speakWithElevenLabs and addLog are recreated every render; handing those out
    // directly made useClapDetector tear down and re-acquire the mic on every render.
    // These ref-backed wrappers keep a constant identity while always calling the latest.
    const latestSpeak = useRef(speakWithElevenLabs);
    const latestAddLog = useRef(addLog);
    useEffect(() => {
        latestSpeak.current = speakWithElevenLabs;
        latestAddLog.current = addLog;
    });
    const forceSpeak = useCallback((text) => latestSpeak.current(text), []);
    const stableAddLog = useCallback((text) => latestAddLog.current(text), []);

    return {
        status,
        transcript,
        logs,
        isMuted,
        toggleMute,
        setMuteState,
        sendTextMessage,
        updateConfig,
        isConnected: true,
        forceSpeak,
        addLog: stableAddLog,
        activeTheme
    };
};
