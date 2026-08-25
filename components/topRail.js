'use client';
import { UserButton, useUser } from '@clerk/nextjs';
import styles from './topRail.module.css';
import { useEffect, useState } from 'react';
import { useLoadDelay } from '@/hooks/useLoadDelay';

export default function TopRail() {
  const { user } = useUser();
  const shown = useLoadDelay();

  // Collapses to the avatar alone once the list is moving, so the name is a
  // greeting on arrival rather than chrome that follows you down the page.
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const onScroll = () => setExpanded(window.scrollY < 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    shown && (
      <header className={styles.rail} data-collapsed={expanded ? undefined : ''}>
        {user ? (
          <UserButton />
        ) : (
          /* Same 38px the avatar occupies, so the pill does not resize when
             Clerk resolves. */
          <div className={styles.avatarPlaceholder} aria-hidden="true" />
        )}
        <div className={styles.who}>
          <span className={styles.welcome}>Welcome 👋</span>
          <span className={styles.name}>
            {user ? user.fullName : 'Logging in...'}
          </span>
        </div>
      </header>
    )
  );
}
