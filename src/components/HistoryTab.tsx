/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { History, Search, FileText, UserCheck, ShieldAlert, CreditCard, RefreshCw } from 'lucide-react';
import { ScanHistory, PaymentHistory, LoginHistory, AuditLog } from '../types';

interface HistoryTabProps {
  scans: ScanHistory[];
  payments: PaymentHistory[];
  logins: LoginHistory[];
  audits: AuditLog[];
  onRefresh: () => void;
  language: 'id' | 'en';
}

export default function HistoryTab({
  scans,
  payments,
  logins,
  audits,
  onRefresh,
  language
}: HistoryTabProps) {
  const [activeTab, setActiveTab] = useState<'scans' | 'payments' | 'logins' | 'audits'>('scans');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering logs
  const getFilteredLogs = () => {
    const q = searchQuery.toLowerCase();
    switch (activeTab) {
      case 'scans':
        return scans.filter(s => 
          s.barcode.includes(q) || 
          (s.productName && s.productName.toLowerCase().includes(q)) ||
          s.scannedBy.toLowerCase().includes(q)
        );
      case 'payments':
        return payments.filter(p => 
          p.orderId.toLowerCase().includes(q) || 
          p.paymentMethod.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
        );
      case 'logins':
        return logins.filter(l => 
          l.username.toLowerCase().includes(q) || 
          l.role.toLowerCase().includes(q) ||
          l.device.toLowerCase().includes(q)
        );
      case 'audits':
        return audits.filter(a => 
          a.actor.toLowerCase().includes(q) || 
          a.action.toLowerCase().includes(q) ||
          a.details.toLowerCase().includes(q)
        );
    }
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6" id="history-view-container">
      
      {/* TABS SELECTOR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-zinc-800">
        <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-850">
          <button
            onClick={() => { setActiveTab('scans'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'scans' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
          >
            {language === 'id' ? 'Riwayat Scan' : 'Scan Log'}
          </button>
          <button
            onClick={() => { setActiveTab('payments'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'payments' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
          >
            {language === 'id' ? 'Pembayaran' : 'Payments'}
          </button>
          <button
            onClick={() => { setActiveTab('logins'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'logins' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
          >
            {language === 'id' ? 'Sesi Login' : 'Logins'}
          </button>
          <button
            onClick={() => { setActiveTab('audits'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'audits' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
          >
            Audit Log
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-600 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder={language === 'id' ? "Filter riwayat..." : "Filter history..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition font-sans w-48"
            />
          </div>

          <button
            onClick={onRefresh}
            className="p-2 bg-zinc-950 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE HISTORY TABLE */}
      <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            {language === 'id' ? 'Belum ada rekaman log yang cocok.' : 'No matched logs available.'}
          </div>
        ) : (
          <div className="overflow-x-auto text-xs text-zinc-400 text-left">
            <table className="w-full">
              <thead className="bg-zinc-900/60 font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                {activeTab === 'scans' && (
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Barcode</th>
                    <th className="p-4">Nama Produk</th>
                    <th className="p-4">Tanggal & Waktu</th>
                    <th className="p-4">Mode</th>
                    <th className="p-4">Scanned By</th>
                    <th className="p-4">Status</th>
                  </tr>
                )}
                {activeTab === 'payments' && (
                  <tr>
                    <th className="p-4">ID Transaksi</th>
                    <th className="p-4">No. Invoice</th>
                    <th className="p-4">Metode Bayar</th>
                    <th className="p-4">Jumlah Nominal</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Tanggal</th>
                  </tr>
                )}
                {activeTab === 'logins' && (
                  <tr>
                    <th className="p-4">ID Sesi</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Level Akses</th>
                    <th className="p-4">Alat Device</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Waktu</th>
                  </tr>
                )}
                {activeTab === 'audits' && (
                  <tr>
                    <th className="p-4">ID Audit</th>
                    <th className="p-4">Aktor</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Operasi / Aksi</th>
                    <th className="p-4">Rincian Perubahan</th>
                    <th className="p-4">Tanggal</th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-zinc-800/40">
                {activeTab === 'scans' && (filteredLogs as ScanHistory[]).map((log, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/10">
                    <td className="p-4 font-mono text-zinc-600 text-[10px]">{log.id}</td>
                    <td className="p-4 font-mono font-semibold text-zinc-300">{log.barcode}</td>
                    <td className="p-4 text-white font-medium">{log.productName || '-'}</td>
                    <td className="p-4 text-zinc-500">{log.timestamp.replace('T', ' ').substring(0, 19)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.mode === 'AI' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {log.mode}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-300 font-medium">@{log.scannedBy}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {activeTab === 'payments' && (filteredLogs as PaymentHistory[]).map((log, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/10">
                    <td className="p-4 font-mono text-zinc-600 text-[10px]">{log.id}</td>
                    <td className="p-4 font-mono font-bold text-zinc-300">{log.orderId}</td>
                    <td className="p-4 text-white font-medium">{log.paymentMethod}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">Rp {log.amount.toLocaleString('id-ID')}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-[9px]">
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500">{log.timestamp.replace('T', ' ').substring(0, 19)}</td>
                  </tr>
                ))}

                {activeTab === 'logins' && (filteredLogs as LoginHistory[]).map((log, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/10">
                    <td className="p-4 font-mono text-zinc-600 text-[10px]">{log.id}</td>
                    <td className="p-4 text-white font-bold">@{log.username}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-zinc-800 text-[10px] text-zinc-300 rounded border border-zinc-700/60 font-semibold">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400 truncate max-w-[150px]">{log.device}</td>
                    <td className="p-4 font-mono text-zinc-500">{log.ip}</td>
                    <td className="p-4 text-zinc-500">{log.timestamp.replace('T', ' ').substring(0, 19)}</td>
                  </tr>
                ))}

                {activeTab === 'audits' && (filteredLogs as AuditLog[]).map((log, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/10">
                    <td className="p-4 font-mono text-zinc-600 text-[10px]">{log.id}</td>
                    <td className="p-4 text-white font-bold">@{log.actor}</td>
                    <td className="p-4 text-zinc-500">{log.role}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-zinc-800 text-[10px] text-zinc-300 rounded border border-zinc-700/60 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-300 font-medium truncate max-w-[280px]">{log.details}</td>
                    <td className="p-4 text-zinc-500">{log.timestamp.replace('T', ' ').substring(0, 19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
