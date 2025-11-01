import TagWidget from "./TagWidget.tsx";
import { Dispatch, SetStateAction } from "react";
import { Tag } from "../../../constants/data/data.ts";

export interface SearchAndFilterProps {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
  selectedTags: Tag[];
  setSelectedTags: Dispatch<SetStateAction<Tag[]>>;
}

const SearchAndFilterWidget = (props: SearchAndFilterProps) => {
  const { searchText, setSearchText, setSelectedTags } = props;
  return (
    <table className={"table"}>
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
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </td>
          <td>
            <TagWidget
              onTagsChange={setSelectedTags}
              initialTags={[]}
              placeholderText="Type to search for tags to filter by..."
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default SearchAndFilterWidget;
