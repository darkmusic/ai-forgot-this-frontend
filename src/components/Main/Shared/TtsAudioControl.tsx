import { MouseEvent, useState } from "react";
import { Card, Deck, TtsAudioResponse } from "../../../constants/data/data.ts";
import { apiFetch, apiUrl } from "../../../lib/api.ts";

type TtsSide = "FRONT" | "BACK";

const parseSseEvent = (rawEvent: string) => {
  let eventName = "message";
  const dataLines: string[] = [];
  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^ /, ""));
    }
  }
  return { eventName, data: dataLines.join("\n") };
};

const TtsAudioControl = (p: { card: Card; deck: Deck; side?: TtsSide }) => {
  const { card, deck, side = "BACK" } = p;
  const [audio, setAudio] = useState<TtsAudioResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displaySide = card.ttsDisplaySide || "BACK";
  const shouldShow =
    deck?.ttsEnabled &&
    card?.id != null &&
    Boolean(card.ttsText?.trim()) &&
    displaySide === side;

  if (!shouldShow) return null;

  const handleGenerate = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (audio || generating || card.id == null) return;

    setGenerating(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/tts/card/${card.id}/generate`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      if (!response.body) {
        throw new Error("TTS response body is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary = buffer.indexOf("\n\n");
          while (boundary !== -1) {
            const rawEvent = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const { eventName, data } = parseSseEvent(rawEvent);
            if (eventName === "done" && data) {
              setAudio(JSON.parse(data) as TtsAudioResponse);
              return;
            }
            if (eventName === "error" && data) {
              throw new Error(data);
            }
            boundary = buffer.indexOf("\n\n");
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      console.error("TTS generation failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="tts-audio-control" onClick={(e) => e.stopPropagation()}>
      {audio ? (
        <audio controls src={apiUrl(audio.audioUrl)} />
      ) : (
        <button type="button" onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating audio..." : "TTS"}
        </button>
      )}
      {error ? <span className="tts-error">{error}</span> : null}
    </div>
  );
};

export default TtsAudioControl;
