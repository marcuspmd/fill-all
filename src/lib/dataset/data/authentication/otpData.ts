import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_OTP: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (OTP / 2FA explícito)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["OTP"],
      secondary: ["Código do autenticador"],
      structural: ["Verificação"],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["OTP"],
      secondary: ["Authenticator code"],
      structural: ["Verification"],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Código OTP"],
      secondary: ["Código de uso único"],
      structural: ["Autenticação"],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["One-Time Password"],
      secondary: ["Enter your OTP"],
      structural: ["2FA"],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["otp_code"],
      secondary: [],
      structural: ["login"],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (contexto de 2FA / login)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Código de Autenticação"],
      secondary: ["6 dígitos do seu autenticador"],
      structural: ["Login"],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Authentication Code"],
      secondary: ["Enter 6-digit code from your authenticator app"],
      structural: ["Two-Factor Authentication"],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Código 2FA"],
      secondary: ["Google Authenticator"],
      structural: ["Segurança da Conta"],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Two-Factor Code"],
      secondary: ["From your authenticator"],
      structural: ["Account Security"],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["TOTP"],
      secondary: ["Time-based one-time password"],
      structural: ["MFA"],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Token"],
      secondary: ["Código enviado por SMS"],
      structural: [],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["OTP"],
      secondary: [],
      structural: [],
    },
    category: "authentication",
    type: "otp",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
    domFeatures: { maxLength: 6, inputType: "tel" },
  },
];
