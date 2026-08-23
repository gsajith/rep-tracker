import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { useEffect, useRef } from 'react';
import styles from './combobox.module.css';
import { capitalize } from '@/utils/utils';

export default function ComboBox({
  children,
  options,
  selectedItem,
  setSelectedItem,
  query,
  setQuery,
}) {
  const inputRef = useRef(null);

  // Headless UI owns the input's text while the list is open, so clearing
  // `query` after an exercise is added does not empty the field on its own and
  // the name people just added stays sitting there. Guarded on `selectedItem`
  // so this never wipes the label of an option they actually chose.
  useEffect(() => {
    if (query === '' && !selectedItem && inputRef.current?.value) {
      inputRef.current.value = '';
    }
  }, [query, selectedItem]);

  const trimmed = query.trim();
  const filteredOptions =
    trimmed === ''
      ? options
      : options.filter((option) => {
          return option.name.toLowerCase().includes(trimmed.toLowerCase());
        });

  // Offering to create a name the user already has splits that exercise's
  // history in two: stats groups by exact name, and nothing in the UI can
  // rename it afterwards. Match case-insensitively so "pushups" cannot become
  // a second "Pushups".
  const alreadyExists = options.some(
    (option) => option.name.toLowerCase() === trimmed.toLowerCase()
  );
  const offerNewExercise = trimmed.length > 0 && !alreadyExists;

  return (
    <Combobox
      value={selectedItem}
      // Closing clears the query so the field and the Add button can never
      // disagree: Headless UI blanks the input on close no matter what this
      // component does, and a surviving query left Add enabled over an empty
      // box. The Add button lives inside this Combobox (see `children` below)
      // so pressing it is not an outside click and does not close anything,
      // which is what let a free-typed name reach the button in the first
      // place. Both halves are load-bearing; dropping either brings back a bug.
      onClose={() => setQuery('')}
      onChange={setSelectedItem}
    >
      <ComboboxInput
        ref={inputRef}
        className={styles.comboBoxInput}
        aria-label="Autocomplete input"
        displayValue={(option) => (option ? capitalize(option.name) : '')}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Add an exercise..."
        autoComplete="off"
      />
      <ComboboxOptions anchor="bottom" modal={false}>
        {filteredOptions.map((option) => (
          <ComboboxOption key={option.id} value={option}>
            {capitalize(option.name)}
          </ComboboxOption>
        ))}
        {offerNewExercise && (
          <ComboboxOption value={{ id: null, name: trimmed }}>
            New exercise:{' '}
            <span style={{ fontWeight: 'bold' }}>&quot;{trimmed}&quot;</span>
          </ComboboxOption>
        )}
      </ComboboxOptions>
      {children}
    </Combobox>
  );
}
