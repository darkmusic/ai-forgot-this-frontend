import TagWidget from "./TagWidget.tsx";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Tag } from "../../../constants/data/data.ts";
import { TagMatchMode } from "./TagWidget.tsx";

export interface SearchAndFilterProps {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  selectedTags: Tag[];
  setSelectedTags: Dispatch<SetStateAction<Tag[]>>;
  resultCount: number;
  resultCountLabel?: string;
  tagMatchMode?: TagMatchMode;
  setTagMatchMode?: Dispatch<SetStateAction<TagMatchMode>>;
  availableTags?: Tag[];
  allowTagCreation?: boolean;
  tagPlaceholderText?: string;
  disabled?: boolean;
}

const SearchAndFilterWidget = (props: SearchAndFilterProps) => {
  const {
    searchText,
    setSearchText,
    selectedTags,
    setSelectedTags,
    resultCount,
    resultCountLabel = "Results",
    tagMatchMode,
    setTagMatchMode,
    availableTags,
    allowTagCreation = true,
    tagPlaceholderText = "Type to search for tags to filter by...",
    disabled = false,
  } = props;

  // Keep local input state so typing a single character doesn't trigger expensive filtering.
  const [draftSearchText, setDraftSearchText] = useState(searchText);

  useEffect(() => {
    setDraftSearchText(searchText);
  }, [searchText]);

  const handleSearchChange = (nextValue: string) => {
    setDraftSearchText(nextValue);

    // Only propagate to the parent filter when:
    // - empty (clear filter)
    // - 2+ characters (meaningful search)
    // For 1 character, treat as "no filter" to avoid performance issues on large result sets.
    if (nextValue.length === 1) {
      setSearchText("");
      return;
    }

    setSearchText(nextValue);
  };

  return (
    <table className={"table search-and-filter-widget" + (disabled ? " is-disabled" : "")}>
      <thead>
        <tr>
          <td className="table-header">Search</td>
          <td className="table-header">Filter by tag(s)</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <input
              type="text"
              className="search-and-filter-search-input"
              value={draftSearchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={disabled}
            />
          </td>
          <td>
            <TagWidget
              onTagsChange={setSelectedTags}
              selectedTags={selectedTags}
              initialTags={[]}
              allowCreation={allowTagCreation}
              availableTags={availableTags}
              placeholderText={tagPlaceholderText}
              disabled={disabled}
              showMatchModeToggle={!!setTagMatchMode}
              matchMode={tagMatchMode}
              onMatchModeChange={setTagMatchMode}
              resultCount={resultCount}
              resultCountLabel={resultCountLabel}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default SearchAndFilterWidget;
