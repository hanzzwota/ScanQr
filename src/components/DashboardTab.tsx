/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Award, PiggyBank, Sparkles, AlertCircle, ShoppingBag, TrendingUp, Info, Activity, PackageCheck, Star } from 'lucide-react';
import { Product, MemberProfile } from '../types';

interface DashboardTabProps {
  role: 'Admin' | 'Kasir' | 'Member';
  language: 'id' | 'en';
}

export default function DashboardTab({
  role,
  language
}: DashboardTabProps) {
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [memberMetrics, setMemberMetrics] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch metrics depending on role
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      if (role === 'Member') {
        const res = await fetch('/api/dashboard/member');
        const data = await res.json();
        setMemberMetrics(data);
      } else {
        const res = await fetch('/api/dashboard/admin');
        const data = await res.json();
        setAdminMetrics(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [role]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-t-emerald-400 border-zinc-800 animate-spin"></div>
        <span>Memuat data analitik...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-view-container">
      
      {/* CASE A: ADMIN DASHBOARD */}
      {role !== 'Member' && adminMetrics && (
        <div className="space-y-6">
          
          {/* STATS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl space-y-2">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Total Produk</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white font-mono">{adminMetrics.metrics.totalProducts}</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Aktif</span>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl space-y-2">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Total Scan Hari Ini</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white font-mono">{adminMetrics.metrics.scansToday}</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Live</span>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl space-y-2">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Pendapatan Ritel</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-emerald-400 font-mono">
                  Rp {adminMetrics.metrics.totalRevenue.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold">PAID</span>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl space-y-2">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Total Member Ritel</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white font-mono">{adminMetrics.metrics.totalMembers}</span>
                <span className="text-[10px] text-zinc-500 font-semibold">Orang</span>
              </div>
            </div>
          </div>

          {/* CHARTS ROW (CUSTOM BEAUTIFUL DRAWN SVGS TO AVOID DEP-CONFLICTS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sales bar chart trend */}
            <div className="lg:col-span-8 bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Tren Grafik Penjualan (Harian)</span>
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">[100% REALTIME]</span>
              </div>

              {/* Custom SVG Bar Chart */}
              <div className="h-56 w-full flex items-end justify-between pt-6 pr-2">
                {adminMetrics.salesTrend.map((t: any, i: number) => {
                  const maxVal = Math.max(...adminMetrics.salesTrend.map((item: any) => item.sales));
                  const heightPercent = maxVal > 0 ? (t.sales / maxVal) * 80 : 20;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="text-[9px] font-mono font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(t.sales / 1000).toFixed(0)}k
                      </div>
                      {/* Bar fill */}
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className="w-8 bg-gradient-to-t from-emerald-600/20 to-emerald-400 rounded-t-lg group-hover:from-emerald-500 group-hover:to-teal-400 transition-all duration-300 shadow shadow-emerald-500/10 min-h-[10px]"
                      ></div>
                      <div className="text-[10px] text-zinc-500 font-mono font-bold">{t.date}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category distribution pie list */}
            <div className="lg:col-span-4 bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Kategori Terlaris</span>
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">Penyebaran inventaris produk dalam database.</p>
              </div>

              <div className="space-y-3 py-2">
                {adminMetrics.categoryChart.map((cat: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-300">
                      <span>{cat.name}</span>
                      <span className="font-mono font-bold text-zinc-400">{cat.value} items</span>
                    </div>
                    {/* custom meter */}
                    <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        style={{ width: `${(cat.value / adminMetrics.metrics.totalProducts) * 100}%` }}
                        className="bg-emerald-500 h-full rounded-full"
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* STOCK ALERTS AND EXPIRED DATE WARNINGS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Stock Alerts list */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl space-y-3">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Peringatan Stok Hampir Habis (&lt; 50 pcs)</span>
              </h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {adminMetrics.stockAlerts.map((prod: Product, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900 text-xs">
                    <div>
                      <p className="font-bold text-white truncate max-w-[180px]">{prod.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">BC: {prod.barcode} / Rak: {prod.rackLocation}</p>
                    </div>
                    <span className="font-extrabold text-red-400 font-mono bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/10 text-[10px]">
                      Sisa: {prod.stock} pcs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expired date check alerts */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl space-y-3">
              <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
                <span>Pengawasan Tanggal Kadaluarsa (Expired Date)</span>
              </h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {adminMetrics.expiredAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    Semua makanan & minuman dalam kondisi aman dikonsumsi.
                  </div>
                ) : (
                  adminMetrics.expiredAlerts.map((prod: Product, i: number) => (
                    <div key={i} className="flex justify-between items-center p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900 text-xs">
                      <div>
                        <p className="font-bold text-white truncate max-w-[180px]">{prod.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">BC: {prod.barcode}</p>
                      </div>
                      <span className="font-extrabold text-yellow-400 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/10">
                        {prod.expiredDate}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CASE B: MEMBER DASHBOARD */}
      {role === 'Member' && memberMetrics && (
        <div className="space-y-6">
          
          {/* MEMBERSHIP LEVEL TIERS CARD */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-emerald-950/40 border border-emerald-500/15 p-6 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-spin-slow shadow-lg shadow-emerald-500/10">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <span>MEMBER LEVEL:</span>
                    <span className="text-emerald-400 tracking-wide uppercase">{memberMetrics.level}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Semakin sering belanja di Smart Market, level keanggotaan Anda akan terus naik!
                  </p>
                </div>
              </div>

              {/* Progress visual tier */}
              <div className="w-full sm:w-56 space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>Level Progress</span>
                  <span className="font-bold">{memberMetrics.nextLevelProgress}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-900">
                  <div 
                    style={{ width: `${memberMetrics.nextLevelProgress}%` }}
                    className="bg-emerald-500 h-full rounded-full"
                  ></div>
                </div>
              </div>
            </div>

            {/* Balances details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800/80">
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-850/80 text-xs">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-1">Poin Loyalitas</span>
                <p className="text-xl font-bold text-white font-mono flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 animate-pulse" />
                  <span>{memberMetrics.points} Poin</span>
                </p>
              </div>

              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-850/80 text-xs">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-1">Saldo Cashback</span>
                <p className="text-xl font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                  <PiggyBank className="w-5 h-5 text-emerald-400" />
                  <span>Rp {memberMetrics.cashbackBalance.toLocaleString('id-ID')}</span>
                </p>
              </div>

              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-850/80 text-xs">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-1">Total Belanja Ritel</span>
                <p className="text-xl font-bold text-zinc-300 font-mono">
                  Rp {memberMetrics.totalSpent.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* MEMBER VOUCHERS WALLET LIST */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Dompet Kupon & Diskon Keanggotaan Anda</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {memberMetrics.coupons.map((coupon, idx) => (
                <div 
                  key={idx} 
                  className={`bg-zinc-900/60 p-5 rounded-2xl border flex flex-col justify-between space-y-4 relative overflow-hidden ${coupon.isUsed ? 'border-zinc-850 opacity-40' : 'border-zinc-800 hover:border-emerald-500/30'}`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2.5 py-0.5 rounded border border-emerald-500/20">
                        {coupon.code}
                      </span>
                      {coupon.isUsed && (
                        <span className="text-[9px] bg-zinc-850 text-zinc-500 px-2 py-0.5 rounded uppercase font-black">
                          Terpakai
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-bold text-white pt-1">{coupon.title}</h5>
                    <p className="text-[10px] text-zinc-500 leading-normal">{coupon.description}</p>
                  </div>

                  <div className="text-[9px] text-zinc-600 font-mono pt-2 border-t border-zinc-950 flex justify-between">
                    <span>S/d: {coupon.expiryDate}</span>
                    <span>Min. Belanja: Rp {coupon.minPurchase.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
