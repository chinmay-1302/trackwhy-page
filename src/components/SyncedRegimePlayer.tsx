import { useEffect, useRef, useState } from "react";

import { withBase } from "@/lib/base";

type Props = {
  supervisionFree: string;
  groundTruth: string;
  poster: string;
  alt: string;
};

export function SyncedRegimePlayer({
  supervisionFree,
  groundTruth,
  poster,
  alt,
}: Props) {
  const leftRef = useRef<HTMLVideoElement>(null);
  const rightRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) {
      return;
    }

    const syncRight = () => {
      if (Math.abs(left.currentTime - right.currentTime) > 0.12) {
        right.currentTime = left.currentTime;
      }
    };
    const onPlay = () => {
      setPlaying(true);
      void right.play().catch(() => undefined);
    };
    const onPause = () => {
      setPlaying(false);
      right.pause();
    };

    left.addEventListener("timeupdate", syncRight);
    left.addEventListener("play", onPlay);
    left.addEventListener("pause", onPause);
    void left.play().catch(() => undefined);
    void right.play().catch(() => undefined);

    return () => {
      left.removeEventListener("timeupdate", syncRight);
      left.removeEventListener("play", onPlay);
      left.removeEventListener("pause", onPause);
    };
  }, [supervisionFree, groundTruth]);

  function toggle() {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) {
      return;
    }
    if (left.paused) {
      void left.play().catch(() => undefined);
      void right.play().catch(() => undefined);
    } else {
      left.pause();
      right.pause();
    }
  }

  return (
    <section className="not-prose my-6">
      <p className="sr-only">{alt}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <figure>
          <video
            ref={leftRef}
            className="aspect-video h-auto w-full rounded-lg bg-black"
            src={withBase(supervisionFree)}
            poster={withBase(poster)}
            muted
            loop
            playsInline
            preload="metadata"
          />
          <figcaption className="mt-2 text-center">Supervision-free</figcaption>
        </figure>
        <figure>
          <video
            ref={rightRef}
            className="aspect-video h-auto w-full rounded-lg bg-black"
            src={withBase(groundTruth)}
            muted
            loop
            playsInline
            preload="metadata"
          />
          <figcaption className="mt-2 text-center">
            Ground-truth-informed
          </figcaption>
        </figure>
      </div>
      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={toggle}
          className="rounded-full bg-zinc-800 px-5 py-2 text-white hover:bg-black dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
        >
          {playing ? "Pause both" : "Play both"}
        </button>
      </div>
    </section>
  );
}
