#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_EXTENSIONS="${IMAGE_EXTENSIONS:-png|jpg|jpeg|gif|bmp|svg|webp}"

if ! git -C "$ROOT_DIR" lfs ls-files >/dev/null 2>&1; then
  echo "git-lfs is required to run this check. Please install git-lfs first." >&2
  exit 1
fi

mapfile -t IMAGE_FILES < <(git -C "$ROOT_DIR" ls-tree -r --name-only HEAD | grep -Ei "\.(${IMAGE_EXTENSIONS})$" || true)

if [ "${#IMAGE_FILES[@]}" -eq 0 ]; then
  echo "No image files found in repository."
  exit 0
fi

mapfile -t LFS_FILES < <(git -C "$ROOT_DIR" lfs ls-files --name-only)
declare -A LFS_SET
for file in "${LFS_FILES[@]}"; do
  LFS_SET["$file"]=1
done

NON_LFS=()
for file in "${IMAGE_FILES[@]}"; do
  if [[ -z "${LFS_SET["$file"]+x}" ]]; then
    NON_LFS+=("$file")
  fi
done

if [ "${#NON_LFS[@]}" -ne 0 ]; then
  echo "Found image files not tracked by Git LFS:"
  for file in "${NON_LFS[@]}"; do
    echo "  $file"
  done
  exit 1
fi

echo "All image files are tracked by Git LFS."
