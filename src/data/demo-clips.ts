import rawClips from "./demo-clips.json";

export type VisitorAnswer = "miss" | "identity_change" | "no_error";

export type DemoClip = {
  clip_id: string;
  video: string;
  video_gt: string;
  poster: string;
  truth: "miss" | "identity_change" | "drift";
  metric: VisitorAnswer | null;
  condition: string;
  observer_a: string;
  observer_b: string;
  model: string;
  note: string;
  alt: string;
};

export const demoClips = rawClips as DemoClip[];

export const ANSWER_LABELS: Record<string, string> = {
  miss: "Missed detection",
  identity_change: "Identity change",
  no_error: "Nothing wrong",
  no_error_visible: "Nothing wrong",
  drift: "Drift",
  could_not_identify_target: "Could not identify the target",
  cannot_determine: "Cannot determine",
};

export function displayLabel(value: string): string {
  return ANSWER_LABELS[value] ?? value.replaceAll("_", " ");
}
