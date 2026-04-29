"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TrendingUp, BarChart3, Link2, Brain, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  { icon: TrendingUp, label: "Keyword Rank Tracking" },
  { icon: BarChart3, label: "Domain Authority Monitoring" },
  { icon: Link2, label: "Backlink Intelligence" },
  { icon: Brain, label: "AI Brand Mention Tracking" },
  { icon: Shield, label: "On-Page SEO Audits" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@rankagent.io");
  const [password, setPassword] = useState("rankagent2025");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#0a0e1a] px-12 py-10 border-r border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">RankAgent</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-foreground">
              SEO Intelligence<br />for your entire team
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Track rankings, monitor backlinks, audit pages, and measure AI brand visibility — all in one dashboard.
            </p>
          </div>
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Internal platform — data marked as Demo uses estimated values.
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex items-center justify-center px-6 py-10 bg-background">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">RankAgent</span>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>Access the RankAgent dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="demo@rankagent.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              <div className="mt-4 rounded-md bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Demo credentials</strong>
                <br />
                Email: demo@rankagent.io
                <br />
                Password: rankagent2025
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
