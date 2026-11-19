import fontkit from '@pdf-lib/fontkit';
import {
  PDFDocument,
  PDFFont,
  PDFHexString,
  PDFImage,
  PDFName,
  PDFNumber,
  PDFOperator,
  PDFPage,
  PDFRef,
  PDFString,
  clip,
  closePath,
  endPath,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  rgb,
} from 'pdf-lib';
import {
  A4_PDF_HEIGHT_PT,
  A4_PDF_WIDTH_PT,
  BorderSegment,
  RgbaColor,
  computeObjectFitRect,
  decodeDataUrlToBytes,
  deduplicateBorderSegments,
  encodeUtf16BeHexWithBom,
  groupClusterCodePoints,
  parseCssColor,
  pxRectToPdfBox,
  splitByScriptRuns,
} from './vectorPdfHelpers';

interface LoadedFontBytes {
  latinRegular: Uint8Array;
  latinBold: Uint8Array;
  devaRegular: Uint8Array;
  devaBold: Uint8Array;
}

interface HbFontHandle {
  hb: typeof import('harfbuzzjs');
  devaRegularFont: import('harfbuzzjs').Font;
  devaRegularUpem: number;
  devaBoldFont: import('harfbuzzjs').Font;
  devaBoldUpem: number;
}

interface EmbeddedDocFonts {
  latinRegular: PDFFont;
  latinBold: PDFFont;
  devaRegular: PDFFont;
  devaBold: PDFFont;
}

interface RawLineSegment {
  text: string;
  rawStart: number;
  rawEnd: number;
  rawMap: { rawStart: number; rawEnd: number }[];
  rect: DOMRect;
}

let cachedFontBytesPromise: Promise<LoadedFontBytes> | null = null;
let cachedHbPromise: Promise<HbFontHandle> | null = null;

async function fetchBinaryAsset(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch asset ${url}: ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

function getFontBytes(): Promise<LoadedFontBytes> {
  if (!cachedFontBytesPromise) {
    cachedFontBytesPromise = Promise.all([
      fetchBinaryAsset('/fonts/NotoSans-Regular.ttf'),
      fetchBinaryAsset('/fonts/NotoSans-Bold.ttf'),
      fetchBinaryAsset('/fonts/NotoSansDevanagari-Regular.ttf'),
      fetchBinaryAsset('/fonts/NotoSansDevanagari-Bold.ttf'),
    ]).then(([latinRegular, latinBold, devaRegular, devaBold]) => ({
      latinRegular,
      latinBold,
      devaRegular,
      devaBold,
    }));
  }
  return cachedFontBytesPromise;
}

function getHarfBuzzHandle(fontBytes: LoadedFontBytes): Promise<HbFontHandle> {
  if (!cachedHbPromise) {
    cachedHbPromise = import('harfbuzzjs').then((hb) => {
      const regBlob = new hb.Blob(fontBytes.devaRegular);
      const regFace = new hb.Face(regBlob, 0);
      const devaRegularFont = new hb.Font(regFace);

      const boldBlob = new hb.Blob(fontBytes.devaBold);
      const boldFace = new hb.Face(boldBlob, 0);
      const devaBoldFont = new hb.Font(boldFace);

      return {
        hb,
        devaRegularFont,
        devaRegularUpem: regFace.upem || 1000,
        devaBoldFont,
        devaBoldUpem: boldFace.upem || 1000,
      };
    });
  }
  return cachedHbPromise;
}

function isElementVisible(style: CSSStyleDeclaration): boolean {
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity || '1') > 0
  );
}

function isBoldWeight(fontWeight: string): boolean {
  const numeric = Number.parseInt(fontWeight, 10);
  if (!Number.isNaN(numeric)) {
    return numeric >= 600;
  }
  return fontWeight === 'bold' || fontWeight === 'bolder';
}

