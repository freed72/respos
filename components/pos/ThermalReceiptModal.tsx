'use client';

import React from 'react';
import { Order, SystemSettings } from '@/types';
import { formatBDT, formatDateTime } from '@/lib/formatters';
import { Printer, KeyRound, X } from 'lucide-react';

interface ThermalReceiptModalProps {
  order: Order;
  settings: SystemSettings;
  onClose: () => void;
  onKickDrawer?: () => void;
  autoPrint?: boolean;
}

export function ThermalReceiptModal({
  order,
  settings,
  onClose,
  onKickDrawer,
  autoPrint = true,
}: ThermalReceiptModalProps) {
  const [isAutoPrintActive, setIsAutoPrintActive] = React.useState(autoPrint);

  const handlePrint = () => {
    if (onKickDrawer) {
      onKickDrawer();
    }
    window.print();
  };

  // Automatically trigger print job & drawer kick upon transaction settlement
  React.useEffect(() => {
    if (isAutoPrintActive) {
      if (onKickDrawer) {
        onKickDrawer();
      }

      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error('Auto-print error:', err);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-close receipt modal once printing finishes (or in silent kiosk mode)
  React.useEffect(() => {
    const handleAfterPrint = () => {
      const closeTimer = setTimeout(() => {
        onClose();
      }, 500);
      return () => clearTimeout(closeTimer);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [onClose]);

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
                <button
                  type="button"
                  onClick={() => setIsAutoPrintActive(!isAutoPrintActive)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition flex items-center gap-1 ${
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
              <p className="text-xs text-slate-500 font-mono">Order #{order.orderNumber}</p>
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
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div
            id="thermal-receipt"
            className="w-full max-w-[320px] bg-white text-black px-6 py-5 rounded-md shadow-md font-sans text-[11px] leading-relaxed select-text border border-slate-200 box-border overflow-hidden"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
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
            <div className="py-2.5 border-b border-dashed border-black text-[11px] space-y-0.5 text-black">
              <div className="flex justify-between items-center gap-1">
                <span>Order No: <strong>{order.orderNumber}</strong></span>
                <span className="shrink-0 text-right">Type: <strong>{order.orderType.replace('_', ' ')}</strong></span>
              </div>
              <div className="flex justify-between items-start gap-1">
                <span>Date: {formatDateTime(order.createdAt)}</span>
                <span className="shrink-0 text-right">Cashier: <strong>{order.serverName || 'Counter Staff'}</strong></span>
              </div>
              {order.tableNumber && (
                <div className="flex justify-between items-center">
                  <span>Table: <strong>{order.tableNumber}</strong></span>
                </div>
              )}
              {order.customerName && (
                <div className="flex justify-between items-start gap-1 text-black">
                  <span className="break-words">Guest: {order.customerName}</span>
                  {order.customerPhone && <span className="shrink-0 font-sans">({order.customerPhone})</span>}
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="py-2.5 border-b border-dashed border-black text-black">
              <div className="flex justify-between font-bold pb-1 text-[11px] border-b border-black">
                <span className="w-1/2">Item Description</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/3 text-right">Amount</span>
              </div>
              <div className="divide-y divide-gray-200 py-1 space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="pt-1">
                    <div className="flex justify-between items-start">
                      <span className="w-1/2 font-medium break-words pr-1 text-black">{item.productName}</span>
                      <span className="w-1/6 text-center shrink-0 text-black">{item.quantity}</span>
                      <span className="w-1/3 text-right shrink-0 text-black">{formatBDT(item.totalPrice)}</span>
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
                <span className="shrink-0 font-medium">{formatBDT(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center text-black">
                  <span>Special Discount:</span>
                  <span className="shrink-0">- {formatBDT(order.discountAmount)}</span>
                </div>
              )}
              {order.pointsDiscountValue > 0 && (
                <div className="flex justify-between items-center text-black">
                  <span>Loyalty Points Discount ({order.pointsRedeemed} pts):</span>
                  <span className="shrink-0">- {formatBDT(order.pointsDiscountValue)}</span>
                </div>
              )}
              {((settings?.vatPercent ?? 0) > 0 || order.taxAmount > 0) && (
                <div className="flex justify-between items-center">
                  <span>VAT ({settings?.vatPercent ?? 0}%):</span>
                  <span className="shrink-0">{formatBDT(order.taxAmount)}</span>
                </div>
              )}
              {((settings?.serviceChargePercent ?? 0) > 0 || order.serviceChargeAmount > 0) && (
                <div className="flex justify-between items-center">
                  <span>Service Charge ({settings?.serviceChargePercent ?? 0}%):</span>
                  <span className="shrink-0">{formatBDT(order.serviceChargeAmount)}</span>
                </div>
              )}
              {order.tipAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span>Staff Gratuity:</span>
                  <span className="shrink-0">{formatBDT(order.tipAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-black">
                <span>TOTAL PAYABLE:</span>
                <span className="shrink-0">{formatBDT(order.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="py-2 border-b border-dashed border-black text-[11px] text-black">
              <div className="flex justify-between items-center font-bold">
                <span>Payment Method:</span>
                <span className="uppercase shrink-0">{order.paymentMethod || 'CASH'}</span>
              </div>
              <div className="flex justify-between items-center text-black">
                <span>Payment Status:</span>
                <span className="font-bold shrink-0">{order.paymentStatus}</span>
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
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="print:hidden p-4 bg-[#f8f8f8] border-t border-slate-200 flex flex-wrap gap-2.5 justify-end">
          {onKickDrawer && (
            <button
              onClick={onKickDrawer}
              className="px-4 py-2.5 rounded-lg bg-[#000f50]/10 border border-[#000f50]/20 hover:bg-[#000f50]/20 text-[#000f50] font-bold text-xs flex items-center gap-2 transition"
            >
              <KeyRound className="w-4 h-4" /> Kick Cash Drawer (ESC/POS)
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-lg bg-[#000f50] hover:bg-[#081a70] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#000f50]/20 transition"
          >
            <Printer className="w-4 h-4" /> Print 80mm Receipt
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
