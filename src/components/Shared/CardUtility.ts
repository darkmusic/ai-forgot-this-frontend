import { Card, Tag } from "../../constants/data/data.ts";
import { TagMatchMode } from "../Main/Shared/TagWidget.tsx";

const normalizeTagName = (name: string) =>
  name.trim().replace(/^#+/, "").replace(/\s+/g, " ").toLowerCase();

const tagsEqual = (a: Tag, b: Tag) => {
  if (a.id != null && b.id != null) return a.id === b.id;
  return normalizeTagName(a.name) === normalizeTagName(b.name);
};

export const FilterCards = (
  cards: Card[],
  selectedTags: Tag[],
  searchText: string,
  tagMatchMode: TagMatchMode = "AND"
) => {
  return cards
    ?.filter(
      (card) =>
        !searchText ||
        card.front.toLowerCase().includes(searchText.toLowerCase()) ||
        card.back.toLowerCase().includes(searchText.toLowerCase())
    )
    .filter(
      (card) =>
        selectedTags === null ||
        selectedTags.length === 0 ||
        (card.tags &&
          (tagMatchMode === "AND"
            ? selectedTags.every((selectedTag) =>
                card.tags?.some((cardTag) => tagsEqual(cardTag, selectedTag))
              )
            : selectedTags.some((selectedTag) =>
                card.tags?.some((cardTag) => tagsEqual(cardTag, selectedTag))
              )))
    );
};

export const PrepareCardMarkdown = (template: string, cardContent: string) => {
  return template.concat(" ", cardContent);
};
