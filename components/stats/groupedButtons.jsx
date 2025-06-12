import classNames from 'classnames';
import styles from './groupedButtons.module.css';
import { useEffect, useRef, useState } from 'react';

export default function GroupedButtons({
  options,
  selectedItem,
  setSelectedItem,
}) {
  const itemRefs = useRef([]);

  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const [indicatorHeight, setIndicatorHeight] = useState(0);
  const [indicatorLeft, setIndicatorLeft] = useState(0);

  useEffect(() => {
    itemRefs.current.forEach((item, index) => {
      if (item && index === selectedItem) {
        const { width, height, left } = item.getBoundingClientRect();
        setIndicatorWidth(width);
        setIndicatorHeight(height);
        setIndicatorLeft(left);
      }
    });
  }, [options, selectedItem]);

  return (
    <div className={styles.groupedButtonsContainer}>
      {options.map((option, index) => {
        return (
          <button
            ref={(el) => (itemRefs.current[index] = el)}
            onClick={() => setSelectedItem(index)}
            className={classNames(styles.button, {
              [`${styles.active}`]: index === selectedItem,
            })}
            key={option}
          >
            {option}
          </button>
        );
      })}
      <div
        className={styles.indicator}
        style={{
          width: indicatorWidth,
          height: indicatorHeight,
          left: indicatorLeft,
          opacity: indicatorWidth > 0 ? '1' : '0',
        }}
      />
    </div>
  );
}
