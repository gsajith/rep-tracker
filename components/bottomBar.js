'use client';
import { usePathname } from 'next/navigation';
import styles from './bottomBar.module.css';
import BottomBarButton from './bottomBarButton';
import { LetsIconsHome } from './SVGIcons/LetsIconsHome';
import { LetsIconsSettings } from './SVGIcons/LetsIconsSettings';
import { LetsIconsStats } from './SVGIcons/LetsIconsStats';
import { useEffect, useRef, useState } from 'react';

export default function BottomBar() {
  const pathname = usePathname();

  const itemRefs = useRef([]);

  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const [indicatorLeft, setIndicatorLeft] = useState(0);

  useEffect(() => {
    itemRefs.current.forEach((item) => {
      if (item && item.pathname === pathname) {
        const { width, left } = item.getBoundingClientRect();
        setIndicatorWidth(width - 20);
        setIndicatorLeft(left + 10);
      }
    });
  }, [pathname]);

  return (
    <div className={styles.bottomBarContainer}>
      <BottomBarButton
        active={pathname === '/'}
        href={'/'}
        ref={(el) => (itemRefs.current[0] = el)}
      >
        <LetsIconsHome /> Home
      </BottomBarButton>
      <BottomBarButton
        active={pathname === '/stats'}
        href={'/stats'}
        ref={(el) => (itemRefs.current[1] = el)}
      >
        <LetsIconsStats /> Stats
      </BottomBarButton>
      <BottomBarButton
        active={pathname === '/settings'}
        href={'/settings'}
        ref={(el) => (itemRefs.current[2] = el)}
      >
        <LetsIconsSettings /> Settings
      </BottomBarButton>
      <div
        className={styles.indicator}
        style={{
          width: indicatorWidth,
          left: indicatorLeft,
          opacity: indicatorWidth > 0 ? '1' : '0',
        }}
      />
    </div>
  );
}
