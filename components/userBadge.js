'use client';
import { UserButton, useUser } from '@clerk/nextjs';
import styles from './userBadge.module.css';
import { useEffect, useState } from 'react';

export default function UserBadge() {
  const { user } = useUser();

  const [allInfoShown, setAllInfoShown] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setAllInfoShown(currentScrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={styles.userBadgeWrapper}
      style={{
        minWidth: allInfoShown ? 100 : 0,
        borderRadius: allInfoShown ? 12 : '12px 99px 99px 12px',
      }}
    >
      {user ? <UserButton /> : <div className={styles.placeholderUserImage} />}
      <div
        className={styles.userInfoWrapper}
        style={{
          maxWidth: allInfoShown ? '200px' : '0px',
          opacity: allInfoShown ? 1 : 0,
        }}
      >
        {user && <span className={styles.welcomeText}>Welcome 👋</span>}
        <span className={styles.userName}>
          {user ? user.fullName : 'Logging in...'}
        </span>
      </div>
    </div>
  );
}
