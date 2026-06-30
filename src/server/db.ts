/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { Product, Order, ScanHistory, PaymentHistory, LoginHistory, AuditLog, MemberProfile, Coupon } from '../types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initial seed data
const DEFAULT_PRODUCTS: Product[] = [
  {
    barcode: "8998866200225",
    name: "Teh Botol Sosro Original",
    brand: "Sosro",
    category: "Minuman",
    price: 5000,
    discountPrice: 4500,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60",
    weight: "400g",
    netContent: "350ml",
    description: "Teh Botol Sosro terbuat dari daun teh pilihan berkualitas tinggi yang diseduh langsung dengan gula asli untuk menghasilkan cita rasa teh melati yang khas dan menyegarkan.",
    ingredients: "Air, Gula, Ekstrak Teh Melati (0.4%)",
    rating: 4.8,
    stock: 120,
    rackLocation: "A-02-B",
    productionDate: "2026-03-10",
    expiredDate: "2027-03-10",
    reviews: [
      { id: "r1", user: "Budi Santoso", rating: 5, comment: "Rasa klasik yang tidak pernah berubah. Segar sekali disajikan dingin!", date: "2026-06-15" },
      { id: "r2", user: "Siti Rahma", rating: 4, comment: "Enak, tapi manisnya agak pekat kalau tidak dingin.", date: "2026-06-20" }
    ],
    priceHistory: [
      { date: "2026-01-01", price: 4800 },
      { date: "2026-03-01", price: 5000 }
    ],
    competitorPrices: [
      { store: "Alfamart", price: 4900 },
      { store: "Indomaret", price: 5000 },
      { store: "Lotte Mart", price: 4300 }
    ]
  },
  {
    barcode: "8999999035619",
    name: "Indomie Goreng Spesial",
    brand: "Indofood",
    category: "Makanan",
    price: 3500,
    discountPrice: 3100,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60",
    weight: "90g",
    netContent: "85g",
    description: "Mi instan goreng legendaris Indonesia dengan bumbu spesial, kecap manis gurih, minyak bumbu beraroma, bawang goreng renyah, dan saus cabai mantap.",
    ingredients: "Tepung Terigu, Minyak Nabati, Garam, Bawang Putih, Kecap Manis, Bawang Goreng, Cabai Bubuk.",
    rating: 4.9,
    stock: 250,
    rackLocation: "B-01-A",
    productionDate: "2026-04-01",
    expiredDate: "2027-04-01",
    reviews: [
      { id: "r3", user: "Rian Hidayat", rating: 5, comment: "Indomie goreng adalah mi instan terbaik sepanjang masa. Gak ada tandingannya!", date: "2026-06-25" },
      { id: "r4", user: "Dewi Lestari", rating: 5, comment: "Penolong lapar di malam hari. Praktis dan bumbunya pas banget.", date: "2026-06-28" }
    ],
    priceHistory: [
      { date: "2026-01-01", price: 3300 },
      { date: "2026-04-01", price: 3500 }
    ],
    competitorPrices: [
      { store: "Alfamart", price: 3400 },
      { store: "Indomaret", price: 3500 },
      { store: "Superindo", price: 3150 }
    ]
  },
  {
    barcode: "8992222013589",
    name: "AQUA Air Mineral Botol",
    brand: "Danone",
    category: "Minuman",
    price: 4000,
    discountPrice: 3800,
    image: "https://images.unsplash.com/photo-1608885898957-a599fb1b468b?w=500&auto=format&fit=crop&q=60",
    weight: "650g",
    netContent: "600ml",
    description: "AQUA berasal dari sumber mata air pegunungan terpilih yang disaring secara alami serta dikemas tanpa sentuhan tangan manusia untuk menjaga kemurniannya.",
    ingredients: "100% Air Mineral Alami Pegunungan",
    rating: 4.7,
    stock: 300,
    rackLocation: "A-01-A",
    productionDate: "2026-05-15",
    expiredDate: "2028-05-15",
    reviews: [
      { id: "r5", user: "Toni Kusuma", rating: 5, comment: "Airnya terasa segar dan tidak seret di tenggorokan.", date: "2026-06-10" }
    ],
    priceHistory: [
      { date: "2026-01-01", price: 3800 },
      { date: "2026-05-01", price: 4000 }
    ],
    competitorPrices: [
      { store: "Alfamart", price: 4000 },
      { store: "Indomaret", price: 3900 }
    ]
  },
  {
    barcode: "7622210811119",
    name: "Oreo Sandwich Biscuit Chocolate Cream",
    brand: "Mondelez",
    category: "Makanan",
    price: 9500,
    discountPrice: 8500,
    image: "https://images.unsplash.com/photo-1558961309-dbdf71791a5a?w=500&auto=format&fit=crop&q=60",
    weight: "140g",
    netContent: "133g",
    description: "Biskuit cokelat renyah berbentuk bulat dengan isian krim cokelat yang manis dan gurih. Nikmat diputar, dijilat, lalu dicelupin!",
    ingredients: "Tepung Terigu, Gula, Minyak Nabati, Kakao Bubuk (5%), Garam, Pengembang, Perisa Krim Cokelat.",
    rating: 4.6,
    stock: 90,
    rackLocation: "B-03-C",
    productionDate: "2026-02-20",
    expiredDate: "2027-02-20",
    reviews: [
      { id: "r6", user: "Andi Wijaya", rating: 4, comment: "Cemilan favorit keluarga saat santai sore.", date: "2026-06-12" }
    ],
    priceHistory: [
      { date: "2026-01-01", price: 9200 },
      { date: "2026-02-15", price: 9500 }
    ],
    competitorPrices: [
      { store: "Alfamart", price: 9600 },
      { store: "Indomaret", price: 9500 },
      { store: "Hypermart", price: 8900 }
    ]
  },
  {
    barcode: "8991001100224",
    name: "Pepsodent Pencegah Gigi Berlubang",
    brand: "Unilever",
    category: "Kebutuhan Harian",
    price: 15500,
    discountPrice: 13900,
    image: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=500&auto=format&fit=crop&q=60",
    weight: "210g",
    netContent: "190g",
    description: "Pasta gigi Pepsodent Pencegah Gigi Berlubang membantu menguatkan gigi dengan kalsium aktif dan fluoride mikro untuk perlindungan maksimal siang dan malam.",
    ingredients: "Calcium Carbonate, Water, Sorbitol, Hydrated Silica, Sodium Lauryl Sulfate, Sodium Monofluorophosphate.",
    rating: 4.8,
    stock: 65,
    rackLocation: "C-01-B",
    productionDate: "2026-01-10",
    expiredDate: "2029-01-10",
    reviews: [
      { id: "r7", user: "Lukman Hakim", rating: 5, comment: "Sejak dulu pakai Pepsodent, nafas segar gigi jadi kuat.", date: "2026-06-22" }
    ],
    priceHistory: [
      { date: "2026-01-01", price: 15000 },
      { date: "2026-04-01", price: 15500 }
    ],
    competitorPrices: [
      { store: "Alfamart", price: 15400 },
      { store: "Indomaret", price: 15500 }
    ]
  },
  {
    barcode: "8991002120443",
    name: "Rinso Deterjen Bubuk Anti Noda Classic",
    brand: "Unilever",
    category: "Rumah Tangga",
    price: 24500,
    discountPrice: 22000,
    image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&auto=format&fit=crop&q=60",
    weight: "850g",
    netContent: "800g",
    description: "Deterjen bubuk legendaris Rinso dengan formulasi SmartFoam yang mampu melarutkan noda membandel hanya dalam 1 kali kucek dan menjaga serat pakaian tetap cerah.",
    ingredients: "Surfaktan Anionik (15%), Sodium Tripolyphosphate, Pewangi, Brightener.",
    rating: 4.7,
    stock: 45,
    rackLocation: "D-02-A",
    productionDate: "2026-03-25",
    expiredDate: "2029-03-25",
    reviews: [
      { id: "r8", user: "Bu Endang", rating: 5, comment: "Deterjen paling ampuh buat noda di baju anak sekolah. Wanginya awet.", date: "2026-06-24" }
    ],
    priceHistory: [
      { date: "2026-01-01", price: 23500 },
      { date: "2026-03-01", price: 24500 }
    ],
    competitorPrices: [
      { store: "Alfamart", price: 24200 },
      { store: "Indomaret", price: 24500 }
    ]
  }
];

