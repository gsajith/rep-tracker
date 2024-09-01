import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { useState } from 'react';
import styles from './combobox.module.css';
import { capitalize } from '@/utils/utils';

export default function ComboBox({ options, onSelect }) {
  const [selectedItem, setSelectedItem] = useState();
  const [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) => {
          return option.name.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <Combobox
      value={selectedItem}
      onChange={(item) => {
        setSelectedItem(item);
        onSelect(item);
      }}
      onClose={() => setQuery('')}
    >
      <ComboboxInput
        className={styles.comboBoxInput}
        aria-label="Autocomplete input"
        displayValue={(option) => (option ? capitalize(option.name) : '')}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Add an exercise..."
        autoComplete="off"
      />
      <ComboboxOptions anchor="bottom">
        {query.length > 0 && (
          <ComboboxOption value={{ id: null, name: query }}>
            New exercise:{' '}
            <span style={{ fontWeight: 'bold' }}>&quot;{query}&quot;</span>
          </ComboboxOption>
        )}
        {filteredOptions.map((option) => (
          <ComboboxOption key={option.id} value={option}>
            {capitalize(option.name)}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}
