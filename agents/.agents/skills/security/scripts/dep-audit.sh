#!/usr/bin/env bash
# dep-audit.sh — detect the lockfile and run the matching dependency auditor.
# Input: run from the project root (or pass --dir <path>).
# Output: stdout = normalised findings; exit 0 = clean, 1 = findings, 2 = no auditor available.

set -u

dir="."
self_test=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dir) dir="$2"; shift 2 ;;
    --self-test) self_test=1; shift ;;
    -h|--help) sed -n '2,5p' "$0"; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

run_self_test() {
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  echo '{"name":"test","version":"0.0.0"}' > "$tmp/package.json"
  echo '{"lockfileVersion":3}' > "$tmp/package-lock.json"
  out=$("$0" --dir "$tmp" 2>&1) || true
  case "$out" in
    *npm*|*"no auditor"*) ;;
    *) echo "self-test failed: $out" >&2; exit 1 ;;
  esac

  cargo_tmp="$tmp/cargo-project"
  bin_tmp="$tmp/bin"
  mkdir "$cargo_tmp" "$bin_tmp"
  echo '# lock' > "$cargo_tmp/Cargo.lock"
  cat > "$bin_tmp/cargo" <<'EOF'
#!/usr/bin/env bash
exit 101
EOF
  chmod +x "$bin_tmp/cargo"
  PATH="$bin_tmp:/usr/bin:/bin" "$0" --dir "$cargo_tmp" >/dev/null 2>&1
  status=$?
  if [ "$status" -ne 2 ]; then
    echo "self-test failed: missing cargo-audit should exit 2, got $status" >&2
    exit 1
  fi

  echo "self-test ok"
  exit 0
}

[ "$self_test" -eq 1 ] && run_self_test

cd "$dir" || { echo "cannot cd $dir" >&2; exit 2; }

have() { command -v "$1" >/dev/null 2>&1; }

findings=0

if [ -f pnpm-lock.yaml ]; then
  echo "== pnpm audit =="
  have pnpm || { echo "pnpm not installed" >&2; exit 2; }
  pnpm audit --prod || findings=1
elif [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
  echo "== npm audit =="
  have npm || { echo "npm not installed" >&2; exit 2; }
  npm audit --omit=dev || findings=1
elif [ -f yarn.lock ]; then
  echo "== yarn audit =="
  have yarn || { echo "yarn not installed" >&2; exit 2; }
  yarn npm audit --environment production || findings=1
elif [ -f bun.lockb ] || [ -f bun.lock ]; then
  echo "== bun audit =="
  have bun || { echo "bun not installed" >&2; exit 2; }
  bun audit || findings=1
elif [ -f uv.lock ] || [ -f pyproject.toml ] || [ -f requirements.txt ] || [ -f poetry.lock ] || [ -f Pipfile.lock ]; then
  echo "== pip-audit =="
  if have pip-audit; then
    pip-audit || findings=1
  elif have uv; then
    uv tool run pip-audit || findings=1
  else
    echo "pip-audit not installed (try 'uv tool install pip-audit')" >&2; exit 2
  fi
elif [ -f Cargo.lock ]; then
  echo "== cargo audit =="
  if have cargo-audit; then
    cargo-audit || findings=1
  elif have cargo && cargo audit --version >/dev/null 2>&1; then
    cargo audit || findings=1
  else
    echo "cargo-audit not installed (try 'cargo install cargo-audit')" >&2; exit 2
  fi
elif [ -f Gemfile.lock ]; then
  echo "== bundler-audit =="
  have bundle || { echo "bundler not installed" >&2; exit 2; }
  bundle exec bundler-audit check --update || findings=1
elif [ -f go.sum ]; then
  echo "== govulncheck =="
  have govulncheck || { echo "govulncheck not installed (go install golang.org/x/vuln/cmd/govulncheck@latest)" >&2; exit 2; }
  govulncheck ./... || findings=1
elif [ -f composer.lock ]; then
  echo "== composer audit =="
  have composer || { echo "composer not installed" >&2; exit 2; }
  composer audit || findings=1
elif [ -f mix.lock ]; then
  echo "== mix deps.audit =="
  have mix || { echo "mix not installed" >&2; exit 2; }
  mix deps.audit || findings=1
else
  echo "no recognised lockfile in $dir" >&2
  exit 2
fi

exit "$findings"