const DEFAULT_COUPONS: Coupon[] = [
  {
    code: "DISKONSMART10",
    title: "Kupon Smart Member 10%",
    description: "Diskon 10% untuk semua produk belanjaan dengan minimal transaksi Rp 30.000",
    discountType: "percentage",
    value: 10,
    minPurchase: 30000,
    expiryDate: "2026-12-31",
    isUsed: false
  },
  {
    code: "HEMATCEPAT5K",
    title: "Potongan Langsung Rp 5.000",
    description: "Potongan langsung Rp 5.000 dengan minimal belanja Rp 25.000",
    discountType: "fixed",
    value: 5000,
    minPurchase: 25000,
    expiryDate: "2026-12-31",
    isUsed: false
  },
  {
    code: "DIAMONDMEGA50",
    title: "Voucher Diamond Spektakuler",
    description: "Voucher diskon 20% khusus member tingkat Diamond hingga Rp 50.000!",
    discountType: "percentage",
    value: 20,
    minPurchase: 100000,
    expiryDate: "2026-12-31",
    isUsed: false
  }
];

const DEFAULT_MEMBER: MemberProfile = {
  username: "member_rehan",
  email: "rehanrehanhidayat57@gmail.com",
  phone: "081234567890",
  role: "Member",
  level: "Silver",
  points: 450,
  cashbackBalance: 12500,
  totalSpent: 450000,
  nextLevelProgress: 45, // 45% towards Gold
  coupons: [...DEFAULT_COUPONS],
  scansCount: 24
};

