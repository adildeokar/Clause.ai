"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "signing" | "welcome">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setPhase("signing");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setPhase("idle");
      } else {
        setPhase("welcome");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 800);
      }
    } catch {
      setError("An unexpected error occurred");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-[40px] font-medium leading-none tracking-[0.5px] text-black">
          Clause.Ai
        </h1>
        {phase === "signing" && (
          <p className="text-base text-[#868686]">logging in...</p>
        )}
        {phase === "welcome" && (
          <p className="text-base font-medium text-[#006A3B]">Welcome!</p>
        )}
      </div>

      <div className="absolute bottom-12 left-1/2 w-full max-w-md -translate-x-1/2 px-6">
        {phase === "idle" && (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-[#E8E8E8] bg-white p-8 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]"
          >
            <p className="mb-6 text-center text-sm text-[#868686]">
              Sign in to your account
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#4B4B4B]">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-[#DDDDDD] focus-visible:ring-[#006A3B]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#4B4B4B]">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-[#DDDDDD] focus-visible:ring-[#006A3B]"
                />
              </div>

              {error && (
                <div className="rounded border border-[#FC7F79] bg-[#FFF0EE] px-4 py-2 text-sm text-[#F83446]">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#006A3B] hover:bg-[#005a32]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
            <p className="mt-6 border-t border-[#E8E8E8] pt-6 text-center text-xs text-[#868686]">
              Contact your administrator for account access
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
