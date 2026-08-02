import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import SearchAndFilterWidget from "../Shared/SearchAndFilterWidget.tsx";
import { Card, Deck, DeckTtsSettings, Tag, TtsPreset } from "../../../constants/data/data.ts";
import { ChangeEvent, FormEvent, useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import HomeWidget from "../Shared/HomeWidget.tsx";
import { FilterCards } from "../../Shared/CardUtility.ts";
import TagWidget, { TagMatchMode } from "../Shared/TagWidget.tsx";
import { useCurrentUser } from "../../Shared/Authentication.ts";
import { deleteOk, getJson, postJson, putJson } from "../../../lib/api";
import Markdown from "../../Shared/Markdown.tsx";
import { PrepareCardMarkdown } from "../../Shared/CardUtility.ts";

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
                <Markdown>
                  {PrepareCardMarkdown(deck.templateFront, c.front)}
                </Markdown>
              </div>
            </td>
            <td className={"edit-td-data"}>
              <div className="deck-card-markdown">
                <Markdown>
                  {PrepareCardMarkdown(deck.templateBack, c.back)}
                </Markdown>
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
  });
  const [ttsSettings, setTtsSettings] = useState<DeckTtsSettings>({
    ttsEnabled: false,
    ttsModelId: "",
    ttsDefaultPresetId: null,
    presets: [],
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
      });
      setSelectedDeckTags(deck.tags || []);
    }
  }, [deck]);

  useEffect(() => {
    if (!deck?.id) {
      setTtsSettings({
        ttsEnabled: deck?.ttsEnabled || false,
        ttsModelId: deck?.ttsModelId || "",
        ttsDefaultPresetId: deck?.ttsDefaultPresetId || null,
        presets: [],
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
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const checked = e.target instanceof HTMLInputElement ? e.target.checked : false;
    const nextValue =
      name === "ttsEnabled"
        ? checked
        : name === "ttsDefaultPresetId"
          ? value ? Number(value) : null
          : value || null;
    setTtsSettings((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const updatePreset = (
    index: number,
    field: keyof TtsPreset,
    value: string
  ) => {
    setTtsSettings((prev) => ({
      ...prev,
      presets: prev.presets.map((preset, i) =>
        i === index ? { ...preset, [field]: value } : preset
      ),
    }));
  };

  const addPreset = () => {
    setTtsSettings((prev) => ({
      ...prev,
      presets: [
        ...prev.presets,
        {
          id: null,
          name: `Preset ${prev.presets.length + 1}`,
          speaker: "",
          language: "",
          caption: "",
          advancedConfigJson: "",
          sortOrder: prev.presets.length,
        },
      ],
    }));
  };

  const removePreset = (index: number) => {
    setTtsSettings((prev) => {
      const removed = prev.presets[index];
      const presets = prev.presets
        .filter((_, i) => i !== index)
        .map((preset, sortOrder) => ({ ...preset, sortOrder }));
      return {
        ...prev,
        presets,
        ttsDefaultPresetId:
          removed?.id != null && removed.id === prev.ttsDefaultPresetId
            ? presets[0]?.id ?? null
            : prev.ttsDefaultPresetId,
      };
    });
  };

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
      ttsEnabled: ttsSettings.ttsEnabled,
      ttsModelId: ttsSettings.ttsModelId || null,
      ttsDefaultPresetId: ttsSettings.ttsDefaultPresetId || null,
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
              <td className={"edit-td-header"}>Template Front:</td>
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
              <td className={"edit-td-header"}>Template Back:</td>
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
                  <td className={"edit-td-header"}>Default Preset:</td>
                  <td className={"edit-td-data"}>
                    <select
                      name="ttsDefaultPresetId"
                      value={ttsSettings.ttsDefaultPresetId ?? ""}
                      onChange={handleTtsSettingChange}
                    >
                      <option value="">First preset</option>
                      {ttsSettings.presets
                        .filter((preset) => preset.id != null)
                        .map((preset) => (
                          <option key={preset.id} value={preset.id ?? ""}>
                            {preset.name}
                          </option>
                        ))}
                    </select>
                  </td>
                </tr>
                <tr>
                  <td className={"edit-td-header-top"}>TTS Presets:</td>
                  <td className={"edit-td-data"}>
                    <table className="table tts-presets-table">
                      <thead>
                        <tr>
                          <td className="table-column-header">Name</td>
                          <td className="table-column-header">Speaker</td>
                          <td className="table-column-header">Language</td>
                          <td className="table-column-header">Caption</td>
                          <td className="table-column-header">Advanced JSON</td>
                          <td className="table-column-header">Actions</td>
                        </tr>
                      </thead>
                      <tbody>
                        {ttsSettings.presets.map((preset, index) => (
                          <tr key={preset.id ?? index}>
                            <td>
                              <input
                                value={preset.name}
                                onChange={(e) => updatePreset(index, "name", e.target.value)}
                                size={14}
                              />
                            </td>
                            <td>
                              <input
                                value={preset.speaker || ""}
                                onChange={(e) => updatePreset(index, "speaker", e.target.value)}
                                size={12}
                              />
                            </td>
                            <td>
                              <input
                                value={preset.language || ""}
                                onChange={(e) => updatePreset(index, "language", e.target.value)}
                                size={10}
                              />
                            </td>
                            <td>
                              <textarea
                                value={preset.caption || ""}
                                onChange={(e) => updatePreset(index, "caption", e.target.value)}
                                rows={3}
                                cols={28}
                              />
                            </td>
                            <td>
                              <textarea
                                value={preset.advancedConfigJson || ""}
                                onChange={(e) => updatePreset(index, "advancedConfigJson", e.target.value)}
                                rows={3}
                                cols={24}
                              />
                            </td>
                            <td>
                              <button type="button" onClick={() => removePreset(index)}>
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button type="button" onClick={addPreset}>
                      Add Preset
                    </button>
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