function unionRects(rects: DOMRect[]): DOMRect {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const r of rects) {
    if (r.left < left) left = r.left;
    if (r.top < top) top = r.top;
    if (r.right > right) right = r.right;
    if (r.bottom > bottom) bottom = r.bottom;
  }
  return new DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}

function computeClipBoxForElement(
  el: HTMLElement,
  pageEl: HTMLElement,
  pageRect: DOMRect
): { x: number; y: number; width: number; height: number } | null {
  let clipLeft = pageRect.left;
  let clipTop = pageRect.top;
  let clipRight = pageRect.right;
  let clipBottom = pageRect.bottom;
  let hasClip = false;

  let cur: HTMLElement | null = el.parentElement;
  while (cur && cur !== pageEl) {
    const cs = window.getComputedStyle(cur);
    if (
      cs.overflowX === 'hidden' ||
      cs.overflowY === 'hidden' ||
      cs.overflowX === 'clip' ||
      cs.overflowY === 'clip'
    ) {
      const r = cur.getBoundingClientRect();
      clipLeft = Math.max(clipLeft, r.left);
      clipTop = Math.max(clipTop, r.top);
      clipRight = Math.min(clipRight, r.right);
      clipBottom = Math.min(clipBottom, r.bottom);
      hasClip = true;
    }
    cur = cur.parentElement;
  }

  if (!hasClip) return null;
  return pxRectToPdfBox(
    {
      left: clipLeft,
      top: clipTop,
      width: Math.max(0, clipRight - clipLeft),
      height: Math.max(0, clipBottom - clipTop),
    },
    pageRect
  );
}

function isUnderlinedText(el: HTMLElement, pageEl: HTMLElement): boolean {
  let cur: HTMLElement | null = el;
  while (cur && cur !== pageEl) {
    const cs = window.getComputedStyle(cur);
    if (cs.textDecorationLine && cs.textDecorationLine.includes('underline')) {
      return true;
    }
    if (cs.display !== 'inline' && cs.display !== 'inline-block' && cs.display !== 'inline-flex') {
      break;
    }
    cur = cur.parentElement;
  }
  return false;
}

const DEVANAGARI_COMBINING_RE = /[\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0962-\u0963\u200C\u200D]/;

function splitWordClusters(raw: string, start: number, end: number): { start: number; end: number }[] {
  const clusters: { start: number; end: number }[] = [];
  let idx = start;
  while (idx < end) {
    const firstEnd = idx + ((raw.charCodeAt(idx) & 0xf800) === 0xd800 ? 2 : 1);
    let clusterEnd = firstEnd;
    while (clusterEnd < end) {
      const nextCh = raw[clusterEnd];
      if (DEVANAGARI_COMBINING_RE.test(nextCh)) {
        clusterEnd += (raw.charCodeAt(clusterEnd) & 0xf800) === 0xd800 ? 2 : 1;
        // Include consonant immediately after halant (virama \u094D) so conjuncts stay together
        if (raw[clusterEnd - 1] === '\u094D' && clusterEnd < end) {
          clusterEnd += (raw.charCodeAt(clusterEnd) & 0xf800) === 0xd800 ? 2 : 1;
        }
      } else {
        break;
      }
    }
    clusters.push({ start: idx, end: clusterEnd });
    idx = clusterEnd;
  }
  return clusters;
}

