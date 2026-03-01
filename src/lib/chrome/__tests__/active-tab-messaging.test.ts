import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendToActiveTab,
  sendToSpecificTab,
  sendToTabWithInjection,
} from "@/lib/chrome/active-tab-messaging";
import type { ExtensionMessage } from "@/types";

const message: ExtensionMessage = {
  type: "FILL_ALL_FIELDS",
};

describe("active-tab-messaging", () => {
  const mockQuery = chrome.tabs.query as ReturnType<typeof vi.fn>;
  const mockSendMessage = chrome.tabs.sendMessage as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockResolvedValue([]);
    mockSendMessage.mockResolvedValue({ ok: true });

    (
      chrome.runtime as typeof chrome.runtime & {
        getManifest: ReturnType<typeof vi.fn>;
      }
    ).getManifest = vi.fn().mockReturnValue({
      content_scripts: [{ js: ["content-script.js"] }],
    });

    (
      chrome as unknown as {
        scripting: { executeScript: ReturnType<typeof vi.fn> };
      }
    ).scripting = {
      executeScript: vi.fn().mockResolvedValue([]),
    };
  });

  it("retorna erro para URL não suportada", async () => {
    // Arrange
    const tabUrl = "chrome://extensions";

    // Act
    const result = await sendToSpecificTab(10, tabUrl, message);

    // Assert
    expect(result).toEqual({
      error: "Content script not available on this page",
    });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it("envia mensagem para tab específica quando URL é http/https", async () => {
    // Arrange
    mockSendMessage.mockResolvedValue({ status: "ok" });

    // Act
    const result = await sendToSpecificTab(10, "https://example.com", message);

    // Assert
    expect(mockSendMessage).toHaveBeenCalledWith(10, message);
    expect(result).toEqual({ status: "ok" });
  });

  it("faz auto-injeção quando primeiro envio falha", async () => {
    // Arrange
    const scripting = (
      chrome as unknown as {
        scripting: { executeScript: ReturnType<typeof vi.fn> };
      }
    ).scripting;
    mockSendMessage
      .mockRejectedValueOnce(new Error("not ready"))
      .mockResolvedValueOnce({ recovered: true });

    // Act
    const result = await sendToTabWithInjection(
      22,
      "https://example.com",
      message,
    );

    // Assert
    expect(scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 22 },
      files: ["content-script.js"],
    });
    expect(result).toEqual({ recovered: true });
  });

  it("retorna erro quando não há tab ativa", async () => {
    // Arrange
    mockQuery.mockResolvedValue([
      { id: undefined, url: "https://example.com" },
    ]);

    // Act
    const result = await sendToActiveTab(message);

    // Assert
    expect(result).toEqual({ error: "No active tab" });
  });

  it("retorna erro de injeção quando manifest não define content script", async () => {
    // Arrange
    mockQuery.mockResolvedValue([{ id: 50, url: "https://example.com" }]);
    mockSendMessage.mockRejectedValue(new Error("first try failed"));
    (
      chrome.runtime as typeof chrome.runtime & {
        getManifest: ReturnType<typeof vi.fn>;
      }
    ).getManifest = vi.fn().mockReturnValue({ content_scripts: [{ js: [] }] });

    // Act
    const result = await sendToActiveTab(message, { injectIfNeeded: true });

    // Assert
    expect(result).toMatchObject({
      error: "Content script not responding",
    });
  });
});
