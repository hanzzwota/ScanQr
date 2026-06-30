/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { Product, Order, ScanHistory, PaymentMethod, Coupon, AuditLog } from './src/types';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to initialize Gemini SDK safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Active payments simulation map: orderId -> status
const paymentStatusMap = new Map<string, string>();

// Simulated Active Session
let activeSession = {
  username: "member_rehan",
  role: "Admin", // default to Admin for easy initial testing of all screens, user can switch roles in UI
  email: "rehanrehanhidayat57@gmail.com",
  phone: "081234567890"
};

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. AUTH API
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password, role } = req.body;
  if (!identifier) {
    res.status(400).json({ error: "Email/Username/Phone is required" });
    return;
  }

  // Set simulated session
  activeSession = {
    username: identifier.split('@')[0] || "user",
    role: role || "Admin",
    email: identifier.includes('@') ? identifier : "user@example.com",
    phone: identifier.match(/^\d+$/) ? identifier : "081234567890"
  };

  db.addLoginHistory({
    id: "LOG-" + Date.now(),
    username: activeSession.username,
    role: activeSession.role as any,
    timestamp: new Date().toISOString(),
    device: "Web Browser (Chrome/Safari)",
    ip: "192.168.1.1"
  });

  db.addAuditLog({
    id: "AUD-" + Date.now(),
    timestamp: new Date().toISOString(),
    actor: activeSession.username,
    role: activeSession.role,
    action: "Login",
    details: `User logged in with identifier: ${identifier} as ${activeSession.role}`
  });

  res.json({
    success: true,
    user: {
      ...activeSession,
      level: db.getMemberProfile().level,
      points: db.getMemberProfile().points
    },
    token: "mock-jwt-token-xyz"
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  db.addAuditLog({
    id: "AUD-" + Date.now(),
    timestamp: new Date().toISOString(),
    actor: activeSession.username,
    role: activeSession.role,
    action: "Logout",
    details: `User logged out`
  });
  res.json({ success: true });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const profile = db.getMemberProfile();
  res.json({
    user: {
      username: activeSession.username,
      role: activeSession.role,
      email: activeSession.email,
      phone: activeSession.phone,
      level: profile.level,
      points: profile.points,
      cashbackBalance: profile.cashbackBalance
    }
  });
});

// 2. PRODUCTS API
app.get('/api/products', (req: Request, res: Response) => {
  const { q, category } = req.query;
  let list = db.getProducts();

  if (category) {
    list = list.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (q) {
    const query = (q as string).toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.barcode.includes(query) || 
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }

  res.json(list);
});

app.get('/api/products/:barcode', (req: Request, res: Response) => {
  const product = db.getProductByBarcode(req.params.barcode);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: "Produk belum tersedia. Tambahkan produk baru?" });
  }
});

app.post('/api/products', (req: Request, res: Response) => {
  const productData: Product = req.body;
  if (!productData.barcode || !productData.name || !productData.price) {
    res.status(400).json({ error: "Barcode, nama produk, dan harga wajib diisi" });
    return;
  }

  // Fill in placeholders if missing
  const product: Product = {
    ...productData,
    rating: productData.rating || 4.5,
    reviews: productData.reviews || [],
    rackLocation: productData.rackLocation || "Rack-X",
    productionDate: productData.productionDate || new Date().toISOString().split('T')[0],
    image: productData.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60"
  };

  db.addProduct(product);

  db.addAuditLog({
    id: "AUD-" + Date.now(),
    timestamp: new Date().toISOString(),
    actor: activeSession.username,
    role: activeSession.role,
    action: "Create Product",
    details: `Added new product: ${product.name} (${product.barcode})`
  });

  res.json({ success: true, product });
});

app.put('/api/products/:barcode', (req: Request, res: Response) => {
  const success = db.updateProduct(req.params.barcode, req.body);
  if (success) {
    db.addAuditLog({
      id: "AUD-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: activeSession.username,
      role: activeSession.role,
      action: "Edit Product",
      details: `Updated product details for barcode: ${req.params.barcode}`
    });
    res.json({ success: true, product: db.getProductByBarcode(req.params.barcode) });
  } else {
    res.status(404).json({ error: "Produk tidak ditemukan" });
  }
});

