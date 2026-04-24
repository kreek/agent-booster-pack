#!/usr/bin/env bash
# sniff-mocks.sh — scan a test tree for common mock-abuse patterns.
# Warning-only; use the output as a review checklist, not a CI gate.
#
# Usage:  sniff-mocks.sh <dir>
#         sniff-mocks.sh --self-test
# Exit:   0 = clean, 1 = findings, 2 = usage error.

set -u

self_test() {
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT

  # Fixture with each pattern this script should catch. Name the spec file
  # after the module being mocked so the "class under test" heuristic fires.
  cat >"$tmp/order-service.test.ts" <<'EOF'
import { vi } from 'vitest'
import { OrderService } from './order-service'

// Pattern 1: mocking the class under test
vi.mock('./order-service')

// Pattern 2: mocking an internal collaborator by relative path
vi.mock('./internal/helpers')

// Pattern 3: call-count assertion without behaviour assertion
test('calls foo', () => {
  const spy = vi.fn()
  doThing(spy)
  expect(spy).toHaveBeenCalledTimes(1)
})

// Pattern 4: private-method access in a test
test('calls private', () => {
  const svc = new OrderService()
  expect((svc as any)._internalCompute()).toBe(42)
})

// Pattern 5: arbitrary waits
test('eventually', async () => {
  await new Promise(r => setTimeout(r, 200))
  expect(true).toBe(true)
})
EOF

  out=$("$0" "$tmp" 2>&1) || true
  for expect in "class under test" "internal collaborator" "call-count assertion" "private method" "arbitrary wait"; do
    case "$out" in
      *"$expect"*) ;;
      *) printf 'self-test failed: missing %q in output\n' "$expect" >&2
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

if [ $# -ne 1 ] || [ ! -d "$1" ]; then
  echo "usage: $0 <test-dir>   (or --self-test)" >&2
  exit 2
fi

dir="$1"
findings=0

report() {
  printf '[%s] %s: %s\n' "$1" "$2" "$3"
  findings=1
}

# 1. Mocking the class/module under test.
# Heuristic: a vi.mock / jest.mock / mock.module call where the imported path
# matches a file the test also imports non-mocked.
while IFS= read -r -d '' f; do
  # Pull the relative paths inside vi.mock("…") / jest.mock("…").
  while IFS= read -r mock_path; do
    [ -n "$mock_path" ] || continue
    # Is there a corresponding import of the same path?
    if grep -qE "from[[:space:]]+['\"]${mock_path}['\"]" "$f" 2>/dev/null; then
      # Heuristic: if the path looks like the subject under test (sits
      # alongside the spec file), flag it.
      base=$(basename "$mock_path")
      if printf '%s' "$f" | grep -q -- "${base%.*}"; then
        report HIGH "class under test" "$f mocks $mock_path (same module family as the spec)"
      fi
    fi
  done < <(grep -oE "(vi|jest)\.mock\([[:space:]]*['\"]([^'\"]+)['\"]" "$f" 2>/dev/null | sed -E "s/.*['\"]([^'\"]+)['\"].*/\1/")
done < <(find "$dir" -type f \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.test.js' -o -name '*.spec.ts' -o -name '*.spec.tsx' -o -name '*.spec.js' \) -print0)

# 2. Mocking an internal collaborator by relative path.
if grep -REn --include='*.test.*' --include='*.spec.*' \
    "(vi|jest)\.mock\([[:space:]]*['\"]\.{1,2}/[^'\"]+['\"]" "$dir" 2>/dev/null \
    | grep -v 'node_modules' | grep -v '__mocks__' >/tmp/sniff-mocks.$$; then
  while IFS= read -r line; do
    report MEDIUM "internal collaborator" "$line"
  done </tmp/sniff-mocks.$$
fi
rm -f /tmp/sniff-mocks.$$

# 3. Call-count assertion without behaviour assertion in the same test.
# Heuristic: toHaveBeenCalledTimes / toHaveBeenCalled present,
# and no toBe/toEqual/toHaveProperty/toMatch within the same 'test(' / 'it('.
find "$dir" -type f \( -name '*.test.*' -o -name '*.spec.*' \) -not -path '*/node_modules/*' | while read -r f; do
  awk '
    /^[[:space:]]*(test|it)[[:space:]]*\(/ { in_test=1; body=""; start=NR; next }
    in_test { body = body "\n" $0 }
    in_test && /^[[:space:]]*\}\)[[:space:]]*;?[[:space:]]*$/ {
      has_count = (body ~ /toHaveBeenCalledTimes|toHaveBeenCalled|calledWith/)
      has_other = (body ~ /toBe\(|toEqual\(|toStrictEqual\(|toMatch\(|toHaveProperty\(|toContain\(|toThrow\(/)
      if (has_count && !has_other) {
        printf "%s:%d\n", FILENAME, start
      }
      in_test=0
    }
  ' "$f"
done | while read -r hit; do
  [ -n "$hit" ] && report MEDIUM "call-count assertion" "$hit — no behaviour assertion in the same test"
done

# 4. Private-method access via `(x as any)._name(` or `(x as any).#name`.
while IFS= read -r line; do
  report MEDIUM "private method" "$line"
done < <(grep -REn --include='*.test.*' --include='*.spec.*' \
    "\([A-Za-z0-9_]+[[:space:]]+as[[:space:]]+any\)\.(_|#)[A-Za-z0-9_]+" "$dir" 2>/dev/null \
    | grep -v 'node_modules')

# 5. Arbitrary waits via setTimeout/sleep/Thread.sleep in tests.
while IFS= read -r line; do
  report HIGH "arbitrary wait" "$line"
done < <(grep -REn --include='*.test.*' --include='*.spec.*' \
    "setTimeout\([[:space:]]*[^,]*,[[:space:]]*[0-9]+|time\.sleep\(|Thread\.sleep\(|sleep [0-9]" "$dir" 2>/dev/null \
    | grep -v 'node_modules' | grep -v 'useFakeTimers' | grep -v 'vi\.useFakeTimers')

if [ "$findings" -eq 0 ]; then
  echo "no obvious mock-abuse patterns found (this is a checklist, not a guarantee)"
fi

exit "$findings"
