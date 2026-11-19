export interface ScriptRun {
  script: 'latin' | 'devanagari';
  text: string;
}

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export const A4_PDF_WIDTH_PT = 595.28;
export const A4_PDF_HEIGHT_PT = 841.89;

const DEVANAGARI_CHAR_RE = /[\u0900-\u097F\uA8E0-\uA8FF]/;
const INHERIT_SCRIPT_PUNCT_RE = /[\s.,:;!?()\-\u200C\u200D]/;

export function isDevanagariChar(ch: string): boolean {
  return DEVANAGARI_CHAR_RE.test(ch);
}

/**
 * Splits a single visual line of text into contiguous script runs so
 * Latin/numeric runs use NotoSans (standard editable PDF text) and
 * Devanagari runs are shaped via HarfBuzz + NotoSansDevanagari.
 */
export function splitByScriptRuns(input: string): ScriptRun[] {
  if (!input) return [];

  const chars = Array.from(input);
  const runs: ScriptRun[] = [];

  let i = 0;
  while (i < chars.length) {
    // Determine script for the current position
    let script: 'latin' | 'devanagari';
    if (isDevanagariChar(chars[i])) {
      script = 'devanagari';
    } else if (!INHERIT_SCRIPT_PUNCT_RE.test(chars[i])) {
      script = 'latin';
    } else {
      // Whitespace/punctuation at start or boundary: peek ahead to see if next strong char is Devanagari
      // and previous run was Devanagari
      const prevScript = runs.length > 0 ? runs[runs.length - 1].script : 'latin';
      let nextStrong: 'latin' | 'devanagari' | null = null;
      for (let k = i; k < chars.length; k++) {
        if (isDevanagariChar(chars[k])) {
          nextStrong = 'devanagari';
          break;
        }
        if (!INHERIT_SCRIPT_PUNCT_RE.test(chars[k])) {
          nextStrong = 'latin';
          break;
        }
      }
      script =
        prevScript === 'devanagari' && (nextStrong === 'devanagari' || nextStrong === null)
          ? 'devanagari'
          : 'latin';
    }

    let chunk = chars[i];
    i++;

    while (i < chars.length) {
      const ch = chars[i];
      if (script === 'devanagari') {
        if (isDevanagariChar(ch)) {
          chunk += ch;
          i++;
          continue;
        }
        if (INHERIT_SCRIPT_PUNCT_RE.test(ch)) {
          // Include internal spaces/punctuation in the Devanagari run only if
          // another Devanagari char (or end-of-line punctuation like ':'/'.') follows without Latin
          let nextStrong: 'latin' | 'devanagari' | null = null;
          for (let k = i; k < chars.length; k++) {
            if (isDevanagariChar(chars[k])) {
              nextStrong = 'devanagari';
              break;
            }
            if (!INHERIT_SCRIPT_PUNCT_RE.test(chars[k])) {
              nextStrong = 'latin';
              break;
            }
          }
          if (nextStrong === 'devanagari' || (nextStrong === null && ch !== ' ')) {
            chunk += ch;
            i++;
            continue;
          }
        }
        break;
      } else {
        if (!isDevanagariChar(ch)) {
          chunk += ch;
          i++;
          continue;
        }
        break;
      }
    }

    if (runs.length > 0 && runs[runs.length - 1].script === script) {
      runs[runs.length - 1].text += chunk;
    } else {
      runs.push({ script, text: chunk });
    }
  }

  return runs;
}

export function parseCssColor(cssColor: string): RgbaColor {
  const match = cssColor
    .trim()
    .match(/^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i);
  if (!match) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  const r = Math.min(255, Math.max(0, Number(match[1]))) / 255;
  const g = Math.min(255, Math.max(0, Number(match[2]))) / 255;
  const b = Math.min(255, Math.max(0, Number(match[3]))) / 255;
  const a = match[4] !== undefined ? Math.min(1, Math.max(0, Number(match[4]))) : 1;
  return { r, g, b, a };
}

export function encodeUtf16BeHexWithBom(text: string): string {
  let hex = 'FEFF';
  for (let i = 0; i < text.length; i++) {
    hex += text.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0');
  }
  return hex;
}