app.delete('/api/products/:barcode', (req: Request, res: Response) => {
  const success = db.deleteProduct(req.params.barcode);
  if (success) {
    db.addAuditLog({
      id: "AUD-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: activeSession.username,
      role: activeSession.role,
      action: "Delete Product",
      details: `Deleted product with barcode: ${req.params.barcode}`
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Produk tidak ditemukan" });
  }
});

// Bulk Import
app.post('/api/products/import', (req: Request, res: Response) => {
  const { products } = req.body;
  if (!Array.isArray(products)) {
    res.status(400).json({ error: "Format salah, data produk harus berupa array" });
    return;
  }

  db.bulkImport(products);

  db.addAuditLog({
    id: "AUD-" + Date.now(),
    timestamp: new Date().toISOString(),
    actor: activeSession.username,
    role: activeSession.role,
    action: "Import Bulk Products",
    details: `Successfully imported ${products.length} products to database`
  });

  res.json({ success: true, message: `${products.length} produk berhasil diimport.` });
});

// Bulk Export
app.get('/api/products/export/download', (req: Request, res: Response) => {
  const products = db.getProducts();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=products_export.json');
  res.send(JSON.stringify(products, null, 2));
});

// 3. SCAN BARCODE & AI DECTECTION API
app.post('/api/scan', (req: Request, res: Response) => {
  const { barcode, mode } = req.body;
  if (!barcode) {
    res.status(400).json({ error: "Barcode is required" });
    return;
  }

  const product = db.getProductByBarcode(barcode);
  const scanTime = new Date().toISOString();

  if (product) {
    db.addScanHistory({
      id: "SCN-" + Date.now(),
      barcode,
      productName: product.name,
      timestamp: scanTime,
      scannedBy: activeSession.username,
      status: 'SUCCESS',
      mode: mode || 'CAMERA'
    });
    res.json({ found: true, product });
  } else {
    db.addScanHistory({
      id: "SCN-" + Date.now(),
      barcode,
      timestamp: scanTime,
      scannedBy: activeSession.username,
      status: 'NOT_FOUND',
      mode: mode || 'CAMERA'
    });
    res.json({ found: false, barcode, message: "Produk belum tersedia. Tambahkan produk baru atau gunakan Smart AI Scan?" });
  }
});

// Smart AI Scan Endpoint using Gemini 3.5 Flash
app.post('/api/scan/ai', async (req: Request, res: Response) => {
  const { barcode, description, imageBase64 } = req.body;
  
  const client = getGeminiClient();
  let queryDetail = barcode || description || "Produk Supermarket";
  
  if (!client) {
    // Generate intelligent mockup data if no Gemini key
    console.log("Gemini API key is not configured, running standard mockup AI simulation...");
    const mockProduct: Product = {
      barcode: barcode || "8997212345678",
      name: description ? `AI Premium ${description}` : "AI Detected Snacks Rasa Keju",
      brand: "AI Smart Choice",
      category: "Makanan",
      price: 12500,
      discountPrice: 11000,
      image: "https://images.unsplash.com/photo-1599490659223-93a95d5168a3?w=500&auto=format&fit=crop&q=60",
      weight: "120g",
      netContent: "110g",
      description: "Produk ini dideteksi secara cerdas oleh AI Smart Scan. Merupakan produk berkualitas tinggi dengan cita rasa modern dan kandungan vitamin pelengkap harian.",
      ingredients: "Bahan Pilihan Premium, Garam, Gula, Bumbu Penyedap Alami",
      rating: 4.5,
      reviews: [
        { id: "ai-r1", user: "AI Assistant", rating: 5, comment: "Estimasi produk terpercaya berdasarkan algoritma visual pintar kami.", date: "2026-06-30" }
      ],
      stock: 50,
      rackLocation: "A-04-C",
      productionDate: new Date().toISOString().split('T')[0],
      priceHistory: [
        { date: "2026-01-01", price: 13000 },
        { date: "2026-06-01", price: 12500 }
      ],
      competitorPrices: [
        { store: "Store A", price: 13000 },
        { store: "Store B", price: 12800 }
      ]
    };
    
    db.addScanHistory({
      id: "SCN-AI-" + Date.now(),
      barcode: mockProduct.barcode,
      productName: mockProduct.name,
      timestamp: new Date().toISOString(),
      scannedBy: activeSession.username,
      status: 'SUCCESS',
      mode: 'AI'
    });

    res.json({
      success: true,
      product: mockProduct,
      recommends: [
        { name: "Teh Botol Sosro", price: 5000, barcode: "8998866200225" },
        { name: "Oreo Sandwich Biscuit", price: 9500, barcode: "7622210811119" }
      ]
    });
    return;
  }

  try {
    let prompt = `You are a smart retail checkout AI assistant. 
Analyze the barcode/product description "${queryDetail}" and output a complete Indonesian market product catalog JSON object.
Adhere STRICTLY to the following Type schema:
{
  "barcode": "string (the barcode provided)",
  "name": "string (premium realistic Indonesian retail product name)",
  "brand": "string (well known FMCG brand)",
  "category": "string (one of: Makanan, Minuman, Kebutuhan Harian, Kesehatan & Kecantikan, Rumah Tangga)",
  "price": number (estimate real price in Rupiah, e.g. 15000),
  "discountPrice": number (slight discount price, e.g. 13500),
  "image": "string (unsplash food/drink product image url)",
  "weight": "string (e.g., '120g')",
  "netContent": "string (e.g., '100ml' or '100g')",
  "description": "string (persuasive Indonesian product description)",
  "ingredients": "string (comma-separated ingredients)",
  "rackLocation": "string (realistic rack position like 'A-04-C')",
  "rating": number (between 4.0 and 5.0)
}
Return ONLY valid raw JSON without any markdown formatting wrappers or backticks.`;

    let response;
    if (imageBase64) {
      // Image input analysis
      response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: 'image/jpeg'
            }
          },
          prompt
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });
    } else {
      // Text input analysis
      response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
    }

    const textOutput = response.text || "{}";
    const parsedProduct = JSON.parse(textOutput.trim());

    // Merge static properties
    const product: Product = {
      barcode: parsedProduct.barcode || barcode || "899" + Math.floor(Math.random() * 10000000000),
      name: parsedProduct.name || "AI Smart Product",
      brand: parsedProduct.brand || "FMCG Choice",
      category: parsedProduct.category || "Makanan",
      price: parsedProduct.price || 15000,
      discountPrice: parsedProduct.discountPrice || (parsedProduct.price ? Math.floor(parsedProduct.price * 0.9) : 13500),
      image: parsedProduct.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
      weight: parsedProduct.weight || "100g",
      netContent: parsedProduct.netContent || "90g",
      description: parsedProduct.description || "Dideteksi oleh kecerdasan buatan Smart Market.",
      ingredients: parsedProduct.ingredients || "Bahan-bahan Alami Pilihan",
      rating: parsedProduct.rating || 4.7,
      reviews: [
        { id: "ai-r2", user: "Sistem AI Smart Market", rating: 5, comment: "Dideteksi dengan akurasi visual tinggi menggunakan model AI Gemini.", date: "2026-06-30" }
      ],
      stock: 30,
      rackLocation: parsedProduct.rackLocation || "A-04-X",
      productionDate: new Date().toISOString().split('T')[0],
      expiredDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priceHistory: [
        { date: "2026-01-01", price: Math.floor((parsedProduct.price || 15000) * 1.05) },
        { date: "2026-06-01", price: parsedProduct.price || 15000 }
      ],
      competitorPrices: [
        { store: "Toko Sebelah", price: Math.floor((parsedProduct.price || 15000) * 1.02) },
        { store: "Mini Market B", price: Math.floor((parsedProduct.price || 15000) * 0.98) }
      ]
    };

    // Auto-save discovered product so it acts as standard in our DB
    db.addProduct(product);

    db.addScanHistory({
      id: "SCN-AI-" + Date.now(),
      barcode: product.barcode,
      productName: product.name,
      timestamp: new Date().toISOString(),
      scannedBy: activeSession.username,
      status: 'SUCCESS',
      mode: 'AI'
    });

    res.json({
      success: true,
      product,
      recommends: db.getProducts().slice(0, 2).map(p => ({
        name: p.name,
        price: p.price,
        barcode: p.barcode
      }))
    });

  } catch (err: any) {
    console.error("Gemini Scan Error:", err);
    res.status(500).json({ error: "Sistem Smart AI Scan sibuk. Silakan coba input manual atau coba lagi." });
  }
});

