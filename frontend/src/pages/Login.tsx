import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
    const { requestOTP, verifyOTP, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    // UI State
    const [step, setStep] = useState<"email" | "otp">("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Step 1: Request OTP
    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await requestOTP(email);
            setStep("otp");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await verifyOTP(email, otp);
            navigate("/");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            await loginWithGoogle(credentialResponse.credential);
            navigate("/");
        } catch (err: any) {
            setError("Google login failed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                    <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500 bg-clip-text text-transparent">
                        AI Platform
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
                        {step === "email" ? "Sign in with Email" : "Enter Verification Code"}
                    </p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {step === "email" ? (
                        <form onSubmit={handleRequestOTP} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Continue with Email"
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    One-Time Password
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                    required
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Check your email ({email}) for the code.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? "Verifying..." : "Verify & Login"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep("email")}
                                className="w-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm mt-4"
                            >
                                ← Back to Email
                            </button>
                        </form>
                    )}

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError("Google login failed")}
                                theme="filled_black"
                                size="large"
                                width="100%"
                            />
                        </GoogleOAuthProvider>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper to provide context locally if global provider is problematic
import { GoogleOAuthProvider } from "@react-oauth/google";