function extractVisualLinesFromTextNode(
  textNode: Text,
  fontSizePx: number
): RawLineSegment[] {
  const raw = textNode.data;
  if (!raw || !/\S/.test(raw)) {
    // Preserve single rendered space between inline nodes if it actually occupies horizontal width
    const probeRange = document.createRange();
    probeRange.selectNodeContents(textNode);
    const rects = Array.from(probeRange.getClientRects()).filter(
      (r) => r.width > 0.3 && r.height > 0.3
    );
    if (rects.length === 1) {
      return [
        {
          text: ' ',
          rawStart: 0,
          rawEnd: raw.length,
          rawMap: [{ rawStart: 0, rawEnd: raw.length }],
          rect: rects[0],
        },
      ];
    }
    return [];
  }

  const range = document.createRange();
  range.selectNodeContents(textNode);
  const fullRects = Array.from(range.getClientRects()).filter(
    (r) => r.width > 0.1 && r.height > 0.1
  );
  if (fullRects.length === 0) return [];

  // Tokenize raw string into whitespace & non-whitespace pieces
  const tokens: { start: number; end: number; isWs: boolean; rect: DOMRect }[] = [];
  const tokenRegex = /\S+|\s+/g;
  let match: RegExpExecArray | null;
  const bandThreshold = Math.max(4, fontSizePx * 0.45);

  while ((match = tokenRegex.exec(raw)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const isWs = /^\s+$/.test(match[0]);

    range.setStart(textNode, start);
    range.setEnd(textNode, end);
    const tRects = Array.from(range.getClientRects()).filter(
      (r) => r.width > 0.1 && r.height > 0.1
    );
    if (tRects.length === 0) continue;

    if (isWs) {
      tokens.push({ start, end, isWs: true, rect: tRects[0] });
      continue;
    }

    const firstTop = tRects[0].top;
    const multiBand = tRects.some((r) => Math.abs(r.top - firstTop) > bandThreshold);
    if (!multiBand) {
      tokens.push({ start, end, isWs: false, rect: unionRects(tRects) });
    } else {
      // Mid-word wrap (e.g. long address/email with word-break: break-word)
      const clusters = splitWordClusters(raw, start, end);
      let pieceStart = clusters[0].start;
      let pieceEnd = clusters[0].end;
      range.setStart(textNode, pieceStart);
      range.setEnd(textNode, pieceEnd);
      let pieceRects = Array.from(range.getClientRects()).filter(
        (r) => r.width > 0.1 && r.height > 0.1
      );
      let pieceTop = pieceRects[0]?.top ?? firstTop;

      for (let cIdx = 1; cIdx < clusters.length; cIdx++) {
        const cl = clusters[cIdx];
        range.setStart(textNode, cl.start);
        range.setEnd(textNode, cl.end);
        const cRects = Array.from(range.getClientRects()).filter(
          (r) => r.width > 0.1 && r.height > 0.1
        );
        const cTop = cRects[0]?.top ?? pieceTop;
        if (cRects.length > 0 && Math.abs(cTop - pieceTop) > bandThreshold) {
          if (pieceRects.length > 0) {
            tokens.push({
              start: pieceStart,
              end: pieceEnd,
              isWs: false,
              rect: unionRects(pieceRects),
            });
          }
          pieceStart = cl.start;
          pieceEnd = cl.end;
          pieceRects = cRects;
          pieceTop = cTop;
        } else {
          pieceEnd = cl.end;
          pieceRects.push(...cRects);
        }
      }
      if (pieceRects.length > 0) {
        tokens.push({
          start: pieceStart,
          end: pieceEnd,
          isWs: false,
          rect: unionRects(pieceRects),
        });
      }
    }
  }

  if (tokens.length === 0) return [];

  // Group tokens into visual horizontal lines
  const lines: { top: number; tokens: typeof tokens }[] = [];
  for (const tok of tokens) {
    const existing = lines.find((ln) => Math.abs(ln.top - tok.rect.top) <= bandThreshold);
    if (existing) {
      existing.tokens.push(tok);
    } else {
      lines.push({ top: tok.rect.top, tokens: [tok] });
    }
  }

  const results: RawLineSegment[] = [];
  for (const line of lines) {
    // Trim leading/trailing collapsed whitespace tokens while preserving intentional inline boundary space
    let startIdx = 0;
    while (startIdx < line.tokens.length && line.tokens[startIdx].isWs) {
      startIdx++;
    }
    if (startIdx >= line.tokens.length) continue;

    let endIdx = line.tokens.length - 1;
    while (
      endIdx > startIdx &&
      line.tokens[endIdx].isWs &&
      line.tokens[endIdx].rect.width < 0.5
    ) {
      endIdx--;
    }

    const activeTokens = line.tokens.slice(startIdx, endIdx + 1);
    let collapsedText = '';
    const rawMap: { rawStart: number; rawEnd: number }[] = [];

    for (const tok of activeTokens) {
      if (tok.isWs) {
        collapsedText += ' ';
        rawMap.push({ rawStart: tok.start, rawEnd: tok.end });
      } else {
        const slice = raw.slice(tok.start, tok.end);
        for (let i = 0; i < slice.length; i++) {
          collapsedText += slice[i];
          rawMap.push({ rawStart: tok.start + i, rawEnd: tok.start + i + 1 });
        }
      }
    }

    results.push({
      text: collapsedText,
      rawStart: activeTokens[0].start,
      rawEnd: activeTokens[activeTokens.length - 1].end,
      rawMap,
      rect: unionRects(activeTokens.map((t) => t.rect)),
    });
  }

  return results;
}

function drawDevanagariRun(
  page: PDFPage,
  pdfDoc: PDFDocument,
  hbHandle: HbFontHandle,
  devaPdfFont: PDFFont,
  isBold: boolean,
  text: string,
  startX: number,
  baselineY: number,
  fontSizePt: number,
  color: RgbaColor
): void {
  const hbFont = isBold ? hbHandle.devaBoldFont : hbHandle.devaRegularFont;
  const upem = isBold ? hbHandle.devaBoldUpem : hbHandle.devaRegularUpem;
  const buffer = new hbHandle.hb.Buffer();
  buffer.addText(text);
  buffer.guessSegmentProperties();
  hbHandle.hb.shape(hbFont, buffer);
  const glyphs = buffer.getGlyphInfosAndPositions();

  if (glyphs.length === 0) return;

  // Register font in this page's /Resources dictionary via PDFPage internals
  const { newFontKey } = (
    page as unknown as { setOrEmbedFont: (f: PDFFont) => { newFontKey: PDFName } }
  ).setOrEmbedFont(devaPdfFont);

  const embedder = (
    devaPdfFont as unknown as {
      embedder: {
        font: {
          getGlyph: (id: number, cps: number[]) => { id: number };
        };
        subset: {
          includeGlyph: (g: { id: number }) => number;
        };
        glyphs: unknown[];
        glyphIdMap: Map<number, number>;
      };
    }
  ).embedder;

  const clusterCps = groupClusterCodePoints(text, glyphs);
  const seenClusters = new Set<number>();

  let cursorX = startX;
  const ops: PDFOperator[] = [
    PDFOperator.of('BDC' as unknown as never, [
      PDFName.of('Span'),
      pdfDoc.context.obj({
        ActualText: PDFHexString.of(encodeUtf16BeHexWithBom(text)),
      }) as unknown as PDFName,
    ]),
    PDFOperator.of('BT' as unknown as never, []),
    PDFOperator.of('Tf' as unknown as never, [newFontKey, PDFNumber.of(fontSizePt)]),
    PDFOperator.of('rg' as unknown as never, [
      PDFNumber.of(color.r),
      PDFNumber.of(color.g),
      PDFNumber.of(color.b),
    ]),
  ];

  for (const g of glyphs) {
    const cps = seenClusters.has(g.cluster) ? [] : clusterCps.get(g.cluster) ?? [];
    seenClusters.add(g.cluster);

    let subsetId = embedder.glyphIdMap.get(g.codepoint);
    if (subsetId === undefined) {
      const fkGlyph = embedder.font.getGlyph(g.codepoint, cps);
      subsetId = embedder.subset.includeGlyph(fkGlyph);
      if (subsetId >= 1) {
        embedder.glyphs[subsetId - 1] = fkGlyph;
      }
      embedder.glyphIdMap.set(fkGlyph.id, subsetId);
    }

    const gx = cursorX + ((g.xOffset ?? 0) * fontSizePt) / upem;
    const gy = baselineY + ((g.yOffset ?? 0) * fontSizePt) / upem;
    const hex = subsetId.toString(16).toUpperCase().padStart(4, '0');

    ops.push(
      PDFOperator.of('Tm' as unknown as never, [
        PDFNumber.of(1),
        PDFNumber.of(0),
        PDFNumber.of(0),
        PDFNumber.of(1),
        PDFNumber.of(Number(gx.toFixed(3))),
        PDFNumber.of(Number(gy.toFixed(3))),
      ]),
      PDFOperator.of('Tj' as unknown as never, [PDFHexString.of(hex)])
    );

    cursorX += ((g.xAdvance ?? 0) * fontSizePt) / upem;
  }

  ops.push(
    PDFOperator.of('ET' as unknown as never, []),
    PDFOperator.of('EMC' as unknown as never, [])
  );

  page.pushOperators(...ops);
}

async function renderPageDomToPdfPage(
  pageEl: HTMLElement,
  pdfPage: PDFPage,
  pdfDoc: PDFDocument,
  fonts: EmbeddedDocFonts,
  hbHandle: HbFontHandle,
  imageCache: Map<string, PDFImage>
): Promise<void> {
  const pageRect = pageEl.getBoundingClientRect();
  if (pageRect.width <= 0 || pageRect.height <= 0) return;

  const scaleX = A4_PDF_WIDTH_PT / pageRect.width;
  const scaleY = A4_PDF_HEIGHT_PT / pageRect.height;

  // -------- PASS 1: Backgrounds & Borders --------
  const rawBorders: BorderSegment[] = [];
  const allElements = [pageEl, ...Array.from(pageEl.querySelectorAll<HTMLElement>('*'))];

  for (const el of allElements) {
    const cs = window.getComputedStyle(el);
    if (!isElementVisible(cs)) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    const box = pxRectToPdfBox(rect, pageRect);

    // Draw non-white visible backgrounds (e.g. #d9d9d9 headers / table rows)
    const bg = parseCssColor(cs.backgroundColor);
    const isOpaqueWhite = bg.r > 0.99 && bg.g > 0.99 && bg.b > 0.99 && bg.a > 0.99;
    if (bg.a > 0 && !isOpaqueWhite) {
      pdfPage.drawRectangle({
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        color: rgb(bg.r, bg.g, bg.b),
        opacity: bg.a,
        borderWidth: 0,
      });
    }

    // Collect borders
    const isCollapsedCell =
      (el.tagName === 'TD' || el.tagName === 'TH') && cs.borderCollapse === 'collapse';

    const topW = Number.parseFloat(cs.borderTopWidth) || 0;
    const rightW = Number.parseFloat(cs.borderRightWidth) || 0;
    const bottomW = Number.parseFloat(cs.borderBottomWidth) || 0;
    const leftW = Number.parseFloat(cs.borderLeftWidth) || 0;

    if (topW > 0.1 && cs.borderTopStyle !== 'none') {
      const c = parseCssColor(cs.borderTopColor);
      const t = topW * scaleY;
      rawBorders.push({
        orientation: 'h',
        fixedPos: isCollapsedCell ? box.y + box.height : box.y + box.height - t / 2,
        start: box.x,
        end: box.x + box.width,
        thickness: t,
        color: c,
      });
    }
    if (bottomW > 0.1 && cs.borderBottomStyle !== 'none') {
      const c = parseCssColor(cs.borderBottomColor);
      const t = bottomW * scaleY;
      rawBorders.push({
        orientation: 'h',
        fixedPos: isCollapsedCell ? box.y : box.y + t / 2,
        start: box.x,
        end: box.x + box.width,
        thickness: t,
        color: c,
      });
    }
    if (leftW > 0.1 && cs.borderLeftStyle !== 'none') {
      const c = parseCssColor(cs.borderLeftColor);
      const t = leftW * scaleX;
      rawBorders.push({
        orientation: 'v',
        fixedPos: isCollapsedCell ? box.x : box.x + t / 2,
        start: box.y,
        end: box.y + box.height,
        thickness: t,
        color: c,
      });
    }
    if (rightW > 0.1 && cs.borderRightStyle !== 'none') {
      const c = parseCssColor(cs.borderRightColor);
      const t = rightW * scaleX;
      rawBorders.push({
        orientation: 'v',
        fixedPos: isCollapsedCell ? box.x + box.width : box.x + box.width - t / 2,
        start: box.y,
        end: box.y + box.height,
        thickness: t,
        color: c,
      });
    }
  }

  for (const seg of deduplicateBorderSegments(rawBorders)) {
    const strokeColor = rgb(seg.color.r, seg.color.g, seg.color.b);
    if (seg.orientation === 'h') {
      pdfPage.drawLine({
        start: { x: seg.start, y: seg.fixedPos },
        end: { x: seg.end, y: seg.fixedPos },
        thickness: seg.thickness,
        color: strokeColor,
        opacity: seg.color.a,
      });
    } else {
      pdfPage.drawLine({
        start: { x: seg.fixedPos, y: seg.start },
        end: { x: seg.fixedPos, y: seg.end },
        thickness: seg.thickness,
        color: strokeColor,
        opacity: seg.color.a,
      });
    }
  }

  // -------- PASS 2: Images (Logos, QR Codes, Signature Checkmark) --------
  const imgs = Array.from(pageEl.querySelectorAll('img'));
  for (const img of imgs) {
    const cs = window.getComputedStyle(img);
    if (!isElementVisible(cs)) continue;

    const rect = img.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || !img.src) continue;

    let embeddedImg = imageCache.get(img.src);
    if (!embeddedImg) {
      const bytes = img.src.startsWith('data:')
        ? decodeDataUrlToBytes(img.src)
        : await fetchBinaryAsset(img.src);
      embeddedImg = img.src.startsWith('data:image/jpeg') || /\.(jpe?g)(\?|$)/i.test(img.src)
        ? await pdfDoc.embedJpg(bytes)
        : await pdfDoc.embedPng(bytes);
      imageCache.set(img.src, embeddedImg);
    }

    const box = pxRectToPdfBox(rect, pageRect);
    const drawnBox = computeObjectFitRect(
      box,
      img.naturalWidth || embeddedImg.width,
      img.naturalHeight || embeddedImg.height,
      cs.objectFit
    );
    const clipBox = computeClipBoxForElement(img, pageEl, pageRect);
    const opacity = Math.min(1, Math.max(0, Number.parseFloat(cs.opacity || '1') || 1));

    if (clipBox) {
      pdfPage.pushOperators(
        pushGraphicsState(),
        moveTo(clipBox.x, clipBox.y),
        lineTo(clipBox.x + clipBox.width, clipBox.y),
        lineTo(clipBox.x + clipBox.width, clipBox.y + clipBox.height),
        lineTo(clipBox.x, clipBox.y + clipBox.height),
        closePath(),
        clip(),
        endPath()
      );
    }

    pdfPage.drawImage(embeddedImg, {
      x: drawnBox.x,
      y: drawnBox.y,
      width: drawnBox.width,
      height: drawnBox.height,
      opacity,
    });

    if (clipBox) {
      pdfPage.pushOperators(popGraphicsState());
    }
  }

  // -------- PASS 3: Vector Text Runs, Underlines & Link Annotations --------
  const linkAnnotations: PDFRef[] = [];
  const walker = document.createTreeWalker(pageEl, NodeFilter.SHOW_TEXT);
  const subRange = document.createRange();

  let node: Node | null;
  while ((node = walker.nextNode()) !== null) {
    const textNode = node as Text;
    const parentEl = textNode.parentElement;
    if (!parentEl) continue;

    const cs = window.getComputedStyle(parentEl);
    if (!isElementVisible(cs)) continue;

    const fontSizePx = Number.parseFloat(cs.fontSize) || 12;
    const fontSizePt = fontSizePx * scaleY;
    const bold = isBoldWeight(cs.fontWeight);
    const textColor = parseCssColor(cs.color);
    const underlined = isUnderlinedText(parentEl, pageEl);

    const visualLines = extractVisualLinesFromTextNode(textNode, fontSizePx);
    for (const line of visualLines) {
      const linePdfBox = pxRectToPdfBox(line.rect, pageRect);
      const isExternalUrl = line.text.trim() === 'https://foscos.fssai.gov.in';

      // Split visual line into contiguous Devanagari vs Latin script runs
      const runs = splitByScriptRuns(line.text);
      let charCursor = 0;

      // Measure each run's exact DOM sub-range so mixed Hindi/English baselines & X offsets match Chrome
      const measuredRuns = runs.map((run) => {
        const startMapIdx = Math.min(charCursor, line.rawMap.length - 1);
        const endMapIdx = Math.min(charCursor + run.text.length - 1, line.rawMap.length - 1);
        charCursor += run.text.length;

        const rStart = line.rawMap[startMapIdx]?.rawStart ?? line.rawStart;
        const rEnd = line.rawMap[endMapIdx]?.rawEnd ?? line.rawEnd;

        subRange.setStart(textNode, rStart);
        subRange.setEnd(textNode, rEnd);
        const subRects = Array.from(subRange.getClientRects()).filter(
          (r) => r.width > 0.05 && r.height > 0.05
        );
        const subRect = subRects.length > 0 ? unionRects(subRects) : line.rect;

        // OpenType hhea metrics from Noto Sans (1069/-293) and Noto Sans Devanagari (896/-408)
        const ascentRatio = run.script === 'devanagari' ? 896 / 1304 : 1069 / 1362;
        const baselinePx = subRect.top + subRect.height * ascentRatio;
        const baselinePdfY = A4_PDF_HEIGHT_PT - (baselinePx - pageRect.top) * scaleY;
        const runPdfX = (subRect.left - pageRect.left) * scaleX;

        return {
          ...run,
          runPdfX,
          baselinePdfY,
        };
      });

      // Harmonize baseline across Latin/Devanagari runs on the same visual line
      const latinRun = measuredRuns.find((r) => r.script === 'latin' && /\S/.test(r.text));
      const sharedBaselineY = latinRun?.baselinePdfY ?? measuredRuns[0]?.baselinePdfY ?? linePdfBox.y;

      for (const run of measuredRuns) {
        if (!run.text) continue;
        if (run.script === 'latin') {
          const latinFont = bold ? fonts.latinBold : fonts.latinRegular;
          pdfPage.drawText(run.text, {
            x: run.runPdfX,
            y: sharedBaselineY,
            size: fontSizePt,
            font: latinFont,
            color: rgb(textColor.r, textColor.g, textColor.b),
            opacity: textColor.a,
          });
        } else {
          const devaFont = bold ? fonts.devaBold : fonts.devaRegular;
          drawDevanagariRun(
            pdfPage,
            pdfDoc,
            hbHandle,
            devaFont,
            bold,
            run.text,
            run.runPdfX,
            sharedBaselineY,
            fontSizePt,
            textColor
          );
        }
      }

      if (underlined) {
        pdfPage.drawLine({
          start: { x: linePdfBox.x, y: sharedBaselineY - fontSizePt * 0.12 },
          end: { x: linePdfBox.x + linePdfBox.width, y: sharedBaselineY - fontSizePt * 0.12 },
          thickness: Math.max(0.55, fontSizePt * 0.065),
          color: rgb(textColor.r, textColor.g, textColor.b),
          opacity: textColor.a,
        });
      }

      if (isExternalUrl) {
        const annotRef = pdfDoc.context.register(
          pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [
              linePdfBox.x,
              linePdfBox.y,
              linePdfBox.x + linePdfBox.width,
              linePdfBox.y + linePdfBox.height,
            ],
            Border: [0, 0, 0],
            A: {
              Type: 'Action',
              S: 'URI',
              URI: PDFString.of('https://foscos.fssai.gov.in'),
            },
          })
        );
        linkAnnotations.push(annotRef);
      }
    }
  }

  if (linkAnnotations.length > 0) {
    pdfPage.node.set(PDFName.of('Annots'), pdfDoc.context.obj(linkAnnotations));
  }
}