export function decodeDataUrlToBytes(dataUrl: string): Uint8Array {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    throw new Error('Invalid data URL');
  }
  const base64 = dataUrl.slice(commaIdx + 1);
  const binaryStr =
    typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

export function groupClusterCodePoints(
  text: string,
  shapedGlyphs: readonly { cluster: number }[]
): Map<number, number[]> {
  const uniqueSorted = [...new Set(shapedGlyphs.map((g) => g.cluster))].sort(
    (a, b) => a - b
  );
  const map = new Map<number, number[]>();
  for (let i = 0; i < uniqueSorted.length; i++) {
    const start = uniqueSorted[i];
    const end = i + 1 < uniqueSorted.length ? uniqueSorted[i + 1] : text.length;
    const slice = text.slice(start, end);
    const cps: number[] = [];
    for (const ch of slice) {
      const cp = ch.codePointAt(0);
      if (cp !== undefined) cps.push(cp);
    }
    map.set(start, cps);
  }
  return map;
}

export function pxRectToPdfBox(
  rect: { left: number; top: number; width: number; height: number },
  pageRect: { left: number; top: number; width: number; height: number }
): { x: number; y: number; width: number; height: number; scaleX: number; scaleY: number } {
  const scaleX = A4_PDF_WIDTH_PT / pageRect.width;
  const scaleY = A4_PDF_HEIGHT_PT / pageRect.height;
  const x = (rect.left - pageRect.left) * scaleX;
  const width = rect.width * scaleX;
  const height = rect.height * scaleY;
  const y = A4_PDF_HEIGHT_PT - (rect.top - pageRect.top + rect.height) * scaleY;
  return { x, y, width, height, scaleX, scaleY };
}

export interface PdfBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeObjectFitRect(
  boxRect: PdfBox,
  naturalWidth: number,
  naturalHeight: number,
  objectFit: string
): PdfBox {
  if (
    objectFit !== 'contain' ||
    naturalWidth <= 0 ||
    naturalHeight <= 0 ||
    boxRect.width <= 0 ||
    boxRect.height <= 0
  ) {
    return boxRect;
  }
  const scale = Math.min(boxRect.width / naturalWidth, boxRect.height / naturalHeight);
  const drawnWidth = naturalWidth * scale;
  const drawnHeight = naturalHeight * scale;
  return {
    x: boxRect.x + (boxRect.width - drawnWidth) / 2,
    y: boxRect.y + (boxRect.height - drawnHeight) / 2,
    width: drawnWidth,
    height: drawnHeight,
  };
}

export interface BorderSegment {
  orientation: 'h' | 'v';
  fixedPos: number;
  start: number;
  end: number;
  thickness: number;
  color: RgbaColor;
}

export function deduplicateBorderSegments(segments: BorderSegment[]): BorderSegment[] {
  const buckets = new Map<string, BorderSegment[]>();

  for (const seg of segments) {
    if (seg.end <= seg.start || seg.thickness <= 0 || seg.color.a <= 0) continue;
    const normStart = Math.min(seg.start, seg.end);
    const normEnd = Math.max(seg.start, seg.end);
    const quantizedPos = Math.round(seg.fixedPos * 1.5); // ~0.67pt tolerance collapses adjacent borders cleanly
    const key = [
      seg.orientation,
      quantizedPos,
      Math.round(seg.thickness * 10),
      Math.round(seg.color.r * 255),
      Math.round(seg.color.g * 255),
      Math.round(seg.color.b * 255),
      Math.round(seg.color.a * 100),
    ].join('|');

    const list = buckets.get(key) ?? [];
    list.push({ ...seg, start: normStart, end: normEnd });
    buckets.set(key, list);
  }

  const merged: BorderSegment[] = [];
  for (const group of buckets.values()) {
    group.sort((a, b) => a.start - b.start);
    let current = group[0];
    for (let i = 1; i < group.length; i++) {
      const next = group[i];
      if (next.start <= current.end + 1.0) {
        current = {
          ...current,
          end: Math.max(current.end, next.end),
          fixedPos: (current.fixedPos + next.fixedPos) / 2,
        };
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);
  }

  return merged;
}

