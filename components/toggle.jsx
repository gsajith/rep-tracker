import Toggle from 'react-toggle';
import styles from './toggle.module.css';

export default function MyToggle({ label, enabled, setEnabled, ...props }) {
  return (
    <div className={styles.toggleWrapper} {...props}>
      <label htmlFor={`${label}-status`}>{label}</label>
      <Toggle
        id={`${label}-status`}
        aria-labelledby={label}
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
      />
    </div>
  );
}
