'use client';
import { UserButton, useUser } from '@clerk/nextjs';
import styles from './userBadge.module.css';

export default function UserBadge() {
  const { user } = useUser();

  return (
    <div className={styles.userBadgeWrapper}>
      {user ? <UserButton /> : <div className={styles.placeholderUserImage} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {user && <span className={styles.welcomeText}>Welcome 👋</span>}
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>
          {user ? user.fullName : 'Logging in...'}
        </span>
      </div>
    </div>
  );
}
