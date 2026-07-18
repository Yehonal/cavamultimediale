# Repository Guidelines

## Project Structure & Module Organization

This is a Create React App project using React 18 and TypeScript. Application startup is in `src/index.tsx`; `App.tsx` composes providers, layout, and routes. Keep page-level screens and their styles in `src/pages/`, reusable UI in `src/modules/<feature>/components/`, and shared state or helpers near `src/AppContext.tsx` and `src/modules/common/`. Store bundled text, images, and fonts under `src/data/media/`; browser-served audio and video belong in `public/`.

## Build, Test, and Development Commands

- `npm ci` installs the locked dependency set.
- `npm start` runs the development server at `http://localhost:3000` and reports ESLint issues.
- `npm test -- --watchAll=false` runs the Jest and React Testing Library suite once.
- `npm run build` type-checks, lints, and produces the deployable `build/` directory.

## Coding Style & Naming Conventions

Use strict TypeScript and functional React components. Follow the surrounding file's formatting: current TSX and CSS use two-space indentation and double-quoted imports. Name components in PascalCase (`MainLayout.tsx`), tests `*.test.tsx`, and colocated styles after their component or page (`Home.css`). Preserve existing lower-case route and content filenames. No standalone formatter script is configured, so do not introduce broad formatting-only changes.

## Testing Guidelines

Tests use Jest, `@testing-library/react`, and `@testing-library/jest-dom`. Add or update a focused `*.test.tsx` test for changed user-visible behavior; prefer accessible queries such as `getByRole` or `getByText`. Run the one-shot test command and a production build before opening a pull request. No coverage threshold is configured.

## Commit and Pull Request Guidelines

Recent history uses short, action-focused subjects such as `fix gallery animation` and `folder refactoring`. Keep each commit scoped and describe the outcome, not the implementation churn. Pull requests should explain the user-facing change, list validation commands, link an issue when applicable, and include screenshots or a short recording for visual or animation changes.

## Git Coordination and Assets

This repository is Syncwheel `git-tracked`: check `syncwheel repo tracking status` before coordinated branch or handoff work, and commit relevant `.syncwheel/` metadata. Keep referenced media paths stable; avoid unnecessary binary rewrites. Store local settings in ignored `.env*.local` files and never commit credentials.
