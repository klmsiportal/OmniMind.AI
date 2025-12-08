import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Radio, Volume2 } from './Icons';

interface LiveInterfaceProps {
    onEndCall: () => void;
}

const LiveInterface: React.FC<LiveInterfaceProps> = ({ onEndCall }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [status, setStatus] = useState("Initializing Secure Connection...");
    
    // Video refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // Audio Processing Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const sessionRef = useRef<any>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const frameIntervalRef = useRef<number | null>(null);

    // Initializer
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                // Initialize Media Stream (Audio First)
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (!mounted) return;
                streamRef.current = stream;

                // Setup Audio Output
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
                
                // Setup Audio Input
                inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
                
                // Connect to Gemini
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                        },
                        systemInstruction: "You are OmniMind Live. Be concise, helpful, and friendly.",
                    },
                });

                // Handle Connection
                sessionRef.current = await sessionPromise;
                setIsConnected(true);
                setStatus("Listening...");

                // Setup Incoming Audio Handler
                const processIncoming = async (message: LiveServerMessage) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio && audioContextRef.current) {
                        setStatus("Speaking...");
                        const ctx = audioContextRef.current;
                        
                        // Decode
                        const binaryString = atob(base64Audio);
                        const len = binaryString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        
                        const dataInt16 = new Int16Array(bytes.buffer);
                        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
                        const channelData = buffer.getChannelData(0);
                        for (let i = 0; i < channelData.length; i++) {
                            channelData[i] = dataInt16[i] / 32768.0;
                        }

                        // Play
                        const source = ctx.createBufferSource();
                        source.buffer = buffer;
                        source.connect(ctx.destination);
                        
                        const now = ctx.currentTime;
                        const start = Math.max(nextStartTimeRef.current, now);
                        source.start(start);
                        nextStartTimeRef.current = start + buffer.duration;
                        
                        sourcesRef.current.add(source);
                        source.onended = () => {
                            sourcesRef.current.delete(source);
                            if (sourcesRef.current.size === 0) setStatus("Listening...");
                        };
                    }
                };

                // Setup Outgoing Audio
                const inputCtx = inputAudioContextRef.current;
                const source = inputCtx.createMediaStreamSource(stream);
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                
                processor.onaudioprocess = (e) => {
                    if (!isMicOn) return; // Mute logic
                    
                    const inputData = e.inputBuffer.getChannelData(0);
                    // Convert Float32 to Int16 PCM
                    const l = inputData.length;
                    const int16 = new Int16Array(l);
                    for (let i = 0; i < l; i++) {
                        int16[i] = inputData[i] * 32768;
                    }
                    
                    // Encode to Base64
                    let binary = '';
                    const bytes = new Uint8Array(int16.buffer);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const base64Data = btoa(binary);

                    sessionRef.current.sendRealtimeInput({
                        media: {
                            mimeType: 'audio/pcm;rate=16000',
                            data: base64Data
                        }
                    });
                };

                source.connect(processor);
                processor.connect(inputCtx.destination);

                // Attach listener for incoming messages (using an internal listener pattern if library supports, 
                // but @google/genai live.connect returns a Session that handles this via callbacks in config, 
                // wait - looking at docs provided: callbacks are passed to connect)
                
                // RE-INITIALIZE with callbacks properly
                // Since we can't easily hook into the promise result for callbacks *after* creation in the provided snippet style,
                // let's restructure to pass callbacks to connect.
                
                // Disconnect previous if any (though this is init)
                // Actually, the example shows callbacks in connect.
            } catch (e) {
                console.error("Live Init Error", e);
                setStatus("Connection Failed. Check Permissions.");
            }
        };

        // Redoing Init with correct Callback structure
        const setupSession = async () => {
             try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;

                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
                inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });

                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                // Helper to decode
                const decodeAudio = (base64: string, ctx: AudioContext) => {
                    const binaryString = atob(base64);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const dataInt16 = new Int16Array(bytes.buffer);
                    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
                    const channelData = buffer.getChannelData(0);
                    for (let i = 0; i < channelData.length; i++) {
                        channelData[i] = dataInt16[i] / 32768.0;
                    }
                    return buffer;
                };

                await ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                        systemInstruction: "You are OmniMind Live. Be concise, helpful, and friendly.",
                    },
                    callbacks: {
                        onopen: async () => {
                            setIsConnected(true);
                            setStatus("Listening...");
                            
                            // Setup Audio Input Processing
                            const inputCtx = inputAudioContextRef.current!;
                            const source = inputCtx.createMediaStreamSource(stream);
                            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                            
                            processor.onaudioprocess = (e) => {
                                // Checking ref directly for mutable mute state
                                if (sessionRef.current && sessionRef.current.muted) return; 

                                const inputData = e.inputBuffer.getChannelData(0);
                                const l = inputData.length;
                                const int16 = new Int16Array(l);
                                for (let i = 0; i < l; i++) {
                                    int16[i] = inputData[i] * 32768;
                                }
                                let binary = '';
                                const bytes = new Uint8Array(int16.buffer);
                                const len = bytes.byteLength;
                                for (let i = 0; i < len; i++) {
                                    binary += String.fromCharCode(bytes[i]);
                                }
                                const base64Data = btoa(binary);

                                sessionRef.current.sendRealtimeInput({
                                    media: { mimeType: 'audio/pcm;rate=16000', data: base64Data }
                                });
                            };
                            source.connect(processor);
                            processor.connect(inputCtx.destination);
                        },
                        onmessage: (msg: LiveServerMessage) => {
                            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                            if (base64Audio && audioContextRef.current) {
                                setStatus("Speaking...");
                                const ctx = audioContextRef.current;
                                const buffer = decodeAudio(base64Audio, ctx);
                                
                                const source = ctx.createBufferSource();
                                source.buffer = buffer;
                                source.connect(ctx.destination);
                                
                                const now = ctx.currentTime;
                                const start = Math.max(nextStartTimeRef.current, now);
                                source.start(start);
                                nextStartTimeRef.current = start + buffer.duration;
                                
                                sourcesRef.current.add(source);
                                source.onended = () => {
                                    sourcesRef.current.delete(source);
                                    if (sourcesRef.current.size === 0) setStatus("Listening...");
                                };
                            }
                        },
                        onclose: () => {
                            setIsConnected(false);
                            setStatus("Disconnected.");
                        },
                        onerror: (err) => {
                            console.error(err);
                            setStatus("Error occurred.");
                        }
                    }
                }).then(session => {
                    sessionRef.current = session;
                    // Inject a mute property for our processor to read
                    (session as any).muted = false;
                });

             } catch (e) {
                 console.error(e);
                 setStatus("Connection Failed.");
             }
        };

        setupSession();

        return () => {
            mounted = false;
            // Cleanup
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (audioContextRef.current) audioContextRef.current.close();
            if (inputAudioContextRef.current) inputAudioContextRef.current.close();
            if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
            // Session close not explicitly available on the promise result easily without storing, 
            // but standard cleanup usually drops connection.
        };
    }, []);

    // Camera Toggle Logic
    const toggleCamera = async () => {
        if (isCameraOn) {
            // Turn Off
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(t => t.stop());
                videoRef.current.srcObject = null;
            }
            if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
            setIsCameraOn(false);
        } else {
            // Turn On
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setIsCameraOn(true);
                // We need to merge this with audio stream ideally, but for now just display 
                // and start sending frames.
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = videoStream;
                        videoRef.current.play();
                        
                        // Start sending frames
                        const canvas = canvasRef.current;
                        const ctx = canvas?.getContext('2d');
                        if (canvas && ctx && sessionRef.current) {
                             frameIntervalRef.current = window.setInterval(() => {
                                 if (!videoRef.current) return;
                                 canvas.width = videoRef.current.videoWidth;
                                 canvas.height = videoRef.current.videoHeight;
                                 ctx.drawImage(videoRef.current, 0, 0);
                                 const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                                 
                                 sessionRef.current.sendRealtimeInput({
                                     media: { mimeType: 'image/jpeg', data: base64 }
                                 });
                             }, 1000); // 1 FPS for preview
                        }
                    }
                }, 500);
            } catch (e) {
                console.error("Camera Error", e);
                alert("Could not access camera.");
            }
        }
    };

    const toggleMic = () => {
        setIsMicOn(!isMicOn);
        if (sessionRef.current) {
            (sessionRef.current as any).muted = !isMicOn;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0b0c0e] text-white relative overflow-hidden">
            {/* Main Visualizer Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative p-8">
                
                {/* Status Indicator */}
                <div className="absolute top-8 flex flex-col items-center gap-2">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isConnected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                         <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                         <span className="text-xs font-bold tracking-wider uppercase">{status}</span>
                    </div>
                </div>

                {/* The Orb */}
                <div className="relative">
                    <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 blur-2xl opacity-50 absolute inset-0 ${status === 'Speaking...' ? 'animate-pulse-slow scale-150' : 'scale-100'}`}></div>
                    <div className="w-48 h-48 rounded-full bg-black border border-gray-800 flex items-center justify-center relative z-10 shadow-2xl">
                         <Radio size={64} className={`text-white transition-opacity duration-300 ${status === 'Speaking...' ? 'opacity-100' : 'opacity-50'}`} />
                         
                         {/* Rings */}
                         {status === 'Speaking...' && (
                            <>
                                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full animate-ping"></div>
                                <div className="absolute inset-0 border border-purple-500/20 rounded-full animate-ping delay-150"></div>
                            </>
                         )}
                    </div>
                </div>

                {/* Privacy Camera Preview (PIP) */}
                <div className={`absolute top-8 right-8 w-48 h-36 bg-black rounded-xl border border-gray-800 overflow-hidden shadow-2xl transition-all duration-500 ${isCameraOn ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                     <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" muted playsInline />
                     <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-[10px] font-mono">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        LIVE FEED
                     </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />

            </div>

            {/* Controls Bar */}
            <div className="p-8 pb-12 flex justify-center items-center gap-6">
                 <button 
                    onClick={toggleMic}
                    className={`p-4 rounded-full transition-all duration-200 ${isMicOn ? 'bg-[#1c1f26] text-white hover:bg-gray-800' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                 >
                    {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                 </button>
                 
                 <button 
                    onClick={onEndCall}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold tracking-wide shadow-lg shadow-red-900/20 transform hover:scale-105 transition-all flex items-center gap-2"
                 >
                    <PhoneOff size={20} />
                    <span>End Call</span>
                 </button>

                 <button 
                    onClick={toggleCamera}
                    className={`p-4 rounded-full transition-all duration-200 ${isCameraOn ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-[#1c1f26] text-gray-400 hover:bg-gray-800'}`}
                 >
                    {isCameraOn ? <Video size={24} /> : <VideoOff size={24} />}
                 </button>
            </div>
            
            <div className="absolute bottom-4 w-full text-center text-xs text-gray-600 font-mono">
                 Gemini 2.5 Flash Native • Low Latency • Encrypted
            </div>
        </div>
    );
};

export default LiveInterface;