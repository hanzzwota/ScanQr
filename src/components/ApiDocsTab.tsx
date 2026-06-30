/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Send, Code, ShieldCheck, Play, Key, Database, Cpu } from 'lucide-react';

interface ApiRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  summary: string;
  description: string;
  category: 'Auth' | 'Products' | 'Scanner' | 'POS Checkout';
  parameters?: string;
  sampleBody?: any;
}

export default function ApiDocsTab({ language }: { language: 'id' | 'en' }) {
  const [activeConsoleRoute, setActiveConsoleRoute] = useState<string | null>(null);
  const [consoleResponse, setConsoleResponse] = useState<string>('');
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [customBodyText, setCustomBodyText] = useState('');

  const ROUTES: ApiRoute[] = [
    {
      category: 'Auth',
      method: 'POST',
      path: '/api/auth/login',
      summary: 'Autentikasi multi-identitas',
      description: 'Mendukung pencocokan credentials menggunakan username, email, atau phone, lengkap dengan session cookies.',
      sampleBody: { identifier: 'rehanrehanhidayat57@gmail.com', password: 'password123', role: 'Admin' }
    },
    {
      category: 'Products',
      method: 'GET',
      path: '/api/products',
      summary: 'List katalog barang supermarket',
      description: 'Mendapatkan seluruh produk dari file-database lokal, filterable by category atau search queries.',
      parameters: 'q=indomie&category=Makanan'
    },
    {
      category: 'Scanner',
      method: 'POST',
      path: '/api/scan',
      summary: 'Verifikasi barcode laser POS',
      description: 'Mencocokkan barcode 1D/2D yang dipindai kamera HP dengan catalog database kasir.',
      sampleBody: { barcode: '8999999035619', mode: 'CAMERA' }
    },
    {
      category: 'Scanner',
      method: 'POST',
      path: '/api/scan/ai',
      summary: 'Analisis visual cerdas Gemini AI',
      description: 'Menggunakan Google Gemini 3.5 Flash untuk memprediksi deskripsi barang jika barcode tidak terdaftar di database.',
      sampleBody: { barcode: '8997212345678', description: 'Biskuit Keju Crispy Enak' }
    },
    {
      category: 'POS Checkout',
      method: 'POST',
      path: '/api/orders',
      summary: 'Pembuatan invoice POS Kasir',
      description: 'Membuat pesanan, menghitung PPN 11%, memotong stock, mengalokasikan poin member, dan mengaktifkan simulasi callback lunas.',
      sampleBody: {
        items: [
          {
            product: { barcode: '8998866200225', name: 'Teh Botol Sosro', price: 5000 },
            quantity: 2
          }
        ],
        paymentMethod: 'QRIS'
      }
    }
  ];

  const handleTryItOut = async (route: ApiRoute) => {
    setActiveConsoleRoute(route.path);
    setConsoleLoading(true);
    setConsoleResponse('');
    
    // Set custom body text initially
    if (route.sampleBody) {
      setCustomBodyText(JSON.stringify(route.sampleBody, null, 2));
    } else {
      setCustomBodyText('');
    }

    try {
      let fetchUrl = route.path;
      const options: RequestInit = {
        method: route.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (route.method === 'GET' && route.parameters) {
        fetchUrl += `?${route.parameters}`;
      }

      if (route.method !== 'GET') {
        const bodyObj = route.sampleBody;
        options.body = JSON.stringify(bodyObj);
      }

      const res = await fetch(fetchUrl, options);
      const data = await res.json();
      setConsoleResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setConsoleResponse(`Error executing REST test: ${e.message}`);
    } finally {
      setConsoleLoading(false);
    }
  };

  const handleExecuteCustom = async (route: ApiRoute) => {
    setConsoleLoading(true);
    setConsoleResponse('');
    try {
      const options: RequestInit = {
        method: route.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (route.method !== 'GET' && customBodyText) {
        options.body = JSON.stringify(JSON.parse(customBodyText));
      }

      const res = await fetch(route.path, options);
      const data = await res.json();
      setConsoleResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setConsoleResponse(`Execution error: ${e.message}`);
    } finally {
      setConsoleLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left" id="api-docs-container">
      <div className="bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-zinc-800">
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Code className="w-5 h-5 text-emerald-400" />
          <span>Interactive REST API Explorer & Swagger Spec</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Uji endpoint RESTful dari Barcode Smart Market langsung dari halaman ini. Gunakan simulator try-it-out untuk melihat respons JSON dinamis secara real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ROUTES INDEX */}
        <div className="lg:col-span-7 space-y-4">
          {ROUTES.map((route, i) => (
            <div
              key={i}
              id={`api-route-block-${route.path.replace(/\//g, '-')}`}
              className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition"
            >
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg font-mono ${route.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}>
                    {route.method}
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-mono text-xs font-bold text-white">{route.path}</p>
                    <p className="text-[10px] text-zinc-500">{route.summary}</p>
                  </div>
                </div>

                <button
                  id={`btn-try-api-${i}`}
                  onClick={() => handleTryItOut(route)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1 active:scale-95 transition"
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>Try</span>
                </button>
              </div>

              {/* ROUTE SPEC DETAILS */}
              <div className="px-4 pb-4 border-t border-zinc-900 pt-3 bg-zinc-950/20 text-xs space-y-2 text-zinc-400">
                <p className="leading-relaxed text-[11px]">{route.description}</p>
                <div className="text-[10px] text-zinc-600 font-mono">
                  <span>Kategori: {route.category}</span>
                  {route.parameters && <span className="ml-4">Query: {route.parameters}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* REST API CONSOLE */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-3xl p-5 space-y-4 min-h-[400px] flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>REST API Live Console</span>
              </h3>
              
              {activeConsoleRoute ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-500 font-mono">ENDPOINT TERPILIH:</span>
                    <p className="text-xs font-mono text-emerald-400 font-bold">{activeConsoleRoute}</p>
                  </div>

                  {customBodyText && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-mono">REQUEST BODY (EDITABLE):</span>
                      <textarea
                        value={customBodyText}
                        onChange={(e) => setCustomBodyText(e.target.value)}
                        className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] font-mono text-zinc-300 focus:outline-none"
                      ></textarea>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 font-mono">JSON RESPONSE:</span>
                      {consoleLoading && (
                        <span className="text-[10px] text-emerald-400 animate-pulse font-mono">WAIT...</span>
                      )}
                    </div>
                    
                    <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl h-56 overflow-auto font-mono text-[10px] text-zinc-300 custom-scrollbar leading-relaxed">
                      {consoleResponse ? (
                        <pre>{consoleResponse}</pre>
                      ) : (
                        <span className="text-zinc-600 font-mono">[Menunggu eksekusi...]</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                  <Database className="w-10 h-10 text-zinc-700 mb-2 animate-pulse" />
                  <p className="text-xs">Pilih salah satu REST route di sebelah kiri lalu klik tombol **Try** untuk menguji response API secara interaktif.</p>
                </div>
              )}
            </div>

            {activeConsoleRoute && (
              <button
                onClick={() => {
                  const targetRoute = ROUTES.find(r => r.path === activeConsoleRoute);
                  if (targetRoute) handleExecuteCustom(targetRoute);
                }}
                disabled={consoleLoading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Execute Request</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
