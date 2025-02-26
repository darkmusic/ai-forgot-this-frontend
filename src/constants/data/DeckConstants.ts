import {Deck, Tag} from "./data.ts";

export const FilterDecks = (decks: Deck[], selectedTags: Tag[], searchText: string) => {
    return decks.filter(deck => {
        // If no tags selected, include all decks
        if (selectedTags.length === 0) return true;

        // If deck has the special name "<new>", include it
        if (deck.name === '<new>') return true;

        // Check if deck has tags property and if it contains all selected tags
        return deck.tags && selectedTags.every(selectedTag =>
            deck.tags?.some(deckTag => deckTag.id === selectedTag.id)
        );
    }).filter(deck =>
        !searchText ||
        deck.name.toLowerCase().includes(searchText.toLowerCase()) ||
        deck.description.toLowerCase().includes(searchText.toLowerCase())
    );
}
