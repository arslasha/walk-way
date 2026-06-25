"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/profile");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !email || !password || !confirmPassword) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    if (password.length < 8) {
      toast.error("Пароль должен содержать минимум 8 символов");
      return;
    }

    const success = await register(email, password, nickname);
    if (success) {
      toast.success("Регистрация выполнена успешно!");
      router.push("/profile");
    } else {
      const err = useAuthStore.getState().error;
      toast.error(err || "Не удалось зарегистрироваться");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors duration-300">
      <Navbar />

      <main className="relative flex flex-1 items-center justify-center px-4 py-16 overflow-hidden">
        {/* Background glow animations */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 -bottom-40 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[120px]" />

        <div className="relative w-full max-w-[480px] overflow-hidden rounded-[40px] border border-border bg-surface/60 p-8 shadow-2xl backdrop-blur-xl md:p-12 transition-all">
          
          {/* Logo / Brand subtitle */}
          <div className="mb-8 text-center">
            <span className="font-heading text-xs font-bold tracking-[0.2em] text-accent uppercase">
              walk-way
            </span>
            <h1 className="mt-2 font-heading text-[44px] font-extrabold leading-[1.0] tracking-tight text-foreground lowercase">
              регистрация
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              создайте аккаунт и сохраняйте любимые вайбы
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-[20px] bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase pl-3">
                никнейм
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-muted-foreground">
                  <User className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="vibe_explorer"
                  className="w-full h-13 pl-12 pr-4 rounded-[28px] border border-border bg-surface/80 text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase pl-3">
                email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.ru"
                  className="w-full h-13 pl-12 pr-4 rounded-[28px] border border-border bg-surface/80 text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase pl-3">
                пароль
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-13 pl-12 pr-12 rounded-[28px] border border-border bg-surface/80 text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground transition-transform active:scale-90"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase pl-3">
                подтверждение пароля
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-13 pl-12 pr-12 rounded-[28px] border border-border bg-surface/80 text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative flex w-full h-14 items-center justify-center rounded-[28px] bg-accent text-white font-semibold tracking-wide transition-all hover:bg-accent-hover disabled:opacity-50 mt-6 active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "зарегистрироваться"
              )}
            </button>

            <div className="pt-4 text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link href="/auth/login" className="font-semibold text-accent hover:underline transition-opacity active:opacity-70">
                Войти
              </Link>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}
