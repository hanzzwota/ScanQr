/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, QrCode, Smartphone, Printer, X, ShieldAlert, Sparkles, AlertCircle, ShoppingBag } from 'lucide-react';
import { Order, PaymentMethod } from '../types';

interface PaymentModalProps {
  order: Order | null;
  onClose: () => void;
  onPaymentSuccess: () => void;
  language: 'id' | 'en';
}

export default function PaymentModal({
  order,
  onClose,
  onPaymentSuccess,
  language
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('QRIS');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PAID' | 'FAILED'>('PENDING');
  const [paymentPollingInterval, setPaymentPollingInterval] = useState<any>(null);
  const [countdown, setCountdown] = useState(4); // simulate payment in 4 seconds
  const [showReceipt, setShowReceipt] = useState(false);

  // Lists of available payments grouped
  const WALLET_METHODS: { id: PaymentMethod; label: string; logo: string }[] = [
    { id: 'QRIS', label: 'QRIS Auto-Paid', logo: 'https://images.unsplash.com/photo-1601597111158-2fceff270190?w=100&auto=format&fit=crop&q=60' },
    { id: 'DANA', label: 'DANA Wallet', logo: '' },
    { id: 'OVO', label: 'OVO Cash', logo: '' },
    { id: 'GOPAY', label: 'GoPay', logo: '' },
    { id: 'SHOPEEPAY', label: 'ShopeePay', logo: '' },
    { id: 'LINKAJA', label: 'LinkAja', logo: '' }
  ];

  const BANK_METHODS: { id: PaymentMethod; label: string }[] = [
    { id: 'VA', label: 'Virtual Account (Mandiri/BCA)' },
    { id: 'BANK_TRANSFER', label: 'Transfer Bank Manual' },
    { id: 'DEBIT', label: 'Kartu Debit ATM' },
    { id: 'CREDIT', label: 'Kartu Kredit Visa/Mastercard' }
  ];

  const CASH_METHODS: { id: PaymentMethod; label: string }[] = [
    { id: 'CASH', label: 'Uang Tunai (POS Kasir)' },
    { id: 'COD', label: 'Cash on Delivery (COD)' }
  ];

  // Start status polling
  useEffect(() => {
    if (order) {
      setPaymentStatus('PENDING');
      setCountdown(4);

      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders/${order.id}/status`);
          const data = await res.json();
          
          if (data.status === 'PAID') {
            setPaymentStatus('PAID');
            clearInterval(interval);
            // play success voice assistants if supported
            try {
              const utterance = new SpeechSynthesisUtterance(language === 'id' ? "Pembayaran berhasil diterima. Terima kasih!" : "Payment verified. Thank you!");
              utterance.lang = language === 'id' ? 'id-ID' : 'en-US';
              window.speechSynthesis.speak(utterance);
            } catch(e){}
          }
        } catch (err) {
          console.error("Polling error:", err);
        }

        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);

      setPaymentPollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    }
  }, [order, selectedMethod]);

  // Handle manual trigger payment (especially useful for CASH checkout by cashier)
  const handleManualPay = async () => {
    if (!order) return;
    try {
      const response = await fetch(`/api/orders/${order.id}/pay-manual`, { method: 'POST' });
      if (response.ok) {
        setPaymentStatus('PAID');
        if (paymentPollingInterval) {
          clearInterval(paymentPollingInterval);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger web print receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]">
        
        {/* LEFT COLUMN: PAYMENT SELECTOR PANEL */}
        <div className="flex-1 p-6 space-y-5 border-r border-zinc-800">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Metode Pembayaran</span>
            </h3>
            <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl space-y-1 border border-zinc-850">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">No. Invoice</span>
            <p className="text-sm font-mono font-bold text-white">{order.id}</p>
            <div className="flex justify-between items-center pt-2 border-t border-zinc-900 mt-2">
              <span className="text-xs text-zinc-400">{language === 'id' ? 'Total Tagihan:' : 'Total Amount:'}</span>
              <span className="text-base font-bold text-emerald-400 font-mono">Rp {order.finalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar text-xs">
            {/* GROUP 1: QRIS / E-WALLET */}
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">E-Wallet & QRIS</span>
              <div className="grid grid-cols-2 gap-2">
                {WALLET_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-3 text-left rounded-xl border flex items-center gap-2.5 transition active:scale-95 ${selectedMethod === method.id ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold' : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-400'}`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GROUP 2: VIRTUAL ACCOUNT / DEBIT */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Kartu & Transfer Bank</span>
              <div className="grid grid-cols-2 gap-2">
                {BANK_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-3 text-left rounded-xl border text-xs transition active:scale-95 ${selectedMethod === method.id ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold' : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-400'}`}
                  >
                    <span>{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GROUP 3: CASH / TUNAI */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Tunai Kasir / COD</span>
              <div className="grid grid-cols-2 gap-2">
                {CASH_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-3 text-left rounded-xl border text-xs transition active:scale-95 ${selectedMethod === method.id ? 'bg-emerald-500/10 border-emerald-500 text-white font-bold' : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-400'}`}
                  >
                    <span>{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE SCREEN (QR CODE / SUCCESS TICK / THERMAL RECEIPT) */}
        <div className="w-full md:w-[420px] bg-zinc-950 p-6 flex flex-col justify-between items-center text-center">
          
          {/* STATE A: PENDING PAYMENT STREAM */}
          {paymentStatus === 'PENDING' && (
            <div className="my-auto space-y-6 w-full">
              {['QRIS', 'DANA', 'OVO', 'GOPAY', 'SHOPEEPAY', 'LINKAJA'].includes(selectedMethod) ? (
                /* SHOW AUTOGENERATE QR CODE FOR WALLETS */
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl inline-block shadow-xl border-4 border-emerald-500">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=000000&data=qris://smartmarket-pos-${order.id}-amount-${order.finalAmount}`}
                      alt="QRIS QR Code"
                      className="w-44 h-44"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">Pindai QRIS {selectedMethod}</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal max-w-xs mx-auto">
                      {language === 'id'
                        ? 'Simulasi transfer kasir berjalan. Invoice akan otomatis di-update menjadi PAID dalam beberapa detik.'
                        : 'Simulator engine is processing transactions. Status will turn to PAID in a few seconds automatically.'}
                    </p>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-xl text-[11px] font-mono text-emerald-400 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>Mencari sinyal bayar... {countdown}s</span>
                  </div>
                </div>
              ) : (
                /* SHOW MANUAL POS PAYMENT INSTRUCTION FOR CASH/CREDIT */
                <div className="space-y-5 py-4">
                  <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-400">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-sm">Pembayaran Non-E-Wallet</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                      Metode {selectedMethod} membutuhkan otorisasi kartu kredit atau penyerahan uang cash tunai langsung ke mesin kasir pintar.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleManualPay}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl text-xs shadow"
                  >
                    Konfirmasi Terima Uang (PAID)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STATE B: SUCCESS & RECEIPT DISPLAY */}
          {paymentStatus === 'PAID' && (
            <div className="my-auto w-full space-y-6">
              {!showReceipt ? (
                /* COMPLETED SUCCESS TICK */
                <div className="space-y-5 py-4">
                  <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white tracking-tight">TRANSAKSI PAID</h3>
                    <p className="text-xs text-zinc-400">
                      Metode Pembayaran: <span className="text-emerald-400 font-semibold">{selectedMethod}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Invoice: {order.id}</p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      id="btn-show-thermal-receipt"
                      onClick={() => setShowReceipt(true)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Cetak Struk Pembayaran</span>
                    </button>
                    
                    <button
                      id="btn-close-payment-done"
                      onClick={() => {
                        onPaymentSuccess();
                        onClose();
                      }}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-xs transition"
                    >
                      Kembali ke Kasir POS
                    </button>
                  </div>
                </div>
              ) : (
                /* THE THERMAL CASHIER RECEIPT PREVIEW */
                <div className="w-full text-left space-y-4">
                  {/* THERMAL STICKER */}
                  <div 
                    id="printable-thermal-receipt" 
                    className="bg-white text-zinc-950 p-6 rounded-lg font-mono text-[10px] space-y-4 shadow-xl border border-zinc-200"
                  >
                    <div className="text-center space-y-1 pb-3 border-b border-dashed border-zinc-400">
                      <h4 className="font-black text-xs">SMART MARKET RETAIL</h4>
                      <p className="text-[8px] text-zinc-500">Kecerdasan AI Kasir Indonesia</p>
                      <p className="text-[8px] text-zinc-500">Jl. Emerald Raya No. 57, Jakarta</p>
                      <p className="text-[8px] text-zinc-500 font-bold">Telp: 0812-3456-7890</p>
                    </div>

                    {/* Meta info block */}
                    <div className="space-y-0.5 text-[9px] pb-3 border-b border-dashed border-zinc-400 text-zinc-700">
                      <div className="flex justify-between">
                        <span>INV ID:</span>
                        <span className="font-bold">{order.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TANGGAL:</span>
                        <span>{order.createdAt.substring(0, 19).replace('T', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OPERATOR:</span>
                        <span>Kasir POS (Admin)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PELANGGAN:</span>
                        <span>{order.customerName}</span>
                      </div>
                    </div>

                    {/* Cart Items list */}
                    <div className="space-y-1.5 py-2 border-b border-dashed border-zinc-400">
                      {order.items.map((item, i) => {
                        const price = item.product.discountPrice || item.product.price;
                        return (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between font-bold">
                              <span>{item.product.name}</span>
                            </div>
                            <div className="flex justify-between text-zinc-600 text-[8px]">
                              <span>{item.quantity} x Rp {price.toLocaleString('id-ID')}</span>
                              <span>Rp {(price * item.quantity).toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Breakdown totals */}
                    <div className="space-y-1 text-[9px] text-zinc-700">
                      <div className="flex justify-between">
                        <span>Subtotal Jual:</span>
                        <span>Rp {order.total.toLocaleString('id-ID')}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-zinc-600 font-bold">
                          <span>Kupon Diskon:</span>
                          <span>- Rp {order.discount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>PPN (11%):</span>
                        <span>Rp {order.tax.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-black text-zinc-950 text-xs border-t border-dashed border-zinc-300 pt-2">
                        <span>TOTAL AKHIR:</span>
                        <span>Rp {order.finalAmount.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Payment success tags */}
                    <div className="text-center space-y-1 pt-3 border-t border-dashed border-zinc-400">
                      <p className="font-extrabold text-[9px] uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 py-1 rounded">
                        LUNAS via {order.paymentMethod}
                      </p>
                      <p className="text-[7px] text-zinc-400">Poin & Level Reward diupdate secara real-time.</p>
                      <p className="text-[8px] font-black text-zinc-800 pt-1">--- TERIMA KASIH BELANJA ---</p>
                    </div>

                    {/* Barcode image mockup on thermal */}
                    <div className="flex flex-col items-center pt-2">
                      <div className="h-6 w-full bg-[repeating-linear-gradient(90deg,black_0px,black_2px,transparent_2px,transparent_6px)] opacity-80"></div>
                      <span className="text-[7px] text-zinc-500 font-mono mt-1">{order.id}</span>
                    </div>
                  </div>

                  {/* Actions under thermal */}
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrintReceipt}
                      className="flex-1 py-2.5 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Printer className="w-4 h-4 text-zinc-950" />
                      <span>Cetak PDF</span>
                    </button>
                    <button
                      onClick={() => {
                        onPaymentSuccess();
                        onClose();
                      }}
                      className="px-4 py-2.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 font-bold rounded-xl text-xs transition"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Secure padlock logo at bottom */}
          <div className="mt-6 flex items-center justify-center gap-1 text-[9px] text-zinc-600 font-mono">
            <Smartphone className="w-3.5 h-3.5 text-zinc-600 animate-pulse" />
            <span>ID-EN SECURED BANK GATEWAY</span>
          </div>
        </div>

      </div>
    </div>
  );
}