// 4. CHECKOUT & BASKET API
app.post('/api/orders', (req: Request, res: Response) => {
  const { items, paymentMethod, voucherCode } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Keranjang belanja kosong" });
    return;
  }

  // Double check calculations
  let subtotal = 0;
  items.forEach((item: any) => {
    const priceToUse = item.product.discountPrice || item.product.price;
    subtotal += priceToUse * item.quantity;
  });

  // Calculate voucher discount
  let voucherDiscount = 0;
  if (voucherCode) {
    const v = db.getVouchers().find(vc => vc.code.toUpperCase() === voucherCode.toUpperCase());
    if (v && !v.isUsed && subtotal >= v.minPurchase) {
      if (v.discountType === 'percentage') {
        voucherDiscount = Math.floor(subtotal * (v.value / 100));
      } else {
        voucherDiscount = v.value;
      }
      db.useVoucher(voucherCode);
    }
  }

  const tax = Math.floor((subtotal - voucherDiscount) * 0.11); // 11% PPN Indonesia
  const finalAmount = subtotal - voucherDiscount + tax;

  const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const newOrder: Order = {
    id: orderId,
    items,
    total: subtotal,
    tax,
    discount: voucherDiscount,
    voucherCode,
    finalAmount,
    paymentMethod,
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    customerName: activeSession.username,
    customerPhone: activeSession.phone
  };

  db.addOrder(newOrder);
  paymentStatusMap.set(orderId, 'PENDING');

  // Audit
  db.addAuditLog({
    id: "AUD-" + Date.now(),
    timestamp: new Date().toISOString(),
    actor: activeSession.username,
    role: activeSession.role,
    action: "Create Transaction",
    details: `Created invoice: ${orderId} total: Rp ${finalAmount.toLocaleString('id-ID')} via ${paymentMethod}`
  });

  // Simulate Instant Auto Payment Callback for QRIS / E-Wallet!
  if (['QRIS', 'DANA', 'OVO', 'GOPAY', 'SHOPEEPAY', 'LINKAJA'].includes(paymentMethod)) {
    setTimeout(() => {
      db.updateOrderStatus(orderId, 'PAID');
      paymentStatusMap.set(orderId, 'PAID');
      console.log(`[SIMULASI PAYMENT CALLBACK] Order ${orderId} successfully set to PAID.`);
    }, 4000); // changes status to PAID after 4 seconds
  }

  res.json({ success: true, order: newOrder });
});

