/**
 * Fill All — Centralized Logger
 *
 * Usage:
 *   import { createLogger } from '@/lib/logger';
 *   const log = createLogger('MyModule');
 *
 *   log.debug('detalhe interno');
 *   log.info('campo detectado', field);
 *   log.warn('fallback activado');
 *   log.error('falha ao carregar modelo', err);
 *
 * O nível mínimo e habilitação são controlados via Settings (debugLog / logLevel).
 * Nenhum `if` é necessário no código consumidor — o filtro é feito aqui.
 *
 * Configuração via storage:
 *   { debugLog: true, logLevel: 'debug' }   → mostra tudo
 *   { debugLog: false }                      → silencia tudo (padrão em prod)
 *
 * Também escuta `chrome.storage.onChanged` para atualização em tempo real.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ── Estado interno ─────────────────────────────────────────────────────────────

interface LoggerState {
  enabled: boolean;
  level: LogLevel;
}

const state: LoggerState = {
  enabled: false,
  level: "warn",
};

/** true enquanto initLogger() ainda não terminou */
let initializing = true;

interface BufferedEntry {
  level: LogLevel | "group";
  prefix: string;
  args: unknown[];
}

/** Fila de mensagens emitidas antes do init completar */
const buffer: BufferedEntry[] = [];

// ── Funções internas ───────────────────────────────────────────────────────────

function shouldLog(level: LogLevel): boolean {
  return state.enabled && LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[state.level];
}

function formatPrefix(namespace: string): string {
  return `[FillAll/${namespace}]`;
}

function flushBuffer(): void {
  for (const entry of buffer) {
    if (entry.level === "group") {
      if (shouldLog("debug")) console.debug(entry.prefix, ...entry.args);
    } else if (shouldLog(entry.level)) {
      const fn =
        entry.level === "error"
          ? console.error
          : entry.level === "warn"
            ? console.warn
            : entry.level === "info"
              ? console.info
              : console.debug;
      fn(entry.prefix, ...entry.args);
    }
  }
  buffer.length = 0;
}

function emit(
  level: LogLevel | "group",
  prefix: string,
  args: unknown[],
): void {
  if (initializing) {
    buffer.push({ level, prefix, args });
    return;
  }
  if (level === "group") {
    if (shouldLog("debug")) console.debug(prefix, ...args);
    return;
  }
  if (!shouldLog(level)) return;
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "info"
          ? console.info
          : console.debug;
  fn(prefix, ...args);
}

// ── API pública de configuração ────────────────────────────────────────────────

/**
 * Atualiza a configuração do logger em tempo de execução.
 * Chamado pelo initLogger() com os dados do storage.
 */
export function configureLogger(options: Partial<LoggerState>): void {
  if (options.enabled !== undefined) state.enabled = options.enabled;
  if (options.level !== undefined) state.level = options.level;
}

/**
 * Inicializa o logger lendo as configurações do chrome.storage.
 * Deve ser chamado uma vez no bootstrap de cada contexto (background, content, popup).
 * Se `chrome` não estiver disponível (ex.: testes unitários), usa os padrões.
 */
export async function initLogger(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage) {
    initializing = false;
    flushBuffer();
    return;
  }

  const SETTINGS_KEY = "fill_all_settings";

  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    const settings = result[SETTINGS_KEY] as
      | { debugLog?: boolean; logLevel?: LogLevel }
      | undefined;

    if (settings) {
      const enabled = settings.debugLog ?? false;
      configureLogger({
        enabled,
        // Se debugLog ligado mas logLevel não salvo, assume "debug" — caso contrário "warn"
        level: settings.logLevel ?? (enabled ? "debug" : "warn"),
      });
    }
  } catch {
    // Silently ignore — logger stays with defaults.
  }

  // Libera a fila de mensagens acumuladas antes do init terminar.
  initializing = false;
  flushBuffer();

  // Atualiza em tempo real quando as configurações mudarem.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[SETTINGS_KEY]) return;
    const newSettings = changes[SETTINGS_KEY].newValue as
      | { debugLog?: boolean; logLevel?: LogLevel }
      | undefined;
    if (!newSettings) return;
    const enabled = newSettings.debugLog ?? false;
    configureLogger({
      enabled,
      level: newSettings.logLevel ?? (enabled ? "debug" : "warn"),
    });
  });
}

// ── Interface do logger criado por namespace ───────────────────────────────────

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  /** Imprime um cabeçalho de seção no lugar de um group. */
  group(label: string): void;
  groupCollapsed(label: string): void;
  groupEnd(): void;
}

/**
 * Cria um logger com namespace específico.
 * O prefixo `[FillAll/<namespace>]` é adicionado automaticamente.
 *
 * @example
 *   const log = createLogger('TFClassifier');
 *   log.debug('modelo carregado');  // [FillAll/TFClassifier] modelo carregado
 */
export function createLogger(namespace: string): Logger {
  const prefix = formatPrefix(namespace);

  return {
    debug(...args: unknown[]) {
      emit("debug", prefix, args);
    },
    info(...args: unknown[]) {
      emit("info", prefix, args);
    },
    warn(...args: unknown[]) {
      emit("warn", prefix, args);
    },
    error(...args: unknown[]) {
      emit("error", prefix, args);
    },
    groupCollapsed(label: string) {
      emit("group", `${prefix} ── ${label} ──`, []);
    },
    group(label: string) {
      emit("group", `${prefix} ── ${label} ──`, []);
    },
    groupEnd() {
      // no-op: sem group, não há nada para fechar
    },
  };
}
