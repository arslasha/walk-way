"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "@/components/layout/Navbar";
import { 
  User as UserIcon, 
  Shield, 
  ShieldCheck, 
  Folder, 
  Users, 
  Camera, 
  Edit3, 
  Copy, 
  Check, 
  Loader2, 
  X,
  Lock,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    clearError, 
    updateProfile, 
    enable2FA, 
    confirm2FA, 
    disable2FA,
    qrCodeData
  } = useAuthStore();

  // Tabs state
  const [activeTab, setActiveTab] = useState<"folders" | "friends">("folders");

  // Edit profile state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // 2FA setup state
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [totpConfirmCode, setTotpConfirmCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodesList, setBackupCodesList] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // 2FA disable state
  const [is2FADisableOpen, setIs2FADisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error("Пожалуйста, войдите в систему");
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Sync edit profile form
  useEffect(() => {
    if (user) {
      setEditNickname(user.nickname || "");
      setEditBio(user.bio || "");
      setAvatarPreview(null);
      setEditAvatarFile(null);
    }
  }, [user, isEditModalOpen]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Handle Avatar selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate type & size
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Разрешены только файлы JPEG, PNG и WebP");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Максимальный размер файла — 5 МБ");
        return;
      }
      setEditAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile Save
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNickname.trim()) {
      toast.error("Никнейм не может быть пустым");
      return;
    }

    const success = await updateProfile(editNickname, editBio, editAvatarFile);
    if (success) {
      toast.success("Профиль успешно обновлен!");
      setIsEditModalOpen(false);
    } else {
      toast.error(error || "Не удалось обновить профиль");
    }
  };

  // 2FA Enable Trigger
  const handleStart2FA = async () => {
    const data = await enable2FA();
    if (data) {
      setBackupCodesList(data.backup_codes || []);
      setIs2FASetupOpen(true);
      setShowBackupCodes(false);
      setTotpConfirmCode("");
    } else {
      toast.error(error || "Не удалось запустить настройку 2FA");
    }
  };

  // 2FA TOTP Confirm
  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpConfirmCode) {
      toast.error("Введите код из приложения Google Authenticator");
      return;
    }

    const success = await confirm2FA(totpConfirmCode);
    if (success) {
      toast.success("Двухфакторная аутентификация успешно включена!");
      setShowBackupCodes(true);
    } else {
      toast.error(error || "Неверный код подтверждения");
    }
  };

  // 2FA Disable Trigger
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword || !disableCode) {
      toast.error("Заполните все поля");
      return;
    }

    const success = await disable2FA(disablePassword, disableCode);
    if (success) {
      toast.success("2FA успешно отключена");
      setIs2FADisableOpen(false);
      setDisablePassword("");
      setDisableCode("");
    } else {
      toast.error(error || "Не удалось отключить 2FA. Проверьте пароль и код");
    }
  };

  // Copy backup codes
  const copyBackupCodes = () => {
    const text = backupCodesList.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    toast.success("Резервные коды скопированы!");
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors duration-300">
      <Navbar />

      <main className="ww-container flex-1 py-12 px-4 md:px-8 max-w-[1200px] mx-auto">
        {/* Hero Banner Area */}
        <div className="relative mb-12 overflow-hidden rounded-[40px] border border-border bg-gradient-to-r from-accent/10 to-accent/5 p-8 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[80px]" />
          
          <div className="flex flex-col items-center gap-6 md:flex-row md:gap-8">
            {/* User Avatar */}
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar.startsWith("http") ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${user.avatar}`}
                  alt={user.nickname}
                  className="h-28 w-28 rounded-full border-4 border-surface object-cover shadow-xl"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-surface bg-surface-raised text-accent shadow-xl">
                  <UserIcon className="h-12 w-12" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <span className="text-xs font-bold tracking-[0.2em] text-accent uppercase">личный кабинет</span>
              <h1 className="mt-1 font-heading text-4xl md:text-5xl font-extrabold leading-[1.0] text-foreground lowercase">
                {user.nickname}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground font-medium">{user.email}</p>
              {user.bio ? (
                <p className="mt-4 max-w-xl text-sm text-foreground/80 leading-relaxed bg-surface/40 backdrop-blur-sm rounded-[20px] p-4 border border-border">
                  {user.bio}
                </p>
              ) : (
                <p className="mt-3 text-xs italic text-muted-foreground">расскажите немного о себе, чтобы добавить вайба вашему профилю</p>
              )}
            </div>

            {/* Edit Profile Button */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-raised hover:border-foreground/30 transition-all shadow-sm"
            >
              <Edit3 className="h-4 w-4" />
              редактировать профиль
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Right/Bottom Column: Security & Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-[40px] border border-border bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
                <Shield className="h-5 w-5 text-accent" />
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground lowercase">
                  безопасность
                </h2>
              </div>

              {/* 2FA Status Widget */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-[28px] bg-surface-raised p-5 border border-border/50">
                  {user.is_2fa_enabled ? (
                    <>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-bold text-foreground">2FA включена</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Ваш аккаунт надежно защищен одноразовыми кодами при авторизации.
                        </p>
                        <button
                          onClick={() => setIs2FADisableOpen(true)}
                          className="mt-3 text-xs font-semibold text-red-500 hover:underline hover:text-red-600 block"
                        >
                          отключить защиту 2FA
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-bold text-foreground">2FA отключена</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Двухфакторная аутентификация обеспечивает дополнительный уровень защиты вашего профиля.
                        </p>
                        <button
                          onClick={handleStart2FA}
                          className="mt-3 text-xs font-semibold text-accent hover:underline hover:text-accent-hover block"
                        >
                          настроить двухфакторку
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Left/Top Columns: Tabs Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-[40px] border border-border bg-surface p-6 shadow-sm min-h-[400px] flex flex-col">
              
              {/* Tab Navigation */}
              <div className="flex gap-4 border-b border-border pb-4 mb-6">
                <button
                  onClick={() => setActiveTab("folders")}
                  className={`flex items-center gap-2 pb-2 text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${
                    activeTab === "folders"
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Folder className="h-4 w-4" />
                  мои папки
                </button>
                <button
                  onClick={() => setActiveTab("friends")}
                  className={`flex items-center gap-2 pb-2 text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${
                    activeTab === "friends"
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  мои друзья
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 flex flex-col justify-center items-center">
                {activeTab === "folders" ? (
                  <div className="text-center max-w-sm py-12">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
                      <Folder className="h-7 w-7" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-foreground lowercase">здесь пока пусто</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Создавайте персональные подборки мест для свиданий, прогулок в одиночку или шумных компаний.
                    </p>
                    <button 
                      onClick={() => toast.info("Функционал папок будет доступен в следующих фазах разработки")}
                      className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-xs font-bold text-white transition-all hover:bg-accent-hover"
                    >
                      создать папку
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center max-w-sm py-12">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
                      <Users className="h-7 w-7" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-foreground lowercase">друзья не добавлены</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Делитесь своими маршрутами, отправляйте подборки и планируйте совместные выходные.
                    </p>
                    <button 
                      onClick={() => toast.info("Функционал друзей будет доступен в следующих фазах разработки")}
                      className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-xs font-bold text-white transition-all hover:bg-accent-hover"
                    >
                      найти друзей
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="relative w-full max-w-[500px] overflow-hidden rounded-[32px] border border-border bg-surface p-6 shadow-2xl md:p-8 animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full border border-border hover:bg-surface-raised transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-2xl font-extrabold text-foreground lowercase mb-6">
              редактировать профиль
            </h3>

            <form onSubmit={handleProfileSave} className="space-y-5">
              {/* Avatar Selector */}
              <div className="flex flex-col items-center gap-4 border-b border-border pb-5">
                <div className="relative group cursor-pointer">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar preview"
                      className="h-24 w-24 rounded-full object-cover border-2 border-accent"
                    />
                  ) : user.avatar ? (
                    <img
                      src={user.avatar.startsWith("http") ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${user.avatar}`}
                      alt={user.nickname}
                      className="h-24 w-24 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-raised border border-border text-muted-foreground">
                      <UserIcon className="h-10 w-10" />
                    </div>
                  )}
                  <label htmlFor="avatar-file-input" className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-5 w-5" />
                  </label>
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Разрешены JPEG, PNG, WebP до 5 МБ
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase pl-3">
                  никнейм
                </label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full h-12 px-4 rounded-[28px] border border-border bg-surface text-foreground focus:border-accent focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase pl-3">
                  обо мне
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={4}
                  className="w-full p-4 rounded-[20px] border border-border bg-surface text-foreground focus:border-accent focus:outline-none transition-all resize-none text-sm leading-relaxed"
                  placeholder="Люблю находить секретные кофейни и тихие парки..."
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center rounded-[28px] bg-accent text-white font-semibold tracking-wide hover:bg-accent-hover transition-all disabled:opacity-50 mt-4"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "сохранить изменения"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {is2FASetupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="relative w-full max-w-[520px] overflow-y-auto max-h-[90vh] rounded-[32px] border border-border bg-surface p-6 shadow-2xl md:p-8 animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => {
                setIs2FASetupOpen(false);
                setShowBackupCodes(false);
              }}
              className="absolute top-6 right-6 p-2 rounded-full border border-border hover:bg-surface-raised transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {!showBackupCodes ? (
              <>
                <h3 className="font-heading text-2xl font-extrabold text-foreground lowercase mb-4">
                  настройка защиты 2FA
                </h3>
                
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    1. Установите приложение <span className="font-bold text-foreground">Google Authenticator</span> или аналогичное.
                  </p>
                  
                  {/* QR Code Container */}
                  <div className="flex flex-col items-center gap-4 bg-surface-raised p-6 rounded-[28px] border border-border/50">
                    {qrCodeData?.otp_uri ? (
                      <div className="p-3 bg-white rounded-2xl border border-border shadow-sm">
                        {/* Dependency-free high fidelity QR Code Generator API */}
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCodeData.otp_uri)}`}
                          alt="QR Code 2FA"
                          className="h-[180px] w-[180px] object-contain"
                        />
                      </div>
                    ) : (
                      <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    )}

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Секретный ключ</div>
                      <div className="mt-1 font-mono text-sm bg-surface px-4 py-1.5 rounded-full border border-border font-bold text-accent select-all">
                        {qrCodeData?.otp_secret}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    2. Отсканируйте QR-код выше в приложении или введите ключ вручную, затем введите полученный 6-значный код ниже.
                  </p>

                  <form onSubmit={handleConfirm2FA} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={totpConfirmCode}
                        onChange={(e) => setTotpConfirmCode(e.target.value)}
                        placeholder="000 000"
                        className="w-full h-12 text-center font-mono text-lg tracking-[0.2em] rounded-[28px] border border-border bg-surface text-foreground focus:border-accent focus:outline-none transition-all"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 flex items-center justify-center rounded-[28px] bg-accent text-white font-semibold hover:bg-accent-hover transition-all disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "активировать защиту"}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-heading text-2xl font-extrabold text-foreground lowercase mb-4">
                  ваши резервные коды
                </h3>
                
                <div className="space-y-6">
                  <div className="rounded-[24px] bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-600 dark:text-amber-400 leading-relaxed font-medium">
                    Сохраните эти коды в надежном месте! Они понадобятся, если вы потеряете доступ к приложению Google Authenticator. Каждый код можно использовать только один раз.
                  </div>

                  {/* Backup Codes Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-surface-raised p-5 rounded-[28px] border border-border/50 font-mono text-center text-sm font-bold">
                    {backupCodesList.map((code) => (
                      <div key={code} className="bg-surface py-2 rounded-full border border-border/50 text-foreground">
                        {code}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={copyBackupCodes}
                      className="flex-1 h-12 flex items-center justify-center gap-2 rounded-[28px] border border-border bg-surface text-foreground font-semibold hover:bg-surface-raised transition-all"
                    >
                      {copiedCodes ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      {copiedCodes ? "скопировано" : "копировать все"}
                    </button>

                    <button
                      onClick={() => {
                        setIs2FASetupOpen(false);
                        setShowBackupCodes(false);
                      }}
                      className="flex-1 h-12 flex items-center justify-center rounded-[28px] bg-accent text-white font-semibold hover:bg-accent-hover transition-all"
                    >
                      готово
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {is2FADisableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="relative w-full max-w-[460px] overflow-hidden rounded-[32px] border border-border bg-surface p-6 shadow-2xl md:p-8 animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setIs2FADisableOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full border border-border hover:bg-surface-raised transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-2xl font-extrabold text-foreground lowercase mb-4">
              отключение 2FA
            </h3>
            
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Для отключения двухфакторной аутентификации введите текущий пароль и код подтверждения из приложения Google Authenticator.
            </p>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase pl-3">
                  ваш пароль
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 pl-12 pr-4 rounded-[28px] border border-border bg-surface text-foreground focus:border-accent focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase pl-3">
                  код подтверждения 2FA
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-muted-foreground">
                    <Shield className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    placeholder="000000"
                    className="w-full h-12 pl-12 pr-4 rounded-[28px] border border-border bg-surface text-foreground focus:border-accent focus:outline-none transition-all font-mono tracking-[0.2em] text-center text-md"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center rounded-[28px] bg-red-500 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-50 mt-6"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "отключить защиту"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
