import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "(app)");

/** Collect `min-height` (in rem) that applies to `cls` inside max-width<=720px media blocks. */
function phoneMinHeight(file: string, cls: string): number {
  const css = readFileSync(join(root, file), "utf8");
  let best = 0;
  const media = /@media\s*\(max-width:\s*(\d+)px\)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = media.exec(css))) {
    if (Number(m[1]) < 720) continue; // 720 and wider cover phones; narrower ones only cover part of the range
    // Walk to the matching close brace of the media block.
    let depth = 1;
    let i = media.lastIndex;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      if (css[i] === "}") depth--;
      i++;
    }
    const block = css.slice(media.lastIndex, i - 1);
    const rule = /([^{}]+)\{([^{}]*)\}/g;
    let r: RegExpExecArray | null;
    while ((r = rule.exec(block))) {
      const selectors = r[1].split(",").map((s) => s.trim());
      if (!selectors.includes(`.${cls}`)) continue;
      const h = /min-height:\s*([\d.]+)rem/.exec(r[2]);
      if (h) best = Math.max(best, Number(h[1]));
    }
  }
  return best;
}

// 2.75rem is 44px at the default 16px root size.
const CONTROLS: Array<[string, string[]]> = [
  ["library/[id]/report.module.css", ["copyBtn"]],
  ["library/[id]/qa.module.css", ["submit", "retry"]],
  ["library/library.module.css", ["deleteBtn", "deleteConfirm"]],
  ["shell.module.css", ["menuButton", "navItem", "signOut"]],
  ["profile/profile.module.css", ["button", "small", "secondary"]],
  ["new/AnalyzePanel.module.css", ["button", "link"]],
];

describe("phone width touch targets", () => {
  for (const [file, classes] of CONTROLS) {
    for (const cls of classes) {
      it(`${cls} in ${file} is at least 44px tall at phone width`, () => {
        expect(phoneMinHeight(file, cls)).toBeGreaterThanOrEqual(2.75);
      });
    }
  }
});
