import { useState } from "react";
import { Tag } from "../../../constants/data/data.ts";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import SearchAndFilterWidget from "../Shared/SearchAndFilterWidget.tsx";
import DeckInfoTable from "../Shared/DeckInfoTable.tsx";
import SrsStatsWidget from "../Shared/SrsStatsWidget.tsx";
import { FilterDecks } from "../../Shared/DeckUtility.ts";
import { useCurrentUser } from "../../Shared/Authentication.ts";
import { TagMatchMode } from "../Shared/TagWidget.tsx";

const Home = () => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<TagMatchMode>("AND");
  const [searchText, setSearchText] = useState("");
  const user = useCurrentUser();

  const handleRefresh = () => {
    // Reload the page to refresh the user data and deck information
    window.location.reload();
  };

  if (!user) {
    return <div>Loading user profile...</div>;
  }
  const filteredDecks = FilterDecks(user.decks || [], selectedTags, searchText, tagMatchMode);

  return (
    <div>
      <UserProfileWidget user={user} />
      <h2>Ai Forgot These Cards!</h2>
      <br />
      <SrsStatsWidget />
      <br />
      <h3>Decks</h3>
      <SearchAndFilterWidget
        searchText={searchText}
        setSearchText={setSearchText}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        resultCount={filteredDecks.length}
        tagMatchMode={tagMatchMode}
        setTagMatchMode={setTagMatchMode}
      />
      <br />
      <DeckInfoTable decks={filteredDecks} onRefresh={handleRefresh} />
    </div>
  );
};

export default Home;
