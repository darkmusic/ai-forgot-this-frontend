import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Tag } from "../../../constants/data/data.ts";
import * as React from "react";

interface TagWidgetProps {
    onTagsChange?: Dispatch<SetStateAction<Tag[]>>;
    initialTags?: Tag[]; // Tags already associated with the item
}

const TagWidget = ({ onTagsChange, initialTags }: TagWidgetProps) => {
    const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags || []);
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    const [fetchedTags, setFetchedTags] = useState<Tag[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch('/api/tag/all');
                if (response.ok) {
                    const data = await response.json();
                    setFetchedTags(data);
                } else {
                    console.error('Failed to fetch tags');
                }
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };

        fetchTags().then((value) => {
            setFetchedTags(value as unknown as Tag[]);
        });
    }, []);

    const handleSuggestionClick = (tag: Tag, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from reaching the document click handler
        addTag(tag);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        if (value.trim() && fetchedTags !== undefined) {
            const filtered = fetchedTags.filter(tag =>
                tag !== undefined &&
                tag.name.toLowerCase().includes(value.toLowerCase()) &&
                !selectedTags.some(selected => selected.id === tag.id) &&
                tag.id !== 0
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const addTag = (tag: Tag) => {
        if (!selectedTags.some(t => t.id === tag.id)) {
            const newTags = [...selectedTags, tag];
            setSelectedTags(newTags);
            onTagsChange?.(newTags);
            setInput('');
            setSuggestions([]); // Clear suggestions immediately
            inputRef.current?.focus();
        }
    };

    const removeTag = (tagId: number | null) => {
        if (!tagId || selectedTags == undefined) return;
        const newTags = selectedTags.filter(tag => tag !== undefined && tag.id !== tagId);
        setSelectedTags(newTags);
        onTagsChange?.(newTags);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            // Always prevent default form submission behavior
            e.preventDefault();

            // Only add tag if we have suggestions
            if (suggestions.length > 0) {
                addTag(suggestions[0]);
            }
        }
    };

    return (
        <div className="tag-widget">
            <div className="tag-input-container">
                {selectedTags.map(tag => (
                    <span key={tag.id} className="tag-label">
                        #{tag.name}
                        <button
                            className="tag-remove"
                            onClick={() => removeTag(tag.id)}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type to add tags..."
                    className="tag-input"
                />
            </div>
            {suggestions !== null && suggestions.length > 0 && (
                <div className="tag-suggestions">
                    {suggestions.map(tag => (
                        <div
                            key={tag.id}
                            className="tag-suggestion"
                            onClick={(e) => handleSuggestionClick(tag, e)}
                        >
                            #{tag.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TagWidget;