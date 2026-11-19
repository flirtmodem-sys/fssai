import html2pdf from 'html2pdf.js';

export async function exportFormCToPdf(
  sourceElement: HTMLElement,
  filename: string
): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    await document.fonts.ready;
  }

  // Allow any just-typed React state updates & async QR code data URLs to flush to DOM before cloning
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setTimeout(resolve, 60))
    )
  );

  // Clone into an unscaled A4 container so preview zoom never distorts PDF export
  const exportHost = document.createElement('div');
  exportHost.style.position = 'fixed';
  exportHost.style.left = '-12000px';
  exportHost.style.top = '0';
  exportHost.style.width = '794px';
  exportHost.style.backgroundColor = '#ffffff';
  exportHost.style.color = '#0f172a';
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
  clone.style.color = '#0f172a';

  const pages = clone.querySelectorAll<HTMLElement>('.fssai-a4-page');
  pages.forEach((page, idx) => {
    page.style.boxShadow = 'none';
    page.style.margin = '0';
    page.style.borderRadius = '0';
    page.style.border = 'none';
    page.style.width = '794px';
    page.style.minHeight = '1122px';
    page.style.height = '1122px';
    page.style.overflow = 'hidden';
    page.style.pageBreakAfter = idx < pages.length - 1 ? 'always' : 'auto';
    page.style.breakAfter = idx < pages.length - 1 ? 'page' : 'auto';
  });

  exportHost.appendChild(clone);
  document.body.appendChild(exportHost);

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

  try {
    const options = {
      margin: 0,
      filename,
      image: { type: 'jpeg' as const, quality: 0.96 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: false,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc: Document) => {
          // Strip Tailwind v4 stylesheets containing oklch()/oklab() so html2canvas never fails to parse colors
          const styleNodes = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styleNodes.forEach((node) => {
            if (node.tagName === 'LINK') {
              const href = (node as HTMLLinkElement).href || '';
              if (!href.includes('fonts.googleapis.com')) {
                node.remove();
              }
            } else if (node.textContent && /oklch|oklab|color-mix/i.test(node.textContent)) {
              node.remove();
            }
          });

          const safeStyle = clonedDoc.createElement('style');
          safeStyle.textContent = `
            *, *::before, *::after { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Noto Sans', 'Noto Sans Devanagari', sans-serif;
              line-height: 1.35;
            }
            table { border-collapse: collapse; }
            img { display: block; max-width: 100%; }
          `;
          clonedDoc.head.appendChild(safeStyle);
        },
      },
      jsPDF: {
        unit: 'px' as const,
        format: [794, 1123] as [number, number],
        orientation: 'portrait' as const,
        compress: true,
      },
      pagebreak: {
        mode: ['css', 'legacy'],
      },
    };

    await html2pdf().from(clone).set(options).save();
  } finally {
    document.body.removeChild(exportHost);
  }
}
