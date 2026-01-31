/**
 * Main dashboard component with glassmorphism design.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, CheckCircle, XCircle, Activity, UserPlus, Shield,
    ArrowLeft, Settings, Bell, Search
} from 'lucide-react';
import { StatsCard, GlassCard, GradientButton } from './ui';
import WebcamCapture from './WebcamCapture';
import LocationMap from './LocationMap';
import AttendanceStatus from './AttendanceStatus';
import StudentRegistration from './StudentRegistration';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';
import { useGeolocation } from '../hooks/useGeolocation';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { attendanceAPI } from '../utils/api';
import { staggerContainer, staggerItem, slideUp } from '../utils/animations';
import toast from 'react-hot-toast';

export default function Dashboard({ onBack }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [attendanceResult, setAttendanceResult] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [stats, setStats] = useState(null);
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [showRegistration, setShowRegistration] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [detectionData, setDetectionData] = useState(null);

    const { location, error: locationError, loading: locationLoading } = useGeolocation();
    const { isConnected, lastMessage } = useWebSocket();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        loadStats();
        loadTodayAttendance();
    }, []);

    useEffect(() => {
        if (lastMessage?.type === 'attendance_marked') {
            loadStats();
            loadTodayAttendance();
        }
    }, [lastMessage]);

    const loadStats = async () => {
        try {
            const data = await attendanceAPI.getStats();
            setStats(data);
        } catch (error) {
            // Silently handle error - stats will show as 0
        }
    };

    const loadTodayAttendance = async () => {
        try {
            const data = await attendanceAPI.getToday();
            setTodayAttendance(data);
        } catch (error) {
            // Silently handle error
        }
    };

    const handleCapture = async (imageBlob) => {
        if (!location) {
            setAttendanceResult({
                success: false,
                message: 'Location not available. Please enable location services.',
            });
            return;
        }

        setIsProcessing(true);
        setAttendanceResult(null);

        try {
            const formData = new FormData();
            formData.append('image', imageBlob, 'attendance.jpg');
            formData.append('latitude', location.latitude);
            formData.append('longitude', location.longitude);

            const result = await attendanceAPI.mark(formData);
            setAttendanceResult(result);
            setStudentData(result.student);

            if (result.success && result.student) {
                const boundingBox = {
                    x: 320,
                    y: 100,
                    width: 640,
                    height: 480
                };

                setDetectionData({
                    success: true,
                    student: result.student,
                    confidence: result.attendance?.confidence_score || 0.95,
                    locationVerified: result.attendance?.status === 'verified',
                    boundingBox: boundingBox
                });

                toast.success(result.message);
            } else {
                toast.error(result.message);
            }

            loadStats();
            loadTodayAttendance();
        } catch (error) {
            setAttendanceResult({
                success: false,
                message: error.response?.data?.detail || 'Failed to mark attendance. Please try again.',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAdminClick = () => {
        if (isAuthenticated) {
            setShowAdminPanel(true);
        } else {
            setShowAdminLogin(true);
        }
    };

    const handleAdminPanelClose = () => {
        setShowAdminPanel(false);
        // Refresh data when returning from admin panel
        loadStats();
        loadTodayAttendance();
    };

    if (showAdminPanel) {
        return <AdminPanel onClose={handleAdminPanelClose} />;
    }

    const handleRegistrationClose = () => {
        setShowRegistration(false);
        // Refresh data when returning from registration
        loadStats();
        loadTodayAttendance();
    };

    if (showRegistration) {
        return (
            <div className="min-h-screen bg-dark-950 pt-6 pb-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <StudentRegistration
                        onClose={handleRegistrationClose}
                        onSuccess={handleRegistrationClose}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-950 pt-6 pb-12 px-6">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-mesh opacity-30 pointer-events-none" />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <motion.div
                    className="mb-8"
                    variants={slideUp}
                    initial="initial"
                    animate="animate"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            {onBack && (
                                <motion.button
                                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onBack}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </motion.button>
                            )}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    Dashboard
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    Face recognition attendance system
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Connection Status */}
                            <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
                                <div className={`status-indicator ${isConnected ? 'status-success' : 'status-error'}`} />
                                <span className="text-sm font-medium text-white/70">
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>

                            {/* Admin Button - matching Connected status style */}
                            <motion.button
                                className="glass px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAdminClick}
                            >
                                <Shield className="w-4 h-4 text-primary-400" />
                                <span className="text-sm font-medium text-white/70">Admin</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                {stats && (
                    <motion.div
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                    >
                        <StatsCard
                            icon={Users}
                            title="Total Students"
                            value={stats.total_students || 0}
                            gradient="from-primary-500 to-primary-700"
                        />
                        <StatsCard
                            icon={CheckCircle}
                            title="Present Today"
                            value={stats.today_present || 0}
                            gradient="from-emerald-500 to-green-600"
                        />
                        <StatsCard
                            icon={XCircle}
                            title="Absent Today"
                            value={stats.today_absent || 0}
                            gradient="from-red-500 to-rose-600"
                        />
                        <StatsCard
                            icon={Activity}
                            title="Attendance %"
                            value={stats.attendance_percentage || 0}
                            suffix="%"
                            gradient="from-accent-pink to-purple-600"
                        />
                    </motion.div>
                )}

                {/* Main Grid */}
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                >
                    <motion.div variants={staggerItem}>
                        <WebcamCapture
                            onCapture={handleCapture}
                            isProcessing={isProcessing}
                            detectionData={detectionData}
                        />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                        <AttendanceStatus
                            result={attendanceResult}
                            student={studentData}
                            deviceLocation={location}
                        />
                    </motion.div>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                >
                    <motion.div className="lg:col-span-2" variants={staggerItem}>
                        <LocationMap userLocation={location} locationError={locationError} />
                    </motion.div>

                    {/* Today's Attendance List */}
                    <motion.div variants={staggerItem}>
                        <GlassCard className="h-full" hover={false}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    Today's Attendance
                                </h2>
                                <motion.button
                                    className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 flex items-center justify-center transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowRegistration(true)}
                                    title="Register New Student"
                                >
                                    <UserPlus className="w-5 h-5" />
                                </motion.button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {todayAttendance.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                            <Users className="w-8 h-8 text-white/30" />
                                        </div>
                                        <p className="text-white/40">No attendance records yet</p>
                                    </div>
                                ) : (
                                    todayAttendance.map((record, index) => (
                                        <motion.div
                                            key={record.id}
                                            className="p-4 bg-white/5 rounded-xl flex items-center justify-between hover:bg-white/8 transition-colors"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-2.5 h-2.5 rounded-full ${record.status === 'verified'
                                                        ? 'bg-green-500 shadow-lg shadow-green-500/50'
                                                        : 'bg-red-500 shadow-lg shadow-red-500/50'
                                                        }`}
                                                />
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {record.student_name}
                                                    </p>
                                                    <p className="text-xs text-white/50">
                                                        {new Date(record.timestamp).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`badge ${record.status === 'verified'
                                                ? 'badge-success'
                                                : 'badge-error'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                </motion.div>
            </div>

            {/* Admin Login Modal */}
            <AdminLogin
                isOpen={showAdminLogin}
                onClose={() => setShowAdminLogin(false)}
                onSuccess={() => {
                    setShowAdminLogin(false);
                    setShowAdminPanel(true);
                }}
            />
        </div>
    );
}
