import styles from './signedOutSurface.module.css';
import SignIn from '@/components/signIn';
import { Sparkle } from '@/components/SVGIcons/Sparkle';

// The signed-out surface. The icon's gradient runs the full first viewport with
// its sparkles over it, and the card that sits on the fold is the real thing
// the app shows you when you start a lift.
//
// There are no testimonials, user counts, reviews or prices anywhere in this
// product, so none may appear here.

const SETS = [
  { reps: 8, weight: 185 },
  { reps: 8, weight: 185 },
  { reps: 6, weight: 195 },
];

const FEATURES = [
  {
    title: 'Drag the number',
    body: 'Slide a thumb across a rep count or a weight and it rolls. The keypad still works.',
  },
  {
    title: 'Hold to repeat',
    body: 'Press and hold any past workout to start today from it, every exercise already filled in.',
  },
  {
    title: 'Kept, and charted',
    body: 'Every session stays. Pick an exercise and see it as max weight or volume over time.',
  },
];

export default function SignedOutSurface() {
  return (
    <div className={styles.page}>
      <header className={styles.rail}>
        <span className={styles.wordmark}>
          Rep<span className={styles.wordmarkCut}>Tracker</span>
        </span>
        <SignIn />
      </header>

      <main>
        <section className={styles.hero}>
          <span className={styles.sparkles} aria-hidden="true">
            <Sparkle size={26} className={styles.sparkleA} />
            <Sparkle size={54} className={styles.sparkleB} />
            <Sparkle size={34} className={styles.sparkleC} />
          </span>

          <div className={styles.heroCopy}>
            <h1 className={styles.heroHeading}>
              Your last numbers,
              <br />
              already on screen.
            </h1>
            <p className={styles.heroBody}>
              A workout log built for one thumb and the twenty seconds between
              sets.
            </p>
            <SignIn size="large" label="Start logging" />
            <span className={styles.heroNote}>Free, and no subscription</span>
          </div>

          {/* The card the app actually shows you, at the size it shows it. */}
          <div className={styles.heroCard}>
            <div className={styles.cardHead}>
              <span className={styles.cardName}>Bench press</span>
              <span className={styles.cardWhen}>4 days ago</span>
            </div>
            <ul className={styles.setList}>
              {SETS.map((set, index) => (
                <li className={styles.setRow} key={index}>
                  <span className={styles.setIndex}>Set {index + 1}</span>
                  <span className={styles.chip}>{set.reps}</span>
                  <span className={styles.times} aria-hidden="true">
                    &times;
                  </span>
                  <span className={styles.chip}>{set.weight}</span>
                  <span className={styles.unit}>lb</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.features}>
          {FEATURES.map((feature) => (
            <article className={styles.feature} key={feature.title}>
              <h2 className={styles.featureTitle}>{feature.title}</h2>
              <p className={styles.featureBody}>{feature.body}</p>
            </article>
          ))}
        </section>

        <section className={styles.close}>
          <h2 className={styles.closeHeading}>Put it on your home screen.</h2>
          <p className={styles.closeBody}>
            It installs as an app and keeps an unfinished workout through a
            reload. Pounds or kilos, your choice.
          </p>
          <SignIn size="large" label="Start logging" />
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Rep Tracker</span>
        <a className={styles.footerLink} href="https://gsajith.com">
          Built by gsajith
        </a>
      </footer>
    </div>
  );
}
