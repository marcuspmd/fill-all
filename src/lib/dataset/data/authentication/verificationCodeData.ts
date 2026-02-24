import type { TrainingSample } from "@/types";

export const TRAINING_SAMPLES_VERIFICATION_CODE: TrainingSample[] = [
  // ─────────────────────────────────────────────
  // EASY (código de verificação de conta / e-mail)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Código de Verificação"],
      secondary: ["Enviado para seu e-mail"],
      structural: ["Segurança"],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Verification Code"],
      secondary: ["Sent to your email"],
      structural: ["Security"],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["Código de Confirmação"],
      secondary: ["Confirme sua conta"],
      structural: ["Verificação de Conta"],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "easy",
    language: "pt",
  },
  {
    signals: {
      primary: ["Confirm Code"],
      secondary: ["Confirm your account"],
      structural: ["Account Verification"],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },
  {
    signals: {
      primary: ["verification_code"],
      secondary: [],
      structural: ["verify"],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "easy",
    language: "en",
  },

  // ─────────────────────────────────────────────
  // MEDIUM (fluxo de verificação)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Código Enviado"],
      secondary: ["Verifique seu e-mail"],
      structural: ["Confirmação de E-mail"],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Enter Code"],
      secondary: ["We sent a code to your email"],
      structural: ["Verify Identity"],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["Código de Ativação"],
      secondary: ["Ative sua conta"],
      structural: ["Cadastro"],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },
  {
    signals: {
      primary: ["Activation Code"],
      secondary: ["Enter the code to activate"],
      structural: ["Sign Up"],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "medium",
    language: "en",
  },
  {
    signals: {
      primary: ["PIN de Verificação"],
      secondary: ["Verifique seu telefone"],
      structural: ["Verificação"],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "medium",
    language: "pt",
  },

  // ─────────────────────────────────────────────
  // HARD (ambíguo)
  // ─────────────────────────────────────────────
  {
    signals: {
      primary: ["Código"],
      secondary: ["Enviado via SMS ou e-mail"],
      structural: [],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "hard",
    language: "pt",
  },
  {
    signals: {
      primary: ["Verification Code"],
      secondary: [],
      structural: [],
    },
    category: "authentication",
    type: "verification-code",
    source: "synthetic",
    difficulty: "hard",
    language: "en",
    domFeatures: { maxLength: 8 },
  },
];
