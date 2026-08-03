import { MouseEvent, useEffect, useMemo, useState } from "react";
import {
  Card,
  Deck,
  TtsAudioResponse,
  TtsPlaybackItem,
} from "../../../constants/data/data.ts";
import { apiFetch, apiUrl, getJson } from "../../../lib/api.ts";

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

const itemKey = (item: TtsPlaybackItem) => `${item.target}:${item.variant}`;

const TtsAudioControl = (p: {
  card: Card;
  deck: Deck;
  side?: TtsSide;
  textSource?: string;
  compact?: boolean;
  itemsOverride?: TtsPlaybackItem[];
}) => {
  const { card, deck, side = "BACK", textSource, compact = false, itemsOverride } = p;
  const [items, setItems] = useState<TtsPlaybackItem[]>([]);
  const [audioByItem, setAudioByItem] = useState<Record<string, TtsAudioResponse>>({});
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [statusByItem, setStatusByItem] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems([]);
    setAudioByItem({});
    setError(null);
    if (!deck?.ttsEnabled || card?.id == null) return;
    if (itemsOverride) {
      return;
    }

    getJson<TtsPlaybackItem[]>(`/api/tts/card/${card.id}/items`)
      .then((resolvedItems) => {
        if (cancelled) return;
        setItems(resolvedItems);
        setAudioByItem(cachedAudioFromItems(resolvedItems, card, deck));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load TTS items:", err);
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [card, card?.id, deck, deck?.id, deck?.ttsEnabled, itemsOverride]);

  const effectiveItems = itemsOverride ?? items;
  const effectiveAudioByItem = useMemo(
    () => ({
      ...(itemsOverride ? cachedAudioFromItems(itemsOverride, card, deck) : {}),
      ...audioByItem,
    }),
    [audioByItem, card, deck, itemsOverride]
  );

  const visibleItems = useMemo(
    () =>
      effectiveItems
        .filter((item) => (item.displaySide || "BACK") === side)
        .filter((item) => !textSource || item.textSource === textSource),
    [effectiveItems, side, textSource]
  );

  if (!deck?.ttsEnabled || card?.id == null || visibleItems.length === 0) return null;

  const handleGenerate = async (
    e: MouseEvent<HTMLButtonElement>,
    item: TtsPlaybackItem,
    force = false
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const key = itemKey(item);
    if ((!force && effectiveAudioByItem[key]) || generatingKey || card.id == null) return;

    setGeneratingKey(key);
    setStatusByItem((prev) => ({ ...prev, [key]: "Starting TTS request" }));
    setError(null);
    try {
      const params = new URLSearchParams({
        target: item.target,
        variant: item.variant,
      });
      if (force) {
        params.set("force", "true");
      }
      const response = await apiFetch(
        `/api/tts/card/${card.id}/generate?${params.toString()}`,
        { method: "POST" }
      );
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
            if (eventName === "status" && data) {
              setStatusByItem((prev) => ({ ...prev, [key]: data }));
            }
            if (eventName === "done" && data) {
              const audio = JSON.parse(data) as TtsAudioResponse;
              setAudioByItem((prev) => ({ ...prev, [key]: audio }));
              setStatusByItem((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
              });
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
      setGeneratingKey(null);
    }
  };

  return (
    <div
      className={["tts-audio-control", compact ? "tts-audio-control-inline" : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={(e) => e.stopPropagation()}
    >
      {visibleItems.map((item) => {
        const key = itemKey(item);
        const audio = effectiveAudioByItem[key];
        const status = statusByItem[key];
        return (
          <span className="tts-audio-item" key={key}>
            {audio ? (
              <>
                <audio
                  controls
                  src={`${apiUrl(audio.audioUrl)}?v=${audio.generatedAt || audio.id}`}
                  aria-label={item.label}
                />
                <button
                  type="button"
                  className="tts-regenerate-button"
                  onClick={(e) => handleGenerate(e, item, true)}
                  disabled={generatingKey != null}
                  aria-label={`Regenerate ${item.label}`}
                  title={`Regenerate ${item.label}`}
                >
                  <span aria-hidden="true">↻</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={(e) => handleGenerate(e, item)}
                disabled={generatingKey != null}
                title={item.text}
              >
                {generatingKey === key ? "Generating..." : "Generate"}
              </button>
            )}
            {generatingKey === key && status ? (
              <span className="tts-status">{status}</span>
            ) : null}
          </span>
        );
      })}
      {error ? <span className="tts-error">{error}</span> : null}
    </div>
  );
};

const cachedAudioFromItems = (items: TtsPlaybackItem[], card: Card, deck: Deck) => {
  const cachedAudio: Record<string, TtsAudioResponse> = {};
  for (const item of items) {
    if (item.audioId && item.audioUrl) {
      cachedAudio[itemKey(item)] = {
        id: item.audioId,
        cardId: card.id!,
        deckId: deck.id!,
        cacheKey: "",
        contentType: "audio/wav",
        generatedAt: 0,
        modelId: item.modelId || "",
        target: item.target,
        variant: item.variant,
        language: item.language,
        textSource: item.textSource,
        resolvedText: item.text,
        audioUrl: item.audioUrl,
        cached: true,
      };
    }
  }
  return cachedAudio;
};

export default TtsAudioControl;
