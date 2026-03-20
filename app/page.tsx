import Link from "next/link";
import { Shield, ArrowRight, FileSearch, Brain, Scale, Zap } from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "Contract Analysis",
    description: "Upload any contract and get instant AI-powered analysis with risk scoring and clause-by-clause breakdown.",
  },
  {
    icon: Brain,
    title: "Loophole Detection",
    description: "Identify exploitable language, missing clauses, and one-sided obligations before they become problems.",
  },
  {
    icon: Scale,
    title: "Fairness Assessment",
    description: "Evaluate contract balance across parties with bias detection and reciprocity analysis.",
  },
  {
    icon: Zap,
    title: "Adversarial Stress Testing",
    description: "Simulate opposing legal attacks to find weaknesses and strengthen your position.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-400" />
            <span className="text-xl font-bold gradient-text">Clause AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-xs text-muted-foreground mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                AI-Powered Contract Intelligence
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                <span className="gradient-text">Analyze contracts</span>
                <br />
                <span className="text-foreground">with precision</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Detect loopholes, assess fairness, stress test clauses, and draft 
                better contracts with AI that thinks like a lawyer.
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-blue-600/20"
                >
                  Start Analyzing
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg glass-card hover:bg-white/[0.06] text-foreground font-medium transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need for contract intelligence
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From risk analysis to AI-powered drafting, Clause AI gives your legal team superpowers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-8 rounded-xl glass-hover group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="glass-card rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5" />
            <div className="relative">
              <h2 className="text-3xl font-bold mb-4">
                Ready to analyze your contracts?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Upload your first contract and see AI-powered analysis in seconds.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-blue-600/20"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-semibold gradient-text">Clause AI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Clause AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
