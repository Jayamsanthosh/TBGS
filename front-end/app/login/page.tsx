'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { encryptData, decryptData } from '@/lib/cryptoUtils';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { loginUser, clearAuthError } from '@/lib/authSlice';
import { useToast } from '@/hooks/use-toast';
import { asset } from '@/lib/config';

type LoginFormData = {
  LOGIN_NAME: string;
  PASSWORD_USER_HDR: string;
};

const REMEMBERED_LOGIN_KEY = 'rememberedLogin';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    LOGIN_NAME: '',
    PASSWORD_USER_HDR: ''
  });
  const [rememberMe, setRememberMe] = useState(false);

  const canSubmit =
    formData.LOGIN_NAME.trim().length > 0 &&
    formData.PASSWORD_USER_HDR.length > 0 &&
    !loading;

  // Show Redux errors as toasts
  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
      dispatch(clearAuthError());
    }
  }, [error, dispatch, toast]);

  // Load remembered credentials on mount
  useEffect(() => {
    const savedEncrypted = localStorage.getItem(REMEMBERED_LOGIN_KEY);
    if (!savedEncrypted) return;

    try {
      const savedData = decryptData(savedEncrypted) as Partial<LoginFormData> | null;
      if (typeof savedData?.LOGIN_NAME === 'string' && typeof savedData?.PASSWORD_USER_HDR === 'string') {
        setFormData({
          LOGIN_NAME: savedData.LOGIN_NAME,
          PASSWORD_USER_HDR: savedData.PASSWORD_USER_HDR
        });
        setRememberMe(true);
      }
    } catch (err) {
      console.error('Failed to load remembered login:', err);
      localStorage.removeItem(REMEMBERED_LOGIN_KEY);
    }
  }, []);

  // Clear credentials if Remember Me is unchecked
  useEffect(() => {
    if (!rememberMe) {
      localStorage.removeItem(REMEMBERED_LOGIN_KEY);
    }
  }, [rememberMe]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const LOGIN_NAME = formData.LOGIN_NAME.trim();
    const PASSWORD = formData.PASSWORD_USER_HDR;

    if (!LOGIN_NAME || !PASSWORD) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter username and password.' });
      return;
    }

    const result = await dispatch(loginUser({ LOGIN_NAME, PASSWORD }));

    if (loginUser.fulfilled.match(result)) {
      if (rememberMe) {
        localStorage.setItem(
          REMEMBERED_LOGIN_KEY,
          encryptData({
            LOGIN_NAME,
            PASSWORD_USER_HDR: PASSWORD
          })
        );
      } else {
        localStorage.removeItem(REMEMBERED_LOGIN_KEY);
      }

      toast({ title: 'Success', description: 'Login successful! Redirecting...' });
      router.replace('/');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-body bg-background selection:bg-primary/20">
      {/* Background Decoration (Matching Theme Colors) */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px] opacity-50" />
      </div>

      {/* Atmospheric Hero Image */}
      <div
        className="absolute inset-0 z-0 opacity-[0.07] blur-[2px] pointer-events-none transition-opacity duration-1000"
        style={{ backgroundImage: `url("${asset('/login-bg.png')}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      <div className="relative z-10 w-full max-w-md px-6 py-4">
        {/* Branding Section */}
        <div className="flex flex-col items-center mb-4 group cursor-default animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="relative">
            <div className="bg-white/90 flex items-center justify-center backdrop-blur-xl p-4 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-white transform transition-all duration-1000 group-hover:scale-[1.02]">
              <img
                src={asset('/tbgs-logo.jpg')}
                alt="tbgs Logo"
                className="w-40 h-auto max-h-20 object-contain transition-transform duration-700"
              />
            </div>
            {/* Minimalist Professional Tagline */}
            <div className="mt-4 flex flex-col items-center gap-1.5 transform transition-all duration-700">
              <div className="h-1 w-10 bg-linear-to-r from-transparent via-primary/30 to-transparent rounded-full" />
              <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/60">
                ERP MANAGEMENT SYSTEM * v1.0
              </p>
            </div>
          </div>
        </div>

        {/* Login Card (Using Theme Card Component) */}
        <div className="bg-card/80 backdrop-blur-2xl border border-border rounded-2xl shadow-xl p-6 md:p-8 transition-all duration-300 hover:shadow-primary/5">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-black text-foreground tracking-tight">Welcome Back</h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">
              Secure access to your enterprise dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground/80 ml-1" htmlFor="login_name">
                Username or Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground transition-colors">
                  <User size={18} />
                </div>
                <input
                  id="login_name"
                  type="text"
                  placeholder="Admin"
                  value={formData.LOGIN_NAME}
                  onChange={(e) => setFormData({ ...formData, LOGIN_NAME: e.target.value })}
                  autoComplete="username"
                  required
                  disabled={loading}
                  className="block w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all text-foreground text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-bold text-foreground/80" htmlFor="password">
                  Password
                </label>
                <a className="text-xs font-bold text-secondary hover:text-secondary/80 transition-colors" href="#">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={formData.PASSWORD_USER_HDR}
                  onChange={(e) => setFormData({ ...formData, PASSWORD_USER_HDR: e.target.value })}
                  autoComplete="current-password"
                  disabled={loading}
                  className="block w-full pl-11 pr-12 py-3 bg-muted/30 border border-border rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all text-foreground text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center ml-1 select-none">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 transition-all cursor-pointer accent-primary"
                />
              </div>
              <label htmlFor="remember" className="ml-2 block text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Remember Me
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70 text-primary-foreground font-bold py-3 px-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Rights Information */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
            Copyright 2026 Vision Infotech Ltd. All rights reserved.
          </p>
        </div>
      </div>

      {/* Branded Footer Asset */}
      <div className="fixed bottom-0 left-0 w-full h-1/4 z-[-1] opacity-5 overflow-hidden pointer-events-none grayscale mix-blend-multiply transition-opacity duration-700">
        <img
          src={asset('/agro-muted-footer.png')}
          alt=""
          className="w-full h-full object-cover object-bottom"
        />
      </div>
    </div>
  );
}