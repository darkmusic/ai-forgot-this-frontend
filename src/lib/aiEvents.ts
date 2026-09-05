/** Read POST SSE, including CRLF, comments, multiline data and split UTF-8 chunks. */
export async function readAiEvents<T>(response: Response, onResult: () => void): Promise<T> {
  if (!response.ok) {
    let detail = "";
    if (response.headers.get("content-type")?.includes("json")) {
      const error = await response.json().catch(() => null);
      detail = error?.detail || error?.message || "";
    }
    throw new Error(`AI request failed (HTTP ${response.status}). ${String(detail).slice(0, 500) || "Check your session and the server connection."}`);
  }
  if (!response.headers.get("content-type")?.includes("text/event-stream") || !response.body) {
    throw new Error("AI response stream is unavailable. Check your session and retry.");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const block = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        let event = "message";
        const data: string[] = [];
        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
        }
        if (event === "error") {
          const message = data.join("\n");
          let parsed: { message?: string } = {};
          try { parsed = JSON.parse(message); } catch { /* Support plain error events. */ }
          throw new Error(parsed.message || message || "The AI operation failed.");
        }
        if (event === "done") {
          onResult();
          try { return JSON.parse(data.join("\n")) as T; }
          catch { throw new Error("The AI returned an invalid response. No changes were applied."); }
        }
      }
      if (chunk.done) throw new Error("The AI connection ended before a complete response arrived. No changes were applied.");
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
