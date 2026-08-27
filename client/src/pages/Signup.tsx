import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";

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

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState<string>("");

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

      const user =
        payload.user ??
        (payload as User);

      const token =
        responseData.token ??
        payload.token;

      if (token) {
        localStorage.setItem("token", token);

        localStorage.setItem(
          "user",
          JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role ?? "member",
          })
        );

        navigate("/home");
        return;
      }

      navigate("/login");
    },

    onError: (err: unknown) => {
      const error = err as AxiosError<ApiError>;

      setError(
        error.response?.data?.message ??
          "Sign-up failed. Please try again."
      );
    },
  });


  const handleChange =
    (field: keyof SignupForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };


  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    signupMutation.mutate(formData);
  };


  return (
    <main className="auth-page">
      <div className="auth-side">
        <Link to="/" className="brand">
          <span>R</span> RIVERSIDE
        </Link>

        <div>
          <p className="eyebrow">START CREATING</p>
          <h1>Bring your best conversations to life.</h1>
          <p>
            Record, edit, and share polished content from one focused studio.
          </p>
        </div>
      </div>

      <section className="auth-card">
        <p className="eyebrow">CREATE YOUR ACCOUNT</p>

        <h2>Start creating today</h2>

        <p className="muted">
          Set up your Riverside account and start your first recording.
        </p>


        {error && (
          <div className="alert error">
            {error}
          </div>
        )}


        <form
          onSubmit={handleSubmit}
          className="form-grid"
        >

          <label htmlFor="name">
            Full name

            <input
              id="name"
              type="text"
              placeholder="Your full name"
              value={formData.name}
              onChange={handleChange("name")}
              required
            />
          </label>


          <label htmlFor="email">
            Email

            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange("email")}
              required
            />
          </label>


          <label htmlFor="password">
            Password

            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              minLength={6}
              value={formData.password}
              onChange={handleChange("password")}
              required
            />
          </label>


          <button
            className="primary"
            type="submit"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending
              ? "Creating account..."
              : "Create account"}
          </button>

        </form>


        <p className="auth-foot">
          Already have an account?{" "}
          <Link to="/login">
            Sign in
          </Link>
        </p>

      </section>
    </main>
  );
}
