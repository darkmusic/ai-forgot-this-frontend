import '../../Dark.css'
import {useState} from "react";
import {DECKS, Tag} from "../../constants/data/data.ts";
import UserProfileWidget from "./UserProfileWidget.tsx";
import SearchAndFilterWidget from "./SearchAndFilterWidget.tsx";
import DeckInfoTable from "./DeckInfoTable.tsx";
import {FilterDecks} from "../../constants/data/DeckConstants.ts";

const Home = () => {
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [searchText, setSearchText] = useState('');
    const filteredDecks = FilterDecks(DECKS, selectedTags, searchText);

    return (
        <div>
            <UserProfileWidget />
            <h2>Ai Forgot These Cards!</h2>
            <br/>
            <br/>
            <h3>Decks</h3>
            <SearchAndFilterWidget searchText={searchText} setSearchText={setSearchText} selectedTags={selectedTags} setSelectedTags={setSelectedTags}/>
            <br/>
            <DeckInfoTable decks={filteredDecks}/>
        </div>
    );
}

export default Home;