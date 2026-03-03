/**
 * AI Context Modal — lets the user provide additional context before
 * triggering a contextual AI fill:
 *  - Free-form text description
 *  - CSV file upload (read as text)
 *  - Image upload (stored as compressed JPEG data URL)
 *  - PDF file upload (pages rendered as images — the AI reads them visually)
 *  - Audio recording via Web Speech API (pt-BR → optional English translation)
 */

import type { AIContextPayload } from "@/types";
import { t } from "@/lib/i18n";
import { createLogger } from "@/lib/logger";
import { renderPdfToImageDataUrls } from "@/lib/ai/pdf-extractor";

const log = createLogger("AIContextModal");

// ── Web Speech API types ──────────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionCtor: (new () => SpeechRecognitionInstance) | undefined =
  (typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition)) ||
  undefined;

// ── Chrome AI Translator (optional) ──────────────────────────────────────────

async function tryTranslateToEnglish(text: string): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TranslatorAPI = (globalThis as any).Translator as
      | {
          create(opts: {
            sourceLanguage: string;
            targetLanguage: string;
          }): Promise<{ translate(text: string): Promise<string> }>;
        }
      | undefined;

    if (!TranslatorAPI) return text;

    const translator = await TranslatorAPI.create({
      sourceLanguage: "pt",
      targetLanguage: "en",
    });
    return await translator.translate(text);
  } catch (err) {
    log.warn("Translator API unavailable, using original transcript:", err);
    return text;
  }
}

// ── Modal DOM helpers ─────────────────────────────────────────────────────────

