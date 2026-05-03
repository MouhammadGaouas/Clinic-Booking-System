"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      }, {
          onError: (ctx) => {
              setError(ctx.error.message || "Invalid email or password");
          }
      });

      if (!signInError) {
        router.push("/");
        return;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-zinc-50 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-zinc-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Welcome Back</h1>
          <p className="text-zinc-500 mt-2">Sign in to your MidCare account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-zinc-700">
                Password
              </label>
              <Link href="#" className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-zinc-600">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-blue-600 font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
