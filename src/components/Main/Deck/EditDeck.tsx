import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import SearchAndFilterWidget from "../Shared/SearchAndFilterWidget.tsx";
import { Card, Deck, DeckTtsSettings, Tag } from "../../../constants/data/data.ts";
import { ChangeEvent, FormEvent, useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HomeWidget from "../Shared/HomeWidget.tsx";
import { FilterCards } from "../../Shared/CardUtility.ts";
import TagWidget, { TagMatchMode } from "../Shared/TagWidget.tsx";
import { useCurrentUser } from "../../Shared/Authentication.ts";
import { deleteOk, getJson, postJson, putJson } from "../../../lib/api";
import Markdown from "../../Shared/Markdown.tsx";

const DEFAULT_TTS_CONFIG = `{
  "provider": "indic-parler-tts",
  "targets": {
    "word": { "enabled": true, "displaySide": "FRONT" },
    "example": { "enabled": true, "displaySide": "BACK" }
  },
  "variants": {
    "hindi": {
      "language": "hi",
      "textSource": "devanagari",
      "caption": "",
      "speaker": "",
      "generationConfig": {}
    },
    "urdu": {
      "language": "ur",
      "textSource": "urduScript",
      "caption": "",
      "speaker": "",
      "generationConfig": {}
    }
  },
  "defaultVariant": "hindi",
  "showVariantControls": "both"
}`;

const PRESENTATION_CONFIG_PLACEHOLDER = `{
  "scriptStyles": {
    "Arab": {
      "fontFamily": "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Naskh Arabic', serif",
      "lineHeight": "2",
      "direction": "rtl"
    },
    "Deva": {
      "fontFamily": "'Noto Sans Devanagari', 'Nirmala UI', sans-serif"
    },
    "Jpan": {
      "fontFamily": "'Noto Sans JP', 'Yu Gothic', 'Hiragino Sans', sans-serif"
    }
  }
}`;

const CardTable = (p: { cards: Card[]; deck: Deck }) => {
  const { cards, deck } = p;
  const navigate = useNavigate();
  return (
    <table className="table deck-cards-table">
      <thead>
        <tr>
          <td className={"table-column-header"}>Front</td>
          <td className={"table-column-header"}>Back</td>
          <td className={"table-column-header"}>Tags</td>
          {cards !== null && <td className={"table-column-header"}>Actions</td>}
        </tr>
      </thead>
      <tbody>
        <tr key={"<new>"}>
          <td className={"edit-td-data"}>
            <a
              className={"link-pointer"}
              onClick={() =>
                navigate("/card/edit", { state: { deck, card: null } })
              }
            >
              {"<new>"}
            </a>
          </td>
          <td className={"edit-td-data"}>
            <a
              className={"link-pointer"}
              onClick={() =>
                navigate("/card/edit", { state: { deck, card: null } })
              }
            >
              {"<new>"}
            </a>
          </td>
          <td className={"edit-td-data"}>
            <a
              className={"link-pointer"}
              onClick={() =>
                navigate("/card/edit", { state: { deck, card: null } })
              }
            >
              {"<new>"}
            </a>
          </td>
          <td className={"edit-td-data"}>
            <a
              className={"link-pointer"}
              onClick={() =>
                navigate("/card/edit", { state: { deck, card: null } })
              }
            >
              Create
            </a>
          </td>
        </tr>
        {cards?.map((c: Card, idx: number) => (
          <tr key={c.id ?? `${c.front}-${c.back}-${idx}`}>
            <td className={"edit-td-data"}>
              <div className="deck-card-markdown">
                <Markdown deck={deck} side="FRONT">{c.front}</Markdown>
              </div>
            </td>
            <td className={"edit-td-data"}>
              <div className="deck-card-markdown">
                <Markdown deck={deck} side="BACK">{c.back}</Markdown>
              </div>
            </td>
            <td className={"edit-td-data"}>
              {c.tags && c.tags.length > 0 ? (
                <div className="tag-cloud-items deck-card-tags">
                  {c.tags
                    .filter((t) => t?.name)
                    .map((t) => (
                      <span key={t.id ?? t.name} className="tag-cloud-item">
                        <span className="tag-cloud-name">#{t.name}</span>
                      </span>
                    ))}
                </div>
              ) : (
                ""
              )}
            </td>
            <td className={"edit-td-data"}>
              <a
                className={"link-pointer"}
                onClick={() =>
                  navigate("/card/view", { state: { deck, card: c } })
                }
              >
                View
              </a>{" "}
              |
              <a
                className={"link-pointer"}
                onClick={() =>
                  navigate("/card/edit", { state: { deck, card: c } })
                }
              >
                Edit
              </a>{" "}
              |
              <a
                className={"link-pointer"}
                onClick={() =>
                  navigate("/card/delete", { state: { deck, card: c } })
                }
              >
                Delete
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const EditDeck = () => {
  const [selectedCardTags, setSelectedCardTags] = useState<Tag[]>([]);
  const [cardTagMatchMode, setCardTagMatchMode] = useState<TagMatchMode>("AND");
  const [selectedDeckTags, setSelectedDeckTags] = useState<Tag[]>([]);
  const [searchText, setSearchText] = useState("");
  const { state } = useLocation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [canceling, setCanceling] = useState(false);
  const cancelRoute = () => {
    setCanceling(true);
    const path = "/home";
    navigate(path);
  };
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    deckName: "",
    deckDescription: "",
    deckTags: [] as Tag[],
    templateFront: "",
    templateBack: "",
    alwaysAppliedTemplateFront: "",
    alwaysAppliedTemplateBack: "",
    presentationConfigJson: "",
  });
  const [ttsSettings, setTtsSettings] = useState<DeckTtsSettings>({
    ttsEnabled: false,
    ttsModelId: "",
    ttsConfigJson: DEFAULT_TTS_CONFIG,
  });

  // Get deck from state or create a new one if null
  const deck: Deck = useMemo(
    (): Deck =>
      state?.deck || {
        id: 0,
        name: "New Deck",
        description: "",
        cards: [],
        tags: [],
        user: user,
        templateFront: "",
        templateBack: "",
        alwaysAppliedTemplateFront: "",
        alwaysAppliedTemplateBack: "",
      },
    [state, user]
  );

  // Initialize form data when deck is available
  useEffect(() => {
    if (deck) {
      setFormData({
        deckName: deck.name || "",
        deckDescription: deck.description || "",
        deckTags: deck.tags || [],
        templateFront: deck.templateFront || "",
        templateBack: deck.templateBack || "",
        alwaysAppliedTemplateFront: deck.alwaysAppliedTemplateFront || "",
        alwaysAppliedTemplateBack: deck.alwaysAppliedTemplateBack || "",
        presentationConfigJson: deck.presentationConfigJson || "",
      });
      setSelectedDeckTags(deck.tags || []);
    }
  }, [deck]);

  useEffect(() => {
    if (!deck?.id) {
      setTtsSettings({
        ttsEnabled: deck?.ttsEnabled || false,
        ttsModelId: deck?.ttsModelId || "",
        ttsConfigJson: deck?.ttsConfigJson || DEFAULT_TTS_CONFIG,
      });
      return;
    }
    getJson<DeckTtsSettings>(`/api/deck/${deck.id}/tts`)
      .then(setTtsSettings)
      .catch((error) => {
        console.error("Failed to load deck TTS settings:", error);
      });
  }, [deck]);

  if (!user) {
    return <div>Loading...</div>;
  } else {
    // This isn't loaded by default, so we need to set it here
    deck.user = user;
  }

  const filteredCards = FilterCards(deck?.cards, selectedCardTags, searchText, cardTagMatchMode);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTtsSettingChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const checked = e.target instanceof HTMLInputElement ? e.target.checked : false;
    const nextValue = name === "ttsEnabled" ? checked : value || null;
    setTtsSettings((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const presentationConfigError = (() => {
    const value = formData.presentationConfigJson.trim();
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return "Presentation config must be a JSON object.";
      }
      const scriptStyles = (parsed as { scriptStyles?: unknown }).scriptStyles;
      if (
        scriptStyles !== undefined &&
        (scriptStyles === null ||
          typeof scriptStyles !== "object" ||
          Array.isArray(scriptStyles))
      ) {
        return "scriptStyles must be a JSON object.";
      }
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid JSON.";
    }
  })();

  const handleDelete = () => {
    setDeleting(true);
    if (deck === null) {
      setDeleting(false);
      return;
    }
    // Show confirmation message
    if (!confirm(`Are you sure you want to delete deck ${deck.id}?`)) {
      setDeleting(false);
      return;
    }

    deleteOk(`/api/deck/${deck.id}`).then((ok) => {
      if (ok) {
        setDeleting(false);
        navigate("/home");
      } else {
        setDeleting(false);
        alert("Failed to delete deck");
      }
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (deleting) return;
    if (canceling) return;

    if (user === null) {
      alert("User is not logged in");
      return;
    }

    // Validate deck data
    if (!formData.deckName) {
      alert("Deck name cannot be empty.");
      return;
    }

    // Build the deck object
    const deckData: Deck = {
      id: deck?.id || null,
      name: formData.deckName,
      description: formData.deckDescription,
      tags: selectedDeckTags,
      cards: deck?.cards || [],
      user: user,
      templateFront: formData.templateFront || "",
      templateBack: formData.templateBack || "",
      alwaysAppliedTemplateFront: formData.alwaysAppliedTemplateFront || "",
      alwaysAppliedTemplateBack: formData.alwaysAppliedTemplateBack || "",
      presentationConfigJson: formData.presentationConfigJson || null,
      ttsEnabled: ttsSettings.ttsEnabled,
      ttsModelId: ttsSettings.ttsModelId || null,
      ttsConfigJson: ttsSettings.ttsConfigJson || null,
    };

    // Send the deck object to the server
    const save =
      deck.id === 0
        ? postJson<Deck>(`/api/deck`, deckData)
        : putJson<Deck>(`/api/deck/${deck.id}`, deckData);
    save.then(async (savedDeck) => {
      if (savedDeck.id != null) {
        await putJson<DeckTtsSettings>(`/api/deck/${savedDeck.id}/tts`, ttsSettings);
      }
      if (deck.id === 0) {
        alert("Deck created successfully.");
        navigate("/home");
      } else {
        alert("Deck saved successfully.");
      }
    }).catch((error) => {
      console.error("Failed to save deck:", error);
      alert("Failed to save deck. Please try again.");
    });
  };

  return (
    <div>
      <UserProfileWidget user={user} />
      <HomeWidget />
      <h2>Ai Forgot These Cards!</h2>
      <br />
      <br />
      {deck.id === 0 ? <h3>Create Deck</h3> : <h3>Deck: {deck?.name}</h3>}
      <br />
      <form onSubmit={handleSubmit}>
        <table className={"table"}>
          <tbody>
            <tr>
              <td className={"edit-td-header"}>Deck Name:</td>
              <td className={"edit-td-data"}>
                <input
                  name={"deckName"}
                  onChange={handleChange}
                  value={formData.deckName}
                  size={50}
                />
              </td>
            </tr>
            <tr>
              <td className={"edit-td-header"}>Deck Description:</td>
              <td className={"edit-td-data"}>
                <input
                  name={"deckDescription"}
                  onChange={handleChange}
                  value={formData.deckDescription}
                  size={50}
                />
              </td>
            </tr>
            <tr>
              <td className={"edit-td-header"}>Template Front Default:</td>
              <td className={"edit-td-data"}>
                <textarea
                  name="templateFront"
                  onChange={handleChange}
                  value={formData.templateFront || ""}
                  rows={3}
                  cols={50}
                />
              </td>
            </tr>
            <tr>
              <td className={"edit-td-header"}>Template Back Default:</td>
              <td className={"edit-td-data"}>
                <textarea
                  name="templateBack"
                  onChange={handleChange}
                  value={formData.templateBack || ""}
                  rows={3}
                  cols={50}
                />
              </td>
            </tr>
            <tr>
              <td className={"edit-td-header"}>Always Applied Template Front:</td>
              <td className={"edit-td-data"}>
                <textarea
                  name="alwaysAppliedTemplateFront"
                  onChange={handleChange}
                  value={formData.alwaysAppliedTemplateFront || ""}
                  rows={3}
                  cols={50}
                />
              </td>
            </tr>
            <tr>
              <td className={"edit-td-header"}>Always Applied Template Back:</td>
              <td className={"edit-td-data"}>
                <textarea
                  name="alwaysAppliedTemplateBack"
                  onChange={handleChange}
                  value={formData.alwaysAppliedTemplateBack || ""}
                  rows={3}
                  cols={50}
                />
              </td>
            </tr>
            <tr>
              <td className={"edit-td-header"}>Deck Tags:</td>
              <td className={"edit-td-data"}>
                <TagWidget
                  onTagsChange={setSelectedDeckTags}
                  selectedTags={selectedDeckTags}
                  initialTags={formData.deckTags}
                  allowCreation={true}
                  suggestionScope="decks"
                  resultCount={selectedDeckTags.length}
                  resultCountLabel="Tags"
                />
              </td>
            </tr>
            <tr>
              <td className={"edit-td-header-top"}>Presentation Config JSON:</td>
              <td className={"edit-td-data"}>
                <textarea
                  name="presentationConfigJson"
                  onChange={handleChange}
                  value={formData.presentationConfigJson}
                  rows={14}
                  cols={80}
                  spellCheck={false}
                  placeholder={PRESENTATION_CONFIG_PLACEHOLDER}
                />
                {presentationConfigError ? (
                  <div className="config-warning">
                    Invalid presentation config: {presentationConfigError}
                  </div>
                ) : null}
              </td>
            </tr>
            <tr>
              <td className={"edit-td-header"}>TTS Enabled:</td>
              <td className={"edit-td-data"}>
                <input
                  type="checkbox"
                  name="ttsEnabled"
                  checked={ttsSettings.ttsEnabled}
                  onChange={handleTtsSettingChange}
                />
              </td>
            </tr>
            {ttsSettings.ttsEnabled ? (
              <>
                <tr>
                  <td className={"edit-td-header"}>TTS Model:</td>
                  <td className={"edit-td-data"}>
                    <input
                      name="ttsModelId"
                      onChange={handleTtsSettingChange}
                      value={ttsSettings.ttsModelId || ""}
                      size={50}
                      placeholder="ai4bharat/indic-parler-tts"
                    />
                  </td>
                </tr>
                <tr>
                  <td className={"edit-td-header-top"}>TTS Config JSON:</td>
                  <td className={"edit-td-data"}>
                    <textarea
                      name="ttsConfigJson"
                      onChange={handleTtsSettingChange}
                      value={ttsSettings.ttsConfigJson || DEFAULT_TTS_CONFIG}
                      rows={24}
                      cols={80}
                      spellCheck={false}
                    />
                  </td>
                </tr>
              </>
            ) : null}
          </tbody>
        </table>
        <button type={"submit"}>{deck.id !== null ? "Save" : "Add"}</button>
        <button type={"button"} onClick={cancelRoute}>
          Cancel
        </button>
        {deck.id !== null && deck.id > 0 ? (
          <button type="button" onClick={handleDelete}>
            Delete Deck
          </button>
        ) : (
          ""
        )}
      </form>
      <br />
      <br />
      {deck.id !== null && deck.id > 0 && <h3>Cards</h3>}
      {deck.id !== null && deck.id > 0 && (
        <div className={"edit-card-filter"}>
          <SearchAndFilterWidget
            searchText={searchText}
            setSearchText={setSearchText}
            selectedTags={selectedCardTags}
            setSelectedTags={setSelectedCardTags}
            resultCount={filteredCards.length}
            tagMatchMode={cardTagMatchMode}
            setTagMatchMode={setCardTagMatchMode}
            tagSuggestionScope="cards"
          />
        </div>
      )}
      <br />

      {deck.id !== null && deck.id > 0 && (
        <CardTable cards={filteredCards} deck={deck} />
      )}
    </div>
  );
};

export default EditDeck;
