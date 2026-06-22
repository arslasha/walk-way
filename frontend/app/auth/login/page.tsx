"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Mail, Lock, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const { login, verify2FA, twoFactorRequired, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    const success = await login(email, password);
    if (success) {
      toast.success("Вход выполнен успешно!");
      router.push("/profile");
    } else if (useAuthStore.getState().twoFactorRequired) {
      toast.info("Требуется двухфакторная аутентификация");
    } else {
      const err = useAuthStore.getState().error;
      toast.error(err || "Неверный email или пароль");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error("Введите код подтверждения");
      return;
    }

    const success = await verify2FA(otpCode);
    if (success) {
      toast.success("Вход выполнен успешно!");
      router.push("/profile");
    } else {
      const err = useAuthStore.getState().error;
      toast.error(err || "Неверный код 2FA");
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
            <h1 className="mt-2 font-heading text-[48px] font-extrabold leading-[1.0] tracking-tight text-foreground lowercase">
              {twoFactorRequired ? "введите код" : "войти"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {twoFactorRequired
                ? "введите 6-значный одноразовый код или резервный код"
                : "городской гид по вайбу ждёт вас"
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-[20px] bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-500 dark:text-red-400">
              {error}
            </div>
          )}

          {!twoFactorRequired ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2">
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
                    className="w-full h-14 pl-12 pr-4 rounded-[28px] border border-border bg-surface/80 text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-3">
                  <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    пароль
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 pl-12 pr-12 rounded-[28px] border border-border bg-surface/80 text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative flex w-full h-14 items-center justify-center rounded-[28px] bg-accent text-white font-semibold tracking-wide transition-all hover:bg-accent-hover disabled:opacity-50 mt-8"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "войти в аккаунт"
                )}
              </button>

              <div className="pt-4 text-center text-sm text-muted-foreground">
                Ещё нет аккаунта?{" "}
                <Link href="/auth/register" className="font-semibold text-accent hover:underline">
                  Зарегистрироваться
                </Link>
              </div>
            </form>
          ) : (
            /* OTP Form */
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  код подтверждения 2FA
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-muted-foreground">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    maxLength={16}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full h-14 px-12 rounded-[28px] border border-border bg-surface/80 text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none transition-all tracking-[0.2em] font-mono text-center text-lg"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative flex w-full h-14 items-center justify-center rounded-[28px] bg-accent text-white font-semibold tracking-wide transition-all hover:bg-accent-hover disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "подтвердить вход"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => useAuthStore.setState({ twoFactorRequired: false, preAuthToken: null })}
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:text-foreground hover:underline"
                >
                  Вернуться к вводу пароля
                </button>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  );
}
