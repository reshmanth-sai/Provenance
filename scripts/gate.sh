#!/usr/bin/env bash
# Typecheck + build every workspace.
#
# Run this before treating a phase as done. `tsx` runs the API without typechecking,
# so 18 type errors -- including a dead EXIF branch that silently disabled image
# metadata analysis -- shipped unnoticed across several phases.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# `next build` writes to the same .next directory that `next dev` serves from, which
# leaves a running dev server throwing 500s until it is restarted.
if lsof -ti tcp:3000 >/dev/null 2>&1; then
  echo "gate: a dev server is listening on :3000."
  echo "gate: 'next build' overwrites the .next directory it serves from and will break it."
  echo "gate: stop it first  ->  lsof -ti tcp:3000 | xargs kill"
  exit 1
fi

npm run typecheck

# A .next directory left half-written by a killed dev server makes `next build` fail with
# PageNotFoundError for /_document or /_not-found. Always build from clean.
rm -rf "$REPO_ROOT/apps/web/.next"

npm run build
echo "gate: PASS"
