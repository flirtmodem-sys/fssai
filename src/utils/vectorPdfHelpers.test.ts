import test from 'node:test';
import assert from 'node:assert/strict';
import {
  A4_PDF_HEIGHT_PT,
  A4_PDF_WIDTH_PT,
  computeObjectFitRect,
  decodeDataUrlToBytes,
  deduplicateBorderSegments,
  encodeUtf16BeHexWithBom,
  groupClusterCodePoints,
  parseCssColor,
  pxRectToPdfBox,
  splitByScriptRuns,
} from './vectorPdfHelpers';

test('splitByScriptRuns keeps Devanagari phrases contiguous and isolates Latin segments', () => {
  const runs = splitByScriptRuns('अनुज्ञप्ति संख्या / License Number: 12826015000118');
  assert.deepEqual(runs, [
    { script: 'devanagari', text: 'अनुज्ञप्ति संख्या' },
    { script: 'latin', text: ' / License Number: 12826015000118' },
  ]);

  const mixed = splitByScriptRuns(
    'Name & Registered Office / अनुज्ञप्तिधारी के पंजीकृत कार्यालय का नाम और पता:'
  );
  assert.deepEqual(mixed, [
    { script: 'latin', text: 'Name & Registered Office / ' },
    { script: 'devanagari', text: 'अनुज्ञप्तिधारी के पंजीकृत कार्यालय का नाम और पता:' },
  ]);
});

test('parseCssColor parses rgb() and rgba() strings accurately', () => {
  assert.deepEqual(parseCssColor('rgb(217, 217, 217)'), {
    r: 217 / 255,
    g: 217 / 255,
    b: 217 / 255,
    a: 1,
  });
  assert.deepEqual(parseCssColor('rgba(0, 0, 0, 0)'), {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  });
  const blue = parseCssColor('rgb(29, 78, 216)');
  assert.ok(Math.abs(blue.r - 29 / 255) < 1e-6);
  assert.ok(Math.abs(blue.b - 216 / 255) < 1e-6);
});

test('encodeUtf16BeHexWithBom encodes BOM + UTF-16BE code units', () => {
  assert.equal(encodeUtf16BeHexWithBom('AB'), 'FEFF00410042');
  assert.equal(encodeUtf16BeHexWithBom('अ'), 'FEFF0905');
});

test('decodeDataUrlToBytes decodes base64 PNG payloads cleanly', () => {
  const payload = 'data:image/png;base64,SGVsbG8=';
  const bytes = decodeDataUrlToBytes(payload);
  assert.deepEqual(Array.from(bytes), [72, 101, 108, 108, 111]);
});

test('groupClusterCodePoints maps HarfBuzz clusters to original codepoints', () => {
  const text = 'अनुज्ञप्ति';
  const map = groupClusterCodePoints(text, [
    { cluster: 0 },
    { cluster: 1 },
    { cluster: 1 },
    { cluster: 3 },
    { cluster: 6 },
    { cluster: 6 },
    { cluster: 6 },
  ]);
  assert.deepEqual(map.get(0), ['अ'.codePointAt(0)]);
  assert.deepEqual(map.get(3), ['ज'.codePointAt(0), '्'.codePointAt(0), 'ञ'.codePointAt(0)]);
});

test('pxRectToPdfBox converts 794x1122 A4 px rect to 595.28x841.89 PDF pt coordinates', () => {
  const box = pxRectToPdfBox(
    { left: 0, top: 0, width: 794, height: 1122 },
    { left: 0, top: 0, width: 794, height: 1122 }
  );
  assert.ok(Math.abs(box.x) < 1e-6);
  assert.ok(Math.abs(box.y) < 1e-6);
  assert.ok(Math.abs(box.width - A4_PDF_WIDTH_PT) < 1e-6);
  assert.ok(Math.abs(box.height - A4_PDF_HEIGHT_PT) < 1e-6);
});

test('computeObjectFitRect centers contained image preserving natural aspect ratio', () => {
  const box = { x: 100, y: 200, width: 100, height: 80 };
  const fitted = computeObjectFitRect(box, 200, 200, 'contain');
  assert.deepEqual(fitted, {
    x: 110,
    y: 200,
    width: 80,
    height: 80,
  });
});

test('deduplicateBorderSegments merges overlapping collapsed table borders', () => {
  const black = { r: 0, g: 0, b: 0, a: 1 };
  const merged = deduplicateBorderSegments([
    { orientation: 'h', fixedPos: 500, start: 40, end: 200, thickness: 0.75, color: black },
    { orientation: 'h', fixedPos: 500.2, start: 199.5, end: 400, thickness: 0.75, color: black },
    { orientation: 'h', fixedPos: 500, start: 40, end: 200, thickness: 0.75, color: black },
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].start, 40);
  assert.equal(merged[0].end, 400);
});

