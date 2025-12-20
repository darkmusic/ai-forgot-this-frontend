import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
  Dispatch,
  SetStateAction,
} from "react";
import { Tag } from "../../../constants/data/data.ts";
import * as React from "react";
import { getJson, postJson } from "../../../lib/api";

interface TagWidgetProps {
  onTagsChange?: Dispatch<SetStateAction<Tag[]>>;
  initialTags?: Tag[]; // Tags already associated with the item
  selectedTags?: Tag[]; // Optional: controlled tags from parent
  allowCreation?: boolean; // Flag to enable tag creation
  placeholderText?: string; // Placeholder text for the widget
  availableTags?: Tag[]; // Optional: restrict suggestions to a provided set of tags
  disabled?: boolean;
}

const TagWidget = ({
  onTagsChange,
  initialTags,
  selectedTags: controlledTags,
  allowCreation = true,
  placeholderText = "Type to add or create tags...",
  availableTags,
  disabled = false,
}: TagWidgetProps) => {
  const isControlled = controlledTags !== undefined;
  const [uncontrolledTags, setUncontrolledTags] = useState<Tag[]>(initialTags ?? []);
  const selectedTags = isControlled ? (controlledTags as Tag[]) : uncontrolledTags;
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [fetchedTags, setFetchedTags] = useState<Tag[]>([]);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizeTagName = (name: string) => name.trim().replace(/^#+/, "").replace(/\s+/g, " ").toLowerCase();

  const tagsEqual = (a: Tag, b: Tag) => {
    if (a.id != null && b.id != null) return a.id === b.id;
    return normalizeTagName(a.name) === normalizeTagName(b.name);
  };

  const allTags = availableTags ?? fetchedTags;

  useEffect(() => {
    if (availableTags) return;
    const fetchTags = async () => {
      try {
        const data = await getJson<Tag[]>(`/api/tag/all`);
        setFetchedTags(data);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    void fetchTags();
  }, [availableTags]);

  useEffect(() => {
    if (!disabled) return;
    setSuggestions([]);
    setIsCreatingTag(false);
  }, [disabled]);

  const createNewTag = async (tagName: string) => {
    try {
      const tag: Tag = {
        id: null,
        name: tagName,
      };
      try {
        const newTag = await postJson<Tag>(`/api/tag`, tag);
        setFetchedTags((prev) => [...prev, newTag]);
        addTag(newTag);
      } catch (error) {
        console.error("Failed to create tag", error);
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const handleSuggestionClick = (tag: Tag, e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation(); // Prevent event from reaching the document click handler
    addTag(tag);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const value = e.target.value;
    setInput(value);

    if (value.trim()) {
      // Check if this would be a new tag
      const exactMatch = allTags.find((tag) => normalizeTagName(tag.name) === normalizeTagName(value));
      setIsCreatingTag(allowCreation && !exactMatch && value.trim().length > 0);

      // Filter for suggestions
      const needle = normalizeTagName(value);
      const filtered = allTags.filter((tag) => {
        if (!normalizeTagName(tag.name).includes(needle)) return false;
        return !selectedTags.some((selected) => tagsEqual(selected, tag));
      });
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
      setIsCreatingTag(false);
    }
  };

  const addTag = (tag: Tag) => {
    if (disabled) return;
    if (!selectedTags.some((t) => tagsEqual(t, tag))) {
      const newTags = [...selectedTags, tag];
      if (!isControlled) setUncontrolledTags(newTags);
      onTagsChange?.(newTags);
      setInput("");
      setSuggestions([]);
      setIsCreatingTag(false);
      inputRef.current?.focus();
    }
  };

  const removeTag = (tagToRemove: Tag) => {
    if (disabled) return;
    const newTags = selectedTags.filter((tag) => !tagsEqual(tag, tagToRemove));
    if (!isControlled) setUncontrolledTags(newTags);
    onTagsChange?.(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "Enter") {
      e.preventDefault();

      if (isCreatingTag && input.trim()) {
        void createNewTag(input.trim());
      } else if (suggestions.length > 0) {
        addTag(suggestions[0]);
      }
    }
  };

  return (
    <div className="tag-widget">
      <div className="tag-input-container">
        {selectedTags.map((tag) => (
          <span key={tag.id ?? tag.name} className="tag-label">
            #{tag.name}
            <button className="tag-remove" onClick={() => removeTag(tag)} disabled={disabled}>
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          className="tag-input"
          disabled={disabled}
        />
      </div>
      {!disabled && (suggestions.length > 0 || isCreatingTag) && (
        <div className="tag-suggestions">
          {isCreatingTag && (
            <div
              className="tag-suggestion create-new"
              onClick={() => {
                if (!input.trim()) return;
                void createNewTag(input.trim());
              }}
            >
              Create new tag: <strong>#{input}</strong>
            </div>
          )}
          {suggestions.map((tag) => (
            <div
              key={tag.id ?? tag.name}
              className="tag-suggestion"
              onClick={(e) => handleSuggestionClick(tag, e)}
            >
              #{tag.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagWidget;
