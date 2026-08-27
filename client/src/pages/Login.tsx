import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormEvent, ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import "../App.css";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

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

export function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const errorMessage = (error: any) =>
    error.response?.data?.message ||
    "Something went wrong. Please try again.";

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();
  

  const loginMutation = useMutation({
    mutationFn: async (form: LoginForm) => {
      const { data } = await API.post<LoginResponse>("/auth/login", form);
      return data;
    },

    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      queryClient.setQueryData(['auth', 'me'], data.user);
      navigate("/home");
    },

    onError: (err: any) => {
      setError(errorMessage(err));
    },
  });
  useEffect(() => {
        if (isAuthenticated) {
            navigate("/home");
        }
    }, [isAuthenticated, navigate]);

  const handleChange =
    (field: keyof LoginForm) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    loginMutation.mutate(form);
  };

  return (
    <div className="auth-page">
      <div className="auth-side">
        <Link to="/" className="brand">
          <span>P</span> Podstudio
        </Link>

        <div>
          <p className="eyebrow">Create with confidence</p>
          <h1>Make every conversation worth sharing.</h1>
          <p>
            Record studio-quality video with your team, wherever they are.
          </p>
        </div>
      </div>

      <section className="auth-card">
        <div>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your workspace</h2>
          <p>Sign in to continue creating with Podstudio.</p>
        </div>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={submit} className="form-grid">
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="you@company.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="••••••••"
              required
            />
          </label>

          <button
            type="submit"
            className="primary"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"} <span>→</span>
          </button>
        </form>

        <p className="auth-foot">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </div>
  );
}
