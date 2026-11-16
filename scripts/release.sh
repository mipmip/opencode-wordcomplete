#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/release.sh <version>
  scripts/release.sh --dry-run <version>
EOF
}

dry_run=false
version=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=true ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      if [ -n "$version" ]; then
        usage
        exit 2
      fi
      version="$arg"
      ;;
  esac
done

if [ -z "$version" ]; then
  usage
  exit 2
fi

if ! [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "release: version must be semver without a leading v: $version" >&2
  exit 1
fi

if [ "$dry_run" = false ] && [ -n "$(git status --porcelain)" ]; then
  echo "release: working copy is dirty, commit or discard changes first" >&2
  exit 1
fi

if ! grep -q "^## \[$version\]" CHANGELOG.md; then
  echo "release: CHANGELOG.md has no '## [$version]' section" >&2
  exit 1
fi

npm_cmd() {
  if command -v npm >/dev/null 2>&1; then
    npm "$@"
  else
    nix shell nixpkgs#nodejs -c npm "$@"
  fi
}

if [ "$dry_run" = true ]; then
  echo "release: dry run for $version"
  echo "  npm version $version --no-git-tag-version"
  echo "  npm publish"
  echo "  jj commit -m \"release $version\""
  echo "  jj bookmark set main -r @-"
  echo "  jj git push --bookmark main"
  echo "  git tag $version"
  echo "  git push origin $version"
  exit 0
fi

nix flake check
npm_cmd version "$version" --no-git-tag-version
npm_cmd publish

jj commit -m "release $version"
jj bookmark set main -r @-
jj git export
git tag "$version"
jj git push --bookmark main
git push origin "$version"
