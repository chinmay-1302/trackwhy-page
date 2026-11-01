import { useEffect, useMemo, useRef, useState } from "react";

import {
  demoClips,
  displayLabel,
  type DemoClip,
  type VisitorAnswer,
} from "@/data/demo-clips";
import { withBase } from "@/lib/base";

const ANSWERS: { value: VisitorAnswer; label: string }[] = [
  { value: "miss", label: "Missed detection" },
  { value: "identity_change", label: "Identity change" },
  { value: "no_error", label: "Nothing wrong" },
];

type Verdict = {
  clip: DemoClip;
  answer: VisitorAnswer;
};

function metricLine(clip: DemoClip): string {
  if (clip.metric === "miss") {
    return "TrackEval counted a missed detection.";
  }
  if (clip.metric === "identity_change") {
    return "TrackEval counted an identity switch.";
  }
  return "TrackEval assigned this event to a false-positive identity hijack (drift).";
}

export function FailureDemo() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<VisitorAnswer | null>(null);
  const [history, setHistory] = useState<Verdict[]>([]);
  const sfRef = useRef<HTMLVideoElement>(null);
  const gtRef = useRef<HTMLVideoElement>(null);

  const clip = demoClips[index];
  const nextClip = demoClips[(index + 1) % demoClips.length];
  const revealed = answer !== null;

  const scored = useMemo(
    () => history.filter((item) => item.clip.metric !== null),
    [history],
  );
  const agreed = scored.filter((item) => item.answer === item.clip.metric).length;

  useEffect(() => {
    const video = sfRef.current;
    if (!video) {
      return;
    }
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  }, [index, revealed]);

  useEffect(() => {
    if (!revealed) {
      return;
    }
    const left = sfRef.current;
    const right = gtRef.current;
    if (!left || !right) {
      return;
    }
    const sync = () => {
      if (Math.abs(left.currentTime - right.currentTime) > 0.12) {
        right.currentTime = left.currentTime;
      }
    };
    left.addEventListener("timeupdate", sync);
    void left.play().catch(() => undefined);
    void right.play().catch(() => undefined);
    return () => left.removeEventListener("timeupdate", sync);
  }, [revealed, index]);

  function choose(value: VisitorAnswer) {
    if (answer) {
      return;
    }
    setAnswer(value);
    setHistory((prev) => [...prev, { clip, answer: value }]);
  }

  function goNext() {
    setAnswer(null);
    setIndex((prev) => (prev + 1) % demoClips.length);
  }

  return (
    <section className="not-prose my-8 rounded-2xl bg-zinc-100 p-4 sm:p-6 dark:bg-zinc-800">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Can you spot the failure?
          </p>
          <p className="text-zinc-700 dark:text-zinc-200">
            Clip {index + 1} of {demoClips.length} · {clip.clip_id}
          </p>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {scored.length === 0
            ? "No scored answers yet."
            : `${agreed} of ${scored.length} — observers in our study agreed with the metric on 56–59% of clips like these.`}
        </p>
      </div>

      <p className="sr-only">{clip.alt}</p>

      {revealed ? (
        <div className="grid gap-3 md:grid-cols-2">
          <figure>
            <video
              ref={sfRef}
              className="aspect-video h-auto w-full rounded-lg bg-black"
              src={withBase(clip.video)}
              poster={withBase(clip.poster)}
              muted
              loop
              playsInline
              controls
              preload="auto"
            />
            <figcaption className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-300">
              Supervision-free
            </figcaption>
          </figure>
          <figure>
            <video
              ref={gtRef}
              className="aspect-video h-auto w-full rounded-lg bg-black"
              src={withBase(clip.video_gt)}
              muted
              loop
              playsInline
              controls
              preload="auto"
            />
            <figcaption className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-300">
              Ground-truth-informed
            </figcaption>
          </figure>
        </div>
      ) : (
        <video
          ref={sfRef}
          className="aspect-video h-auto w-full rounded-lg bg-black"
          src={withBase(clip.video)}
          poster={withBase(clip.poster)}
          muted
          loop
          playsInline
          controls
          autoPlay
          preload="auto"
        />
      )}

      {nextClip && (
        <link rel="preload" as="image" href={withBase(nextClip.poster)} />
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {ANSWERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => choose(item.value)}
            disabled={revealed}
            className={`flex-1 rounded-full px-4 py-2.5 text-base font-medium transition ${
              answer === item.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white text-zinc-800 ring-1 ring-zinc-300 hover:bg-zinc-50 disabled:opacity-60 dark:bg-zinc-700 dark:text-zinc-100 dark:ring-zinc-600 dark:hover:bg-zinc-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4" aria-live="polite">
        {revealed && (
          <div className="rounded-xl bg-white p-4 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="font-medium">
                You said {displayLabel(answer)}. {metricLine(clip)}
              </p>
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-zinc-900 px-5 py-2 text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Next clip
              </button>
            </div>
            <p className="mt-3">{clip.note}</p>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  Attributor condition
                </dt>
                <dd>
                  <code>{clip.condition}</code>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  Observer A
                </dt>
                <dd>{displayLabel(clip.observer_a)}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  Observer B
                </dt>
                <dd>{displayLabel(clip.observer_b)}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  Qwen3.8-27B
                </dt>
                <dd>{displayLabel(clip.model)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
        Twelve clips, stratified to match the paper: four misses observers
        called clean, three misses that flipped once convention knowledge was
        supplied, three identity changes, and two drift cases. Catching the
        identity changes and missing the entry events reproduces the pilot —
        naive observers detected 6 of 10 misses and 5 of 5 identity changes.
      </p>
    </section>
  );
}
