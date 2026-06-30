/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, Ticket, Percent, CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface CartTabProps {
  cartItems: CartItem[];
  onUpdateQuantity: (barcode: string, delta: number) => void;
  onRemoveItem: (barcode: string) => void;
  onClearCart: () => void;
  onCheckout: (voucherCode?: string) => void;
  language: 'id' | 'en';
}

export default function CartTab({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  language
}: CartTabProps) {
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Coupon | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Totals calculations
  let subtotal = 0;
  cartItems.forEach(item => {
    const activePrice = item.product.discountPrice || item.product.price;
    subtotal += activePrice * item.quantity;
  });

  // Calculate applied voucher discount
  let voucherDiscount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discountType === 'percentage') {
      voucherDiscount = Math.floor(subtotal * (appliedVoucher.value / 100));
    } else {
      voucherDiscount = appliedVoucher.value;
    }
  }

  const tax = Math.floor((subtotal - voucherDiscount) * 0.11); // 11% PPN Indonesia
  const finalAmount = Math.max(0, subtotal - voucherDiscount + tax);

  // Validate Voucher with backend
  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    setIsValidating(true);
    setVoucherError(null);
    try {
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode, amount: subtotal })
      });
      const data = await response.json();
      if (response.ok) {
        setAppliedVoucher(data.voucher);
        setVoucherError(null);
      } else {
        setAppliedVoucher(null);
        setVoucherError(data.error || "Kupon tidak valid");
      }
    } catch (err) {
      setVoucherError("Gagal memvalidasi kupon");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6" id="cart-view-container">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-emerald-400" />
          {language === 'id' ? 'Keranjang POS Kasir' : 'Shopping Cart'}
        </h2>
        {cartItems.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer active:scale-95 transition"
          >
            {language === 'id' ? 'Kosongkan Keranjang' : 'Clear All'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: LIST OF CART ITEMS */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.length === 0 ? (
            <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800/30 border border-zinc-700/50 flex items-center justify-center mx-auto text-zinc-600 animate-pulse">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">
                  {language === 'id' ? 'Keranjang belanja kosong' : 'Your cart is empty'}
                </p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  {language === 'id' 
                    ? 'Pindai barcode di tab Scanner atau pilih barang dari tab Katalog untuk memulai transaksi.' 
                    : 'Scan barcodes in the scanner tab or tap items in the catalog to prepare cashier transaction.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3" id="basket-items-list">
              {cartItems.map((item, idx) => {
                const activePrice = item.product.discountPrice || item.product.price;
                return (
                  <div
                    key={idx}
                    className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.image}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover bg-zinc-950 border border-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{item.product.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">BC: {item.product.barcode}</p>
                        <div className="flex items-baseline gap-1.5 mt-1">
                          <span className="text-xs font-bold text-emerald-400">
                            Rp {activePrice.toLocaleString('id-ID')}
                          </span>
                          {item.product.discountPrice && (
                            <span className="text-[10px] text-zinc-500 line-through">
                              Rp {item.product.price.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity editors */}
                      <div className="flex items-center bg-zinc-950 px-2 py-1.5 rounded-xl border border-zinc-800/80">
                        <button
                          onClick={() => onUpdateQuantity(item.product.barcode, -1)}
                          className="p-1 text-zinc-400 hover:text-white"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-white font-mono min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.barcode, 1)}
                          className="p-1 text-zinc-400 hover:text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Total Item Price */}
                      <span className="text-xs font-bold text-white font-mono min-w-[80px] text-right">
                        Rp {(activePrice * item.quantity).toLocaleString('id-ID')}
                      </span>

                      {/* Trash */}
                      <button
                        onClick={() => onRemoveItem(item.product.barcode)}
                        className="p-2 text-zinc-500 hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TAXES, VOUCHERS, SUMMARY, CHECKOUT */}
        <div className="lg:col-span-4">
          <div className="bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-800 p-5 space-y-5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Ringkasan Transaksi POS
            </h3>

            {/* VOUCHER APPLICATION CARD */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gunakan Voucher Belanja</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: DISKONSMART10"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  disabled={cartItems.length === 0}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleApplyVoucher}
                  disabled={cartItems.length === 0 || isValidating}
                  className="px-4 py-2 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs font-semibold rounded-xl transition"
                >
                  {isValidating ? '...' : 'Gunakan'}
                </button>
              </div>
              
              {appliedVoucher && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-400 flex items-center justify-between">
                  <div>
                    <span className="font-bold">{appliedVoucher.code}</span>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{appliedVoucher.title}</p>
                  </div>
                  <button 
                    onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }}
                    className="text-red-400 hover:text-red-300 font-bold ml-2 text-xs"
                  >
                    X
                  </button>
                </div>
              )}

              {voucherError && (
                <p className="text-[10px] text-red-400 font-semibold">{voucherError}</p>
              )}
            </div>

            {/* BILL BREAKDOWN DETAILS */}
            <div className="space-y-2.5 text-xs border-t border-zinc-800 pt-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal Belanja</span>
                <span className="text-zinc-200 font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-emerald-400">
                  <span>Diskon Voucher ({appliedVoucher.value}%)</span>
                  <span className="font-mono">- Rp {voucherDiscount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Pajak Negara (PPN 11%)</span>
                <span className="text-zinc-200 font-mono">Rp {tax.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="flex justify-between text-sm font-bold text-white pt-2.5 border-t border-zinc-800">
                <span>Total Tagihan</span>
                <span className="text-emerald-400 font-mono">Rp {finalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* PAYMENT GUARANTEE */}
            <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60 flex items-center gap-2.5 text-[10px] text-zinc-500">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Pembayaran dilindungi Enkripsi SSL. QRIS & saldo poin member diupdate otomatis setelah terverifikasi lunas.
              </span>
            </div>

            {/* ACTION CHECKOUT */}
            <button
              id="btn-pos-checkout"
              onClick={() => onCheckout(appliedVoucher?.code)}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-extrabold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{language === 'id' ? 'Lanjut ke Pembayaran' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
