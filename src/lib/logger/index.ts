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

// ── Funções internas ───────────────────────────────────────────────────────────

function shouldLog(level: LogLevel): boolean {
  return state.enabled && LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[state.level];
}

function formatPrefix(namespace: string): string {
  return `[FillAll/${namespace}]`;
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
  if (typeof chrome === "undefined" || !chrome.storage) return;

  const SETTINGS_KEY = "fill_all_settings";

  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    const settings = result[SETTINGS_KEY] as
      | { debugLog?: boolean; logLevel?: LogLevel }
      | undefined;

    if (settings) {
      configureLogger({
        enabled: settings.debugLog ?? false,
        level: settings.logLevel ?? "warn",
      });
    }
  } catch {
    // Silently ignore — logger stays with defaults.
  }

  // Atualiza em tempo real quando as configurações mudarem.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[SETTINGS_KEY]) return;
    const newSettings = changes[SETTINGS_KEY].newValue as
      | { debugLog?: boolean; logLevel?: LogLevel }
      | undefined;
    if (!newSettings) return;
    configureLogger({
      enabled: newSettings.debugLog ?? false,
      level: newSettings.logLevel ?? "warn",
    });
  });
}

// ── Interface do logger criado por namespace ───────────────────────────────────

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  /** Abre um grupo colapsado — só executa se o nível debug estiver ativo. */
  groupCollapsed(label: string): void;
  /** Abre um grupo expandido — só executa se o nível debug estiver ativo. */
  group(label: string): void;
  /** Fecha o grupo atual. */
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
      if (shouldLog("debug")) console.debug(prefix, ...args);
    },
    info(...args: unknown[]) {
      if (shouldLog("info")) console.info(prefix, ...args);
    },
    warn(...args: unknown[]) {
      if (shouldLog("warn")) console.warn(prefix, ...args);
    },
    error(...args: unknown[]) {
      if (shouldLog("error")) console.error(prefix, ...args);
    },
    groupCollapsed(label: string) {
      if (shouldLog("debug")) console.groupCollapsed(`${prefix} ${label}`);
    },
    group(label: string) {
      if (shouldLog("debug")) console.group(`${prefix} ${label}`);
    },
    groupEnd() {
      if (shouldLog("debug")) console.groupEnd();
    },
  };
}
