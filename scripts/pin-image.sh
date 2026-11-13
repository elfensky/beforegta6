#!/usr/bin/env bash
# Pins the built image sha into the branch's compose file and commits and
# pushes to that branch, retrying when the push loses a race to another
# commit. The branch picks the environment: main -> deploy/production/
# compose.yaml, develop -> deploy/staging/compose.yaml; any other branch is a
# guard failure. BRANCH defaults to the checked-out branch.
# Called by the build.yml `pin` job. Copied unchanged from miklav.com, where a race simulation tests it. Runs on the checkout in its current
# working directory and never changes directory, so it also runs inside a
# throwaway clone.
#
#   SHA=<full 40-char commit sha> REPO=<owner/repo> [BRANCH=main|develop] bash scripts/pin-image.sh
#
# Exit codes: 0 pinned, or already pinned (D-08). 1 guard failure (unknown
# branch, pin pattern missing or the sed did not take) or retries exhausted
# (D-09).
#
# The two grep guards are unchanged from the job's own prior inline step: a
# non-matching sed is indistinguishable from "already pinned" — sed exits 0
# having changed nothing, git diff then reports no change, and the job would
# go green while compose.yaml still names the previous sha, silently
# stopping deploys. A hand-edit that quotes the value, or any YAML
# formatter, is enough to trigger it, so both guards fail loudly instead.
#
# On a rejected push the job fetches the branch, resets hard to it and
# re-runs the guarded sed from scratch (D-06) — it never replays the rejected
# local commit. This is deliberately not `git rebase`: the local change is a
# trivial, always-regeneratable one-line sed, so redoing it from a fresh
# branch tip cannot conflict, unlike replaying a stale patch.
#
# `set -euo pipefail` is deliberate here, unlike 06-redirect-smoke.sh's
# tallying `set -u` only: a guard failure must stop the job immediately, not
# be tallied and continued past. Every `git push` is the condition of an
# `if`, never a bare statement — GitHub Actions' default run-step shell is
# `bash --noprofile --norc -e -o pipefail {0}`, so an ungated failing push
# would kill the whole step on attempt 1 and the loop would never see a
# second iteration.
#
# The job never force-pushes and never rewrites the branch's history (D-09):
# only a plain, gated `git push origin <branch>` is attempted, so a rejection
# is a clean fast-forward failure, never overridden.
set -euo pipefail

SHA="${SHA:?SHA env var required}"
REPO="${REPO:?REPO env var required}"
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

case "$BRANCH" in
  main) ENVIRONMENT=production ;;
  develop) ENVIRONMENT=staging ;;
  *)
    echo "::error::branch '${BRANCH}' has no environment — only main (production) and develop (staging) pin an image"
    exit 1
    ;;
esac
COMPOSE="deploy/${ENVIRONMENT}/compose.yaml"

MAX_ATTEMPTS=3
SLEEP_SECONDS=5

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if [ "$attempt" -ge 2 ]; then
    # D-06: start again from the branch tip; a fetch/reset failure is not a
    # retry case — set -e stops the job with git's own message.
    git fetch -q origin "$BRANCH"
    git reset -q --hard FETCH_HEAD
  fi

  grep -qE "^[[:space:]]*image: ghcr\.io/${REPO}:" "$COMPOSE" || {
    echo "::error::no 'image: ghcr.io/${REPO}:...' line in ${COMPOSE} — the pin pattern did not match; refusing to no-op silently"
    exit 1
  }
  sed -i.bak -E "s#^([[:space:]]*image: ghcr\.io/${REPO}:).*#\1sha-${SHA}#" "$COMPOSE"
  rm -f "${COMPOSE}.bak"
  grep -qF "image: ghcr.io/${REPO}:sha-${SHA}" "$COMPOSE" || {
    echo "::error::${COMPOSE} does not name sha-${SHA} after the rewrite — the pin did not take"
    exit 1
  }

  # Only now does "no diff" unambiguously mean "already at this sha" (D-08).
  # This runs on every attempt, after every fetch.
  if git diff --quiet "$COMPOSE"; then
    echo "already pinned"
    exit 0
  fi

  git -c user.name='github-actions[bot]' -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
    commit -q -am "chore(deploy): ${ENVIRONMENT} → sha-${SHA:0:12} [skip ci]"

  if git push -q origin "$BRANCH"; then
    echo "pinned sha-${SHA:0:12} on attempt ${attempt}/${MAX_ATTEMPTS}"
    exit 0
  fi

  echo "push rejected (attempt ${attempt}/${MAX_ATTEMPTS}) — ${BRANCH} moved; fetching it and pinning again"
  if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    sleep "$SLEEP_SECONDS"
  fi
  attempt=$((attempt + 1))
done

echo "::error::failed to pin sha-${SHA} into ${COMPOSE} after ${MAX_ATTEMPTS} attempts — ${BRANCH} kept moving; re-run the pin job"
exit 1
