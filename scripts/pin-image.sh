#!/usr/bin/env bash
# Pin a built image on deploy/staging or deploy/production without changing the source checkout.
# SHA and REPO are required. BRANCH must identify the built source branch: develop or main.
# Optional ENVIRONMENT and TARGET_BRANCH must agree with that source branch.
# Deployment branches must already exist. Each attempt copies both compose configurations from SHA,
# preserves the other environment's deployment tag, and updates only the selected environment's tag.
# A temporary detached worktree shares checkout authentication. Only that temporary checkout is reset.
# An advanced source branch makes this build stale if build inputs changed. Documentation-only descendants are safe.
# A rejected target push retries from the new target tip.
set -euo pipefail

fail() {
  echo "::error::$*" >&2
  exit 1
}

SHA="${SHA:?SHA env var required}"
REPO="${REPO:?REPO env var required}"
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || fail 'SHA must contain exactly 40 lowercase hexadecimal characters'
[[ "$REPO" =~ ^[a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9_-]*$ ]] || fail 'REPO must be a lowercase owner/repository name'

case "$BRANCH" in
  main) selected_environment=production ;;
  develop) selected_environment=staging ;;
  *) fail "branch '${BRANCH}' has no environment; use main or develop" ;;
esac
[[ "${ENVIRONMENT:-$selected_environment}" == "$selected_environment" ]] || fail 'ENVIRONMENT does not match BRANCH'
TARGET_BRANCH="${TARGET_BRANCH:-deploy/$selected_environment}"
[[ "$TARGET_BRANCH" == "deploy/$selected_environment" ]] || fail 'TARGET_BRANCH does not match BRANCH'

source_checkout="$(git rev-parse --show-toplevel)"
temporary_directory="$(mktemp -d)"
pin_checkout="${temporary_directory}/checkout"
# shellcheck disable=SC2329 # Called by the EXIT trap.
cleanup() {
  if [ -d "$pin_checkout" ]; then
    git -C "$source_checkout" worktree remove --force "$pin_checkout"
  fi
  rm -rf "$temporary_directory"
}
trap 'cleanup' EXIT

# Return the single canonical site image tag. Missing, duplicated or quoted image lines fail loudly.
image_tag() {
  local file="$1" pattern matches
  pattern="^[[:space:]]*image: ghcr\\.io/${REPO//./\\.}:sha-([0-9a-f]{40}|unpinned)$"
  matches="$(grep -Ec "$pattern" "$file" || true)"
  [[ "$matches" == 1 ]] || fail "expected one canonical image line in ${file}"
  sed -nE "s#^[[:space:]]*image: ghcr\\.io/${REPO//./\\.}:(sha-([0-9a-f]{40}|unpinned))\$#\\1#p" "$file"
}

# Keep these ignored paths aligned with build.yml. Nested card Markdown is a build input.
source_is_current() {
  local tip="$1" changed_path
  git -C "$source_checkout" merge-base --is-ancestor "$SHA" "$tip" || return 1
  git -C "$source_checkout" diff --name-only -z "$SHA" "$tip" >"${temporary_directory}/changes" || fail 'cannot compare build inputs'
  while IFS= read -r -d '' changed_path; do
    case "$changed_path" in
      docs/*|research/*|.planning/*) continue ;;
    esac
    if [[ "$changed_path" != */* && "$changed_path" == *.md ]]; then
      continue
    fi
    return 1
  done <"${temporary_directory}/changes"
  return 0
}

MAX_ATTEMPTS=3
for ((attempt = 1; attempt <= MAX_ATTEMPTS; attempt++)); do
  # FETCH_HEAD lists these two explicit refs in order. Neither source branch is checked out or changed.
  if ! git -C "$source_checkout" fetch -q origin "refs/heads/$BRANCH" "refs/heads/$TARGET_BRANCH"; then
    fail "cannot fetch deployment refs; seed ${TARGET_BRANCH} from ${BRANCH} with its existing image pins before retrying"
  fi
  fetch_head="$(git -C "$source_checkout" rev-parse --path-format=absolute --git-path FETCH_HEAD)"
  source_tip="$(awk 'NR == 1 {print $1}' "$fetch_head")"
  target_tip="$(awk 'NR == 2 {print $1}' "$fetch_head")"
  if ! source_is_current "$source_tip"; then
    echo "stale build: ${BRANCH} has different build inputs or ancestry from sha-${SHA:0:12}; deployment unchanged"
    exit 0
  fi
  if [ "$attempt" -eq 1 ]; then
    git -C "$source_checkout" worktree add -q --detach "$pin_checkout" "$target_tip"
  else
    # This path is an owned temporary worktree. The original checkout can contain local edits.
    git -C "$pin_checkout" reset -q --hard "$target_tip"
  fi

  current_tag="$(image_tag "${pin_checkout}/deploy/${selected_environment}/compose.yaml")"
  current_sha="${current_tag#sha-}"
  if [[ "$current_sha" != "$SHA" ]] &&
    git -C "$source_checkout" cat-file -e "${current_sha}^{commit}" 2>/dev/null &&
    git -C "$source_checkout" merge-base --is-ancestor "$SHA" "$current_sha"; then
    echo "stale build: ${TARGET_BRANCH} already pins a newer source commit; deployment unchanged"
    exit 0
  fi

  for environment in staging production; do
    compose="deploy/${environment}/compose.yaml"
    tag="$(image_tag "${pin_checkout}/${compose}")"
    git -C "$pin_checkout" restore --source="$SHA" --worktree -- "$compose"
    image_tag "${pin_checkout}/${compose}" >/dev/null
    if [[ "$environment" == "$selected_environment" ]]; then
      tag="sha-${SHA}"
    fi
    sed -i.bak -E "s#^([[:space:]]*image: ghcr\\.io/${REPO//./\\.}:).*#\\1${tag}#" "${pin_checkout}/${compose}"
    rm "${pin_checkout}/${compose}.bak"
    [[ "$(image_tag "${pin_checkout}/${compose}")" == "$tag" ]] || fail "image pin did not take in ${compose}"
  done

  git -C "$pin_checkout" add -- deploy/staging/compose.yaml deploy/production/compose.yaml
  if git -C "$pin_checkout" diff --cached --quiet; then
    echo 'already pinned'
    exit 0
  fi
  git -C "$pin_checkout" -c user.name='github-actions[bot]' \
    -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
    commit -q -m "chore(deploy): ${selected_environment} → sha-${SHA:0:12}"
  if git -C "$pin_checkout" push -q origin "HEAD:refs/heads/${TARGET_BRANCH}"; then
    echo "pinned sha-${SHA:0:12} to ${TARGET_BRANCH} on attempt ${attempt}/${MAX_ATTEMPTS}"
    exit 0
  fi
  echo "push rejected on attempt ${attempt}/${MAX_ATTEMPTS}; fetching source and target before retrying"
done
fail "failed to pin sha-${SHA} after ${MAX_ATTEMPTS} attempts; rerun the pin job"
