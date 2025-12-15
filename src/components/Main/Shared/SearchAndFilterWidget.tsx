import TagWidget from "./TagWidget.tsx";
import { Dispatch, SetStateAction } from "react";
import { Tag } from "../../../constants/data/data.ts";

export interface SearchAndFilterProps {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  selectedTags: Tag[];
  setSelectedTags: Dispatch<SetStateAction<Tag[]>>;
  availableTags?: Tag[];
  allowTagCreation?: boolean;
  tagPlaceholderText?: string;
}

const SearchAndFilterWidget = (props: SearchAndFilterProps) => {
  const {
    searchText,
    setSearchText,
    selectedTags,
    setSelectedTags,
    availableTags,
    allowTagCreation = true,
    tagPlaceholderText = "Type to search for tags to filter by...",
  } = props;
  return (
    <table className={"table search-and-filter-widget"}>
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
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default SearchAndFilterWidget;
