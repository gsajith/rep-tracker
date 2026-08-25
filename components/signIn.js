import { SignInButton } from '@clerk/nextjs';
import classNames from 'classnames';
import styles from './signIn.module.css';

export default function SignIn({ size = 'small', label = 'Sign in' }) {
  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className={classNames(styles.signIn, {
          [styles.large]: size === 'large',
        })}
      >
        {label}
      </button>
    </SignInButton>
  );
}
