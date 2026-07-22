import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { RoomsFilter } from '../model/types';

type Props = {
  filter: RoomsFilter;
  onApply: (filter: RoomsFilter) => void;
};

type VisibilityOption = 'all' | 'public' | 'private';

function toVisibilityOption(isPrivate?: boolean): VisibilityOption {
  if (isPrivate === undefined) {
    return 'all';
  }

  return isPrivate ? 'private' : 'public';
}

function toIsPrivate(option: VisibilityOption): boolean | undefined {
  if (option === 'all') {
    return undefined;
  }

  return option === 'private';
}

function isActive(filter: RoomsFilter): boolean {
  return Boolean(filter.name) || filter.isPrivate !== undefined;
}

export function RoomsFilterBar({ filter, onApply }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(filter.name ?? '');
  const [visibility, setVisibility] = useState<VisibilityOption>(toVisibilityOption(filter.isPrivate));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply({ name: name.trim() || undefined, isPrivate: toIsPrivate(visibility) });
    setIsOpen(false);
  }

  function handleReset() {
    setName('');
    setVisibility('all');
    onApply({});
    setIsOpen(false);
  }

  return (
    <div className="filter-menu" ref={containerRef}>
      <button
        className={`secondary filter-toggle${isActive(filter) ? ' active' : ''}`}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M1.5 2.5h13L9.5 8.2v4.6L6.5 14V8.2L1.5 2.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        Filters
      </button>

      {isOpen && (
        <form className="filter-popover" onSubmit={handleSubmit}>
          <label>
            Room name
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Search by name"
            />
          </label>

          <label>
            Visibility
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as VisibilityOption)}
            >
              <option value="all">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>

          <div className="filter-actions">
            <button type="submit">Apply</button>
            <button className="secondary" type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
