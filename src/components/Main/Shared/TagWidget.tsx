import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Tag } from "../../../constants/data/data.ts";
import * as React from "react";
import { getJson, postJson } from '../../../lib/api';

interface TagWidgetProps {
    onTagsChange?: Dispatch<SetStateAction<Tag[]>>;
    initialTags?: Tag[]; // Tags already associated with the item
    allowCreation?: boolean; // Flag to enable tag creation
    placeholderText?: string; // Placeholder text for the widget
}

const TagWidget = ({ onTagsChange, initialTags, allowCreation = true, placeholderText = 'Type to add or create tags...' }: TagWidgetProps) => {
    const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags || []);
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    const [fetchedTags, setFetchedTags] = useState<Tag[]>([]);
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const data = await getJson<Tag[]>(`/api/tag/all`);
                setFetchedTags(data);
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };

        fetchTags().then(_ => {});
    }, []);

    const createNewTag = async (tagName: string) => {
        try {
            const tag : Tag = {
                id: null,
                name: tagName,
            };
            try {
                const newTag = await postJson<Tag>(`/api/tag`, tag);
                setFetchedTags([...fetchedTags, newTag]);
                addTag(newTag);
            } catch (error) {
                console.error('Failed to create tag', error);
            }
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    };

    const handleSuggestionClick = (tag: Tag, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from reaching the document click handler
        addTag(tag);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);

        if (value.trim()) {
            // Check if this would be a new tag
            const exactMatch = fetchedTags.find(
                tag => tag.name.toLowerCase() === value.toLowerCase()
            );
            setIsCreatingTag(allowCreation && !exactMatch && value.trim().length > 0);

            // Filter for suggestions
            const filtered = fetchedTags.filter(tag =>
                tag.name.toLowerCase().includes(value.toLowerCase()) &&
                !selectedTags.some(selected => selected.id === tag.id)
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
            setIsCreatingTag(false);
        }
    };

    const addTag = (tag: Tag) => {
        if (!selectedTags.some(t => t.id === tag.id)) {
            const newTags = [...selectedTags, tag];
            setSelectedTags(newTags);
            onTagsChange?.(newTags);
            setInput('');
            setSuggestions([]);
            setIsCreatingTag(false);
            inputRef.current?.focus();
        }
    };

    const removeTag = (tagId: number | null) => {
        if (!tagId) return;
        const newTags = selectedTags.filter(tag => tag.id !== tagId);
        setSelectedTags(newTags);
        onTagsChange?.(newTags);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            if (isCreatingTag && input.trim()) {
                createNewTag(input.trim()).then(_ => {});
            } else if (suggestions.length > 0) {
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
                    placeholder={placeholderText}
                    className="tag-input"
                />
            </div>
            {(suggestions.length > 0 || isCreatingTag) && (
                <div className="tag-suggestions">
                    {isCreatingTag && (
                        <div className="tag-suggestion create-new">
                            Create new tag: <strong>#{input}</strong>
                        </div>
                    )}
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