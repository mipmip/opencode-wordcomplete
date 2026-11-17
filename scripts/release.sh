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

current_version=$(sed -nE 's/^  "version": "([^"]+)".*/\1/p' package.json | head -1)

if [ "$dry_run" = true ]; then
  echo "release: dry run for $version"
  echo "  package.json is at $current_version"
  if [ "$current_version" != "$version" ]; then
    echo "  npm version $version --no-git-tag-version"
  fi
  echo "  npm publish"
  if [ "$current_version" != "$version" ]; then
    echo "  jj commit -m \"release $version\""
  fi
  echo "  jj bookmark set main -r @-"
  echo "  jj git push --bookmark main"
  echo "  git tag $version"
  echo "  git push origin $version"
  exit 0
fi

nix flake check
if [ "$current_version" != "$version" ]; then
  npm_cmd version "$version" --no-git-tag-version
fi
npm_cmd publish

if [ -n "$(git status --porcelain)" ]; then
  jj commit -m "release $version"
fi
jj bookmark set main -r @-
jj git export
git tag "$version"
jj git push --bookmark main
git push origin "$version"
