import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, LogIn, Mail, Lock, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import HSQ from "../../public/HSQ.png";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

const LoginPage = () => {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-25"></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-full w-16 h-16 flex items-center justify-center shadow-lg shadow-amber-900/20">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <p className="text-slate-400 font-light tracking-wide">
            Accessing Secure Portal...
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Welcome Back",
        description: "You have successfully logged in.",
        className: "bg-emerald-950 border-emerald-900 text-emerald-50"
      });
    } else {
      setError(result.message);
      toast({
        title: "Login failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>

      {/* Animated Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-slate-800/20 blur-[100px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo Section */}
        <div className="text-center mb-8 flex flex-col items-center animate-fade-in-down">
          <div className="h-24 w-24 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-black/50 border border-slate-800 mb-6 group transition-all duration-500 hover:border-amber-500/30 hover:shadow-amber-900/20">
            <img
              src={HSQ}
              alt="HSQ Logo"
              className="w-16 h-auto opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </div>
          <h1 className="text-3xl font-light text-slate-100 tracking-wider">HSQ <span className="font-semibold text-amber-500">TOWERS</span></h1>
          <p className="text-slate-500 text-sm mt-2 tracking-wide font-light">MANAGEMENT PORTAL</p>
        </div>

        {/* Login Card */}
        <Card className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl shadow-black/80">
          <CardHeader className="text-center pb-2 pt-8">
            <CardTitle className="text-xl font-medium text-slate-200">
              Sign In
            </CardTitle>
            <CardDescription className="text-slate-500">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 pb-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-400 text-xs font-medium uppercase tracking-wider ml-1">
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-amber-500 transition-colors duration-300" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 rounded-lg transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-slate-400 text-xs font-medium uppercase tracking-wider ml-1">
                    Password
                  </Label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-amber-500 transition-colors duration-300" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-11 bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 rounded-lg transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full w-10 px-0 text-slate-500 hover:text-amber-400 hover:bg-transparent transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-red-400 text-sm font-light leading-relaxed">
                    {error}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg shadow-lg shadow-amber-900/20 hover:shadow-amber-900/40 transform active:scale-[0.98] transition-all duration-200 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>

          <CardContent className="pb-6 pt-0 px-8 text-center border-t border-slate-800/50">
            <p className="text-xs text-slate-600 mt-6 font-light">
              By signing in, you agree to the company policies.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-600 text-xs font-mono">
            SECURE CONNECTION • 256-BIT ENCRYPTION
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
