'use client';

import React from 'react';
import { Order, SystemSettings } from '@/types';
import { formatBDT, formatDateTime } from '@/lib/formatters';
import { Printer, KeyRound, X, Scissors, Check, Layers } from 'lucide-react';

interface ThermalReceiptModalProps {
  order: Order;
  settings: SystemSettings;
  onClose: () => void;
  onKickDrawer?: () => void;
  autoPrint?: boolean;
}

const getCopyLabel = (index: number, total: number) => {
  if (total === 1) return 'CUSTOMER COPY';
  if (index === 0) return 'CUSTOMER COPY';
  if (index === 1) return 'MERCHANT / ACCOUNTS COPY';
  if (index === 2) return 'KITCHEN / STORE COPY';
  return `COPY ${index + 1}`;
};

function SingleReceiptCopy({
  order,
  settings,
  copyLabel,
  copyIndex,
  totalCopies,
  onPrintThisOnly,
}: {
  order: Order;
  settings: SystemSettings;
  copyLabel: string;
  copyIndex: number;
  totalCopies: number;
  onPrintThisOnly?: () => void;
}) {
  return (
    <div
      className="thermal-receipt-copy w-full max-w-[275px] bg-white text-black px-3.5 py-4 rounded-md shadow-md font-sans text-[11px] leading-relaxed select-text border border-slate-200 box-border overflow-hidden"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      {/* Copy Type Header Badge */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-black">
        <div className="w-full text-center text-[10px] font-black tracking-widest uppercase">
          *** {copyLabel} ***
        </div>
      </div>

      {/* Screen-Only Single Copy Action Bar */}
      {onPrintThisOnly && totalCopies > 1 && (
        <div className="print:hidden mb-2.5 pb-2 border-b border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onPrintThisOnly}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-mono flex items-center gap-1 cursor-pointer transition"
            title="Print only this single slip"
          >
            <Printer className="w-2.5 h-2.5" />
            <span>Print {copyLabel.split('/')[0].trim()} Only</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center pb-3 border-b border-dashed border-black">
        <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-black">
          {settings?.restaurantName || 'The Royal Palette'}
        </h1>
        {settings?.tagline && <p className="text-[10px] text-black italic break-words">{settings.tagline}</p>}
        {settings?.address && <p className="text-[10px] text-black mt-1 break-words">{settings.address}</p>}
        {settings?.phone && <p className="text-[10px] text-black">Phone: {settings.phone}</p>}
        {settings?.binNumber && (
          <p className="text-[10px] font-bold text-black mt-0.5">BIN / VAT Reg: {settings.binNumber}</p>
        )}
      </div>

      {/* Order Meta */}
      <div className="py-2.5 border-b border-dashed border-black text-[11px] space-y-1 text-black">
        <div className="flex justify-between items-center gap-2">
          <span>Order No: <strong>{order.orderNumber}</strong></span>
          <span className="shrink-0 text-right">Type: <strong>{order.orderType.replace('_', ' ')}</strong></span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span>Date: {formatDateTime(order.createdAt)}</span>
          {order.tableNumber && (
            <span className="shrink-0 text-right">Table: <strong>{order.tableNumber}</strong></span>
          )}
        </div>
        <div className="flex justify-between items-start gap-2">
          <span className="break-words">Cashier: <strong>{order.serverName || 'Counter Staff'}</strong></span>
          {order.customerName && (
            <span className="shrink-0 text-right break-words font-medium">Guest: {order.customerName}</span>
          )}
        </div>
        {order.customerPhone && (
          <div className="text-[10px] text-black">
            Phone: {order.customerPhone}
          </div>
        )}
      </div>

      {/* Itemized Table */}
      <div className="py-2.5 border-b border-dashed border-black text-black">
        <div className="flex justify-between font-bold pb-1 text-[11px] border-b border-black">
          <span className="w-1/2">Item Description</span>
          <span className="w-1/6 text-center">Qty</span>
          <span className="w-1/3 text-right pr-1">Amount</span>
        </div>
        <div className="divide-y divide-gray-200 py-1 space-y-1">
          {order.items.map((item) => (
            <div key={item.id} className="pt-1">
              <div className="flex justify-between items-start">
                <span className="w-1/2 font-medium break-words pr-1 text-black">{item.productName}</span>
                <span className="w-1/6 text-center shrink-0 text-black">{item.quantity}</span>
                <span className="w-1/3 text-right shrink-0 pr-1 text-black">{formatBDT(item.totalPrice)}</span>
              </div>
              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                <div className="text-[10px] text-black pl-2 break-words">
                  {item.selectedModifiers.map((m) => `+ ${m.optionName}`).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Calculations & Totals */}
      <div className="py-2.5 border-b border-dashed border-black text-[11px] space-y-1 text-black">
        <div className="flex justify-between items-center">
          <span>Subtotal:</span>
          <span className="shrink-0 font-medium pr-1">{formatBDT(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between items-center text-black">
            <span>Special Discount:</span>
            <span className="shrink-0 pr-1">- {formatBDT(order.discountAmount)}</span>
          </div>
        )}
        {order.pointsDiscountValue > 0 && (
          <div className="flex justify-between items-center text-black">
            <span>Loyalty Points Discount ({order.pointsRedeemed} pts):</span>
            <span className="shrink-0 pr-1">- {formatBDT(order.pointsDiscountValue)}</span>
          </div>
        )}
        {((settings?.vatPercent ?? 0) > 0 || order.taxAmount > 0) && (
          <div className="flex justify-between items-center">
            <span>VAT ({settings?.vatPercent ?? 0}%):</span>
            <span className="shrink-0 pr-1">{formatBDT(order.taxAmount)}</span>
          </div>
        )}
        {((settings?.serviceChargePercent ?? 0) > 0 || order.serviceChargeAmount > 0) && (
          <div className="flex justify-between items-center">
            <span>Service Charge ({settings?.serviceChargePercent ?? 0}%):</span>
            <span className="shrink-0 pr-1">{formatBDT(order.serviceChargeAmount)}</span>
          </div>
        )}
        {order.tipAmount > 0 && (
          <div className="flex justify-between items-center">
            <span>Staff Gratuity:</span>
            <span className="shrink-0 pr-1">{formatBDT(order.tipAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-black">
          <span>TOTAL PAYABLE:</span>
          <span className="shrink-0 pr-1">{formatBDT(order.totalAmount)}</span>
        </div>
      </div>

      {/* Payment Method Details */}
      <div className="py-2 border-b border-dashed border-black text-[11px] text-black">
        <div className="flex justify-between items-center font-bold">
          <span>Payment Method:</span>
          <span className="uppercase shrink-0 pr-1">{order.paymentMethod || 'CASH'}</span>
        </div>
        <div className="flex justify-between items-center text-black">
          <span>Payment Status:</span>
          <span className="font-bold shrink-0 pr-1">{order.paymentStatus}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 text-center flex flex-col items-center space-y-1 text-black">
        <p className="text-[9px] font-bold text-black break-words">
          {settings?.receiptFooterMessage || 'Thank you for gracing The Royal Palette! Visit again.'}
        </p>
        <div className="text-[8px] text-black leading-tight text-center pt-0.5">
          <p>Software Powered by eypo technologies</p>
          <p>www.airocky.me</p>
        </div>
        <div className="text-[8px] text-slate-500 font-mono pt-0.5">
          [ Sheet {copyIndex + 1} of {totalCopies} ]
        </div>
      </div>
    </div>
  );
}

export function ThermalReceiptModal({
  order,
  settings,
  onClose,
  onKickDrawer,
  autoPrint = true,
}: ThermalReceiptModalProps) {
  const [isAutoPrintActive, setIsAutoPrintActive] = React.useState(autoPrint);
  const [printingCopyIndex, setPrintingCopyIndex] = React.useState<number | null>(null);
  const [isPrintingSequential, setIsPrintingSequential] = React.useState(false);
  const [sequentialStatus, setSequentialStatus] = React.useState<string | null>(null);
  const isPrintingSequentialRef = React.useRef(false);

  const numCopies = Math.max(1, settings?.receiptCopies ?? 3);
  const cutMode = settings?.receiptCutMode || 'PAGE_BREAK';

  // Wait for browser print dialog / spooler to finish before sending next job
  // Crucial for Mozilla Firefox & PWAs where window.print() is non-blocking
  const waitForPrintJobComplete = (timeoutMs = 45000): Promise<void> => {
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        window.removeEventListener('afterprint', onAfterPrint);
        clearTimeout(fallbackTimer);
        resolve();
      };
      const onAfterPrint = () => {
        done();
      };
      window.addEventListener('afterprint', onAfterPrint, { once: true });
      const fallbackTimer = setTimeout(done, timeoutMs);
    });
  };

  const waitForDomPaint = (): Promise<void> => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 120);
        });
      });
    });
  };

  const handlePrintMultiPage = () => {
    setPrintingCopyIndex(null);
    if (onKickDrawer) {
      onKickDrawer();
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintSingle = async (index: number) => {
    isPrintingSequentialRef.current = true;
    setPrintingCopyIndex(index);
    if (onKickDrawer) {
      onKickDrawer();
    }
    await waitForDomPaint();
    const afterPrintPromise = waitForPrintJobComplete();
    window.print();
    await afterPrintPromise;
    setPrintingCopyIndex(null);
    isPrintingSequentialRef.current = false;
  };

  const handlePrintSeparately = async () => {
    if (isPrintingSequentialRef.current) return;
    isPrintingSequentialRef.current = true;
    setIsPrintingSequential(true);
    if (onKickDrawer) {
      onKickDrawer();
    }

    try {
      for (let i = 0; i < numCopies; i++) {
        const label = getCopyLabel(i, numCopies);
        setSequentialStatus(`Printing ${label} (${i + 1}/${numCopies})...`);
        setPrintingCopyIndex(i);

        // Wait for React to render ONLY this single copy in the DOM
        await waitForDomPaint();

        // Listen for afterprint BEFORE calling window.print() so Firefox PWA
        // completes/spools each job and fires the printer's auto-cutter before the next starts
        const jobDone = waitForPrintJobComplete();
        window.print();
        await jobDone;

        // Brief spooler/cutter cooldown between separate print jobs
        if (i < numCopies - 1) {
          await new Promise((resolve) => setTimeout(resolve, 450));
        }
      }
    } finally {
      setPrintingCopyIndex(null);
      setIsPrintingSequential(false);
      setSequentialStatus(null);
      isPrintingSequentialRef.current = false;
    }

    if (isAutoPrintActive) {
      setTimeout(() => {
        onClose();
      }, 400);
    }
  };

  const handlePrimaryPrint = () => {
    if (cutMode === 'SEPARATE_JOBS' && numCopies > 1) {
      handlePrintSeparately();
    } else {
      handlePrintMultiPage();
    }
  };

  // Automatically trigger print job & drawer kick upon transaction settlement
  React.useEffect(() => {
    if (isAutoPrintActive) {
      const timer = setTimeout(() => {
        try {
          handlePrimaryPrint();
        } catch (err) {
          console.error('Auto-print error:', err);
        }
      }, 350);

      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-close receipt modal once single-job printing finishes
  React.useEffect(() => {
    const handleAfterPrint = () => {
      // Never auto-close prematurely while sequential separate-job printing is running
      if (isPrintingSequentialRef.current || isPrintingSequential) return;

      const closeTimer = setTimeout(() => {
        onClose();
      }, 500);
      return () => clearTimeout(closeTimer);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [onClose, isPrintingSequential]);

  return (
    <div className="thermal-receipt-modal-backdrop fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Control Bar */}
        <div className="print:hidden p-4 bg-[#f8f8f8] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#000f50]/10 text-[#000f50] flex items-center justify-center font-bold text-xs">
              80mm
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Thermal Receipt Preview</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
                  {numCopies} {numCopies === 1 ? 'Copy' : 'Copies'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAutoPrintActive(!isAutoPrintActive)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition flex items-center gap-1 cursor-pointer ${
                    isAutoPrintActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                  }`}
                  title="Toggle automatic printing when transaction completes"
                >
                  <Printer className="w-3 h-3" />
                  <span>Auto-Print: {isAutoPrintActive ? 'ON' : 'OFF'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {sequentialStatus ? (
                  <span className="text-amber-600 font-bold animate-pulse">{sequentialStatus}</span>
                ) : (
                  `Order #${order.orderNumber} • ${cutMode === 'SEPARATE_JOBS' ? 'Sequential Cutter Mode' : 'Multi-Page Driver Cut'}`
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Canvas (Styled like authentic thermal paper) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex flex-col items-center">
          <div id="thermal-receipt" className="w-full max-w-[320px] select-text box-border space-y-4">
            {Array.from({ length: numCopies }).map((_, copyIndex) => {
              const copyLabel = getCopyLabel(copyIndex, numCopies);
              // Hide other copies if currently printing a specific individual copy
              const isExcludedFromPrint = printingCopyIndex !== null && printingCopyIndex !== copyIndex;
              if (isExcludedFromPrint) return null;

              return (
                <React.Fragment key={copyIndex}>
                  {copyIndex > 0 && printingCopyIndex === null && (
                    <div className="print:hidden my-2 py-1.5 border-y border-dashed border-slate-400 text-center font-mono text-[10px] font-bold text-slate-600 bg-slate-200/80 rounded flex items-center justify-between px-3">
                      <span>✂️ --- CUT / TEAR HERE ({copyLabel}) --- ✂️</span>
                      <button
                        type="button"
                        onClick={() => handlePrintSingle(copyIndex)}
                        className="text-[10px] text-blue-700 hover:text-blue-900 underline font-sans flex items-center gap-1 cursor-pointer"
                        title="Print only this single slip"
                      >
                        <Printer className="w-3 h-3" /> Print Only
                      </button>
                    </div>
                  )}
                  <SingleReceiptCopy
                    order={order}
                    settings={settings}
                    copyLabel={copyLabel}
                    copyIndex={copyIndex}
                    totalCopies={numCopies}
                    onPrintThisOnly={() => handlePrintSingle(copyIndex)}
                  />
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="print:hidden p-4 bg-[#f8f8f8] border-t border-slate-200 flex flex-wrap gap-2.5 justify-between items-center">
          <div className="flex items-center gap-2">
            {onKickDrawer && (
              <button
                onClick={onKickDrawer}
                className="px-3.5 py-2 rounded-lg bg-[#000f50]/10 border border-[#000f50]/20 hover:bg-[#000f50]/20 text-[#000f50] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" /> Kick Drawer
              </button>
            )}

            {numCopies > 1 && (
              <button
                type="button"
                onClick={cutMode === 'SEPARATE_JOBS' ? handlePrintMultiPage : handlePrintSeparately}
                disabled={isPrintingSequential}
                className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-800 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title={cutMode === 'SEPARATE_JOBS' ? 'Switch to 1-Job Multi-Page Print' : 'Print each copy sequentially with cut'}
              >
                <Scissors className="w-3.5 h-3.5 text-amber-600" />
                <span>{cutMode === 'SEPARATE_JOBS' ? 'Print in 1 Job' : 'Print Separately (Cut Each)'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrimaryPrint}
              disabled={isPrintingSequential}
              className="px-5 py-2.5 rounded-lg bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#000f50]/20 transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>
                {isPrintingSequential
                  ? 'Printing...'
                  : `Print ${numCopies} ${numCopies === 1 ? 'Copy' : 'Copies'} (${cutMode === 'SEPARATE_JOBS' ? 'Cut Each' : '80mm'})`}
              </span>
            </button>

            <button
              onClick={onClose}
              disabled={isPrintingSequential}
              className="px-4 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
