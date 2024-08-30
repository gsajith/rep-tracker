import { SignInButton } from "@clerk/nextjs";
import styles from "./signIn.module.css";

export default function SignIn() {
  return <SignInButton mode="modal">
    <button className={styles.signIn}>Sign in</button>
  </SignInButton>;
}
