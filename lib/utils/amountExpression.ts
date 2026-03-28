/**
 * Evaluates left-to-right addition/subtraction only (no eval).
 * Returns null if incomplete or invalid.
 */
export function evaluateAddSubtractExpression(input: string): number | null {
  const s = input.replace(/\s/g, "");
  if (!s) return null;

  let i = 0;

  function consumeNumber(allowUnary: boolean): number | null {
    if (i >= s.length) return null;
    let sign = 1;
    if (allowUnary && (s[i] === "+" || s[i] === "-")) {
      if (s[i] === "-") sign = -1;
      i++;
    }
    const rest = s.slice(i);
    const m = rest.match(/^(\d+\.?\d*|\.\d+)/);
    if (!m) return null;
    i += m[0].length;
    const v = sign * parseFloat(m[0]);
    return Number.isFinite(v) ? v : null;
  }

  const first = consumeNumber(true);
  if (first === null) return null;
  if (i === s.length) return first;

  let total = first;
  while (i < s.length) {
    const op = s[i];
    if (op !== "+" && op !== "-") return null;
    i++;
    const n = consumeNumber(true);
    if (n === null) return null;
    total = op === "+" ? total + n : total - n;
  }
  return Number.isFinite(total) ? total : null;
}

/** True if the string uses + or a minus that is not only a leading unary sign. */
export function looksLikeAddSubExpression(input: string): boolean {
  const t = input.replace(/\s/g, "");
  if (!t) return false;
  if (t.includes("+")) return true;
  return t.indexOf("-", 1) !== -1;
}

export function formatEvaluatedAmount(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (!Number.isFinite(r)) return "";
  if (r % 1 === 0) return String(r);
  return r.toFixed(2).replace(/\.?0+$/, "");
}
