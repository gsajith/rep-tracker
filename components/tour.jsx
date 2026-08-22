'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './tour.module.css';
import { LetsIconsSwipe } from './SVGIcons/LetsIconsSwipe';

// The tour runs in two acts because the thing it exists to show does not exist
// on day one. Act 1 gets a first workout saved. Act 2 waits for the second
// workout, where re-adding an exercise finally surfaces what you lifted last
// time, which is the moment the app earns its place on someone's phone.
//
// No step has a "Next". A step clears when the user does the real thing, so
// this is a commentary on the app rather than a slideshow over it. Only the
// two steps that teach something with nothing to complete end in a button.
//
// Status values, held in localStorage under "tourStatus":
//   null           not decided yet; page.jsx picks act1 or done on first load
//   act1           first workout, steps below
//   act1-taught    act 1 said its piece, waiting for the save
//   act2           second workout, the payoff
//   done           never show again unless replayed from settings

const ACTS = {
  act1: [
    {
      id: 'start',
      anchors: ['tour-start'],
      text: 'Tap the card to start. The clock runs until you end the workout.',
      done: (state) => state.inWorkout,
    },
    {
      id: 'add',
      anchors: ['tour-add'],
      text: 'Type what you are lifting, then Add. A name it has never seen is fine, it keeps it for next time.',
      done: (state) => state.exerciseCount > 0,
    },
    {
      id: 'scrub',
      anchors: ['tour-set'],
      text: 'Drag sideways across a number to change it, or tap it to type. Add your sets, then end the workout.',
      icon: true,
      ack: 'Got it',
      ackStatus: 'act1-taught',
    },
  ],
  act2: [
    {
      id: 'copy',
      anchors: ['tour-workout'],
      text: 'Press and hold a workout to copy the whole thing into today.',
      done: (state) => state.inWorkout,
    },
    {
      id: 'last',
      // Whichever arrived first: the preview under the exercise picker, or the
      // previous sets inside an exercise that came from a copied workout.
      anchors: ['tour-preview', 'tour-past'],
      text: 'Here is the part worth staying for. Last time is right there, and today starts from those numbers.',
      ack: 'Done',
      ackStatus: 'done',
    },
  ],
};

function findAnchor(ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function Tour({ status, setStatus, inWorkout, exerciseCount }) {
  const steps = ACTS[status] ?? null;
  const step =
    steps?.find((candidate) => {
      if (!candidate.done) return true;
      return !candidate.done({ inWorkout, exerciseCount });
    }) ?? null;

  // Joined rather than passed as an array so the effects below can depend on
  // it without re-running on every render.
  const anchorKey = step ? step.anchors.join(' ') : '';

  const [rect, setRect] = useState(null);
  const scrolledFor = useRef(null);

  // Every measurement happens in an effect, never during render. Reading
  // layout while rendering is what took this app down during server rendering
  // once already (24355ef).
  useEffect(() => {
    if (!anchorKey) {
      setRect(null);
      return undefined;
    }

    const ids = anchorKey.split(' ');

    const measure = () => {
      const el = findAnchor(ids);
      if (!el) {
        setRect(null);
        return;
      }
      const next = el.getBoundingClientRect();
      setRect((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.viewport === window.innerHeight
          ? prev
          : {
              top: next.top,
              left: next.left,
              width: next.width,
              height: next.height,
              viewport: window.innerHeight,
            }
      );
    };

    // The anchor may still be growing: exercise cards animate max-height over
    // 300ms, so a single measurement lands on a box that is about to change.
    // Track across that window, then hand off to the observers.
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function track(now) {
      measure();
      if (now - startedAt < 700) frame = requestAnimationFrame(track);
    });

    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener('resize', measure);
    // Capture phase so scrolling inside a nested container counts too.
    window.addEventListener('scroll', measure, true);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchorKey]);

  // Bring the anchor into view once per step, and only once it exists. The set
  // inputs in particular sit below the fold on a short screen.
  useEffect(() => {
    if (!rect || scrolledFor.current === anchorKey) return;
    const el = findAnchor(anchorKey.split(' '));
    if (!el) return;
    scrolledFor.current = anchorKey;
    el.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, [rect, anchorKey]);

  useEffect(() => {
    if (!steps) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setStatus('done');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [steps, setStatus]);

  if (!step || !rect) return null;

  // Breathing room around the anchor, in px.
  const pad = 8;

  // The card sits low unless the spotlight is already down there.
  const anchorBottom = rect.top + rect.height;
  const cardAtBottom = anchorBottom < rect.viewport - 230;

  return (
    <>
      <div
        className={styles.ring}
        aria-hidden="true"
        style={{
          transform: `translate3d(${rect.left - pad}px, ${rect.top - pad}px, 0)`,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        }}
      />
      <div
        key={step.id}
        className={`${styles.card} ${
          cardAtBottom ? styles.cardBottom : styles.cardTop
        }`}
        role="status"
        aria-live="polite"
      >
        <div className={styles.body}>
          {step.icon && (
            <LetsIconsSwipe className={styles.icon} aria-hidden="true" />
          )}
          <p className={styles.text}>{step.text}</p>
        </div>
        <div className={styles.controls}>
          <span className={styles.counter}>
            {steps.indexOf(step) + 1} of {steps.length}
          </span>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.skip}
              onClick={() => setStatus('done')}
            >
              Skip
            </button>
            {step.ack && (
              <button
                type="button"
                className={styles.ack}
                onClick={() => setStatus(step.ackStatus)}
              >
                {step.ack}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
