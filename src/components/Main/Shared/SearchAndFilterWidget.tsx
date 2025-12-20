import TagWidget from "./TagWidget.tsx";
import { Dispatch, SetStateAction } from "react";
import { Tag } from "../../../constants/data/data.ts";
import { TagMatchMode } from "./TagWidget.tsx";

export interface SearchAndFilterProps {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  selectedTags: Tag[];
  setSelectedTags: Dispatch<SetStateAction<Tag[]>>;
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
    tagMatchMode,
    setTagMatchMode,
    availableTags,
    allowTagCreation = true,
    tagPlaceholderText = "Type to search for tags to filter by...",
    disabled = false,
  } = props;
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
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
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
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default SearchAndFilterWidget;