function removeModal(): void {
  document.getElementById("ai-context-modal-overlay")?.remove();
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Renders an AI context modal and resolves with the collected payload (or
 * `null` if the user dismissed / cancelled the modal).
 */
export function openAIContextModal(): Promise<AIContextPayload | null> {
  return new Promise((resolve) => {
    // Ensure only one modal at a time
    removeModal();

    // ── State ──────────────────────────────────────────────────────────────
    let audioTranscript = "";
    let csvText = "";
    let imageDataUrl = "";
    let pdfPageDataUrls: string[] = [];
    let isRecording = false;
    let recognition: SpeechRecognitionInstance | null = null;

    // ── Overlay ────────────────────────────────────────────────────────────
    const overlay = document.createElement("div");
    overlay.id = "ai-context-modal-overlay";
    overlay.className = "modal-overlay ai-context-modal-overlay";
    overlay.style.display = "flex";

    overlay.innerHTML = `
      <div class="modal-content ai-context-modal-content" role="dialog" aria-modal="true" aria-label="${t("aiContextModalTitle")}">
        <div class="modal-header">
          <h3>🤖 ${t("aiContextModalTitle")}</h3>
          <button class="modal-close" id="ai-ctx-close" title="${t("close")}">×</button>
        </div>

        <div class="modal-body ai-context-modal-body">
          <p class="ai-ctx-help">${t("aiContextModalHelp")}</p>

          <!-- Free-form text -->
          <div class="form-group">
            <label for="ai-ctx-text">${t("aiContextTextLabel")}</label>
            <textarea
              id="ai-ctx-text"
              class="ai-ctx-textarea"
              rows="3"
              placeholder="${t("aiContextTextPlaceholder")}"
            ></textarea>
          </div>

          <!-- Audio recording -->
          <div class="form-group ai-ctx-audio-group">
            <label>${t("aiContextAudioLabel")}</label>
            <div class="ai-ctx-audio-row">
              <button class="btn ai-ctx-record-btn" id="ai-ctx-record">
                🎙️ ${t("aiContextAudioRecord")}
              </button>
              <span class="ai-ctx-audio-status" id="ai-ctx-audio-status"></span>
            </div>
            <div class="ai-ctx-transcript-box" id="ai-ctx-transcript" style="display:none"></div>
          </div>

          <!-- CSV upload -->
          <div class="form-group">
            <label for="ai-ctx-csv">${t("aiContextCsvLabel")}</label>
            <div class="ai-ctx-upload-zone" id="ai-ctx-csv-zone">
              <input type="file" id="ai-ctx-csv" accept=".csv,text/csv" class="ai-ctx-file-input" />
              <span class="ai-ctx-upload-icon">📄</span>
              <span id="ai-ctx-csv-name">${t("aiContextCsvPlaceholder")}</span>
            </div>
          </div>

          <!-- Image upload -->
          <div class="form-group">
            <label for="ai-ctx-image">${t("aiContextImageLabel")}</label>
            <div class="ai-ctx-upload-zone" id="ai-ctx-image-zone">
              <input type="file" id="ai-ctx-image" accept="image/*" class="ai-ctx-file-input" />
              <span class="ai-ctx-upload-icon">🖼️</span>
              <span id="ai-ctx-image-name">${t("aiContextImagePlaceholder")}</span>
            </div>
            <div id="ai-ctx-image-preview" class="ai-ctx-image-preview" style="display:none"></div>
          </div>

          <!-- PDF upload -->
          <div class="form-group">
            <label for="ai-ctx-pdf">${t("aiContextPdfLabel")}</label>
            <div class="ai-ctx-upload-zone" id="ai-ctx-pdf-zone">
              <input type="file" id="ai-ctx-pdf" accept=".pdf,application/pdf" class="ai-ctx-file-input" />
              <span class="ai-ctx-upload-icon">📑</span>
              <span id="ai-ctx-pdf-name">${t("aiContextPdfPlaceholder")}</span>
            </div>
            <div id="ai-ctx-pdf-status" class="ai-ctx-audio-status" style="display:none"></div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="ai-ctx-cancel">${t("cancel")}</button>
          <button class="btn btn-primary" id="ai-ctx-confirm">🤖 ${t("aiContextConfirm")}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // ── Element refs ────────────────────────────────────────────────────────
    const closeBtn = overlay.querySelector<HTMLButtonElement>("#ai-ctx-close")!;
    const cancelBtn =
      overlay.querySelector<HTMLButtonElement>("#ai-ctx-cancel")!;
    const confirmBtn =
      overlay.querySelector<HTMLButtonElement>("#ai-ctx-confirm")!;
    const textArea =
      overlay.querySelector<HTMLTextAreaElement>("#ai-ctx-text")!;
    const recordBtn =
      overlay.querySelector<HTMLButtonElement>("#ai-ctx-record")!;
    const audioStatus = overlay.querySelector<HTMLSpanElement>(
      "#ai-ctx-audio-status",
    )!;
    const transcriptBox =
      overlay.querySelector<HTMLDivElement>("#ai-ctx-transcript")!;
    const csvInput = overlay.querySelector<HTMLInputElement>("#ai-ctx-csv")!;
    const csvName = overlay.querySelector<HTMLSpanElement>("#ai-ctx-csv-name")!;
    const csvZone = overlay.querySelector<HTMLDivElement>("#ai-ctx-csv-zone")!;
    const imageInput =
      overlay.querySelector<HTMLInputElement>("#ai-ctx-image")!;
    const imageName =
      overlay.querySelector<HTMLSpanElement>("#ai-ctx-image-name")!;
    const imageZone =
      overlay.querySelector<HTMLDivElement>("#ai-ctx-image-zone")!;
    const imagePreview = overlay.querySelector<HTMLDivElement>(
      "#ai-ctx-image-preview",
    )!;
    const pdfInput = overlay.querySelector<HTMLInputElement>("#ai-ctx-pdf")!;
    const pdfName = overlay.querySelector<HTMLSpanElement>("#ai-ctx-pdf-name")!;
    const pdfZone = overlay.querySelector<HTMLDivElement>("#ai-ctx-pdf-zone")!;
    const pdfStatus =
      overlay.querySelector<HTMLDivElement>("#ai-ctx-pdf-status")!;

    // ── Dismiss ─────────────────────────────────────────────────────────────
    const dismiss = (payload: AIContextPayload | null): void => {
      recognition?.abort();
      removeModal();
      resolve(payload);
    };

    closeBtn.addEventListener("click", () => dismiss(null));
    cancelBtn.addEventListener("click", () => dismiss(null));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) dismiss(null);
    });

    // ── Audio recording ──────────────────────────────────────────────────────
    if (!SpeechRecognitionCtor) {
      recordBtn.disabled = true;
      recordBtn.title = t("aiContextAudioUnsupported");
      audioStatus.textContent = t("aiContextAudioUnsupported");
    }

    recordBtn.addEventListener("click", () => {
      if (!SpeechRecognitionCtor) return;

      if (isRecording) {
        recognition?.stop();
        return;
      }

      recognition = new SpeechRecognitionCtor();
      recognition.lang = "pt-BR";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;
      isRecording = true;
      recordBtn.textContent = `⏹️ ${t("aiContextAudioStop")}`;
      recordBtn.classList.add("recording");
      audioStatus.textContent = t("aiContextAudioListening");

      let finalTranscript = "";
      let interimTranscript = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        interimTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript + " ";
          } else {
            interimTranscript += res[0].transcript;
          }
        }
        transcriptBox.style.display = "block";
        transcriptBox.textContent =
          (finalTranscript + interimTranscript).trim() || "…";
      };

      recognition.onerror = (event: Event) => {
        log.warn("Speech recognition error:", event);
        audioStatus.textContent = t("aiContextAudioError");
      };

      recognition.onend = () => {
        isRecording = false;
        recordBtn.textContent = `🎙️ ${t("aiContextAudioRecord")}`;
        recordBtn.classList.remove("recording");
        audioStatus.textContent = finalTranscript.trim()
          ? t("aiContextAudioDone")
          : t("aiContextAudioEmpty");

        void (async () => {
          const raw = finalTranscript.trim();
          if (!raw) return;
          audioStatus.textContent = t("aiContextAudioTranslating");
          const translated = await tryTranslateToEnglish(raw);
          audioTranscript = translated;
          transcriptBox.textContent = translated;
          audioStatus.textContent = t("aiContextAudioDone");
        })();
      };

      recognition.start();
    });

    // ── CSV upload ───────────────────────────────────────────────────────────
    csvZone.addEventListener("click", () => csvInput.click());

    csvInput.addEventListener("change", () => {
      const file = csvInput.files?.[0];
      if (!file) return;
      csvName.textContent = file.name;
      csvZone.classList.add("has-file");
      const reader = new FileReader();
      reader.onload = (e) => {
        csvText = (e.target?.result as string) ?? "";
      };
      reader.readAsText(file, "UTF-8");
    });

    // Drag-and-drop for CSV
    csvZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      csvZone.classList.add("drag-over");
    });
    csvZone.addEventListener("dragleave", () =>
      csvZone.classList.remove("drag-over"),
    );
    csvZone.addEventListener("drop", (e) => {
      e.preventDefault();
      csvZone.classList.remove("drag-over");
      const file = e.dataTransfer?.files[0];
      if (!file) return;
      csvName.textContent = file.name;
      csvZone.classList.add("has-file");
      const reader = new FileReader();
      reader.onload = (ev) => {
        csvText = (ev.target?.result as string) ?? "";
      };
      reader.readAsText(file, "UTF-8");
    });

    // ── Image upload ─────────────────────────────────────────────────────────
    imageZone.addEventListener("click", () => imageInput.click());

    /**
     * Compresses an image data URL to a JPEG with max side ≤ maxDimension.
     * Runs in the popup/devtools context where the Canvas API is available.
     */
    const compressImage = (
      dataUrl: string,
      maxDimension = 1024,
      quality = 0.7,
    ): Promise<string> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(
            1,
            maxDimension / Math.max(img.width, img.height),
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          log.debug(
            `Imagem comprimida: ${img.width}×${img.height} → ${canvas.width}×${canvas.height} ` +
              `(${(dataUrl.length / 1024).toFixed(0)}KB → ${(compressed.length / 1024).toFixed(0)}KB)`,
          );
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = dataUrl;
      });

    const handleImageFile = (file: File): void => {
      imageName.textContent = file.name;
      imageZone.classList.add("has-file");
      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = (e.target?.result as string) ?? "";
        void compressImage(raw).then((compressed) => {
          imageDataUrl = compressed;
          imagePreview.style.display = "block";
          imagePreview.innerHTML = `<img src="${imageDataUrl}" alt="Preview" class="ai-ctx-preview-img" />`;
        });
      };
      reader.readAsDataURL(file);
    };

    imageInput.addEventListener("change", () => {
      const file = imageInput.files?.[0];
      if (file) handleImageFile(file);
    });

    // Drag-and-drop for image
    imageZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      imageZone.classList.add("drag-over");
    });
    imageZone.addEventListener("dragleave", () =>
      imageZone.classList.remove("drag-over"),
    );
    imageZone.addEventListener("drop", (e) => {
      e.preventDefault();
      imageZone.classList.remove("drag-over");
      const file = e.dataTransfer?.files[0];
      if (!file || !file.type.startsWith("image/")) return;
      handleImageFile(file);
    });

    // ── PDF upload ───────────────────────────────────────────────────────────
    pdfZone.addEventListener("click", () => pdfInput.click());

    const handlePdfFile = (file: File): void => {
      if (!file || file.type !== "application/pdf") return;
      pdfName.textContent = file.name;
      pdfZone.classList.add("has-file");
      pdfStatus.style.display = "block";
      pdfStatus.textContent = t("aiContextPdfExtracting");

      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        log.debug(
          `PDF selecionado: ${file.name}, tamanho=${(buffer.byteLength / 1024).toFixed(1)}KB`,
        );
        void (async () => {
          try {
            // Renderiza as páginas como imagens — a IA lê o PDF visualmente.
            // Não extraímos texto: o modelo multimodal interpreta as imagens.
            const pageUrls = await renderPdfToImageDataUrls(buffer);
            pdfPageDataUrls = pageUrls;
            log.info(
              `PDF processado: ${pageUrls.length} página(s) enviada(s) à IA como imagem.`,
            );
            pdfStatus.textContent = t("aiContextPdfDone");
          } catch (err) {
            log.warn("Falha ao processar PDF:", err);
            pdfStatus.textContent = t("aiContextPdfError");
          }
        })();
      };
      reader.onerror = (e) => {
        log.warn("Erro ao ler arquivo PDF:", e);
        pdfStatus.textContent = t("aiContextPdfError");
      };
      reader.readAsArrayBuffer(file);
    };

    pdfInput.addEventListener("change", () => {
      const file = pdfInput.files?.[0];
      if (file) handlePdfFile(file);
    });

    pdfZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      pdfZone.classList.add("drag-over");
    });
    pdfZone.addEventListener("dragleave", () =>
      pdfZone.classList.remove("drag-over"),
    );
    pdfZone.addEventListener("drop", (e) => {
      e.preventDefault();
      pdfZone.classList.remove("drag-over");
      const file = e.dataTransfer?.files[0];
      if (file) handlePdfFile(file);
    });

    // ── Confirm ──────────────────────────────────────────────────────────────
    confirmBtn.addEventListener("click", () => {
      const text = textArea.value.trim();
      const payload: AIContextPayload = {};

      if (text) payload.text = text;
      if (audioTranscript) payload.audioTranscript = audioTranscript;
      if (csvText) payload.csvText = csvText;
      if (imageDataUrl) payload.imageDataUrl = imageDataUrl;
      if (pdfPageDataUrls.length > 0) payload.pdfPageDataUrls = pdfPageDataUrls;

      dismiss(payload);
    });

    // Trap focus on first input
    textArea.focus();
  });
}
