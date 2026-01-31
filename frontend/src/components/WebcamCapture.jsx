/**
 * Webcam capture component with real-time face detection, tracking, and recognition.
 * Features glassmorphism overlay and real-time stats display.
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { Camera, Loader2, Video, Zap, Eye, Activity } from 'lucide-react';
import * as faceapi from 'face-api.js';
import { GradientButton, GlassCard } from './ui';

export default function WebcamCapture({ onCapture, isProcessing, detectionData }) {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [hasPermission, setHasPermission] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const animationFrameRef = useRef(null);
    const recognitionIntervalRef = useRef(null);
    const [recognizedStudent, setRecognizedStudent] = useState(null);
    const [isUnknown, setIsUnknown] = useState(false);
    const unknownStartTimeRef = useRef(null);
    const lastSeenTimeRef = useRef(0);
    const lastRecognitionTime = useRef(0);
    const [fps, setFps] = useState(0);
    const [faceCount, setFaceCount] = useState(0);
    const frameCountRef = useRef(0);
    const lastFpsUpdateRef = useRef(Date.now());

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: 'user',
    };

    // Load face-api.js models
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);

                setModelsLoaded(true);
            } catch (error) {
                setModelsLoaded(false);
            }
        };

        loadModels();
    }, []);

    // Periodic face recognition
    useEffect(() => {
        if (!modelsLoaded || !hasPermission) return;

        const recognizeFace = async () => {
            const video = webcamRef.current?.video;
            if (!video || video.readyState !== 4) return;

            try {
                const imageSrc = webcamRef.current?.getScreenshot();
                if (!imageSrc) return;

                const response = await fetch(imageSrc);
                const blob = await response.blob();

                const formData = new FormData();
                formData.append('image', blob, 'frame.jpg');
                formData.append('latitude', '31.248');
                formData.append('longitude', '75.708');

                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const result = await fetch(`${API_URL}/api/attendance/recognize`, {
                    method: 'POST',
                    body: formData,
                });

                if (result.ok) {
                    const data = await result.json();

                    if (data.success && data.student) {
                        setRecognizedStudent({
                            name: data.student.name,
                            uid: data.student.enrollment_id,
                            confidence: data.confidence || 0.95,
                            timestamp: Date.now()
                        });
                        setIsUnknown(false);
                        unknownStartTimeRef.current = null;
                    } else if (data.message === "No face detected") {
                        setRecognizedStudent(null);
                    } else {
                        setRecognizedStudent(null);
                        if (!unknownStartTimeRef.current) {
                            unknownStartTimeRef.current = Date.now();
                        }
                        if (Date.now() - unknownStartTimeRef.current > 1000) {
                            setIsUnknown(true);
                        }
                    }
                }
            } catch (error) {
                // Silently handle recognition errors
            }
        };

        recognitionIntervalRef.current = setInterval(recognizeFace, 1000);

        return () => {
            if (recognitionIntervalRef.current) {
                clearInterval(recognitionIntervalRef.current);
            }
        };
    }, [modelsLoaded, hasPermission]);

    // Continuous face detection with smooth rendering
    useEffect(() => {
        if (!modelsLoaded || !hasPermission) return;

        let isDetecting = true;

        const detectFaces = async () => {
            if (!isDetecting) return;

            const video = webcamRef.current?.video;
            const canvas = canvasRef.current;

            if (!video || !canvas || video.readyState !== 4) {
                animationFrameRef.current = requestAnimationFrame(detectFaces);
                return;
            }

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            // Update FPS counter
            frameCountRef.current++;
            const now = Date.now();
            if (now - lastFpsUpdateRef.current >= 1000) {
                setFps(frameCountRef.current);
                frameCountRef.current = 0;
                lastFpsUpdateRef.current = now;
            }

            try {
                const detections = await faceapi
                    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
                        inputSize: 320,
                        scoreThreshold: 0.5
                    }))
                    .withFaceLandmarks();

                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                setFaceCount(detections.length);

                if (detections.length > 0) {
                    lastSeenTimeRef.current = Date.now();
                }

                if (Date.now() - lastSeenTimeRef.current > 1500) {
                    unknownStartTimeRef.current = null;
                    setIsUnknown(false);
                    setRecognizedStudent(null);
                }

                if (detections.length > 0) {
                    detections.forEach((detection, index) => {
                        const box = detection.detection.box;

                        // Determine colors
                        const isRecognized = recognizedStudent !== null;
                        const primaryColor = isRecognized ? '#10b981' : '#8B5CF6';
                        const secondaryColor = isRecognized ? '#059669' : '#6D28D9';

                        // Draw bounding box with glow effect
                        ctx.shadowColor = primaryColor;
                        ctx.shadowBlur = 20;
                        ctx.strokeStyle = primaryColor;
                        ctx.lineWidth = 3;
                        ctx.strokeRect(box.x, box.y, box.width, box.height);
                        ctx.shadowBlur = 0;

                        // Draw corner accents
                        const cornerLength = 25;
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = secondaryColor;

                        // Top-left
                        ctx.beginPath();
                        ctx.moveTo(box.x, box.y + cornerLength);
                        ctx.lineTo(box.x, box.y);
                        ctx.lineTo(box.x + cornerLength, box.y);
                        ctx.stroke();

                        // Top-right
                        ctx.beginPath();
                        ctx.moveTo(box.x + box.width - cornerLength, box.y);
                        ctx.lineTo(box.x + box.width, box.y);
                        ctx.lineTo(box.x + box.width, box.y + cornerLength);
                        ctx.stroke();

                        // Bottom-left
                        ctx.beginPath();
                        ctx.moveTo(box.x, box.y + box.height - cornerLength);
                        ctx.lineTo(box.x, box.y + box.height);
                        ctx.lineTo(box.x + cornerLength, box.y + box.height);
                        ctx.stroke();

                        // Bottom-right
                        ctx.beginPath();
                        ctx.moveTo(box.x + box.width - cornerLength, box.y + box.height);
                        ctx.lineTo(box.x + box.width, box.y + box.height);
                        ctx.lineTo(box.x + box.width, box.y + box.height - cornerLength);
                        ctx.stroke();

                        // Draw student info if recognized
                        if (index === 0 && recognizedStudent) {
                            const infoBoxHeight = 90;
                            const infoBoxY = Math.max(10, box.y - infoBoxHeight - 15);
                            const padding = 14;
                            const infoBoxWidth = Math.max(box.width, 260);

                            // Glassmorphism background
                            ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
                            ctx.beginPath();
                            ctx.roundRect(box.x, infoBoxY, infoBoxWidth, infoBoxHeight, 12);
                            ctx.fill();

                            // Draw text
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 16px Inter, system-ui, sans-serif';
                            ctx.fillText(`${recognizedStudent.name}`, box.x + padding, infoBoxY + 28);

                            ctx.font = '14px Inter, system-ui, sans-serif';
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                            ctx.fillText(`UID: ${recognizedStudent.uid}`, box.x + padding, infoBoxY + 52);

                            ctx.font = 'bold 14px Inter, system-ui, sans-serif';
                            ctx.fillText(`${(recognizedStudent.confidence * 100).toFixed(1)}% Match`, box.x + padding, infoBoxY + 76);
                        } else if (index === 0 && !recognizedStudent) {
                            const labelWidth = isUnknown ? 140 : 120;
                            const labelHeight = 32;
                            const labelY = box.y - 42;

                            ctx.fillStyle = isUnknown ? 'rgba(239, 68, 68, 0.9)' : 'rgba(139, 92, 246, 0.9)';
                            ctx.beginPath();
                            ctx.roundRect(box.x, labelY, labelWidth, labelHeight, 8);
                            ctx.fill();

                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 13px Inter, system-ui, sans-serif';
                            ctx.fillText(isUnknown ? 'Unknown Person' : 'Detecting...', box.x + 12, labelY + 21);
                        }
                    });
                }
            } catch (error) {
                // Silently handle error
            }

            animationFrameRef.current = requestAnimationFrame(detectFaces);
        };

        detectFaces();

        return () => {
            isDetecting = false;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [modelsLoaded, hasPermission, recognizedStudent, isUnknown]);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc && onCapture) {
            fetch(imageSrc)
                .then(res => res.blob())
                .then(blob => {
                    onCapture(blob);
                });
        }
    }, [onCapture]);

    const handleUserMedia = () => {
        setHasPermission(true);
    };

    const handleUserMediaError = () => {
        setHasPermission(false);
    };

    return (
        <GlassCard className="h-full" hover={false}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                        <Video className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Live Camera</h2>
                        <p className="text-xs text-white/50">Real-time face detection</p>
                    </div>
                </div>
                {modelsLoaded && hasPermission && (
                    <motion.div
                        className="badge badge-success"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <span className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            Active
                        </span>
                    </motion.div>
                )}
            </div>

            {/* Webcam Container */}
            <div className="webcam-container mb-4 relative rounded-2xl overflow-hidden bg-dark-900">
                {hasPermission === false ? (
                    <div className="flex items-center justify-center h-80 bg-dark-800">
                        <div className="text-center p-6">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                                <Camera className="w-10 h-10 text-red-400" />
                            </div>
                            <p className="text-white font-semibold mb-2">Camera Access Denied</p>
                            <p className="text-sm text-white/50">
                                Please allow camera access in your browser settings
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            onUserMedia={handleUserMedia}
                            onUserMediaError={handleUserMediaError}
                            className="w-full rounded-2xl"
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-2xl"
                        />

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none rounded-2xl" />

                        {/* Stats overlay */}
                        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 sm:gap-3">
                            <motion.div
                                className="glass px-3 py-1.5 rounded-lg text-xs flex items-center gap-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Activity className="w-3.5 h-3.5 text-primary-400" />
                                <span className="text-white/70">FPS:</span>
                                <span className="text-primary-400 font-bold">{fps}</span>
                            </motion.div>
                            <motion.div
                                className="glass px-3 py-1.5 rounded-lg text-xs flex items-center gap-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Eye className="w-3.5 h-3.5 text-secondary-400" />
                                <span className="text-white/70">Faces:</span>
                                <span className="text-secondary-400 font-bold">{faceCount}</span>
                            </motion.div>
                            {recognizedStudent && (
                                <motion.div
                                    className="glass px-3 py-1.5 rounded-lg text-xs flex items-center gap-2"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <span className="text-white/70">Match:</span>
                                    <span className="text-emerald-400 font-bold">
                                        {(recognizedStudent.confidence * 100).toFixed(1)}%
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Capture Button */}
            <GradientButton
                variant="gradient"
                size="lg"
                icon={isProcessing ? Loader2 : Camera}
                loading={isProcessing}
                disabled={!hasPermission || isProcessing}
                onClick={capture}
                className="w-full"
            >
                {isProcessing ? 'Processing...' : 'Capture & Mark Attendance'}
            </GradientButton>

            {/* Status messages */}
            <AnimatePresence>
                {hasPermission === null && (
                    <motion.p
                        className="text-sm text-white/50 text-center mt-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        Requesting camera permission...
                    </motion.p>
                )}
                {!modelsLoaded && hasPermission && (
                    <motion.p
                        className="text-sm text-amber-400 text-center mt-3 flex items-center justify-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading face detection models...
                    </motion.p>
                )}
            </AnimatePresence>
        </GlassCard>
    );
}
