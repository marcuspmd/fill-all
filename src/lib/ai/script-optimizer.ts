/**
 * Script Optimizer — Chrome AI (Gemini Nano) powered E2E script optimizer
 *
 * Accepts a raw generated E2E script and optional page context, then uses
 * Chrome AI to refactor and optimize the code for better selectors,
 * structure, and assertions.
 *
 * Runs in the background service worker where `LanguageModel` is available.
 * Content scripts / popup / devtools proxy calls through `AI_OPTIMIZE_SCRIPT`.
 */

import { createLogger } from "@/lib/logger";
import { renderSystemPrompt } from "@/lib/ai/prompts/prompt-renderer";
import {
  scriptOptimizerPrompt,
  OPTIMIZER_TEMPERATURE,
} from "@/lib/ai/prompts/script-optimizer.prompt";
import type { ScriptOptimizerInput } from "@/lib/ai/prompts/script-optimizer.prompt";

const log = createLogger("ScriptOptimizer");

// ── Session management ────────────────────────────────────────────────────────

const OPTIMIZE_TIMEOUT_MS = 120_000;
const SESSION_FAILURE_TTL_MS = 60_000;

let optimizerSession: LanguageModelSession | null = null;
let sessionFailedAt: number | null = null;

function getLanguageModelApi(): LanguageModelStatic | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).LanguageModel as LanguageModelStatic | undefined;
}

async function getOrCreateSession(): Promise<LanguageModelSession | null> {
  if (optimizerSession) return optimizerSession;

  if (
    sessionFailedAt &&
    Date.now() - sessionFailedAt < SESSION_FAILURE_TTL_MS
  ) {
    return null;
  }

  try {
    const api = getLanguageModelApi();
    if (!api) {
      log.warn("LanguageModel API não encontrada.");
      sessionFailedAt = Date.now();
      return null;
    }

    const avail = await api.availability({ outputLanguage: "en" });
    if (avail === "unavailable") {
      log.warn(`Chrome AI indisponível (status: "${avail}").`);
      sessionFailedAt = Date.now();
      return null;
    }

    log.debug(`Criando sessão de otimização (availability: "${avail}")...`);

    const systemPrompt = renderSystemPromptForOptimizer();

    optimizerSession = await api.create({
      systemPrompt,
      temperature: OPTIMIZER_TEMPERATURE,
      topK: 1,
      outputLanguage: "en",
    });

    log.info("Sessão Chrome AI ScriptOptimizer criada com sucesso.");
    sessionFailedAt = null;
    return optimizerSession;
  } catch (err) {
    log.warn("Falha ao criar sessão de otimização:", err);
    sessionFailedAt = Date.now();
    return null;
  }
}

function renderSystemPromptForOptimizer(): string {
  return renderSystemPrompt(scriptOptimizerPrompt);
}

/** Destroys the optimizer session and releases resources. */
export function destroyOptimizerSession(): void {
  if (optimizerSession) {
    optimizerSession.destroy();
    optimizerSession = null;
  }
}

// ── Core optimization ─────────────────────────────────────────────────────────

/**
 * Optimizes an E2E test script using Chrome AI (Gemini Nano).
 *
 * @param input - Script content, framework, and optional page context
 * @returns Optimized script string, or `null` when AI is unavailable or fails
 */
export async function optimizeScript(
  input: ScriptOptimizerInput,
): Promise<string | null> {
  log.debug(
    `Otimizando script ${input.framework} (${input.script.length} chars)...`,
  );

  const session = await getOrCreateSession();
  if (!session) {
    log.warn("Sessão Chrome AI indisponível — otimização não realizada.");
    return null;
  }

  const prompt = scriptOptimizerPrompt.buildPrompt(input);

  log.groupCollapsed(`Prompt → otimização de script ${input.framework}`);
  log.debug("▶ Prompt completo:\n" + prompt);
  log.groupEnd();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPTIMIZE_TIMEOUT_MS);

  let raw: string;
  try {
    raw = await session.prompt(prompt, { signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      log.warn(`Timeout (${OPTIMIZE_TIMEOUT_MS}ms) na otimização do script.`);
    } else {
      optimizerSession = null;
      log.warn("Erro na otimização:", (err as Error).message);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }

  const result = scriptOptimizerPrompt.parseResponse(raw);

  log.groupCollapsed(`Resposta ← otimização de script ${input.framework}`);
  log.debug("◄ Resposta raw:\n" + raw);
  log.debug(
    `◄ Resultado parsed: ${result ? `${result.length} chars` : "null"}`,
  );
  log.groupEnd();

  return result;
}
