'use client';
import { usePathname } from 'next/navigation';
import styles from './bottomBar.module.css';
import BottomBarButton from './bottomBarButton';
import { LetsIconsHome } from './SVGIcons/LetsIconsHome';
import { LetsIconsSettings } from './SVGIcons/LetsIconsSettings';
import { LetsIconsStats } from './SVGIcons/LetsIconsStats';

export default function BottomBar() {
  const pathname = usePathname();

  console.log(pathname);
  return (
    <div className={styles.bottomBarContainer}>
      <BottomBarButton active={pathname === '/'} href={'/'}>
        <LetsIconsHome /> Home
      </BottomBarButton>
      <BottomBarButton active={pathname === '/stats'} href={'/stats'}>
        <LetsIconsStats /> Stats
      </BottomBarButton>
      <BottomBarButton active={pathname === '/settings'} href={'/settings'}>
        <LetsIconsSettings /> Settings
      </BottomBarButton>
    </div>
  );
}