interface Schema {
  products: Product[];
  orders: Order[];
  scanHistory: ScanHistory[];
  paymentHistory: PaymentHistory[];
  loginHistory: LoginHistory[];
  auditLogs: AuditLog[];
  member: MemberProfile;
  vouchers: Coupon[];
}

class FileDatabase {
  private db: Schema = {
    products: [...DEFAULT_PRODUCTS],
    orders: [],
    scanHistory: [],
    paymentHistory: [],
    loginHistory: [],
    auditLogs: [],
    member: { ...DEFAULT_MEMBER },
    vouchers: [...DEFAULT_COUPONS]
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        
        // Merge structures in case file has older schema
        this.db = {
          products: parsed.products || [...DEFAULT_PRODUCTS],
          orders: parsed.orders || [],
          scanHistory: parsed.scanHistory || [],
          paymentHistory: parsed.paymentHistory || [],
          loginHistory: parsed.loginHistory || [],
          auditLogs: parsed.auditLogs || [],
          member: parsed.member || { ...DEFAULT_MEMBER },
          vouchers: parsed.vouchers || [...DEFAULT_COUPONS]
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.error("Error reading db file, using in-memory database:", err);
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error("Error writing db file:", err);
    }
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.db.products;
  }

  public getProductByBarcode(barcode: string): Product | undefined {
    return this.db.products.find(p => p.barcode === barcode);
  }

  public addProduct(product: Product): void {
    const exists = this.getProductByBarcode(product.barcode);
    if (exists) {
      this.updateProduct(product.barcode, product);
    } else {
      this.db.products.unshift(product);
      this.save();
    }
  }

  public updateProduct(barcode: string, updated: Partial<Product>): boolean {
    const idx = this.db.products.findIndex(p => p.barcode === barcode);
    if (idx !== -1) {
      // Retain review history and price history if they aren't fully updated
      const original = this.db.products[idx];
      let newPriceHistory = updated.priceHistory || original.priceHistory || [];
      if (updated.price !== undefined && updated.price !== original.price) {
        newPriceHistory = [
          ...newPriceHistory,
          { date: new Date().toISOString().split('T')[0], price: updated.price }
        ];
      }

      this.db.products[idx] = {
        ...original,
        ...updated,
        priceHistory: newPriceHistory
      };
      this.save();
      return true;
    }
    return false;
  }

  public deleteProduct(barcode: string): boolean {
    const lengthBefore = this.db.products.length;
    this.db.products = this.db.products.filter(p => p.barcode !== barcode);
    if (this.db.products.length < lengthBefore) {
      this.save();
      return true;
    }
    return false;
  }

