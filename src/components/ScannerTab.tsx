/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Sparkles, Volume2, Search, Plus, MapPin, AlertCircle, ShoppingCart, TrendingUp, Info, HelpCircle } from 'lucide-react';
import { Product } from '../types';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

interface ScannerTabProps {
  onAddProductToCart: (product: Product) => void;
  onOpenProductEditor: (barcode: string) => void;
  language: 'id' | 'en';
  isOnline: boolean;
}

export default function ScannerTab({
  onAddProductToCart,
  onOpenProductEditor,
  language,
  isOnline
}: ScannerTabProps) {
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  // Camera premium parameters
  const [flashOn, setFlashOn] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [voiceAssistant, setVoiceAssistant] = useState(true);

  // AI discovery loading
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);

  // Local preset scanning barcodes to make testing easy
  const PRESET_PRODUCTS = [
    { name: "Teh Botol Sosro", barcode: "8998866200225" },
    { name: "Indomie Goreng Spesial", barcode: "8999999035619" },
    { name: "AQUA Air Mineral", barcode: "8992222013589" },
    { name: "Oreo Sandwich Biscuit", barcode: "7622210811119" },
    { name: "Pepsodent Pasta Gigi", barcode: "8991001100224" },
    { name: "Rinso Deterjen Bubuk", barcode: "8991002120443" }
  ];

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Stop camera scanning
  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanning", err);
      }
    }
  };

  // Start real camera scanning
  const startCamera = async () => {
    setScanError(null);
    setScannedProduct(null);
    setScannedResult(null);

    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameraPermission('granted');
        const rearCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        ) || devices[0];

        const html5QrCode = new Html5Qrcode("reader-container");
        html5QrCodeRef.current = html5QrCode;
        setIsScanning(true);

        await html5QrCode.start(
          rearCamera.id,
          {
            fps: 15,
            qrbox: { width: 260, height: 180 },
            aspectRatio: 1.33
          },
          (decodedText) => {
            // Success barcode callback
            handleBarcodeFound(decodedText, 'CAMERA');
            stopCamera();
          },
          (errorMessage) => {
            // Ignore normal non-match framing logs to prevent performance issues
          }
        );
      } else {
        setScanError(language === 'id' ? "Kamera tidak terdeteksi." : "No cameras detected.");
      }
    } catch (err: any) {
      console.error(err);
      setCameraPermission('denied');
      setScanError(language === 'id' 
        ? "Gagal mengakses kamera. Menampilkan Mode Simulator di bawah." 
        : "Camera access denied. Showing Scan Simulator below."
      );
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Voice synthesis read-out
  const triggerVoiceAssistant = (productName: string) => {
    if (!voiceAssistant) return;
    try {
      const speechText = language === 'id' 
        ? `Produk ditemukan. ${productName}.` 
        : `Product identified: ${productName}.`;
      
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = language === 'id' ? 'id-ID' : 'en-US';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis failure:", e);
    }
  };

  // Match scanned barcode
  const handleBarcodeFound = async (barcode: string, mode: 'CAMERA' | 'AI' | 'MANUAL') => {
    setScannedResult(barcode);
    setScanError(null);
    setScannedProduct(null);
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, mode })
      });
      const data = await response.json();

      if (data.found) {
        setScannedProduct(data.product);
        triggerVoiceAssistant(data.product.name);
      } else {
        setScanError(language === 'id' 
          ? "Produk belum tersedia di database." 
          : "Product not available in database."
        );
      }
    } catch (err) {
      setScanError(language === 'id' 
        ? "Gangguan koneksi lokal." 
        : "Local database connection error."
      );
    }
  };

  // Trigger Smart AI Scan
  const handleSmartAiScan = async (codeStr?: string, description?: string) => {
    setIsAiLoading(true);
    setScanError(null);
    const targetCode = codeStr || scannedResult || manualBarcode || "8997212345678";
    
    try {
      const response = await fetch('/api/scan/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: targetCode,
          description: description || ""
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setScannedProduct(data.product);
        setScannedResult(data.product.barcode);
        setAiRecommendations(data.recommends || []);
        triggerVoiceAssistant(data.product.name);
      } else {
        setScanError(data.error || "AI fails to decode.");
      }
    } catch (err) {
      setScanError(language === 'id' ? "Gagal menghubungi modul AI." : "Failed to contact AI module.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Scan file from Gallery upload simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScanError(null);
      // Simulate reading barcode of indomie / aqua
      const mockBarcodes = ["8999999035619", "8998866200225", "8992222013589", "7622210811119"];
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      
      setIsAiLoading(true);
      setTimeout(() => {
        setIsAiLoading(false);
        handleBarcodeFound(randomBarcode, 'MANUAL');
      }, 1500);
    }
  };

  return (
    <div className="space-y-6" id="scanner-view-container">
      {/* HEADER ROW WITH VOICE SETTING */}
      <div className="flex items-center justify-between bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            {language === 'id' ? 'Kamera Scan & Smart AI' : 'Camera Scan & Smart AI'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {language === 'id' 
              ? 'Scan Barcode 1D/2D, QR Code, atau gunakan kecerdasan AI.' 
              : 'Scan 1D/2D Barcode, QR code or trigger AI analysis.'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
            <Volume2 className={`w-4 h-4 ${voiceAssistant ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span>Voice Assistant</span>
            <input 
              type="checkbox" 
              checked={voiceAssistant} 
              onChange={() => setVoiceAssistant(!voiceAssistant)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 relative"></div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CAMERA / PRESETS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* CAMERA STAGE */}
          <div className="relative bg-black rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl aspect-[4/3] flex flex-col items-center justify-center">
            {isScanning ? (
              <div id="reader-container" className="w-full h-full object-cover"></div>
            ) : (
              <div className="text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto animate-pulse">
                  <Camera className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-white">
                    {language === 'id' ? 'Kamera Scanner Siap' : 'Camera Scanner Ready'}
                  </p>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    {language === 'id' 
                      ? 'Nyalakan kamera untuk membaca barcode produk otomatis secara real-time.' 
                      : 'Enable camera streaming to instantly capture and decode market barcodes.'}
                  </p>
                </div>
                <button
                  id="btn-start-camera"
                  onClick={startCamera}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 text-sm"
                >
                  {language === 'id' ? 'Aktifkan Kamera' : 'Activate Camera'}
                </button>
              </div>
            )}

            {/* FLOATING CAMERA ADJS (ONLY WHEN ACTIVE) */}
            {isScanning && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-700">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setFlashOn(!flashOn)}
                    className={`p-2 rounded-lg text-xs font-bold transition ${flashOn ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800 text-zinc-400'}`}
                  >
                    Flash: {flashOn ? 'ON' : 'OFF'}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400">Zoom:</span>
                    <input 
                      type="range" 
                      min="1" 
                      max="3" 
                      step="0.5" 
                      value={zoomLevel} 
                      onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                      className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
                <button 
                  id="btn-stop-camera"
                  onClick={stopCamera}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-xs"
                >
                  {language === 'id' ? 'Matikan' : 'Disable'}
                </button>
              </div>
            )}
          </div>

          {/* QUICK DEMO SIMULATOR BAR (VITAL FOR IFRAME TESTING) */}
          <div className="bg-zinc-900/60 backdrop-blur-md p-5 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                {language === 'id' ? 'Simulator Barcode (Mudah di-Klik)' : 'Barcode Simulator (Click-to-Scan)'}
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                No Camera Mode
              </span>
            </div>
            
            <p className="text-xs text-zinc-400">
              {language === 'id'
                ? 'Klik salah satu produk ritel di bawah ini untuk mensimulasikan scan instan dari scanner supermarket.'
                : 'Click any premium item below to simulate a hardware laser barcode scan instantly.'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_PRODUCTS.map((prod, i) => (
                <button
                  key={i}
                  id={`preset-barcode-btn-${prod.barcode}`}
                  onClick={() => handleBarcodeFound(prod.barcode, 'MANUAL')}
                  className="p-3 bg-zinc-800/50 hover:bg-zinc-800 hover:border-emerald-500/40 border border-zinc-700/50 text-left rounded-xl transition duration-200 group active:scale-95"
                >
                  <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-400">{prod.name}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">{prod.barcode}</p>
                </button>
              ))}
            </div>

            {/* MANUAL MAN-INPUT BARCODE & GALLERY FILE UPLOAD */}
            <div className="border-t border-zinc-800 pt-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={language === 'id' ? 'Ketik barcode manual...' : 'Type barcode manually...'}
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                />
                <button
                  id="btn-manual-search"
                  onClick={() => handleBarcodeFound(manualBarcode, 'MANUAL')}
                  disabled={!manualBarcode}
                  className="absolute right-2 top-1.5 p-1.5 bg-emerald-500 text-zinc-950 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="gallery-input" 
                />
                <label
                  htmlFor="gallery-input"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 cursor-pointer active:scale-95 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-zinc-400" />
                  {language === 'id' ? 'Ambil dari Galeri' : 'Scan from Gallery'}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DISCOVERED PRODUCT INFO OR ADD SCREEN */}
        <div className="lg:col-span-5">
          {/* AI LOADING OVERLAY STATE */}
          {isAiLoading ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full border-4 border-t-emerald-400 border-zinc-800 animate-spin flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-white text-base">Gemini AI Smart Analyzing...</h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  {language === 'id'
                    ? 'AI sedang mendeteksi nama produk, merek, detail kandungan nutrisi, dan mengestimasi harga pasar.'
                    : 'AI is decyphering packaging text, identifying brand, estimating prices, and formulating specs.'}
                </p>
              </div>
              <div className="space-y-1.5 text-[10px] text-zinc-500 font-mono bg-zinc-950/50 p-3 rounded-lg w-full max-w-xs">
                <div>[STATUS: DECRYPTING PACKAGING]</div>
                <div>[MODEL: gemini-3.5-flash]</div>
              </div>
            </div>
          ) : scannedProduct ? (
            /* DETAILED PRODUCT CARD PRESENTATION */
            <div className="bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-zinc-800/80 overflow-hidden shadow-2xl transition duration-300">
              {/* Product Hero Header Image */}
              <div className="relative h-48 bg-zinc-950">
                <img 
                  src={scannedProduct.image} 
                  alt={scannedProduct.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-80" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                
                {/* Category tag */}
                <span className="absolute top-4 left-4 bg-emerald-500 text-zinc-950 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wide">
                  {scannedProduct.category}
                </span>

                {/* Stock alert */}
                <span className={`absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full ${scannedProduct.stock > 10 ? 'bg-zinc-900/90 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {language === 'id' ? 'Stok: ' : 'Stock: '} {scannedProduct.stock}
                </span>
              </div>

              {/* Product core body */}
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">{scannedProduct.brand}</span>
                    <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      {scannedProduct.rackLocation}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                    {scannedProduct.name}
                  </h3>
                </div>

                {/* Pricing row */}
                <div className="flex items-baseline gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
                  {scannedProduct.discountPrice ? (
                    <>
                      <span className="text-xl font-bold text-emerald-400">
                        Rp {scannedProduct.discountPrice.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-zinc-500 line-through">
                        Rp {scannedProduct.price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] bg-red-500/10 text-red-400 font-semibold px-2 py-0.5 rounded border border-red-500/20">
                        {language === 'id' ? 'Hemat!' : 'Save!'}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-white">
                      Rp {scannedProduct.price.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                {/* Key Spec metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase mb-0.5">{language === 'id' ? 'Isi Bersih' : 'Net Weight'}</span>
                    <span className="text-zinc-200 font-medium">{scannedProduct.netContent || scannedProduct.weight}</span>
                  </div>
                  <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase mb-0.5">Expired Date</span>
                    <span className="text-yellow-400/90 font-medium font-mono text-xs">{scannedProduct.expiredDate || '2027-12-31'}</span>
                  </div>
                </div>

                {/* Description & ingredients tabs */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-300 block">{language === 'id' ? 'Deskripsi Produk' : 'Product Description'}</span>
                  <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/20 p-3 rounded-xl border border-zinc-800">
                    {scannedProduct.description}
                  </p>
                </div>

                {scannedProduct.ingredients && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-zinc-300 block">{language === 'id' ? 'Kandungan / Bahan' : 'Ingredients'}</span>
                    <p className="text-[11px] text-zinc-500 leading-normal">
                      {scannedProduct.ingredients}
                    </p>
                  </div>
                )}

                {/* Competitor Price Comparisons if any */}
                {scannedProduct.competitorPrices && scannedProduct.competitorPrices.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-400" />
                      {language === 'id' ? 'Perbandingan Harga Pasar' : 'Market Price Comparisons'}
                    </span>
                    <div className="bg-zinc-950/60 rounded-xl overflow-hidden border border-zinc-800/80 text-xs">
                      {scannedProduct.competitorPrices.map((comp, idx) => (
                        <div key={idx} className="flex justify-between p-2.5 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/30">
                          <span className="text-zinc-400">{comp.store}</span>
                          <span className="font-medium text-zinc-300">Rp {comp.price.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions bottom bar */}
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => onAddProductToCart(scannedProduct)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/10 text-xs"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {language === 'id' ? 'Masukkan Keranjang' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => onOpenProductEditor(scannedProduct.barcode)}
                    className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition active:scale-95"
                  >
                    {language === 'id' ? 'Ubah Data' : 'Edit Catalog'}
                  </button>
                </div>
              </div>
            </div>
          ) : scannedResult ? (
            /* BARCODE SCANNED BUT NOT IN DATABASE -> "TAMBAHKAN BARU / SMART AI SCAN" */
            <div className="bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-zinc-800/80 p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              
              <div className="space-y-2">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block">Barcode: {scannedResult}</span>
                <h4 className="font-bold text-white text-lg">
                  {language === 'id' ? 'Produk Belum Tersedia' : 'Product Not Found'}
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  {language === 'id'
                    ? 'Barcode ini tidak terdaftar di POS kasir. Pilih Smart AI Scan untuk memprediksi deskripsi barang instan, atau ketik data manual.'
                    : 'This barcode is not recognized. Launch Gemini Smart AI scan to analyze details, or create catalog record.'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  id="btn-trigger-ai-scan"
                  onClick={() => handleSmartAiScan(scannedResult)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 active:scale-95 text-zinc-950 font-bold rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-500/10"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  {language === 'id' ? 'Smart AI Scan (Gemini)' : 'Smart AI Scan (Gemini)'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenProductEditor(scannedResult)}
                    className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition"
                  >
                    {language === 'id' ? '+ Tambah Manual' : '+ Create Record'}
                  </button>
                  <button
                    onClick={() => { setScannedResult(null); setScanError(null); }}
                    className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 rounded-xl text-xs transition"
                  >
                    {language === 'id' ? 'Reset' : 'Reset'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* INITIAL BLANK GUIDE PANEL */
            <div className="bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-zinc-800/80 p-8 text-center space-y-6 min-h-[350px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h4 className="font-bold text-white text-sm">
                  {language === 'id' ? 'Menunggu Hasil Scan...' : 'Awaiting Scan Result...'}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {language === 'id'
                    ? 'Gunakan kamera scanner atau gunakan simulator di samping kiri untuk menguji data kasir secara langsung.'
                    : 'Activate camera stream or trigger custom simulated barcode triggers on the left.'}
                </p>
              </div>
            </div>
          )}

          {/* AI RECOMS CONTAINER (ONLY AFTER AI SCAN) */}
          {scannedProduct && aiRecommendations.length > 0 && (
            <div className="mt-6 bg-zinc-900/40 backdrop-blur-sm p-4 rounded-3xl border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {language === 'id' ? 'Rekomendasi Produk AI' : 'AI Related Recommendations'}
              </h4>
              <div className="space-y-2">
                {aiRecommendations.map((rec, i) => (
                  <button
                    key={i}
                    onClick={() => handleBarcodeFound(rec.barcode, 'AI')}
                    className="w-full flex items-center justify-between p-2.5 bg-zinc-950/40 hover:bg-zinc-800 border border-zinc-800/50 rounded-xl text-left text-xs text-zinc-300 transition"
                  >
                    <span className="font-medium truncate max-w-[200px]">{rec.name}</span>
                    <span className="text-emerald-400 font-semibold font-mono">Rp {rec.price.toLocaleString('id-ID')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
