import Link from "next/link";
import { Shield, ArrowRight, FileSearch, Brain, Scale, Zap } from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "Contract Analysis",
    description:
      "Upload any contract and get instant AI-powered analysis with risk scoring and clause-by-clause breakdown.",
  },
  {
    icon: Brain,
    title: "Loophole Detection",
    description:
      "Identify exploitable language, missing clauses, and one-sided obligations before they become problems.",
  },
  {
    icon: Scale,
    title: "Fairness Assessment",
    description:
      "Evaluate contract balance across parties with bias detection and reciprocity analysis.",
  },
  {
    icon: Zap,
    title: "Adversarial Stress Testing",
    description:
      "Simulate opposing legal attacks to find weaknesses and strengthen your position.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 z-50 w-full border-b border-[#E8E8E8] bg-white/95 backdrop-blur figma-shadow-header">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-[#006A3B]" />
            <span className="text-xl font-medium text-black">Clause.Ai</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-[#868686] transition-colors hover:text-black"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded bg-[#006A3B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#005a32]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#006A3B]/5 via-transparent to-transparent" />

          <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#CCE1D8] bg-[#F4F7F6] px-3 py-1 text-xs text-[#868686]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#006A3B]" />
                AI-Powered Contract Intelligence
              </div>

              <h1 className="mb-6 text-5xl font-medium tracking-tight text-black md:text-7xl">
                Analyze contracts
                <br />
                with precision
              </h1>

              <p className="mx-auto mb-10 max-w-xl text-lg text-[#868686]">
                Detect loopholes, assess fairness, stress test clauses, and draft
                better contracts with AI that thinks like a lawyer.
              </p>

              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded bg-[#006A3B] px-6 py-3 font-medium text-white transition-all hover:bg-[#005a32] hover:shadow-lg hover:shadow-[#006A3B]/20"
                >
                  Start Analyzing
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 rounded border border-[#E8E8E8] bg-white px-6 py-3 font-medium text-black transition-colors hover:bg-[#F4F7F6]"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-medium text-black">
              Everything you need for contract intelligence
            </h2>
            <p className="mx-auto max-w-lg text-[#868686]">
              From risk analysis to AI-powered drafting, Clause AI gives your legal
              team superpowers.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="figma-card p-8 transition-colors hover:border-[#66A689]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#E5F0EB]">
                  <feature.icon className="h-5 w-5 text-[#006A3B]" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-black">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#868686]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="relative overflow-hidden rounded-2xl border border-[#CCE1D8] bg-[#F4F7F6] p-12 text-center">
            <h2 className="mb-4 text-3xl font-medium text-black">
              Ready to analyze your contracts?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-[#868686]">
              Upload your first contract and see AI-powered analysis in seconds.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded bg-[#006A3B] px-8 py-3 font-medium text-white transition-all hover:bg-[#005a32] hover:shadow-lg hover:shadow-[#006A3B]/20"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E8E8E8] py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#006A3B]" />
            <span className="text-sm font-medium text-black">Clause.Ai</span>
          </div>
          <p className="text-xs text-[#868686]">
            &copy; {new Date().getFullYear()} Clause AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
