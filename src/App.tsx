/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Camera, ShoppingCart, LayoutDashboard, History, Database, Code, Globe, Wifi, WifiOff, Sun, Moon, LogIn, Award, Bell, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';
import { Product, CartItem, Order, ScanHistory, PaymentHistory, LoginHistory, AuditLog, AppNotification } from './types';
import ScannerTab from './components/ScannerTab';
import ProductsTab from './components/ProductsTab';
import CartTab from './components/CartTab';
import PaymentModal from './components/PaymentModal';
import HistoryTab from './components/HistoryTab';
import DashboardTab from './components/DashboardTab';
import ApiDocsTab from './components/ApiDocsTab';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'scanner' | 'products' | 'cart' | 'history' | 'dashboard' | 'apidocs'>('scanner');
  
  // App-wide preferences
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [isOnline, setIsOnline] = useState(true);
  const [isDark, setIsDark] = useState(true);

  // Database lists
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Logs lists
  const [scans, setScans] = useState<ScanHistory[]>([]);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [logins, setLogins] = useState<LoginHistory[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);

  // User session state
  const [userSession, setUserSession] = useState<{ username: string; email: string; phone: string; role: 'Admin' | 'Kasir' | 'Member' }>({
    username: 'member_rehan',
    email: 'rehanrehanhidayat57@gmail.com',
    phone: '081234567890',
    role: 'Admin' // default Admin to explore everything immediately
  });

  // active invoice during payment modal
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);

  // notifications stack
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'n1',
      title: 'Selamat Datang!',
      message: 'Sistem POS Smart Market siap mendeteksi barcode belanja Anda.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Trigger sound effect or voice read-out on scanned barcode
  const triggerAudioTick = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high chime sound
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.log("Audio API blocked:", e);
    }
  };

  // Fetch product list
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products list:", err);
    }
  };

  // Fetch administrative log centers
  const fetchHistoryLogs = async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      setScans(data.scans || []);
      setPayments(data.payments || []);
      setLogins(data.logins || []);
      setAudits(data.audits || []);
    } catch (err) {
      console.error("Failed to fetch transactional logs:", err);
    }
  };

  // Load Initial assets on mount
  useEffect(() => {
    fetchProducts();
    fetchHistoryLogs();
  }, []);

  // Update Cart logic
  const handleAddProductToCart = (product: Product) => {
    triggerAudioTick();
    setCartItems(prev => {
      const existing = prev.find(item => item.product.barcode === product.barcode);
      if (existing) {
        return prev.map(item => 
          item.product.barcode === product.barcode 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });

    // Push realtime Toast notification
    pushNotification(
      language === 'id' ? 'Barang Ditambahkan' : 'Item Added',
      `${product.name} telah dimasukkan ke keranjang kasir.`,
      'success'
    );
  };

  const handleUpdateCartQuantity = (barcode: string, delta: number) => {
    setCartItems(prev => 
      prev.map(item => {
        if (item.product.barcode === barcode) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (barcode: string) => {
    setCartItems(prev => prev.filter(item => item.product.barcode !== barcode));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Register real-time push notification alert
  const pushNotification = (title: string, message: string, type: 'success' | 'warning' | 'info' | 'promo') => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 8)]); // cap at 8
  };

  // Handle Switch User Roles (Admin / Kasir / Member)
  const handleSwitchRole = async (targetRole: 'Admin' | 'Kasir' | 'Member') => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: userSession.email,
          password: 'mock',
          role: targetRole
        })
      });
      const data = await response.json();
      if (response.ok) {
        setUserSession({
          username: data.user.username,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role
        });
        
        // Push alert toast
        pushNotification(
          language === 'id' ? 'Hak Akses Berubah' : 'Role Updated',
          `Sistem POS beralih ke dashboard ${targetRole}.`,
          'info'
        );

        fetchHistoryLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Invoice checkout checkout order
  const handlePOSCheckout = async (voucherCode?: string) => {
    if (cartItems.length === 0) return;
    
    // Simulate Offline Mode blocking checkout
    if (!isOnline) {
      alert(language === 'id' 
        ? "Mode Offline Aktif! Transaksi POS disimpan di memori dan akan disinkronkan otomatis saat internet terhubung kembali." 
        : "Offline Mode Active! Transaction logged locally and will sync when internet returns.");
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          paymentMethod: 'QRIS', // Default, can be altered inside payment modal
          voucherCode
        })
      });
      const data = await response.json();
      if (response.ok) {
        setCheckoutOrder(data.order);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post Checkout lunas payment callback trigger
  const handlePaymentCompleted = () => {
    // Clear shopping cart
    setCartItems([]);
    setCheckoutOrder(null);
    fetchProducts();
    fetchHistoryLogs();

    pushNotification(
      language === 'id' ? 'Pembayaran Lunas' : 'Payment Completed',
      'Invoice lunas terverifikasi oleh server. Poin bonus member diupdate.',
      'success'
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen font-sans ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* GLOBAL NAVBAR HEADER */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        
        {/* Brand identity (No unrequested branding prefix, matching metadata.json) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-500/20">
            <ShoppingCart className="w-5 h-5 font-black text-zinc-950" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase flex items-center gap-1.5">
              <span>Smart Market POS</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">V1.2</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono">Barcode & QR Cashier Hub</p>
          </div>
        </div>

        {/* CONTROLS AREA (LANG, INTERNET SIM, DARK/LIGHT, NOTIFS, SWITCH-ROLE) */}
        <div className="flex items-center gap-3.5">
          
          {/* OFFLINE SIMULATOR ICON BUTTON */}
          <button
            onClick={() => {
              setIsOnline(!isOnline);
              pushNotification(
                isOnline ? 'Koneksi Terputus' : 'Koneksi Terhubung',
                isOnline ? 'Sistem beralih ke mode offline lokal.' : 'Sistem kembali online. Mensinkronkan data...',
                isOnline ? 'warning' : 'success'
              );
            }}
            id="toggle-offline-mode"
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${isOnline ? 'bg-zinc-950 border-zinc-800 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="hidden sm:inline text-[10px]">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          {/* LANGUAGE TOGGLE SELECTOR */}
          <button
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            id="toggle-language"
            className="px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* ACTIVE ROLE SWITCHER DROPDOWN (Allows instantly testing all roles!) */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[10px]">
            <span className="text-zinc-600 px-2 py-1.5 font-bold uppercase hidden sm:inline">Role:</span>
            {(['Admin', 'Kasir', 'Member'] as const).map(role => (
              <button
                key={role}
                id={`switch-role-${role}`}
                onClick={() => handleSwitchRole(role)}
                className={`px-3 py-1 rounded-lg font-bold transition ${userSession.role === role ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* NOTIFICATION NOTIFIER CENTER */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationCenter(!showNotificationCenter)}
              id="btn-notification-bell"
              className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
              )}
            </button>

            {/* FLOATING TOAST STACK */}
            {showNotificationCenter && (
              <div className="absolute right-0 mt-3 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 text-left">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifikasi Real-time</h4>
                  <button 
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      setShowNotificationCenter(false);
                    }}
                    className="text-[9px] text-emerald-400 hover:underline"
                  >
                    Tandai dibaca
                  </button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar text-xs">
                  {notifications.map((n, i) => (
                    <div key={i} className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-850/80 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className={`font-bold ${n.type === 'warning' ? 'text-yellow-400' : 'text-emerald-400'}`}>{n.title}</span>
                        <span className="text-[8px] text-zinc-600 font-mono">{n.timestamp.substring(11, 19)}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: NAVIGATION RAIL BAR */}
        <nav className="lg:col-span-3 space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-black pl-3 block mb-4">
            Navigasi POS Kasir
          </span>

          <button
            id="nav-tab-scanner"
            onClick={() => setActiveTab('scanner')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 active:scale-98 ${activeTab === 'scanner' ? 'bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/15' : 'bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-white'}`}
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span>Barcode HP Scanner</span>
          </button>

          <button
            id="nav-tab-products"
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 active:scale-98 ${activeTab === 'products' ? 'bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/15' : 'bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-white'}`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Katalog Produk POS</span>
          </button>

          <button
            id="nav-tab-cart"
            onClick={() => setActiveTab('cart')}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 active:scale-98 ${activeTab === 'cart' ? 'bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/15' : 'bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>Keranjang Belanja</span>
            </div>
            {cartItems.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${activeTab === 'cart' ? 'bg-zinc-950 text-emerald-400' : 'bg-emerald-500 text-zinc-950'}`}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>

          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 active:scale-98 ${activeTab === 'dashboard' ? 'bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/15' : 'bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-white'}`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard {userSession.role === 'Member' ? 'Loyalitas Member' : 'Analitik Admin'}</span>
          </button>

          <button
            id="nav-tab-history"
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 active:scale-98 ${activeTab === 'history' ? 'bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/15' : 'bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-white'}`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Audit Logs & Riwayat</span>
          </button>

          <button
            id="nav-tab-apidocs"
            onClick={() => setActiveTab('apidocs')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-200 active:scale-98 ${activeTab === 'apidocs' ? 'bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/15' : 'bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-white'}`}
          >
            <Code className="w-4 h-4 shrink-0" />
            <span>REST API Swagger</span>
          </button>

          {/* ACTIVE USER SESSION BANNER */}
          <div className="pt-6 border-t border-zinc-800/80 mt-6 space-y-3">
            <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-850 text-left">
              <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest block">Operator Aktif</span>
              <p className="text-xs font-bold text-white mt-1">@{userSession.username}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{userSession.email}</p>
              
              <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-zinc-800 text-[10px] text-zinc-500">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Level: <span className="text-white font-bold uppercase">{userSession.role}</span></span>
              </div>
            </div>
          </div>
        </nav>

        {/* RIGHT COLUMN: MAIN CONTENT STAGE */}
        <main className="lg:col-span-9" id="main-route-canvas">
          
          {activeTab === 'scanner' && (
            <ScannerTab
              onAddProductToCart={handleAddProductToCart}
              onOpenProductEditor={(barcode) => {
                setActiveTab('products');
                // open direct modal trigger inside products tab
                setTimeout(() => {
                  const addBtn = document.getElementById('btn-add-new-product');
                  if (addBtn) addBtn.click();
                }, 200);
              }}
              language={language}
              isOnline={isOnline}
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab
              products={products}
              onRefreshProducts={fetchProducts}
              onAddProductToCart={handleAddProductToCart}
              onEditProduct={(barcode) => {}}
              language={language}
              isAdminOrKasir={userSession.role !== 'Member'}
            />
          )}

          {activeTab === 'cart' && (
            <CartTab
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveCartItem}
              onClearCart={handleClearCart}
              onCheckout={handlePOSCheckout}
              language={language}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              scans={scans}
              payments={payments}
              logins={logins}
              audits={audits}
              onRefresh={fetchHistoryLogs}
              language={language}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardTab
              role={userSession.role}
              language={language}
            />
          )}

          {activeTab === 'apidocs' && (
            <ApiDocsTab
              language={language}
            />
          )}

        </main>
      </div>

      {/* MODAL CHECKOUT & PAYMENT INTEGRATION */}
      {checkoutOrder && (
        <PaymentModal
          order={checkoutOrder}
          onClose={() => setCheckoutOrder(null)}
          onPaymentSuccess={handlePaymentCompleted}
          language={language}
        />
      )}
    </div>
  );
}
