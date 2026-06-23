import React, { useState } from "react";
import { User } from "../types";
import { safeLocalStorage } from "../utils/safeStorage";
import { 
  ShieldAlert, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Flame, 
  Zap, 
  ArrowRight,
  Sparkles
} from "lucide-react";

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  darkMode: boolean;
}

export default function AuthScreen({ onLoginSuccess, darkMode }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Simulated validation & localStorage DB
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all credentials.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (isSignUp && !name.trim()) {
      setErrorMsg("Please provide your name.");
      return;
    }

    const registeredUsersKey = "saved_life_saver_users_list_v1";
    const existingUsersRaw = safeLocalStorage.getItem(registeredUsersKey);
    const users: any[] = existingUsersRaw ? JSON.parse(existingUsersRaw) : [];

    if (isSignUp) {
      // Check if user exists
      const userExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        setErrorMsg("This email is already registered.");
        return;
      }

      const newUser = {
        email: email.toLowerCase(),
        name: name.trim(),
        password: password, // For simulation
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      safeLocalStorage.setItem(registeredUsersKey, JSON.stringify(users));

      setSuccessMsg("Account created successfully! Logging you in...");
      setTimeout(() => {
        onLoginSuccess({
          email: newUser.email,
          name: newUser.name,
          avatarUrl: newUser.avatarUrl,
          createdAt: newUser.createdAt,
        });
      }, 1000);
    } else {
      // Login flow
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        setErrorMsg("Invalid email or password. Feel free to sign up a new account!");
        return;
      }

      setSuccessMsg("Success! Loading your workspace...");
      setTimeout(() => {
        onLoginSuccess({
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        });
      }, 800);
    }
  };

  const handleGuestMode = () => {
    const guestUser: User = {
      email: "guest@example.com",
      name: "Guest Overachiever",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Guest",
      createdAt: new Date().toISOString(),
    };
    onLoginSuccess(guestUser);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${
      darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
    }`}>
      {/* Decorative background ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 dark:bg-violet-600/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className={`w-full max-w-md p-8 rounded-3xl border transition-all duration-300 relative z-10 shadow-2xl ${
        darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
      }`}>
        {/* App Logo / Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20 mb-4 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2 text-slate-950 dark:text-white">
            The Last-Minute Life Saver
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Your hyper-intelligent AI strategy companion that prevents procrastination and saves deadlines.
          </p>
        </div>

        {/* Dynamic Alerts */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/30 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2.5 font-bold animate-shake">
            <Flame className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-450">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Aditya Clash"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-500 transition font-medium ${
                    darkMode
                      ? "bg-slate-750 border-slate-650 text-white placeholder-slate-450"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-450">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-500 transition font-medium ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-450">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="•••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-11 py-3 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-500 transition font-medium ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-450"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:text-slate-400 dark:hover:text-slate-200 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <span>{isSignUp ? "Create Strategic Account" : "Access Emergency Planner"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            {isSignUp ? "Already have an account?" : "Stressed and need an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="font-bold text-indigo-600 hover:text-indigo-700 transition"
            >
              {isSignUp ? "Log In" : "Sign Up Here"}
            </button>
          </p>
        </div>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className={`w-full border-t ${darkMode ? "border-slate-800" : "border-slate-150"}`}></div>
          </div>
          <span className={`relative px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest ${
            darkMode ? "bg-slate-900" : "bg-white"
          }`}>
            Quick Entry
          </span>
        </div>

        {/* Guest Mode Access */}
        <button
          onClick={handleGuestMode}
          className={`w-full py-2.5 px-4 rounded-xl border border-dashed font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
            darkMode
              ? "border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
              : "border-slate-300 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/20 text-slate-600"
          }`}
        >
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span>Continue as Guest Mode</span>
        </button>

        {/* Extra Security disclaimer info */}
        <div className="mt-8 text-center text-[10px] text-slate-400 leading-normal max-w-[260px] mx-auto">
          Secure offline account isolation. Your planner, rescue steps, and study sessions are isolated and encrypted in your local sandbox browser.
        </div>
      </div>
    </div>
  );
}
