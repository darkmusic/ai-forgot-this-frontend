import { Tag } from "../../../constants/data/data.ts";

export type TagCloudEntry = {
  tag: Tag;
  count: number;
};

interface TagCloudProps {
  entries: TagCloudEntry[];
  selectedTagIds?: number[];
  onTagToggle?: (tag: Tag) => void;
  minFontSizeRem?: number;
  maxFontSizeRem?: number;
  maxEntries?: number;
  title?: string;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const TagCloud = ({
  entries,
  selectedTagIds = [],
  onTagToggle,
  minFontSizeRem = 0.85,
  maxFontSizeRem = 1.6,
  maxEntries,
  title = "Tag cloud",
}: TagCloudProps) => {
  const safeEntries = entries
    .filter((e) => e.tag.id != null)
    .slice(0, maxEntries ?? entries.length);

  if (safeEntries.length === 0) return null;

  const counts = safeEntries.map((e) => e.count);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  const denom = Math.max(1, maxCount - minCount);

  const selected = new Set<number>(selectedTagIds);

  return (
    <div className="tag-cloud" aria-label={title}>
      <div className="tag-cloud-title">{title}</div>
      <div className="tag-cloud-items">
        {safeEntries.map((entry) => {
          const id = entry.tag.id;
          if (id == null) return null;

          const normalized = denom === 0 ? 0.5 : (entry.count - minCount) / denom;
          const size = minFontSizeRem + (maxFontSizeRem - minFontSizeRem) * clamp01(normalized);
          const isSelected = selected.has(id);

          return (
            <button
              key={id}
              type="button"
              className={isSelected ? "tag-cloud-item selected" : "tag-cloud-item"}
              style={{ fontSize: `${size}rem` }}
              aria-pressed={isSelected}
              title={`#${entry.tag.name} (${entry.count} card${entry.count === 1 ? "" : "s"})`}
              onClick={() => onTagToggle?.(entry.tag)}
            >
              <span className="tag-cloud-name">#{entry.tag.name}</span>
              <span className="tag-cloud-count">{entry.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TagCloud;
