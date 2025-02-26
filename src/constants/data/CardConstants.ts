import {Card, Tag} from "./data.ts";

export const FilterCards = (cards: Card[], selectedTags: Tag[], searchText: string ) => {
    return cards?.filter(card =>
        !searchText ||
        card.front.toLowerCase().includes(searchText.toLowerCase()) ||
        card.back.toLowerCase().includes(searchText.toLowerCase())
    ).filter(card =>
            selectedTags.length === 0 ||
            card.tags && selectedTags.every(selectedTag =>
                card.tags?.some(cardTag => cardTag.id === selectedTag.id)
            )
    );
}
