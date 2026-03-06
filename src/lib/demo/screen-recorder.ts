/**
 * Screen Recorder — captures the active tab as WebM video via
 * `chrome.tabCapture` + `MediaRecorder`, fully client-side.
 *
 * Lifecycle:
 *   1. `startRecording(tabId)` → acquires a MediaStream, begins encoding.
 *   2. `stopRecording()` → finalises the recording, returns a Blob.
 *
 * All data stays local — no upload, no external API.
 */

import { createLogger } from "@/lib/logger";
import type { RecordingState, ScreenRecordOptions } from "./demo.types";
import { DEFAULT_SCREEN_RECORD_OPTIONS } from "./demo.types";

const log = createLogger("ScreenRecorder");

// ── Types ─────────────────────────────────────────────────────────────────

export interface ScreenRecorder {
  /** Current recording state */
  readonly state: RecordingState;
  /** Start capturing the given tab (background/extension page context required) */
  start(tabId: number, options?: Partial<ScreenRecordOptions>): Promise<void>;
  /**
   * Start recording from an already-obtained `chrome.tabCapture` stream ID.
   * Use this from DevTools panel pages which have access to `navigator.mediaDevices`
   * but cannot call `chrome.tabCapture.getMediaStreamId` on behalf of another tab.
   */
  startWithStreamId(
    streamId: string,
    options?: Partial<ScreenRecordOptions>,
  ): Promise<void>;
  /** Stop capturing and return the recorded Blob (WebM) */
  stop(): Promise<Blob>;
}

// ── Factory ───────────────────────────────────────────────────────────────

export function createScreenRecorder(): ScreenRecorder {
  let state: RecordingState = "inactive";
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];

  function mimeForCodec(codec: "vp8" | "vp9"): string {
    const candidate = `video/webm;codecs=${codec}`;
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(candidate)
    ) {
      return candidate;
    }
    return "video/webm";
  }

  async function acquireStream(
    tabId: number,
    opts: ScreenRecordOptions,
  ): Promise<MediaStream> {
    // chrome.tabCapture.getMediaStreamId requires an active tab
    const streamId = await new Promise<string>((resolve, reject) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(id);
        }
      });
    });

    const constraints: MediaStreamConstraints = {
      audio: opts.includeAudio
        ? ({
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId: streamId,
            },
          } as MediaTrackConstraints)
        : false,
      video: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      } as MediaTrackConstraints,
    };

    return navigator.mediaDevices.getUserMedia(constraints);
  }

  return {
    get state() {
      return state;
    },

    async start(tabId, optionsOverride) {
      if (state !== "inactive") {
        log.warn("Recording already active");
        return;
      }

      const opts: ScreenRecordOptions = {
        ...DEFAULT_SCREEN_RECORD_OPTIONS,
        ...optionsOverride,
      };

      try {
        stream = await acquireStream(tabId, opts);
        chunks = [];

        const mimeType = mimeForCodec(opts.codec);
        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: opts.videoBitrate,
        });

        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onerror = (e) => {
          log.error("MediaRecorder error:", e);
          state = "inactive";
        };

        recorder.start(1000); // 1 s timeslice for progressive encoding
        state = "recording";
        log.info(`Recording started (tab ${tabId}, codec=${opts.codec})`);
      } catch (err) {
        log.error("Failed to start recording:", err);
        state = "inactive";
        throw err;
      }
    },

    async startWithStreamId(streamId, optionsOverride) {
      if (state !== "inactive") {
        log.warn("Recording already active");
        return;
      }

      const opts: ScreenRecordOptions = {
        ...DEFAULT_SCREEN_RECORD_OPTIONS,
        ...optionsOverride,
      };

      const constraints: MediaStreamConstraints = {
        audio: opts.includeAudio
          ? ({
              mandatory: {
                chromeMediaSource: "tab",
                chromeMediaSourceId: streamId,
              },
            } as MediaTrackConstraints)
          : false,
        video: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: streamId,
          },
        } as MediaTrackConstraints,
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        chunks = [];

        const mimeType = mimeForCodec(opts.codec);
        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: opts.videoBitrate,
        });

        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onerror = (e) => {
          log.error("MediaRecorder error:", e);
          state = "inactive";
        };

        recorder.start(1000);
        state = "recording";
        log.info(`Recording started via streamId, codec=${opts.codec}`);
      } catch (err) {
        log.error("Failed to start recording from streamId:", err);
        state = "inactive";
        throw err;
      }
    },

    async stop() {
      if (state !== "recording" || !recorder || !stream) {
        return new Blob([], { type: "video/webm" });
      }

      state = "stopping";

      return new Promise<Blob>((resolve) => {
        recorder!.onstop = () => {
          const blob = new Blob(chunks, {
            type: recorder!.mimeType || "video/webm",
          });
          log.info(`Recording stopped — ${(blob.size / 1024).toFixed(1)} KB`);

          // Release tracks
          stream!.getTracks().forEach((t) => t.stop());
          stream = null;
          recorder = null;
          chunks = [];
          state = "inactive";

          resolve(blob);
        };

        recorder!.stop();
      });
    },
  };
}