export async function exportFormCToPdf(
  sourceElement: HTMLElement,
  filename: string
): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready;
  }

  // Allow any pending React state updates & async QR code data URLs to flush to DOM before cloning
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setTimeout(resolve, 60))
    )
  );

  // Clone into an unscaled A4 container so preview zoom never distorts PDF geometry
  const exportHost = document.createElement('div');
  exportHost.style.position = 'fixed';
  exportHost.style.left = '-12000px';
  exportHost.style.top = '0';
  exportHost.style.width = '794px';
  exportHost.style.backgroundColor = '#ffffff';
  exportHost.style.color = '#000000';
  exportHost.style.zIndex = '-1';
  exportHost.style.pointerEvents = 'none';

  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.id = 'fssai-pdf-export-clone';
  clone.style.transform = 'none';
  clone.style.width = '794px';
  clone.style.margin = '0';
  clone.style.gap = '0';
  clone.style.display = 'block';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';
  clone.style.textRendering = 'geometricPrecision';
  clone.style.fontKerning = 'normal';

  const pages = Array.from(clone.querySelectorAll<HTMLElement>('.fssai-a4-page'));
  pages.forEach((page) => {
    page.style.boxShadow = 'none';
    page.style.margin = '0';
    page.style.borderRadius = '0';
    page.style.border = 'none';
    page.style.width = '794px';
    page.style.minHeight = '1122px';
    page.style.height = '1122px';
    page.style.overflow = 'hidden';
  });

  exportHost.appendChild(clone);
  document.body.appendChild(exportHost);

  try {
    const imgs = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      imgs.map(async (img) => {
        if (!(img.complete && img.naturalWidth > 0)) {
          await new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        }
        if (typeof img.decode === 'function') {
          await img.decode().catch(() => undefined);
        }
      })
    );

    const fontBytes = await getFontBytes();
    const hbHandle = await getHarfBuzzHandle(fontBytes);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit as unknown as Parameters<PDFDocument['registerFontkit']>[0]);

    pdfDoc.setTitle(filename.replace(/\.pdf$/i, ''));
    pdfDoc.setSubject('FSSAI Form C License Document');
    pdfDoc.setCreator('FSSAI Form C License Generator');

    // Full font embedding (subset: false) on NotoSans keeps all English/numeric text editable in PDF editors;
    // subset: true + HarfBuzz shaping renders Devanagari conjuncts/matras with vector outlines & ActualText Unicode tags.
    const fonts: EmbeddedDocFonts = {
      latinRegular: await pdfDoc.embedFont(fontBytes.latinRegular, { subset: false }),
      latinBold: await pdfDoc.embedFont(fontBytes.latinBold, { subset: false }),
      devaRegular: await pdfDoc.embedFont(fontBytes.devaRegular, { subset: true }),
      devaBold: await pdfDoc.embedFont(fontBytes.devaBold, { subset: true }),
    };

    const imageCache = new Map<string, PDFImage>();

    for (const pageEl of pages) {
      const pdfPage = pdfDoc.addPage([A4_PDF_WIDTH_PT, A4_PDF_HEIGHT_PT]);
      await renderPageDomToPdfPage(pageEl, pdfPage, pdfDoc, fonts, hbHandle, imageCache);
    }

    // Flush updated glyph subset caches before serializing the Devanagari font programs
    for (const df of [fonts.devaRegular, fonts.devaBold]) {
      const emb = (df as unknown as { embedder?: { glyphCache?: { invalidate?: () => void } } }).embedder;
      emb?.glyphCache?.invalidate?.();
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } finally {
    document.body.removeChild(exportHost);
  }
}
