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

        navigate("/dashboard");
        return;
      }

      navigate("/login");
    },

    onError: (err: unknown) => {
      const error = err as AxiosError<ApiError>;

      setError(
        error.response?.data?.message ??
          "Signup failed. Please try again."
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
          <span>H</span> HeroCRM
        </Link>

        <div>
          <p className="eyebrow">JOIN YOUR WORKSPACE</p>
          <h1>Keep every new lead moving forward.</h1>
          <p>
            Capture, qualify, and follow up from one focused CRM dashboard.
          </p>
        </div>
      </div>

      <section className="auth-card">
        <p className="eyebrow">Create account</p>

        <h2>Start managing leads</h2>

        <p className="muted">
          Add your CRM account, then continue straight to the dashboard.
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
              placeholder="Your name"
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
              placeholder="you@example.com"
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
              placeholder="Minimum 6 characters"
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
            Login
          </Link>
        </p>

      </section>
    </main>
  );
}
