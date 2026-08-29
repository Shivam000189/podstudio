import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormEvent, ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useSignIn } from "@clerk/clerk-react";
import { useAuth } from "../hooks/useAuth";
import {
  ArrowRight,
  Radio,
  CheckCircle2,
  Lock,
  Mail,
} from "lucide-react";
import "../App.css";

import API from "../api/axios";

interface LoginForm {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const isClerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

function ClerkGoogleButton() {
  const { signIn, isLoaded } = useSignIn();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    try {
      setIsGoogleLoading(true);
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/home",
      });
    } catch (err) {
      console.error("Google sign in error:", err);
      setIsGoogleLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="social-login-btn"
      onClick={handleGoogleSignIn}
      disabled={!isLoaded || isGoogleLoading}
    >
      <GoogleIcon />
      <span>{isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
    </button>
  );
}

export function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  let clerkSignIn: any = null;
  try {
    if (isClerkEnabled) {
      clerkSignIn = useSignIn();
    }
  } catch {
    // Clerk not loaded yet
  }

  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errorMessage = (error: any) => {
    const raw = error.response?.data?.message || error.errors?.[0]?.message || error.message || "";
    if (
      raw.toLowerCase().includes("find your account") ||
      raw.toLowerCase().includes("user not found") ||
      raw.toLowerCase().includes("no account found")
    ) {
      return "No account found with this email address. Please click 'Create free account' below to sign up.";
    }
    return raw || "Invalid email or password. Please try again.";
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (form: LoginForm) => {
      const { data } = await API.post<LoginResponse>("/auth/login", form);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      queryClient.setQueryData(["auth", "me"], data.user);
      navigate("/home");
    },
    onError: (err: any) => {
      const message = errorMessage(err);
      setError(message);
      setIsShaking(true);
      window.setTimeout(() => setIsShaking(false), 500);
    },
  });

  const handleChange =
    (field: keyof LoginForm) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError("");
    };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // 1. Try local PostgreSQL database login first
    try {
      const { data } = await API.post<LoginResponse>("/auth/login", form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      queryClient.setQueryData(["auth", "me"], data.user);
      setIsSubmitting(false);
      navigate("/home");
      return;
    } catch (localErr: any) {
      // If user not in local DB or invalid, check if they are in Clerk
      if (isClerkEnabled && clerkSignIn?.isLoaded && clerkSignIn?.signIn) {
        try {
          const result = await clerkSignIn.signIn.create({
            identifier: form.email,
            password: form.password,
          });

          if (result.status === "complete") {
            await clerkSignIn.setActive({ session: result.createdSessionId });
            setIsSubmitting(false);
            navigate("/home");
            return;
          }
        } catch {
          // Clerk also failed
        }
      }

      // Show clear, friendly error message
      const message = errorMessage(localErr);
      setError(message);
      setIsShaking(true);
      window.setTimeout(() => setIsShaking(false), 500);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page login-page">
      {/* Left Brand Showcase Portal */}
      <motion.div 
        className="auth-portal"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="brand">
          <span>R</span>
          <strong>PodStudio</strong>
        </Link>

        <div className="portal-copy">
          <div className="portal-badge-pill mono">
            <Radio className="w-3.5 h-3.5 text-brand" />
            <span>Studio Production Suite</span>
          </div>
          <h1>Make Every Conversation A Studio Masterpiece.</h1>
          <p>
            Capture separate 4K video tracks and lossless 48kHz audio directly from the browser with zero quality drop.
          </p>

          <div className="portal-feature-list">
            <div className="portal-feat-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>One-click Google OAuth & Password Login</span>
            </div>
            <div className="portal-feat-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Isolated local multi-track recording</span>
            </div>
            <div className="portal-feat-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Sub-20ms ultra-low latency WebRTC</span>
            </div>
            <div className="portal-feat-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Automated cloud sync & WAV/WebM export</span>
            </div>
          </div>
        </div>

        <div className="portal-footer-meta mono">
          <span>© {new Date().getFullYear()} PodStudio</span>
          <span>•</span>
          <span>Broadcast Engine v2.0</span>
        </div>
      </motion.div>

      {/* Right Login Form Panel */}
      <section className="auth-panel">
        <motion.div 
          className={`login-card ${error ? "has-error" : ""} ${isShaking ? "shake" : ""}`}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <span className="auth-kicker mono">WELCOME BACK</span>
            <h2>Sign in to Studio</h2>
            <p className="auth-subtext">Choose Google or enter your email and password.</p>
          </motion.div>

          {/* Google OAuth Button */}
          {isClerkEnabled && (
            <motion.div variants={itemVariants} style={{ marginTop: "16px" }}>
              <ClerkGoogleButton />
              <div className="auth-divider">
                <span>or continue with email</span>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div 
              className="alert error mono"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={submit} className="login-form">
            <motion.div className="field-group" variants={itemVariants}>
              <label className="field">
                <span className="mono">Email Address</span>
                <div className="auth-input-box">
                  <Mail className="w-4 h-4 auth-icon" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="creator@podstudio.com"
                    required
                    aria-invalid={Boolean(error)}
                  />
                </div>
              </label>

              <label className="field">
                <span className="mono">Password</span>
                <div className="auth-input-box">
                  <Lock className="w-4 h-4 auth-icon" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder="••••••••"
                    required
                    aria-invalid={Boolean(error)}
                  />
                </div>
              </label>
            </motion.div>

            <motion.button 
              type="submit" 
              className="login-submit" 
              disabled={isSubmitting || loginMutation.isPending}
              variants={itemVariants}
            >
              {isSubmitting || loginMutation.isPending ? (
                <span className="spinner-mini" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            <motion.div className="auth-foot" variants={itemVariants}>
              Don't have an account? <Link to="/register">Create free account</Link>
            </motion.div>
          </form>
        </motion.div>
      </section>
    </div>
  );
}

export default Login;


