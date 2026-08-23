import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import styles from './combobox.module.css';
import { capitalize } from '@/utils/utils';

export default function ComboBox({
  options,
  selectedItem,
  setSelectedItem,
  query,
  setQuery,
}) {
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
      onChange={(option) => {
        setSelectedItem(option);
        // Cleared when an option is actually chosen, not when the list closes.
        // Clearing on close wiped whatever the user had typed the moment they
        // reached for the Add button, so a free-typed name could never be
        // committed: the only state where Add looked usable was the one where
        // the text had already been thrown away.
        setQuery('');
      }}
    >
      <ComboboxInput
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
    </Combobox>
  );
}
