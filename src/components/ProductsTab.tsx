/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit3, Download, Upload, Filter, Grid, List, Layers, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { Product } from '../types';

interface ProductsTabProps {
  products: Product[];
  onRefreshProducts: () => void;
  onAddProductToCart: (product: Product) => void;
  onEditProduct: (barcode: string) => void;
  language: 'id' | 'en';
  isAdminOrKasir: boolean;
}

export default function ProductsTab({
  products,
  onRefreshProducts,
  onAddProductToCart,
  onEditProduct,
  language,
  isAdminOrKasir
}: ProductsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal form states for create/edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editBarcode, setEditBarcode] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    barcode: '',
    name: '',
    brand: '',
    category: 'Makanan',
    price: 0,
    discountPrice: undefined,
    weight: '100g',
    netContent: '90g',
    description: '',
    ingredients: '',
    stock: 50,
    rackLocation: 'A-01-A',
    image: '',
    productionDate: new Date().toISOString().split('T')[0],
    expiredDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Bulk paste text state
  const [bulkImportText, setBulkImportText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // List of all unique categories present
  const CATEGORIES = ['All', 'Makanan', 'Minuman', 'Kebutuhan Harian', 'Kesehatan & Kecantikan', 'Rumah Tangga'];

  // Handle delete
  const handleDeleteProduct = async (barcode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(language === 'id' ? "Apakah Anda yakin ingin menghapus produk ini dari katalog?" : "Are you sure you want to delete this product?")) {
      return;
    }
    try {
      const response = await fetch(`/api/products/${barcode}`, { method: 'DELETE' });
      if (response.ok) {
        onRefreshProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditBarcode(null);
    setFormData({
      barcode: '',
      name: '',
      brand: '',
      category: 'Makanan',
      price: 15000,
      discountPrice: undefined,
      weight: '100g',
      netContent: '90g',
      description: 'Deskripsi produk berkualitas tinggi.',
      ingredients: 'Bahan Pilihan Premium',
      stock: 100,
      rackLocation: 'A-02-C',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
      productionDate: new Date().toISOString().split('T')[0],
      expiredDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsFormOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditBarcode(product.barcode);
    setFormData(product);
    setIsFormOpen(true);
  };

  // Handle save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.barcode || !formData.name || !formData.price) {
      alert("Barcode, Nama, dan Harga wajib diisi");
      return;
    }

    try {
      const method = editBarcode ? 'PUT' : 'POST';
      const url = editBarcode ? `/api/products/${editBarcode}` : '/api/products';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsFormOpen(false);
        onRefreshProducts();
      } else {
        const data = await response.json();
        alert(data.error || "Gagal menyimpan produk");
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // Bulk import submit
  const handleBulkImportSubmit = async () => {
    try {
      const list = JSON.parse(bulkImportText);
      if (!Array.isArray(list)) {
        setImportStatus("Error: Data harus berupa JSON Array");
        return;
      }
      
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: list })
      });
      const data = await response.json();
      
      if (response.ok) {
        setImportStatus(`Success: ${data.message}`);
        setBulkImportText('');
        onRefreshProducts();
        setTimeout(() => {
          setShowBulkImport(false);
          setImportStatus(null);
        }, 2000);
      } else {
        setImportStatus(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setImportStatus(`Error parsing JSON: ${err.message}`);
    }
  };

  // Fill in default sample JSON import to help the user test it instantly
  const insertSampleBulkJson = () => {
    const sample = [
      {
        "barcode": "8992222055663",
        "name": "Le Minerale Botol Air",
        "brand": "Mayora",
        "category": "Minuman",
        "price": 3500,
        "discountPrice": 3000,
        "image": "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&auto=format&fit=crop&q=60",
        "weight": "600g",
        "netContent": "600ml",
        "description": "Air mineral jernih dengan kandungan mineral esensial seimbang dan rasa manis khas alami pegunungan.",
        "stock": 180,
        "rackLocation": "A-01-C"
      },
      {
        "barcode": "8992123456781",
        "name": "Chiki Balls Keju Spektakuler",
        "brand": "Indofood",
        "category": "Makanan",
        "price": 8000,
        "discountPrice": 7200,
        "image": "https://images.unsplash.com/photo-1599490659223-93a95d5168a3?w=500&auto=format&fit=crop&q=60",
        "weight": "80g",
        "netContent": "70g",
        "description": "Cemilan jagung renyah legendaris rasa keju tebal gurih kesukaan anak-anak dan keluarga.",
        "stock": 140,
        "rackLocation": "B-02-C"
      }
    ];
    setBulkImportText(JSON.stringify(sample, null, 2));
  };

  // Filtered lists
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.barcode.includes(searchQuery) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6" id="catalog-view-container">
      
      {/* FILTER & CONTROL PANEL */}
      <div className="bg-zinc-900/40 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3.5 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder={language === 'id' ? "Cari nama barang, barcode, atau merk..." : "Search name, barcode, brand..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* CATEGORY DROPDOWN OR BUTTONS */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {CATEGORIES.slice(0, 3).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedCategory === cat ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
              >
                {cat === 'All' ? (language === 'id' ? 'Semua' : 'All') : cat}
              </button>
            ))}
            
            {/* Standard fallback selector for more categories */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-950 text-xs text-zinc-400 border-none outline-none pr-2 font-semibold"
            >
              <option value="All">{language === 'id' ? 'Lainnya' : 'Others'}</option>
              {CATEGORIES.slice(3).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {isAdminOrKasir && (
            <button
              id="btn-add-new-product"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              {language === 'id' ? 'Tambah Produk' : 'Create Product'}
            </button>
          )}
        </div>
      </div>

      {/* ADMIN UTILITIES: BULK EXPORT/IMPORT PANEL */}
      {isAdminOrKasir && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs rounded-xl font-medium transition"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import Massal (JSON)</span>
          </button>
          
          <a
            href="/api/products/export/download"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs rounded-xl font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export Database</span>
          </a>
        </div>
      )}

      {/* BULK IMPORT MODAL BOX */}
      {showBulkImport && (
        <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Import Banyak Produk Sekaligus</h4>
            </div>
            <button 
              onClick={insertSampleBulkJson}
              className="text-[10px] text-emerald-400 underline hover:text-emerald-300"
            >
              Tempel Contoh JSON
            </button>
          </div>
          <p className="text-xs text-zinc-400 leading-normal">
            Masukkan format Array of JSON yang mendefinisikan barcode, nama produk, kategori, harga, dan lokasi rak. Format ini mirip dengan ekspor stok ritel Alfamart/Indomaret.
          </p>
          <textarea
            value={bulkImportText}
            onChange={(e) => setBulkImportText(e.target.value)}
            placeholder="[ { &quot;barcode&quot;: &quot;899...&quot;, &quot;name&quot;: &quot;...&quot; } ]"
            className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-700 font-mono focus:outline-none focus:border-emerald-500"
          ></textarea>
          {importStatus && (
            <div className={`p-3 rounded-xl text-xs font-mono ${importStatus.startsWith('Success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {importStatus}
            </div>
          )}
          <div className="flex justify-end gap-2 text-xs">
            <button
              onClick={() => setShowBulkImport(false)}
              className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-xl"
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              onClick={handleBulkImportSubmit}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl"
            >
              {language === 'id' ? 'Proses Import' : 'Import Now'}
            </button>
          </div>
        </div>
      )}

      {/* EMPTY RESULT STATE */}
      {filteredProducts.length === 0 && (
        <div className="bg-zinc-900/20 rounded-3xl p-12 text-center border border-zinc-800/50">
          <AlertTriangle className="w-10 h-10 text-zinc-600 mx-auto mb-4 animate-bounce" />
          <h4 className="font-bold text-white text-base">Produk tidak ditemukan</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-2 leading-relaxed">
            Tidak ada kecocokan di database. Anda bisa menambahkan barang baru di tombol atas, atau trigger scan kamera di tab sebelah.
          </p>
        </div>
      )}

      {/* CATALOG GRID VIEW */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4" id="pos-grid-items">
          {filteredProducts.map((p, idx) => (
            <div
              key={idx}
              id={`catalog-card-${p.barcode}`}
              className="group bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition duration-200"
            >
              <div className="relative aspect-[4/3] bg-zinc-950">
                <img 
                  src={p.image} 
                  alt={p.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                />
                
                {/* Category chip */}
                <span className="absolute top-2 left-2 text-[9px] font-bold bg-zinc-900/90 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/10 uppercase">
                  {p.category}
                </span>

                {/* Stock Warning badge if near empty */}
                {p.stock < 10 && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md border border-red-500/30">
                    Stok Tipis!
                  </span>
                )}
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500">{p.brand}</span>
                  <h4 className="text-xs font-bold text-white tracking-tight leading-tight line-clamp-2">
                    {p.name}
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-500 block">Barcode: {p.barcode}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-1 pt-1">
                    {p.discountPrice ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-400">
                          Rp {p.discountPrice.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[9px] text-zinc-500 line-through">
                          Rp {p.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-zinc-200">
                        Rp {p.price.toLocaleString('id-ID')}
                      </p>
                    )}
                    <span className="text-[9px] text-zinc-500 font-mono">Rak {p.rackLocation}</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-1.5 pt-1 border-t border-zinc-800/50">
                    <button
                      id={`btn-add-to-cart-grid-${p.barcode}`}
                      onClick={() => onAddProductToCart(p)}
                      className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-950 font-bold rounded-lg text-[10px] transition"
                    >
                      + {language === 'id' ? 'Beli' : 'Add'}
                    </button>
                    {isAdminOrKasir && (
                      <>
                        <button
                          onClick={(e) => handleOpenEdit(p, e)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteProduct(p.barcode, e)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs text-zinc-400">
            <thead className="bg-zinc-900/60 text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
              <tr>
                <th className="p-4">{language === 'id' ? 'Nama Produk' : 'Product'}</th>
                <th className="p-4">Barcode</th>
                <th className="p-4">Merek</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">{language === 'id' ? 'Harga POS' : 'Price'}</th>
                <th className="p-4">Stok</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredProducts.map((p, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/20 transition">
                  <td className="p-4 flex items-center gap-3">
                    <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-zinc-950" />
                    <div>
                      <p className="font-bold text-white text-xs">{p.name}</p>
                      <p className="text-[10px] text-zinc-500">Net: {p.netContent || p.weight}</p>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-semibold text-zinc-400 text-[11px]">{p.barcode}</td>
                  <td className="p-4">{p.brand}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700/50">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-semibold text-emerald-400">
                    Rp {(p.discountPrice || p.price).toLocaleString('id-ID')}
                  </td>
                  <td className="p-4">
                    <span className={p.stock < 15 ? 'text-red-400 font-semibold' : 'text-zinc-300'}>
                      {p.stock} pcs
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onAddProductToCart(p)}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-lg text-[10px]"
                      >
                        + Keranjang
                      </button>
                      {isAdminOrKasir && (
                        <>
                          <button
                            onClick={(e) => handleOpenEdit(p, e)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProduct(p.barcode, e)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT POPUP MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              {editBarcode ? 'Sunting Data Produk' : 'Tambah Produk Baru'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-500">Nomor Barcode *</label>
                  <input
                    type="text"
                    disabled={!!editBarcode}
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="899..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500">Nama Barang *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Indomie Goreng"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-500">Brand / Merk</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Sosro, Indofood, dll"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  >
                    {CATEGORIES.slice(1).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-500">Harga Jual *</label>
                  <input
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500">Harga Diskon (Opsional)</label>
                  <input
                    type="number"
                    value={formData.discountPrice || ''}
                    onChange={(e) => setFormData({ ...formData, discountPrice: parseInt(e.target.value) || undefined })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500">Stok Awal</label>
                  <input
                    type="number"
                    value={formData.stock || 0}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-500">Isi Bersih / Berat</label>
                  <input
                    type="text"
                    value={formData.netContent}
                    onChange={(e) => setFormData({ ...formData, netContent: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500">Lokasi Rak Kasir</label>
                  <input
                    type="text"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-500">Expired Date</label>
                  <input
                    type="date"
                    value={formData.expiredDate}
                    onChange={(e) => setFormData({ ...formData, expiredDate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-[10px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500">URL Foto Produk</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500">Deskripsi Barang</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
