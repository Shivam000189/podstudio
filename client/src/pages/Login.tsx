// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import API from "../api/axios";

// export default function SignIn() {
//     const navigate = useNavigate();
//     const [formData, setFormData] = useState({
//         email: "",
//         password: "",
//     });
//     const [isSubmitting, setIsSubmitting] = useState(false);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setIsSubmitting(true);

//         try {
//             const response = await API.post("/auth/login", formData);
//             localStorage.setItem("token", response.data.token);
//             localStorage.setItem("user", JSON.stringify(response.data.user));
//             alert("Login successful!");
//             navigate("/dashboard");
//         } catch (error) {
//             console.error("Login error:", error);
//             alert(error.response?.data?.message || "Login failed. Please check your credentials and try again.");
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return (
//         <div className="flex h-screen w-screen items-center justify-center bg-gray-400">
//             <div className="w-96 space-y-4 rounded-md bg-white p-8 shadow-md">
//                 <h1 className="text-center text-3xl font-bold">Login Page</h1>
//                 <form onSubmit={handleSubmit} className="flex flex-col justify-center">
//                     <label htmlFor="email" className="text-lg font-semibold">Email</label>
//                     <input
//                         id="email"
//                         type="email"
//                         placeholder="Email"
//                         value={formData.email}
//                         onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                         className="m-2 rounded-md border-2 border-gray-300 p-2"
//                         required
//                     />

//                     <label htmlFor="password" className="text-lg font-semibold">Password</label>
//                     <input
//                         id="password"
//                         type="password"
//                         placeholder="Password"
//                         value={formData.password}
//                         onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                         className="m-2 rounded-md border-2 border-gray-300 p-2"
//                         required
//                     />

//                     <button
//                         type="submit"
//                         disabled={isSubmitting}
//                         className="m-2 cursor-pointer rounded-md bg-black p-2 text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-70"
//                     >
//                         {isSubmitting ? "Logging in..." : "Login"}
//                     </button>
//                 </form>

//                 <p className="text-center">
//                     Don&apos;t have an account?{" "}
//                     <Link to="/signup" className="text-blue-500 hover:underline">
//                         Signup
//                     </Link>
//                 </p>
//             </div>
//         </div>
//     );
// }

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormEvent, ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import "../App.css";

import API from "../api/axios";

interface LoginForm {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: unknown;
}

export function Login() {
  const navigate = useNavigate();

  const errorMessage = (error: any) =>
    error.response?.data?.message ||
    "Something went wrong. Please try again.";

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (form: LoginForm) => {
      const { data } = await API.post<LoginResponse>("/auth/login", form);
      return data;
    },

    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    },

    onError: (err: any) => {
      setError(errorMessage(err));
    },
  });

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
          <span>H</span> HeroCRM
        </Link>

        <div>
          <p className="eyebrow">A better way to follow up</p>
          <h1>Turn every conversation into a customer.</h1>
          <p>
            Keep your team aligned and your pipeline moving from the very first
            hello.
          </p>
        </div>
      </div>

      <section className="auth-card">
        <div>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your workspace</h2>
          <p>Use your admin or member account to continue.</p>
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
