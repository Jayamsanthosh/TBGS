"use client";
// app/login/page.tsx
import React, { useState, useEffect } from "react";
import { Lock, ArrowRight, Github, Chrome, LogIn, User, Eye, EyeOff, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { loginUser } from "@/redux/slices/authSlice";

export default function LoginPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error: authError, user } = useAppSelector((state) => state.auth);

    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        const result = await dispatch(loginUser({ LOGIN_NAME: username, PASSWORD: password }));

        if (loginUser.fulfilled.match(result)) {
            toast.success(`Welcome back! Redirecting...`);
            router.push("/dashboard");
        } else {
            toast.error(result.payload as string || "Login failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 transition-all duration-500 hover:shadow-indigo-500/10">
                    {/* Header */}
                    <div className="flex flex-col items-center">
                        <div className="p-3 bg-indigo-50 rounded-2xl mb-4">
                            <LogIn className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                            Admin Portal
                        </h2>
                        <p className="text-sm text-gray-500">
                            Secure access to administrative tools
                        </p>
                    </div>

                    {/* Form */}
                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        {/* Username */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700 ml-1">
                                Username
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUserName(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none disabled:opacity-50"
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700 ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none disabled:opacity-50"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((p) => !p)}
                                    disabled={loading}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <Eye className="w-5 h-5" />
                                    ) : (
                                        <EyeOff className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="accent-indigo-600 w-4 h-4 rounded"
                                />
                                <span className="ml-2 text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                                    Remember me
                                </span>
                            </label>
                       </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-4 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin h-5 w-5 mr-3" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>

                        {/* Error Message */}
                        {authError && (
                            <div className="bg-red-50 text-red-600 text-sm font-semibold py-3 px-4 rounded-xl text-center border border-red-100">
                                {authError}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