  public bulkImport(products: Product[]): void {
    products.forEach(p => {
      const idx = this.db.products.findIndex(prod => prod.barcode === p.barcode);
      if (idx !== -1) {
        this.db.products[idx] = { ...this.db.products[idx], ...p };
      } else {
        this.db.products.push(p);
      }
    });
    this.save();
  }

  // --- ORDERS ---
  public getOrders(): Order[] {
    return this.db.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.db.orders.find(o => o.id === id);
  }

  public addOrder(order: Order): void {
    this.db.orders.unshift(order);
    this.save();
  }

  public updateOrderStatus(id: string, status: 'PENDING' | 'PAID' | 'FAILED'): boolean {
    const order = this.getOrderById(id);
    if (order) {
      order.paymentStatus = status;
      
      // If order is paid, append payment history and award points/cashback
      if (status === 'PAID') {
        const payId = "PAY-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        this.addPaymentHistory({
          id: payId,
          orderId: id,
          amount: order.finalAmount,
          paymentMethod: order.paymentMethod,
          status: 'PAID',
          timestamp: new Date().toISOString()
        });

        // Award rewards if member checkout
        const pointsEarned = Math.floor(order.finalAmount / 1000); // 1 point for every Rp 1000 spent
        const cashbackEarned = Math.floor(order.finalAmount * 0.01); // 1% cashback
        
        this.db.member.points += pointsEarned;
        this.db.member.cashbackBalance += cashbackEarned;
        this.db.member.totalSpent += order.finalAmount;
        
        // Level up progress calculation
        const spent = this.db.member.totalSpent;
        if (spent > 2000000) {
          this.db.member.level = 'Diamond';
          this.db.member.nextLevelProgress = 100;
        } else if (spent > 1000000) {
          this.db.member.level = 'Platinum';
          this.db.member.nextLevelProgress = Math.floor(((spent - 1000000) / 1000000) * 100);
        } else if (spent > 500000) {
          this.db.member.level = 'Gold';
          this.db.member.nextLevelProgress = Math.floor(((spent - 500000) / 500000) * 100);
        } else {
          this.db.member.level = 'Silver';
          this.db.member.nextLevelProgress = Math.floor((spent / 500000) * 100);
        }

        // Subtract stocks for bought products
        order.items.forEach(item => {
          const prod = this.getProductByBarcode(item.product.barcode);
          if (prod) {
            prod.stock = Math.max(0, prod.stock - item.quantity);
          }
        });
      }
      this.save();
      return true;
    }
    return false;
  }

  // --- SCAN HISTORY ---
  public getScanHistory(): ScanHistory[] {
    return this.db.scanHistory;
  }

  public addScanHistory(history: ScanHistory): void {
    this.db.scanHistory.unshift(history);
    this.db.member.scansCount += 1;
    this.save();
  }

  // --- PAYMENT HISTORY ---
  public getPaymentHistory(): PaymentHistory[] {
    return this.db.paymentHistory;
  }

  public addPaymentHistory(history: PaymentHistory): void {
    this.db.paymentHistory.unshift(history);
    this.save();
  }

  // --- LOGIN HISTORY ---
  public getLoginHistory(): LoginHistory[] {
    return this.db.loginHistory;
  }

  public addLoginHistory(history: LoginHistory): void {
    this.db.loginHistory.unshift(history);
    this.save();
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.db.auditLogs;
  }

  public addAuditLog(log: AuditLog): void {
    this.db.auditLogs.unshift(log);
    this.save();
  }

  // --- MEMBER PROFILE ---
  public getMemberProfile(): MemberProfile {
    return this.db.member;
  }

  public updateMemberProfile(profile: Partial<MemberProfile>): void {
    this.db.member = {
      ...this.db.member,
      ...profile
    };
    this.save();
  }

  // --- VOUCHERS ---
  public getVouchers(): Coupon[] {
    return this.db.vouchers;
  }

  public addVoucher(voucher: Coupon): void {
    this.db.vouchers.push(voucher);
    this.save();
  }

  public useVoucher(code: string): boolean {
    const v = this.db.vouchers.find(voucher => voucher.code.toUpperCase() === code.toUpperCase());
    if (v && !v.isUsed) {
      v.isUsed = true;
      const memV = this.db.member.coupons.find(coupon => coupon.code.toUpperCase() === code.toUpperCase());
      if (memV) {
        memV.isUsed = true;
      }
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new FileDatabase();
