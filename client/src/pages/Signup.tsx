import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useSignUp } from "@clerk/clerk-react";
import {
  ArrowRight,
  Radio,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  Check,
} from "lucide-react";
import "../App.css";

import API from "../api/axios";

interface SignupForm {
  name: string;
  email: string;
  password: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

interface SignupResponse {
  token?: string;
  data?: {
    token?: string;
    user?: User;
  };
  user?: User;
}

interface ApiError {
  message: string;
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

const isClerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

function ClerkGoogleSignUpButton() {
  const { signUp, isLoaded } = useSignUp();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    try {
      setIsGoogleLoading(true);
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/home",
      });
    } catch (err) {
      console.error("Google sign up error:", err);
      setIsGoogleLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="social-login-btn"
      onClick={handleGoogleSignUp}
      disabled={!isLoaded || isGoogleLoading}
    >
      <GoogleIcon />
      <span>{isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
    </button>
  );
}

const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[!@#$%^&*]/.test(password)) strength += 1;
  return Math.min((strength / 6) * 100, 100);
};

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

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const signupMutation = useMutation({
    mutationFn: async (form: SignupForm) => {
      const response = await API.post<SignupResponse>(
        "/auth/register",
        form
      );
      return response.data;
    },

    onSuccess: (responseData) => {
      const payload = responseData.data ?? responseData;
      const token = payload.token ?? responseData.token;
      const user = payload.user ?? responseData.user;

      if (token) {
        localStorage.setItem("token", token);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    },

    onError: (err: AxiosError<ApiError>) => {
      setError(
        err.response?.data?.message ??
          "Sign-up failed. Please try again."
      );
      setIsShaking(true);
      window.setTimeout(() => setIsShaking(false), 500);
    },
  });

  const handleChange =
    (field: keyof SignupForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
      if (error) setError("");
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    // 1. Register in local backend database
    try {
      await signupMutation.mutateAsync(formData);
    } catch {
      // Handled by onError in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page signup-page">
      {/* Left Portal */}
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
            <span>Join 100,000+ Creators</span>
          </div>
          <h1>Unlock Broadcast Quality Everywhere.</h1>
          <p>
            Start recording remote podcasts, interviews, and webinars with local hardware acceleration and zero internet artifacts.
          </p>

          <div className="portal-feature-list">
            <div className="portal-feat-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Google OAuth & One-click Social Signup</span>
            </div>
            <div className="portal-feat-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Full 4K Ultra-HD video & 48kHz WAV</span>
            </div>
            <div className="portal-feat-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Instant guest join without software</span>
            </div>
            <div className="portal-feat-item">
              <CheckCircle2 className="w-4 h-4 text-brand" />
              <span>Unlimited free studio sessions</span>
            </div>
          </div>
        </div>

        <div className="portal-footer-meta mono">
          <span>© {new Date().getFullYear()} PodStudio</span>
          <span>•</span>
          <span>Broadcast Engine v2.0</span>
        </div>
      </motion.div>

      {/* Right Signup Form Panel */}
      <section className="auth-panel">
        <motion.div 
          className={`signup-card ${error ? "has-error" : ""} ${isShaking ? "shake" : ""}`}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {isSuccess ? (
            <motion.div 
              className="signup-success-state"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="success-icon-box">
                <Check className="w-8 h-8 text-brand" />
              </div>
              <h3>Account Created!</h3>
              <p>Launching your broadcast studio dashboard...</p>
            </motion.div>
          ) : (
            <>
              <motion.div variants={itemVariants}>
                <span className="auth-kicker mono">START FOR FREE</span>
                <h2>Create Creator Account</h2>
                <p className="auth-subtext">Instant access to 4K multi-track studio recording.</p>
              </motion.div>

              {/* Google OAuth Button */}
              {isClerkEnabled && (
                <motion.div variants={itemVariants} style={{ marginTop: "16px" }}>
                  <ClerkGoogleSignUpButton />
                  <div className="auth-divider">
                    <span>or register with email</span>
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

              <form onSubmit={handleSubmit} className="signup-form">
                <motion.div className="field-group" variants={itemVariants}>
                  <label className="field">
                    <span className="mono">Full Name</span>
                    <div className="auth-input-box">
                      <UserIcon className="w-4 h-4 auth-icon" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={handleChange("name")}
                        placeholder="Jane Doe"
                        required
                        aria-invalid={Boolean(error)}
                      />
                    </div>
                  </label>

                  <label className="field">
                    <span className="mono">Email Address</span>
                    <div className="auth-input-box">
                      <Mail className="w-4 h-4 auth-icon" />
                      <input
                        type="email"
                        value={formData.email}
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
                        value={formData.password}
                        onChange={handleChange("password")}
                        placeholder="At least 8 characters"
                        required
                        aria-invalid={Boolean(error)}
                      />
                    </div>
                    
                    {formData.password && (
                      <div className="strength-container">
                        <div className="strength-track">
                          <div
                            className="strength-fill"
                            style={{
                              width: `${passwordStrength}%`,
                              backgroundColor:
                                passwordStrength < 40
                                  ? "#ef4444"
                                  : passwordStrength < 75
                                  ? "#f59e0b"
                                  : "var(--color-brand)",
                            }}
                          />
                        </div>
                        <span className="strength-label mono">
                          {passwordStrength < 40
                            ? "Weak Password"
                            : passwordStrength < 75
                            ? "Good Password"
                            : "Strong Password"}
                        </span>
                      </div>
                    )}
                  </label>
                </motion.div>

                <motion.button 
                  type="submit" 
                  className="signup-submit" 
                  disabled={isSubmitting || signupMutation.isPending}
                  variants={itemVariants}
                >
                  {isSubmitting || signupMutation.isPending ? (
                    <span className="spinner-mini" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                <motion.div className="auth-foot" variants={itemVariants}>
                  Already have an account? <Link to="/login">Sign in</Link>
                </motion.div>
              </form>
            </>
          )}
        </motion.div>
      </section>
    </div>
  );
}

