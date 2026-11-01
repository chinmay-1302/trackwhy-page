# TrackWhy project page

Project page for *What Counts as a Tracking Failure? Measuring Disagreement Between Metrics, Human Observers, and Vision-Language Models* (VLM4RWD @ NeurIPS 2026).

Paper: https://openreview.net/forum?id=TRJ7gFUnta
Code: https://github.com/chinmay-1302/trackwhy
Clips: https://huggingface.co/datasets/chinmay-1302/TrackWhy

Built from [Roman Hauksson-Neill's academic project page template](https://github.com/RomanHauksson/academic-project-astro-template) (CC BY-SA 4.0).

## Local development

Node 24 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:4321. If the file-watcher limit is exhausted on this machine, build and preview instead:

```bash
npx astro build
npx astro preview
```

To regenerate the twelve demo clips and `src/data/demo-clips.json` from the local annotation and clip trees:

```bash
python3 scripts/build_demo_data.py
```

The script reads `/mnt/SSD_4/sankalp/trackwhy-code` and `/mnt/SSD_4/sankalp/trackwhy-dataset` and writes re-encoded 480p clips into `public/clips`.

## Deploy

GitHub Pages is configured by `.github/workflows/astro.yml`. After Pages is set to GitHub Actions, a push to `main` publishes `https://chinmay-1302.github.io/trackwhy-page/`.
