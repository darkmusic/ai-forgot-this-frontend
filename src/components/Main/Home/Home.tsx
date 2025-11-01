import { useState } from "react";
import { Tag } from "../../../constants/data/data.ts";
import UserProfileWidget from "../Shared/UserProfileWidget.tsx";
import SearchAndFilterWidget from "../Shared/SearchAndFilterWidget.tsx";
import DeckInfoTable from "../Shared/DeckInfoTable.tsx";
import SrsStatsWidget from "../Shared/SrsStatsWidget.tsx";
import { FilterDecks } from "../../Shared/DeckUtility.ts";
import { useCurrentUser } from "../../Shared/Authentication.ts";

const Home = () => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [searchText, setSearchText] = useState("");
  const user = useCurrentUser();

  if (!user) {
    return <div>Loading user profile...</div>;
  }
  const filteredDecks = FilterDecks(user.decks || [], selectedTags, searchText);

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
      />
      <br />
      <DeckInfoTable decks={filteredDecks} />
    </div>
  );
};

export default Home;
