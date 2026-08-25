import classNames from 'classnames';
import styles from './groupedButtons.module.css';

// Positions of one switch. The selected one used to be marked by an absolutely
// positioned indicator placed from getBoundingClientRect().left, which is a
// viewport coordinate written into an element whose container was never
// positioned; it landed correctly only when the group started at the left edge
// of the window.
export default function GroupedButtons({
  options,
  selectedItem,
  setSelectedItem,
}) {
  return (
    <div className={styles.groupedButtonsContainer} role="group">
      {options.map((option, index) => (
        <button
          onClick={() => setSelectedItem(index)}
          className={classNames(styles.button, {
            [styles.active]: index === selectedItem,
          })}
          // Selection was conveyed by colour alone, and the inactive colour
          // failed contrast, so there was nothing left to convey it.
          aria-pressed={index === selectedItem}
          type="button"
          key={option}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
