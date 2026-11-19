import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Download,
  FileText,
  Loader2,
  Printer,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  FormCData,
  SAMPLE_FORM_C_DATA,
  createEmptyFormCData,
  formCSchema,
  mergeFormCDraft,
  sanitizeFilename,
} from './schemas/formCSchema';
import { FormCStudio, StudioSectionId } from './components/FormCStudio';
import { FormCA4Replica } from './components/FormCA4Replica';
import { exportFormCToPdf } from './utils/pdfExport';

const STORAGE_KEY = 'fssai_form_c_draft_v2';

function loadInitialDraft(): FormCData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_FORM_C_DATA;
    const parsed = JSON.parse(raw);
    return mergeFormCDraft(parsed);
  } catch {
    // Fall back to sample data if storage is malformed
  }
  return SAMPLE_FORM_C_DATA;
}

const ZOOM_LEVELS = [60, 75, 90, 100];

export default function App() {
  const [activeSection, setActiveSection] = useState<StudioSectionId>('license');
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('preview');
  const [zoomPercent, setZoomPercent] = useState<number>(75);
  const [activePage, setActivePage] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [lastSavedText, setLastSavedText] = useState<string>('Draft synced');

  const pdfRootRef = useRef<HTMLDivElement | null>(null);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<FormCData>({
    resolver: zodResolver(formCSchema),
    defaultValues: loadInitialDraft(),
    mode: 'onChange',
  });

  const formData = watch();

  useEffect(() => {
    const subscription = watch((value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setLastSavedText(`Saved ${hh}:${mm}`);
      } catch {
        // Ignore quota errors
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const scrollToPage = (pageNum: number) => {
    setActivePage(pageNum);
    setMobilePane('preview');
    requestAnimationFrame(() => {
      const target = document.getElementById(`form-c-page-${pageNum}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const handleLoadSample = () => {
    reset(SAMPLE_FORM_C_DATA, { keepDefaultValues: false });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_FORM_C_DATA));
    setExportNotice({
      type: 'success',
      text: 'Loaded M/S AAROGYA Form C sample license data.',
    });
  };

  const handleClearForm = () => {
    const empty = createEmptyFormCData();
    reset(empty, { keepDefaultValues: false });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    setExportNotice(null);
  };

  const handleDownloadPdf = async () => {
    if (!pdfRootRef.current || isExporting) return;
    setIsExporting(true);
    setExportNotice(null);
    try {
      const filename = sanitizeFilename(formData.fboName, formData.licenseNumber);
      await exportFormCToPdf(pdfRootRef.current, filename);
      setExportNotice({
        type: 'success',
        text: `Generated 7-page A4 PDF: ${filename}`,
      });
    } catch (err) {
      setExportNotice({
        type: 'error',
        text:
          err instanceof Error
            ? `PDF export failed: ${err.message}`
            : 'Unable to export PDF. Try Print A4 instead.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Top Bar (3-Zone Contract) */}
      <header className="no-print h-14 px-5 bg-white border-b border-slate-200 flex items-center justify-between gap-8 shrink-0">
        <a
          href="#top"
          className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          FSSAI Form C Studio
        </a>

        <nav
          aria-label="Document Sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => scrollToPage(1)}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Certificate
          </button>
          <button
            type="button"
            onClick={() => scrollToPage(3)}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Product Annexure
          </button>
          <button
            type="button"
            onClick={() => scrollToPage(4)}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            License History
          </button>
          <button
            type="button"
            onClick={() => scrollToPage(5)}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Non-Form C
          </button>
          <button
            type="button"
            onClick={() => scrollToPage(6)}
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Conditions
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExporting ? 'Generating PDF...' : 'Download 7-Page PDF'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Pane Switcher */}
      <div className="no-print lg:hidden px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobilePane('editor')}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            mobilePane === 'editor'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          Form Studio
        </button>
        <button
          type="button"
          onClick={() => setMobilePane('preview')}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            mobilePane === 'preview'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          7-Page A4 Preview
        </button>
      </div>

      {/* Main Split-Pane Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        <div
          className={`no-print w-full lg:w-[460px] xl:w-[490px] shrink-0 lg:h-full ${
            mobilePane === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          <FormCStudio
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            onLoadSample={handleLoadSample}
            onClearForm={handleClearForm}
            lastSavedText={lastSavedText}
            isValid={isValid}
          />
        </div>

        <section
          aria-label="7-Page A4 License Preview"
          className={`flex-1 flex flex-col lg:h-full bg-slate-200/75 min-w-0 ${
            mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="no-print px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1 whitespace-nowrap">
                <FileText className="w-3.5 h-3.5" />
                <span>Pages:</span>
              </span>
              {[1, 2, 3, 4, 5, 6, 7].map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => scrollToPage(pageNum)}
                  className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activePage === pageNum
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  P{pageNum}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => {
                    const idx = ZOOM_LEVELS.indexOf(zoomPercent);
                    if (idx > 0) setZoomPercent(ZOOM_LEVELS[idx - 1]);
                  }}
                  disabled={zoomPercent === ZOOM_LEVELS[0]}
                  className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 text-xs font-mono tabular-nums text-slate-700">
                  {zoomPercent}%
                </span>
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => {
                    const idx = ZOOM_LEVELS.indexOf(zoomPercent);
                    if (idx < ZOOM_LEVELS.length - 1) {
                      setZoomPercent(ZOOM_LEVELS[idx + 1]);
                    }
                  }}
                  disabled={zoomPercent === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                  className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print A4</span>
              </button>
            </div>
          </div>

          {exportNotice && (
            <div
              role="status"
              className={`no-print px-4 py-2 text-xs font-medium border-b flex items-center justify-between ${
                exportNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <span>{exportNotice.text}</span>
              <button
                type="button"
                onClick={() => setExportNotice(null)}
                className="text-xs underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          <div
            ref={previewScrollRef}
            className="print-only-container flex-1 min-w-0 overflow-auto p-6 sm:p-8"
          >
            <FormCA4Replica
              data={formData}
              zoomPercent={zoomPercent}
              containerRef={pdfRootRef}
              onJumpToPage={scrollToPage}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