// Real-time automatic payment polling status check
app.get('/api/orders/:id/status', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (order) {
    res.json({ status: order.paymentStatus });
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

// Manual POS Kasir Payment trigger (Cash/Debit/Credit)
app.post('/api/orders/:id/pay-manual', (req: Request, res: Response) => {
  const success = db.updateOrderStatus(req.params.id, 'PAID');
  if (success) {
    db.addAuditLog({
      id: "AUD-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: activeSession.username,
      role: activeSession.role,
      action: "Manual Cash POS Payment",
      details: `POS Cash Payment complete for invoice: ${req.params.id}`
    });
    res.json({ success: true, status: 'PAID' });
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

// Voucher Check API
app.post('/api/vouchers/validate', (req: Request, res: Response) => {
  const { code, amount } = req.body;
  if (!code) {
    res.status(400).json({ error: "Kode voucher wajib diisi" });
    return;
  }

  const v = db.getVouchers().find(vc => vc.code.toUpperCase() === code.toUpperCase());
  if (!v) {
    res.status(404).json({ valid: false, message: "Kupon tidak ditemukan" });
  } else if (v.isUsed) {
    res.status(400).json({ valid: false, message: "Kupon sudah digunakan" });
  } else if (amount && amount < v.minPurchase) {
    res.status(400).json({ valid: false, message: `Belanja minimum Rp ${v.minPurchase.toLocaleString('id-ID')} diperlukan.` });
  } else {
    res.json({ valid: true, voucher: v });
  }
});

// 5. HISTORY & AUDIT LOGS
app.get('/api/history', (req: Request, res: Response) => {
  res.json({
    scans: db.getScanHistory(),
    payments: db.getPaymentHistory(),
    logins: db.getLoginHistory(),
    audits: db.getAuditLogs()
  });
});

// 6. DASHBOARDS API
app.get('/api/dashboard/admin', (req: Request, res: Response) => {
  const products = db.getProducts();
  const orders = db.getOrders();
  const scans = db.getScanHistory();
  const todayStr = new Date().toISOString().split('T')[0];

  const totalProducts = products.length;
  const scansToday = scans.filter(s => s.timestamp.startsWith(todayStr)).length;
  
  // Total Revenue (all PAID orders)
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.finalAmount, 0);

  // Expired products check
  const stockAlerts = products.filter(p => p.stock < 10);
  const expiredAlerts = products.filter(p => p.expiredDate && new Date(p.expiredDate) < new Date());

  // Popular categories calculation
  const categoryCounts: Record<string, number> = {};
  products.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const categoryChart = Object.keys(categoryCounts).map(name => ({
    name,
    value: categoryCounts[name]
  }));

  // Sales trend mockup
  const salesTrend = [
    { date: "Mon", sales: totalRevenue > 0 ? Math.floor(totalRevenue * 0.4) : 450000, scans: 25 },
    { date: "Tue", sales: totalRevenue > 0 ? Math.floor(totalRevenue * 0.6) : 600000, scans: 35 },
    { date: "Wed", sales: totalRevenue > 0 ? Math.floor(totalRevenue * 0.8) : 510000, scans: 28 },
    { date: "Thu", sales: totalRevenue > 0 ? Math.floor(totalRevenue * 0.7) : 580000, scans: 41 },
    { date: "Fri", sales: totalRevenue > 0 ? Math.floor(totalRevenue * 1.1) : 750000, scans: 55 },
    { date: "Sat", sales: totalRevenue > 0 ? Math.floor(totalRevenue * 1.5) : 1200000, scans: 92 },
    { date: "Sun", sales: totalRevenue > 0 ? totalRevenue : 1500000, scans: 110 }
  ];

  res.json({
    metrics: {
      totalProducts,
      scansToday,
      totalRevenue,
      totalMembers: 154 // mock high quality counts
    },
    stockAlerts,
    expiredAlerts,
    categoryChart,
    salesTrend
  });
});

app.get('/api/dashboard/member', (req: Request, res: Response) => {
  const profile = db.getMemberProfile();
  res.json(profile);
});

// 7. INTERACTIVE SWAGGER REST API DOCS JSON
app.get('/api/docs/json', (req: Request, res: Response) => {
  res.json({
    swagger: "2.0",
    info: {
      title: "Barcode & QR Smart Market REST API Specification",
      description: "Dokumentasi API lengkap untuk modul checkout, scan AI Gemini, level membership, dan kasir POS.",
      version: "1.0.0"
    },
    host: process.env.APP_URL || "localhost:3000",
    basePath: "/api",
    schemes: ["http", "https"],
    paths: {
      "/auth/login": {
        "post": {
          "summary": "User authentication",
          "description": "Mendukung login dengan Username, Email, atau HP, dengan role: Admin, Kasir, atau Member.",
          "parameters": [
            { "name": "body", "in": "body", "required": true, "schema": { "type": "object", "properties": { "identifier": { "type": "string" }, "password": { "type": "string" }, "role": { "type": "string" } } } }
          ],
          "responses": { "200": { "description": "Success with JWT token" } }
        }
      },
      "/products": {
        "get": {
          "summary": "Get catalog list",
          "description": "Mendapatkan daftar produk, filter berdasarkan kategori atau pencarian.",
          "responses": { "200": { "description": "Array of products" } }
        },
        "post": {
          "summary": "Create catalog product",
          "description": "Tambah produk baru oleh Admin.",
          "responses": { "200": { "description": "Product created successfully" } }
        }
      },
      "/scan": {
        "post": {
          "summary": "Scan raw barcode",
          "description": "Mencocokkan barcode 1D/2D dengan database lokal.",
          "parameters": [
            { "name": "body", "in": "body", "required": true, "schema": { "type": "object", "properties": { "barcode": { "type": "string" } } } }
          ],
          "responses": { "200": { "description": "Product found status" } }
        }
      },
      "/scan/ai": {
        "post": {
          "summary": "Gemini Smart AI Scan",
          "description": "Menggunakan Google Gemini 3.5 Flash untuk mengestimasi deskripsi barang jika barcode tidak terdaftar di database.",
          "responses": { "200": { "description": "AI predicted product details" } }
        }
      },
      "/orders": {
        "post": {
          "summary": "Create checkout invoice",
          "description": "Membuat transaksi, menghitung diskon kupon, PPN 11%, dan meluncurkan auto-payment callback.",
          "responses": { "200": { "description": "Pending invoice generated" } }
        }
      }
    }
  });
});

// -------------------------------------------------------------
// VITE AND STATIC SERVING
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SMART MARKET SERVER] Running at http://localhost:${PORT}`);
  });
}

startServer();
