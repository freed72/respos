'use client';

import React from 'react';
import { Order, SystemSettings } from '@/types';
import { formatBDT, formatDateTime } from '@/lib/formatters';
import { Printer, KeyRound, X, CheckCircle, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ThermalReceiptModalProps {
  order: Order;
  settings: SystemSettings;
  onClose: () => void;
  onKickDrawer?: () => void;
}

export function ThermalReceiptModal({
  order,
  settings,
  onClose,
  onKickDrawer,
}: ThermalReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Control Bar */}
        <div className="p-4 bg-[#f8f8f8] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#000f50]/10 text-[#000f50] flex items-center justify-center font-bold text-xs">
              80mm
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Thermal Receipt Preview</h3>
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
            className="w-full max-w-[340px] bg-white text-black p-5 rounded-md shadow-md font-mono text-[12px] leading-relaxed select-text border border-slate-200"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <h1 className="text-lg font-black tracking-wider uppercase">{settings.restaurantName}</h1>
              <p className="text-[10px] text-gray-700 italic">{settings.tagline}</p>
              <p className="text-[10px] text-gray-700 mt-1">{settings.address}</p>
              <p className="text-[10px] text-gray-700">Phone: {settings.phone}</p>
              <p className="text-[10px] font-bold text-gray-900 mt-0.5">BIN / VAT Reg: {settings.binNumber}</p>
            </div>

            {/* Order Meta */}
            <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Order No: <strong>{order.orderNumber}</strong></span>
                <span>Type: <strong>{order.orderType.replace('_', ' ')}</strong></span>
              </div>
              <div className="flex justify-between">
                <span>Date: {formatDateTime(order.createdAt)}</span>
                {order.tableNumber && <span>Table: <strong>{order.tableNumber}</strong></span>}
              </div>
              {order.customerName && (
                <div className="flex justify-between text-gray-800">
                  <span>Guest: {order.customerName}</span>
                  {order.customerPhone && <span>({order.customerPhone})</span>}
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="py-2.5 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold pb-1 text-[11px] border-b border-gray-200">
                <span className="w-1/2">Item Description</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/3 text-right">Amount</span>
              </div>
              <div className="divide-y divide-gray-100 py-1 space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="pt-1">
                    <div className="flex justify-between">
                      <span className="w-1/2 font-medium">{item.productName}</span>
                      <span className="w-1/6 text-center">{item.quantity}</span>
                      <span className="w-1/3 text-right">{formatBDT(item.totalPrice)}</span>
                    </div>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="text-[10px] text-gray-600 pl-2">
                        {item.selectedModifiers.map((m) => `+ ${m.optionName}`).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations & Totals */}
            <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatBDT(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Special Discount:</span>
                  <span>- {formatBDT(order.discountAmount)}</span>
                </div>
              )}
              {order.pointsDiscountValue > 0 && (
                <div className="flex justify-between text-indigo-800">
                  <span>Loyalty Points Discount ({order.pointsRedeemed} pts):</span>
                  <span>- {formatBDT(order.pointsDiscountValue)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>VAT ({settings.vatPercent}%):</span>
                <span>{formatBDT(order.taxAmount)}</span>
              </div>
              {order.serviceChargeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge ({settings.serviceChargePercent}%):</span>
                  <span>{formatBDT(order.serviceChargeAmount)}</span>
                </div>
              )}
              {order.tipAmount > 0 && (
                <div className="flex justify-between">
                  <span>Staff Gratuity:</span>
                  <span>{formatBDT(order.tipAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1.5 border-t border-gray-400">
                <span>TOTAL PAYABLE:</span>
                <span>{formatBDT(order.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>Payment Method:</span>
                <span className="uppercase">{order.paymentMethod || 'CASH'}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Payment Status:</span>
                <span className="text-emerald-700 font-bold">{order.paymentStatus}</span>
              </div>
            </div>

            {/* Loyalty Rewards on this visit */}
            {order.pointsEarned > 0 && (
              <div className="py-2.5 border-b border-dashed border-gray-400 text-center bg-gray-50 rounded my-1.5 p-1.5">
                <div className="text-[10px] font-bold text-indigo-900 uppercase flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" /> Royal Rewards Earned!
                </div>
                <div className="text-xs font-black text-gray-900">
                  +{order.pointsEarned} Points Added to Wallet
                </div>
                <div className="text-[9px] text-gray-600">
                  Redeem 1 Pt = ৳1 BDT on your next banquet
                </div>
              </div>
            )}

            {/* QR Code & Footer */}
            <div className="pt-3 text-center flex flex-col items-center">
              <div className="p-1 bg-white border border-gray-300 rounded">
                <QRCodeSVG
                  value={`https://royalpalette.com.bd/rewards?order=${order.orderNumber}`}
                  size={64}
                  level="M"
                />
              </div>
              <p className="text-[9px] text-gray-600 mt-1">Scan to check your Royal Points balance</p>
              <p className="text-[10px] font-bold text-gray-800 mt-2">{settings.receiptFooterMessage}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">Software Powered by Next.js & Insforge</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="p-4 bg-[#f8f8f8] border-t border-slate-200 flex flex-wrap gap-2.5 justify-end">
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
