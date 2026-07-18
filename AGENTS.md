# Repository Guidelines

## Mission and Reference Material

This project recreates *Cava de' Tirreni Multimediale*, AMI Informatica's 1998 CD-ROM for Cava de' Tirreni. The web edition must preserve the original bilingual content, information structure, interaction model, animation cues, artwork, audio, typography, and 640×480 visual language—not modernize it. Treat the original ISO, packaging, demo video, and captured screens as read-only evidence. Extract media reproducibly; do not decompile, alter, or infer new content from the legacy executable.

## Project Structure

`src/index.tsx` starts the React app; `App.tsx`, `Routes.tsx`, and `AppContext.tsx` compose it. Keep screens and their CSS in `src/pages/`, reusable UI in `src/modules/<feature>/`, and imported archival media under `src/data/media/`. Assets that must be loaded by a stable browser URL belong in `public/` (for example `public/wave/` and `public/voice/`). Keep a CD section's images, text, sound, and navigation changes together.

## Development Commands

- `npm ci` installs the locked toolchain.
- `npm start` runs the Create React App development server.
- `npm test -- --watchAll=false` runs Jest and React Testing Library once.
- `npm run build` creates the production build. The GitHub Actions workflow builds, tests, and deploys pushes to `react-v1`.

## Fidelity and Code Style

Use strict TypeScript, functional React components, two-space indentation, and the surrounding file's quote and naming style. Place colocated styles beside their component or page (`City.tsx`, `City.css`) and tests in `*.test.tsx`. Reimplement the original behavior in TSX/CSS; do not introduce a design system or responsive layout that changes the 640×480 composition. Preserve the established Italian/English content and media paths unless the reference evidence requires a correction.

## Testing and Review

Test changed user-facing behavior with accessible React Testing Library queries. For each fidelity change, manually compare the affected route at 640×480 with the reference and test both language variants, navigation, animation, and audio behavior where applicable. Pull requests need a concise description, validation commands, and before/after captures for visual changes.

## Original Runtime and Git

The original launcher is a Windows 3.1 NE executable with the Visual Basic 4 runtime. A browser emulator (for example, v86 plus a separately licensed Windows 3.x image) is a valid preservation proof of concept, but keep it isolated from the React recreation and never commit or distribute the ISO or Windows images without rights. Use focused, imperative commits and check `syncwheel repo tracking status` before coordinated Git work.
