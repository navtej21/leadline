"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      setLoading(false);
      if (error) return setError(error.message);
      // With email confirmation on, there is no session yet: don't send them to /app.
      if (!data.session) return setInfo("Check your email to confirm your account, then log in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
    }

    router.push("/app");
    router.refresh(); // makes server components see the new session
  }

  return (
    <main className="mx-auto mt-24 max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold">
        {mode === "login" ? "Log in to Leadline" : "Create your account"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded border p-2"
        />
        <input
          type="password" required minLength={6} value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 characters)"
          className="w-full rounded border p-2"
        />
        <button disabled={loading} className="w-full rounded bg-black p-2 text-white disabled:opacity-50">
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}
      </form>

      <button
        onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setInfo(""); }}
        className="mt-4 text-sm text-gray-600 underline"
      >
        {mode === "login" ? "No account? Sign up" : "Already have an account? Log in"}
      </button>
    </main>
  );
}