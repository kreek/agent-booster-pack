#!/usr/bin/env bash
# migration-preflight.sh — scan a migration file for unsafe patterns.
# Input: path to a .sql / .rb / .py migration, or '-' to read stdin.
# Output: findings list, one per line, prefixed [severity]. Warning-only.
# Exit codes: 0 clean, 1 findings reported, 2 usage error.
# Self-test: bash migration-preflight.sh --self-test

set -u

self_test() {
  tmp=$(mktemp)
  trap 'rm -f "$tmp"' EXIT
  cat >"$tmp" <<'EOF'
ALTER TABLE orders DROP COLUMN status;
ALTER TABLE orders ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN created_at TIMESTAMP DEFAULT now();
CREATE INDEX idx_orders_user ON orders(user_id);
UPDATE orders SET processed = true;
ALTER TABLE users RENAME COLUMN email TO email_address;
EOF
  out=$("$0" "$tmp" 2>&1) || true
  for expected in "DROP COLUMN" "volatile default" "non-concurrent" "unbounded UPDATE" "RENAME"; do
    case "$out" in
      *"$expected"*) ;;
      *) printf 'self-test failed: missing %q in output\n' "$expected" >&2
         printf '%s\n' "$out" >&2
         exit 1 ;;
    esac
  done
  echo "self-test ok"
  exit 0
}

if [ "${1:-}" = "--self-test" ]; then
  self_test
fi

if [ $# -ne 1 ]; then
  echo "usage: $0 <migration-file|-|--self-test>" >&2
  exit 2
fi

file="$1"
if [ "$file" = "-" ]; then
  content=$(cat)
else
  [ -r "$file" ] || { echo "cannot read $file" >&2; exit 2; }
  content=$(cat "$file")
fi

# Normalise: collapse to single line per semicolon-terminated statement-ish
# and lowercase for easier matching (keep original for the report).
norm=$(printf '%s' "$content" | tr '\r\n' '  ' | tr -s ' ')
lc=$(printf '%s' "$norm" | tr '[:upper:]' '[:lower:]')

findings=0
report() {
  printf '[%s] %s\n' "$1" "$2"
  findings=1
}

# 1. DROP COLUMN — always suspect unless phase 3 of expand-contract.
if printf '%s' "$lc" | grep -qE 'drop[[:space:]]+column'; then
  report HIGH "DROP COLUMN detected — confirm phase 3 of expand-contract, with a preceding deploy where the app no longer reads the column."
fi

# 2. RENAME COLUMN / RENAME TO — breaks old code on rollback.
if printf '%s' "$lc" | grep -qE 'rename[[:space:]]+column|rename[[:space:]]+to|rename_column'; then
  report HIGH "RENAME detected — on rollback, old code reads the old name. Use add-column + backfill + dual-write + drop-old across separate deploys."
fi

# 3. NOT NULL add without DEFAULT → table rewrite on most DBs.
if printf '%s' "$lc" | grep -qE 'add[[:space:]]+column[^;]*not[[:space:]]+null' ; then
  if ! printf '%s' "$lc" | grep -qE 'add[[:space:]]+column[^;]*not[[:space:]]+null[^;]*default'; then
    report HIGH "ADD COLUMN NOT NULL without DEFAULT — rewrites the table on most DBs. Add nullable, backfill, then add constraint via NOT VALID + VALIDATE."
  fi
fi

# 4. Volatile defaults rewrite the table on PG (pre-18 behaviour).
if printf '%s' "$lc" | grep -qE 'default[[:space:]]+(now\(\)|current_timestamp|clock_timestamp\(\)|gen_random_uuid\(\)|uuid_generate_v[0-9]+\(\)|random\(\))'; then
  report MEDIUM "volatile default on ADD COLUMN — rewrites the table on most PG versions. Add without default, backfill, then SET DEFAULT for future rows."
fi

# 5. CREATE INDEX without CONCURRENTLY on PG.
if printf '%s' "$lc" | grep -qE 'create[[:space:]]+(unique[[:space:]]+)?index'; then
  if ! printf '%s' "$lc" | grep -qE 'create[[:space:]]+(unique[[:space:]]+)?index[[:space:]]+concurrently'; then
    report HIGH "non-concurrent CREATE INDEX — locks the table on PG. Use CREATE INDEX CONCURRENTLY (and algorithm: :concurrently in Rails)."
  fi
fi

# 6. Unbounded UPDATE / DELETE — no WHERE clause.
# Split on ';', check each chunk (lowercased) for update/delete without where.
unbounded=$(printf '%s' "$lc" | tr ';' '\n' | awk '
  /^[[:space:]]*(update|delete from)[[:space:]]/ {
    if ($0 !~ /where/) { print; found=1 }
  }
  END { exit !found }
')
if [ -n "$unbounded" ]; then
  report HIGH "unbounded UPDATE / DELETE (no WHERE) — can rewrite the whole table and hold locks for minutes. Batch with a WHERE range."
fi

# 7. TRUNCATE on a non-temporary table.
if printf '%s' "$lc" | grep -qE 'truncate[[:space:]]+table|truncate[[:space:]]+[a-z_]'; then
  report HIGH "TRUNCATE detected — acquires AccessExclusiveLock; destructive and non-reversible without backup restore."
fi

# 8. Foreign key without NOT VALID.
if printf '%s' "$lc" | grep -qE 'add[[:space:]]+constraint[^;]*foreign[[:space:]]+key' \
   && ! printf '%s' "$lc" | grep -qE 'add[[:space:]]+constraint[^;]*foreign[[:space:]]+key[^;]*not[[:space:]]+valid'; then
  report MEDIUM "ADD FOREIGN KEY without NOT VALID — holds share-row-exclusive lock on both tables during validation. Use NOT VALID then VALIDATE CONSTRAINT."
fi

# 9. LOCK / ACCESS EXCLUSIVE explicit.
if printf '%s' "$lc" | grep -qE 'lock[[:space:]]+table|access[[:space:]]+exclusive'; then
  report MEDIUM "explicit LOCK TABLE / ACCESS EXCLUSIVE detected — confirm this is intentional and scoped."
fi

if [ "$findings" -eq 0 ]; then
  echo "no obvious issues found (this is a checklist, not a guarantee)"
fi

exit "$findings"
