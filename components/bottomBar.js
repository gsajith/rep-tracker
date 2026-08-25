'use client';
import { usePathname } from 'next/navigation';
import styles from './bottomBar.module.css';
import BottomBarButton from './bottomBarButton';
import { LetsIconsHome } from './SVGIcons/LetsIconsHome';
import { LetsIconsSettings } from './SVGIcons/LetsIconsSettings';
import { LetsIconsStats } from './SVGIcons/LetsIconsStats';
import { useLoadDelay } from '@/hooks/useLoadDelay';

const TABS = [
  { href: '/', label: 'Home', Icon: LetsIconsHome },
  { href: '/stats', label: 'Stats', Icon: LetsIconsStats },
  { href: '/settings', label: 'Settings', Icon: LetsIconsSettings },
];

// A floating pill, the shape the reference uses. The selected tab is a filled
// pill inside it, which replaced a sliding indicator positioned from a measured
// getBoundingClientRect behind two 250ms timers.
export default function BottomBar() {
  const pathname = usePathname();
  const shown = useLoadDelay();

  return (
    shown && (
      <nav className={styles.dock} aria-label="Sections">
        <div className={styles.pill}>
          {TABS.map(({ href, label, Icon }) => (
            <BottomBarButton
              key={href}
              href={href}
              active={pathname === href}
              label={label}
            >
              <Icon />
            </BottomBarButton>
          ))}
        </div>
      </nav>
    )
  );
}
