import Link from 'next/link';
import styles from './bottomBar.module.css';
import BottomBarButton from './bottomBarButton';
import { LetsIconsHome } from './SVGIcons/LetsIconsHome';
import { LetsIconsSettings } from './SVGIcons/LetsIconsSettings';
import { LetsIconsStats } from './SVGIcons/LetsIconsStats';

export default function BottomBar() {
  return (
    <div className={styles.bottomBarContainer}>
      <BottomBarButton active href={'/'}>
        <LetsIconsHome /> Home
      </BottomBarButton>
      <BottomBarButton active={false} href={'/stats'}>
        <LetsIconsStats /> Stats
      </BottomBarButton>
      <BottomBarButton active={false} href={'/settings'}>
        <LetsIconsSettings /> Settings
      </BottomBarButton>
    </div>
  );
}
