import React, { useState, useEffect, useCallback } from 'react';
import {
    ShoppingCart, Users, Plus, Search, TrendingUp, TrendingDown,
    ArrowLeft, Upload, Download, FileText, X, Check, AlertCircle,
    MessageCircle, Camera, Trash2, Settings, LogOut, ChevronRight,
    Bell, Shield, Mic, RefreshCw, Package, UserPlus
} from 'lucide-react';
import { useMerchantAuth } from '../context/MerchantAuthContext';
import { useNavigate } from 'react-router-dom';
import MerchantSettings from '../components/MerchantSettings';
import logoImg from '../assets/logo.png';

/* ─── helpers ─── */
const fmt = (n, abs = true) => '₹' + (abs ? Math.abs(n) : n).toLocaleString('en-IN');
const ago = (d) => {
    const diff = Date.now() - new Date(d);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
};
const initials = (name = '') => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

/* ─── sub-components ─── */

function StatCard({ label, value, color, icon: Icon, sub }) {
    return (
        <div style={{
            background: 'white', borderRadius: '20px', padding: '20px',
            border: '1px solid #f0ebe0', flex: 1, minWidth: 0,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: '0.08em', background: color + '15', padding: '3px 8px', borderRadius: '6px' }}>{label}</span>
                <Icon size={20} color={color + '40'} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#1a1209', letterSpacing: '-0.5px' }}>{value}</div>
            {sub && <div style={{ fontSize: '11px', color: '#92896a', marginTop: '4px', fontWeight: 600 }}>{sub}</div>}
        </div>
    );
}

/* ─── Add Katha Modal ─── */
function AddKathaModal({ customer, merchantId, api, onClose, onSaved }) {
    const [mode, setMode] = useState(null); // 'manual' | 'scan'
    const [entryType, setEntryType] = useState('UDHAR');
    const [items, setItems] = useState([{ name: '', price: '' }]);
    const [description, setDescription] = useState('');
    const [jamaAmount, setJamaAmount] = useState('');
    const [scanLoading, setScanLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);

    const addRow = () => setItems(prev => [...prev, { name: '', price: '' }]);
    const updateRow = (idx, field, val) => setItems(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const removeRow = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

    const handleScan = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setScanLoading(true);
        setErr('');
        try {
            // Use existing Paywise AI scan bill endpoint
            const formData = new FormData();
            formData.append('bill', file);
            const res = await api.post('/ai/scan-bill', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const { items: scanned } = res.data;
            if (scanned && scanned.length > 0) {
                setItems(scanned.map(i => ({ name: i.name || i.item || '', price: String(i.price || i.amount || '') })));
                setMode('manual'); // show items in the table
            } else {
                setErr('Could not read bill items. Please enter manually.');
                setMode('manual');
            }
        } catch {
            setErr('Bill scan failed. Please enter manually.');
            setMode('manual');
        } finally {
            setScanLoading(false);
        }
    };

    const handleSave = async () => {
        if (entryType === 'JAMA') {
            const amount = parseFloat(jamaAmount);
            if (!amount || amount <= 0) {
                setErr('Please enter a valid amount.');
                return;
            }
            setSaving(true);
            setErr('');
            try {
                await api.post('/merchant/katha', {
                    customerPhone: customer.phone,
                    customerName: customer.name,
                    amount,
                    entryType,
                    description: description || 'Payment received via Jama',
                    itemList: [],
                });
                onSaved();
                onClose();
            } catch (e) {
                setErr(e.response?.data?.msg || 'Failed to save. Try again.');
            } finally {
                setSaving(false);
            }
            return;
        }

        if (mode !== 'manual') return;
        const validItems = items.filter(i => i.name.trim() && parseFloat(i.price) > 0);
        if (validItems.length === 0 && !description.trim()) {
            setErr('Add at least one item with a price, or a description.');
            return;
        }
        if (total <= 0 && validItems.length === 0) {
            setErr('Total amount must be greater than 0.');
            return;
        }
        setSaving(true);
        setErr('');
        try {
            const amount = total > 0 ? total : 0;
            await api.post('/merchant/katha', {
                customerPhone: customer.phone,
                customerName: customer.name,
                amount: amount || parseFloat(description) || 0,
                entryType,
                description: description || validItems.map(i => `${i.name} ₹${i.price}`).join(', '),
                itemList: validItems.map(i => ({ name: i.name, price: parseFloat(i.price) })),
            });
            onSaved();
            onClose();
        } catch (e) {
            setErr(e.response?.data?.msg || 'Failed to save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(4px)' };
    const sheet = { background: 'white', borderRadius: '28px 28px 0 0', width: '100%', maxWidth: '560px', padding: '28px 24px', maxHeight: '90vh', overflowY: 'auto' };

    return (
        <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={sheet}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#1a1209' }}>Add Katha</h2>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#92896a' }}>for {customer.name}</p>
                    </div>
                    <button type="button" onClick={onClose} style={{ background: '#f0ebe0', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}><X size={20} color="#92896a" /></button>
                </div>

                {/* Entry type toggle */}
                <div style={{ display: 'flex', background: '#f9f7f3', borderRadius: '14px', padding: '4px', marginBottom: '20px' }}>
                    {[['UDHAR', '📦 Udhar (Gave Goods)', '#dc2626'], ['JAMA', '💰 Jama (Received)', '#16a34a']].map(([val, label, color]) => (
                        <button key={val} onClick={() => { setEntryType(val); setErr(''); }} style={{
                            flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', transition: 'all 0.2s',
                            background: entryType === val ? color : 'transparent',
                            color: entryType === val ? 'white' : '#92896a',
                        }}>{label}</button>
                    ))}
                </div>

                {/* Mode selection for UDHAR */}
                {entryType === 'UDHAR' && !mode && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <button onClick={() => setMode('manual')} style={{ flex: 1, padding: '20px', background: '#fdf6e3', border: '2px dashed #d4a857', borderRadius: '16px', cursor: 'pointer', textAlign: 'center' }}>
                            <FileText size={28} color="#92400e" style={{ display: 'block', margin: '0 auto 8px' }} />
                            <div style={{ fontWeight: 800, fontSize: '14px', color: '#92400e' }}>Manual Entry</div>
                            <div style={{ fontSize: '11px', color: '#b5a97a', marginTop: '2px' }}>Add items like a spreadsheet</div>
                        </button>
                        <button onClick={() => setMode('scan')} style={{ flex: 1, padding: '20px', background: '#f0fdf4', border: '2px dashed #86efac', borderRadius: '16px', cursor: 'pointer', textAlign: 'center' }}>
                            <Camera size={28} color="#16a34a" style={{ display: 'block', margin: '0 auto 8px' }} />
                            <div style={{ fontWeight: 800, fontSize: '14px', color: '#16a34a' }}>Scan Bill</div>
                            <div style={{ fontSize: '11px', color: '#86efac', marginTop: '2px' }}>Take photo of bill / receipt</div>
                        </button>
                    </div>
                )}

                {/* Scan mode for UDHAR */}
                {entryType === 'UDHAR' && mode === 'scan' && (
                    <div style={{ textAlign: 'center', padding: '28px', background: '#f9f7f3', borderRadius: '16px', marginBottom: '20px' }}>
                        {scanLoading ? (
                            <div>
                                <div style={{ width: '40px', height: '40px', border: '3px solid #e5dfcf', borderTopColor: '#92400e', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
                                <p style={{ color: '#92896a', fontSize: '14px' }}>Reading bill…</p>
                            </div>
                        ) : (
                            <label style={{ cursor: 'pointer' }}>
                                <Camera size={36} color="#92400e" style={{ display: 'block', margin: '0 auto 12px' }} />
                                <p style={{ fontWeight: 800, color: '#1a1209', fontSize: '15px', margin: '0 0 4px' }}>Tap to upload bill photo</p>
                                <p style={{ color: '#92896a', fontSize: '12px', margin: 0 }}>Items and prices will be detected automatically</p>
                                <input type="file" accept="image/*" capture="environment" onChange={handleScan} style={{ display: 'none' }} />
                            </label>
                        )}
                        {!scanLoading && <button onClick={() => setMode('manual')} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#92400e', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Or enter manually →</button>}
                    </div>
                )}

                {/* Manual entry for UDHAR */}
                {entryType === 'UDHAR' && mode === 'manual' && (
                    <div>
                        {/* Items spreadsheet */}
                        <div style={{ border: '1.5px solid #e5dfcf', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 40px', background: '#fdf6e3', padding: '10px 12px', borderBottom: '1.5px solid #e5dfcf' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#92896a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Item / Description</span>
                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#92896a', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Amount ₹</span>
                                <span />
                            </div>
                            {items.map((row, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 40px', padding: '8px 12px', borderBottom: idx < items.length - 1 ? '1px solid #f0ebe0' : 'none', alignItems: 'center', gap: '8px' }}>
                                    <input value={row.name} onChange={e => updateRow(idx, 'name', e.target.value)} placeholder={`Item ${idx + 1}`}
                                        style={{ border: 'none', outline: 'none', fontSize: '14px', color: '#1a1209', background: 'transparent', width: '100%', fontFamily: 'Inter, sans-serif' }} />
                                    <input value={row.price} onChange={e => updateRow(idx, 'price', e.target.value)} placeholder="0" type="number" min="0"
                                        style={{ border: 'none', outline: 'none', fontSize: '14px', color: '#1a1209', background: 'transparent', textAlign: 'right', width: '100%', fontFamily: 'Inter, sans-serif' }} />
                                    <button type="button" onClick={() => removeRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#e5dfcf' }}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addRow} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontWeight: 700, fontSize: '13px', borderTop: '1.5px dashed #e5dfcf', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Plus size={14} /> Add Row
                            </button>
                        </div>

                        {/* Note / description */}
                        <div style={{ marginBottom: '16px' }}>
                            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Note (optional, e.g. Monthly groceries)"
                                style={{ width: '100%', boxSizing: 'border-box', background: '#f9f7f3', border: '1.5px solid #e5dfcf', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: '#1a1209', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                        </div>

                        {/* Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff5f5', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', border: '1.5px solid #fecaca' }}>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#1a1209' }}>Total Udhar</span>
                            <span style={{ fontWeight: 900, fontSize: '22px', color: '#dc2626' }}>₹{total.toLocaleString('en-IN')}</span>
                        </div>

                        {err && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px' }}><AlertCircle size={15} color="#dc2626" /><span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>{err}</span></div>}

                        <button type="button" onClick={handleSave} disabled={saving || total <= 0} style={{
                            width: '100%', padding: '16px', border: 'none', borderRadius: '14px', cursor: saving ? 'wait' : total <= 0 ? 'not-allowed' : 'pointer',
                            background: total > 0 ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#e5dfcf',
                            color: 'white', fontWeight: 900, fontSize: '15px', letterSpacing: '-0.2px',
                            boxShadow: total > 0 ? '0 6px 20px rgba(0,0,0,0.15)' : 'none',
                        }}>
                            {saving ? 'Saving…' : `Confirm Udhar — ₹${total.toLocaleString('en-IN')}`}
                        </button>
                    </div>
                )}

                {/* Simple Entry for JAMA */}
                {entryType === 'JAMA' && (
                    <div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#92896a', marginBottom: '8px' }}>Amount Received ₹</label>
                            <input type="number" value={jamaAmount} onChange={e => setJamaAmount(e.target.value)} placeholder="0"
                                style={{ width: '100%', boxSizing: 'border-box', background: '#f9f7f3', border: '1.5px solid #e5dfcf', borderRadius: '12px', padding: '16px', fontSize: '24px', fontWeight: 900, color: '#16a34a', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#92896a', marginBottom: '8px' }}>Payment Method / Note (Optional)</label>
                            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Cash, UPI, PhonePe"
                                style={{ width: '100%', boxSizing: 'border-box', background: '#f9f7f3', border: '1.5px solid #e5dfcf', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: '#1a1209', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                        </div>

                        {err && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px' }}><AlertCircle size={15} color="#dc2626" /><span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>{err}</span></div>}

                        <button type="button" onClick={handleSave} disabled={saving || !jamaAmount || parseFloat(jamaAmount) <= 0} style={{
                            width: '100%', padding: '16px', border: 'none', borderRadius: '14px', cursor: (saving || !jamaAmount || parseFloat(jamaAmount) <= 0) ? 'not-allowed' : 'pointer',
                            background: (parseFloat(jamaAmount) > 0) ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#e5dfcf',
                            color: 'white', fontWeight: 900, fontSize: '15px', letterSpacing: '-0.2px',
                            boxShadow: (parseFloat(jamaAmount) > 0) ? '0 6px 20px rgba(0,0,0,0.15)' : 'none',
                        }}>
                            {saving ? 'Saving…' : `Confirm Jama — ₹${parseFloat(jamaAmount) > 0 ? parseFloat(jamaAmount).toLocaleString('en-IN') : 0}`}
                        </button>
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ─── Bulk Import Modal ─── */
function BulkImportModal({ api, onClose, onDone }) {
    const [rows, setRows] = useState([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [err, setErr] = useState('');

    const parseCSV = (text) => {
        const lines = text.trim().split('\n');
        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const cols = line.split(',').map(c => c.trim());
            const obj = {};
            header.forEach((h, i) => obj[h] = cols[i] || '');
            return {
                customerPhone: obj.customerphone || obj.phone || '',
                customerName: obj.customername || obj.name || '',
                amount: obj.amount || '',
                entryType: (obj.entrytype || obj.type || 'UDHAR').toUpperCase(),
                description: obj.description || obj.remarks || '',
                date: obj.date || '',
            };
        }).filter(r => r.customerPhone && r.amount);
    };

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = parseCSV(ev.target.result);
                setRows(parsed);
                setErr('');
            } catch {
                setErr('Could not parse file. Please use the provided template.');
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!rows.length) return;
        setImporting(true);
        setErr('');
        try {
            const res = await api.post('/merchant/bulk-import', { rows });
            setResult(res.data);
            if (res.data.imported?.length > 0) onDone();
        } catch (e) {
            setErr(e.response?.data?.msg || 'Import failed.');
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const csv = `customerPhone,customerName,amount,entryType,description,date\n9876543210,Ramesh Kumar,500,UDHAR,Monthly groceries,2026-03-01\n8765432109,Sunderamma,200,JAMA,Payment received,2026-03-10`;
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'katha_import_template.csv';
        a.click();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#1a1209' }}>📤 Bulk Import</h2>
                    <button onClick={onClose} style={{ background: '#f0ebe0', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}><X size={20} color="#92896a" /></button>
                </div>

                {!result ? (
                    <>
                        <div style={{ background: '#fdf6e3', border: '1.5px solid #e5dfcf', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#92400e' }}>📄 Download Template First</p>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#b5a97a' }}>Use our template to ensure correct column headers</p>
                            </div>
                            <button onClick={downloadTemplate} style={{ background: '#92400e', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Download size={14} /> Template
                            </button>
                        </div>

                        <label style={{ display: 'block', background: '#f9f7f3', border: '2px dashed #e5dfcf', borderRadius: '16px', padding: '32px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px' }}>
                            <Upload size={32} color="#b5a97a" style={{ display: 'block', margin: '0 auto 10px' }} />
                            <p style={{ fontWeight: 800, fontSize: '15px', color: '#1a1209', margin: '0 0 4px' }}>Upload CSV File</p>
                            <p style={{ fontSize: '12px', color: '#92896a', margin: 0 }}>Columns: customerPhone, customerName, amount, entryType, description, date</p>
                            <input type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
                        </label>

                        {rows.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a1209', marginBottom: '10px' }}>Preview — {rows.length} entries</p>
                                <div style={{ border: '1px solid #e5dfcf', borderRadius: '12px', overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                        <thead style={{ background: '#fdf6e3', position: 'sticky', top: 0 }}>
                                            <tr>{['Phone', 'Name', 'Amount', 'Type', 'Note'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 800, color: '#92896a', fontSize: '10px', textTransform: 'uppercase' }}>{h}</th>)}</tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((r, i) => (
                                                <tr key={i} style={{ borderTop: '1px solid #f0ebe0' }}>
                                                    <td style={{ padding: '8px 10px', color: '#1a1209' }}>{r.customerPhone}</td>
                                                    <td style={{ padding: '8px 10px', color: '#1a1209' }}>{r.customerName}</td>
                                                    <td style={{ padding: '8px 10px', color: r.entryType === 'UDHAR' ? '#dc2626' : '#16a34a', fontWeight: 800 }}>₹{r.amount}</td>
                                                    <td style={{ padding: '8px 10px' }}><span style={{ background: r.entryType === 'UDHAR' ? '#fff5f5' : '#f0fdf4', color: r.entryType === 'UDHAR' ? '#dc2626' : '#16a34a', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>{r.entryType}</span></td>
                                                    <td style={{ padding: '8px 10px', color: '#92896a' }}>{r.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {err && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 12px', marginBottom: '14px' }}><AlertCircle size={15} color="#dc2626" /><span style={{ fontSize: '13px', color: '#dc2626' }}>{err}</span></div>}

                        <button onClick={handleImport} disabled={rows.length === 0 || importing} style={{
                            width: '100%', padding: '15px', border: 'none', borderRadius: '14px',
                            background: rows.length > 0 ? 'linear-gradient(135deg, #92400e, #78350f)' : '#e5dfcf',
                            color: 'white', fontWeight: 900, fontSize: '15px', cursor: rows.length > 0 ? 'pointer' : 'not-allowed',
                            boxShadow: rows.length > 0 ? '0 6px 20px rgba(146,64,14,0.3)' : 'none',
                        }}>
                            {importing ? 'Importing…' : `Import ${rows.length} Entries`}
                        </button>
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Check size={32} color="#16a34a" />
                        </div>
                        <h3 style={{ color: '#16a34a', fontSize: '20px', fontWeight: 900, margin: '0 0 8px' }}>{result.imported?.length || 0} Entries Imported!</h3>
                        {result.errors?.length > 0 && <p style={{ color: '#dc2626', fontSize: '13px' }}>{result.errors.length} entries had errors and were skipped.</p>}
                        <button onClick={onClose} style={{ marginTop: '20px', padding: '12px 28px', background: '#92400e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── New Customer Modal ─── */
function NewCustomerModal({ onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleNext = () => {
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        if (!name.trim() || cleanPhone.length !== 10) return;
        onSuccess({ name: name.trim(), phone: cleanPhone });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '380px', padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#1a1209' }}>Add Customer</h2>
                    <button onClick={onClose} style={{ background: '#f0ebe0', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}><X size={20} color="#92896a" /></button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#92896a', marginBottom: '8px' }}>Customer Name</label>
                    <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramesh Kumar"
                        style={{ width: '100%', boxSizing: 'border-box', background: '#f9f7f3', border: '1.5px solid #e5dfcf', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: '#1a1209', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#92896a', marginBottom: '8px' }}>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#92896a', fontSize: '14px', fontWeight: 700 }}>+91</span>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210"
                            style={{ width: '100%', boxSizing: 'border-box', background: '#f9f7f3', border: '1.5px solid #e5dfcf', borderRadius: '12px', padding: '12px 14px 12px 52px', fontSize: '14px', color: '#1a1209', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                    </div>
                </div>

                <button onClick={handleNext} disabled={!name.trim() || phone.replace(/\D/g, '').length !== 10} style={{
                    width: '100%', padding: '15px', border: 'none', borderRadius: '14px',
                    background: (name.trim() && phone.replace(/\D/g, '').length === 10) ? 'linear-gradient(135deg, #92400e, #78350f)' : '#e5dfcf',
                    color: 'white', fontWeight: 900, fontSize: '15px', cursor: (name.trim() && phone.replace(/\D/g, '').length === 10) ? 'pointer' : 'not-allowed',
                }}>
                    Continue to Add Katha
                </button>
            </div>
        </div>
    );
}

/* ─── Manage Dispute Modal ─── */
function ManageDisputeModal({ entry, api, onClose, onResolved }) {
    const [reply, setReply] = useState(entry.merchantReply || '');
    const [items, setItems] = useState(entry.itemList || []);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
    const addRow = () => setItems(prev => [...prev, { name: '', price: '' }]);
    const updateRow = (idx, field, val) => setItems(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
    const removeRow = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

    const handleAction = async (action) => {
        setSaving(true);
        setErr('');
        try {
            // First update the items if they were changed
            if (action === 'RESOLVE' && entry.entryType === 'UDHAR') {
                await api.put(`/merchant/katha/${entry._id}`, {
                    amount: total,
                    itemList: items,
                    description: items.map(i => `${i.name} ₹${i.price}`).join(', ')
                });
            }
            // Then resolve with reply
            await api.post(`/merchant/katha/${entry._id}/resolve`, { reply, action });
            onResolved();
            onClose();
        } catch (e) {
            setErr(e.response?.data?.msg || 'Failed to update. Try again.');
        } finally {
            setSaving(false);
        }
    };

    const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '20px' };
    const sheet = { background: 'white', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' };

    return (
        <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={sheet}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#1a1209' }}>Manage Dispute</h2>
                    <button onClick={onClose} style={{ background: '#f0ebe0', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}><X size={20} color="#92896a" /></button>
                </div>

                <div style={{ background: '#fff7ed', border: '1.5px solid #ffedd5', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>Customer's Disputed Reason</p>
                    <p style={{ margin: 0, fontSize: '15px', color: '#9a3412', fontWeight: 600 }}>"{entry.disputeReason || 'No reason provided'}"</p>
                </div>

                {entry.entryType === 'UDHAR' && (
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 800, color: '#1a1209' }}>Edit Items to Correct Amount</p>
                        <div style={{ border: '1.5px solid #e5dfcf', borderRadius: '14px', overflow: 'hidden' }}>
                            {items.map((row, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', padding: '8px 12px', borderBottom: '1px solid #f0ebe0', alignItems: 'center', gap: '8px' }}>
                                    <input value={row.name} onChange={e => updateRow(idx, 'name', e.target.value)} placeholder="Item" style={{ border: 'none', background: 'transparent', fontSize: '14px', outline: 'none' }} />
                                    <input value={row.price} onChange={e => updateRow(idx, 'price', e.target.value)} type="number" placeholder="0" style={{ border: 'none', background: 'transparent', textAlign: 'right', fontSize: '14px', outline: 'none' }} />
                                    <button onClick={() => removeRow(idx)} style={{ background: 'none', border: 'none', color: '#e5dfcf', cursor: 'pointer' }}><Trash2 size={14}/></button>
                                </div>
                            ))}
                            <button onClick={addRow} style={{ width: '100%', padding: '10px', background: '#fdf6e3', border: 'none', color: '#92400e', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>+ Add Row</button>
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '8px', fontWeight: 800, color: '#dc2626' }}>Corrected Total: ₹{total}</div>
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 800, color: '#1a1209' }}>Your Reply to Customer</p>
                    <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Explain the charge or mention it's corrected..."
                        style={{ width: '100%', minHeight: '80px', boxSizing: 'border-box', background: '#f9f7f3', border: '1.5px solid #e5dfcf', borderRadius: '12px', padding: '12px', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
                </div>

                {err && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{err}</p>}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleAction('RESOLVE')} disabled={saving} style={{ flex: 1, padding: '14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
                        {saving ? 'Saving...' : 'Edit & Resolve'}
                    </button>
                    <button onClick={() => handleAction('DISMISS')} disabled={saving} style={{ padding: '14px', background: '#f0ebe0', color: '#92896a', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
                        Just Reply
                    </button>
                </div>
            </div>
        </div>
    );
}


/* ─── Customer Katha Detail View ─── */
function CustomerDetail({ customer, api, onBack, onAddKatha, onManageDispute }) {
    const [entries, setEntries] = useState([]);

    const [loading, setLoading] = useState(true);

    const loadEntries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/merchant/customer/${customer.phone}/katha`);
            setEntries(res.data);
        } catch { setEntries([]); }
        finally { setLoading(false); }
    }, [customer.phone, api]);

    const handleApproveEntry = async (entryId, action) => {
        try {
            await api.post(`/merchant/approve-entry/${entryId}`, { action });
            loadEntries();
        } catch (e) {
            alert('Failed to approve entry.');
        }
    };

    useEffect(() => { loadEntries(); }, [loadEntries, customer.entryCount, customer.balance]);

    const balance = customer.balance || 0; // positive = customer owes merchant

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0ebe0', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <button onClick={onBack} style={{ background: '#f0ebe0', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}><ArrowLeft size={20} color="#92896a" /></button>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#1a1209' }}>{customer.name}</h2>
                        <p style={{ margin: 0, fontSize: '12px', color: '#92896a' }}>{customer.phone} · {customer.entryCount || 0} entries</p>
                    </div>
                    <a href={`https://wa.me/91${customer.phone}`} target="_blank" rel="noreferrer"
                        style={{ background: '#f0fdf4', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', textDecoration: 'none' }}>
                        <MessageCircle size={20} color="#16a34a" />
                    </a>
                </div>

                {/* Balance card */}
                <div style={{ background: balance > 0 ? '#fff5f5' : balance < 0 ? '#f0fdf4' : '#f9f7f3', borderRadius: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1.5px solid ${balance > 0 ? '#fecaca' : balance < 0 ? '#bbf7d0' : '#e5dfcf'}` }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#92896a' }}>
                            {balance > 0 ? 'Customer Owes You' : balance < 0 ? 'You Owe Customer' : 'All Clear'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 900, color: balance > 0 ? '#dc2626' : balance < 0 ? '#16a34a' : '#92896a', letterSpacing: '-0.5px' }}>
                            {balance === 0 ? '₹0' : fmt(balance)}
                        </p>
                    </div>
                    <button onClick={onAddKatha} style={{ background: '#92400e', color: 'white', border: 'none', borderRadius: '14px', padding: '12px 18px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={16} /> Add Katha
                    </button>
                </div>
            </div>

            {/* Entries list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#92896a' }}>Loading…</div>
                ) : entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <Package size={40} color="#e5dfcf" style={{ display: 'block', margin: '0 auto 12px' }} />
                        <p style={{ color: '#92896a', fontSize: '14px', fontWeight: 600 }}>No entries yet</p>
                        <button onClick={onAddKatha} style={{ marginTop: '12px', background: '#92400e', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}>Add First Entry</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {entries.map(e => (
                            <div key={e._id} style={{ background: 'white', border: `1.5px solid ${e.entryType === 'UDHAR' ? '#fecaca' : '#bbf7d0'}`, borderRadius: '16px', padding: '14px 16px', borderLeft: `4px solid ${e.entryType === 'UDHAR' ? '#dc2626' : '#16a34a'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: e.entryType === 'UDHAR' ? '#fff5f5' : '#f0fdf4', color: e.entryType === 'UDHAR' ? '#dc2626' : '#16a34a', padding: '2px 8px', borderRadius: '6px' }}>{e.entryType}</span>
                                            {e.approvalStatus === 'PENDING' && <span style={{ fontSize: '10px', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '6px' }}>🟡 PENDING CONFIRMATION</span>}
                                            {e.approvalStatus === 'REJECTED' && <span style={{ fontSize: '10px', fontWeight: 800, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '6px' }}>✖ REJECTED</span>}
                                            {e.status === 'DISPUTED' && <span style={{ fontSize: '10px', fontWeight: 800, background: '#fff7ed', color: '#ea580c', padding: '2px 8px', borderRadius: '6px' }}>⚠ Disputed</span>}
                                            {e.isSettled && <span style={{ fontSize: '10px', fontWeight: 800, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '6px' }}>✓ Settled</span>}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#1a1209', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {e.description || (e.itemList?.length > 0 ? e.itemList.map(i => i.name).join(', ') : 'Entry')}
                                        </p>
                                        {e.itemList?.length > 0 && (
                                            <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {e.itemList.map((item, i) => (
                                                    <span key={i} style={{ fontSize: '11px', background: '#f9f7f3', border: '1px solid #e5dfcf', borderRadius: '6px', padding: '2px 8px', color: '#92896a' }}>{item.name} ₹{item.price}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right', marginLeft: '12px', flexShrink: 0 }}>
                                        <div style={{ fontSize: '20px', fontWeight: 900, color: e.entryType === 'UDHAR' ? '#dc2626' : '#16a34a', letterSpacing: '-0.3px' }}>
                                            {e.entryType === 'UDHAR' ? '+' : '-'}₹{e.amount?.toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#b5a97a', marginTop: '2px' }}>{ago(e.createdAt)}</div>
                                    </div>
                                </div>
                                {e.approvalStatus === 'PENDING' && (
                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e5dfcf', display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleApproveEntry(e._id, 'ACCEPT')} style={{ flex: 1, padding: '8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <Check size={14} /> Confirm Payment
                                        </button>
                                        <button onClick={() => handleApproveEntry(e._id, 'REJECT')} style={{ padding: '8px 12px', background: '#fff1f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                                            Reject
                                        </button>
                                    </div>
                                )}
                                {e.status === 'DISPUTED' && (
                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #ffedd5' }}>
                                        <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '10px', marginBottom: '10px' }}>
                                            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#ea580c', fontWeight: 800, textTransform: 'uppercase' }}>Reason for dispute</p>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#9a3412', fontWeight: 600 }}>{e.disputeReason || 'No reason provided'}</p>
                                        </div>
                                        <button onClick={() => onManageDispute(e)} style={{ width: '100%', padding: '10px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            <Shield size={14} strokeWidth={2.5} /> Resolve & Reply
                                        </button>
                                    </div>
                                )}
                                {e.merchantReply && (
                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e5dfcf' }}>
                                        <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#92896a', fontWeight: 800, textTransform: 'uppercase' }}>Your Reply</p>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#1a1209', fontStyle: 'italic' }}>"{e.merchantReply}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


/* ─── MAIN DASHBOARD ─── */
export default function MerchantDashboard() {
    const { user, merchant, api, logout } = useMerchantAuth();
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showAddKatha, setShowAddKatha] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [stats, setStats] = useState({ totalUdhar: 0, totalJama: 0, trustScore: 100 });

    const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'settings'

    const loadCustomers = useCallback(async () => {
        setLoadingCustomers(true);
        try {
            const res = await api.get('/merchant/customers');
            setCustomers(res.data);
            // compute stats
            const totalUdhar = res.data.reduce((s, c) => s + Math.max(0, c.balance), 0);
            const totalJama = res.data.reduce((s, c) => s + Math.max(0, -c.balance), 0);
            setStats(s => ({ ...s, totalUdhar, totalJama }));

            // Synchronize selectedCustomer
            setSelectedCustomer(prev => {
                if (!prev) return prev;
                const updated = res.data.find(c => c.phone === prev.phone);
                return updated ? { ...updated } : prev;
            });
        } catch { setCustomers([]); }
        finally { setLoadingCustomers(false); }
    }, [api]);

    const loadTrustScore = useCallback(async () => {
        try {
            const res = await api.get('/merchant/trust-score');
            setStats(s => ({ ...s, trustScore: res.data.trustScore }));
        } catch { }
    }, [api]);

    useEffect(() => { loadCustomers(); loadTrustScore(); }, [loadCustomers, loadTrustScore]);

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    );

    // Redirect to login / onboarding handled by App.jsx
    if (!merchant) return null;

    return (
        <div style={{ minHeight: '100vh', background: '#fdfaf4', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ background: 'white', borderBottom: '1px solid #f0ebe0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logoImg} alt="Paywise" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                    <div style={{ width: '1px', height: '28px', background: '#e5dfcf', margin: '0 4px' }} />
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#1a1209', lineHeight: 1 }}>{merchant.shopName}</div>
                        <div style={{ fontSize: '11px', color: '#b5a97a', marginTop: '2px', fontWeight: 600 }}>{merchant.category}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '6px 10px' }}>
                        <Shield size={12} color="#16a34a" />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a' }}>{stats.trustScore}%</span>
                    </div>
                    <button onClick={logout} style={{ background: '#f9f7f3', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }} title="Logout">
                        <LogOut size={18} color="#92896a" />
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div style={{ padding: '20px 24px 0', display: 'flex', gap: '12px' }}>
                <StatCard label="Total Udhar" value={fmt(stats.totalUdhar)} color="#dc2626" icon={TrendingUp} sub="Customers owe you" />
                <StatCard label="Total Jama" value={fmt(stats.totalJama)} color="#16a34a" icon={TrendingDown} sub="Advance / paid" />
            </div>

            {/* Tab Bar */}
            <div style={{ display: 'flex', padding: '16px 24px 0', gap: '4px' }}>
                {[['customers', '👥 Customers'], ['settings', '⚙️ Settings']].map(([t, label]) => (
                    <button key={t} onClick={() => setActiveTab(t)} style={{
                        padding: '8px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s',
                        background: activeTab === t ? '#92400e' : 'transparent',
                        color: activeTab === t ? 'white' : '#92896a',
                    }}>{label}</button>
                ))}
            </div>

            {activeTab === 'customers' && !selectedCustomer && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Search + Bulk Import */}
                    <div style={{ padding: '16px 24px', display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={17} color="#b5a97a" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer name or phone…"
                                style={{ width: '100%', boxSizing: 'border-box', background: 'white', border: '1.5px solid #e5dfcf', borderRadius: '12px', padding: '11px 14px 11px 36px', fontSize: '14px', color: '#1a1209', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
                        </div>
                        <button onClick={() => setShowBulkImport(true)} style={{ background: '#fdf6e3', border: '1.5px solid #e5dfcf', borderRadius: '12px', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                            <Upload size={16} /> Bulk
                        </button>
                    </div>

                    {/* Customer List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
                        {loadingCustomers ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[1, 2, 3].map(i => <div key={i} style={{ height: '80px', background: '#f0ebe0', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                <Users size={40} color="#e5dfcf" style={{ display: 'block', margin: '0 auto 12px' }} />
                                <p style={{ color: '#92896a', fontSize: '14px', fontWeight: 600 }}>{search ? 'No customers match your search' : 'No customers yet'}</p>
                                <p style={{ color: '#b5a97a', fontSize: '12px', marginBottom: '20px' }}>Add a customer to start recording Katha entries</p>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button onClick={() => setShowNewCustomer(true)} style={{ background: '#92400e', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 18px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <UserPlus size={16} /> Add Customer
                                    </button>
                                    <button onClick={() => setShowBulkImport(true)} style={{ background: '#fdf6e3', color: '#92400e', border: '1.5px solid #e5dfcf', borderRadius: '12px', padding: '10px 18px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Upload size={16} /> Bulk Import
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {filtered.map(c => {
                                    const owes = c.balance > 0;
                                    const net = Math.abs(c.balance);
                                    return (
                                        <button key={c.phone} onClick={() => setSelectedCustomer(c)}
                                            style={{ background: 'white', border: '1.5px solid #e5dfcf', borderRadius: '18px', padding: '14px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = '#92400e'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e5dfcf'}
                                        >
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: owes ? '#dc2626' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 900, color: 'white', flexShrink: 0 }}>
                                                {initials(c.name)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 800, fontSize: '15px', color: '#1a1209', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                                <div style={{ fontSize: '12px', color: '#92896a', marginTop: '2px' }}>{c.phone} · {ago(c.lastTransaction)}</div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontSize: '18px', fontWeight: 900, color: owes ? '#dc2626' : '#16a34a', letterSpacing: '-0.3px' }}>
                                                    {c.balance === 0 ? '₹0' : fmt(c.balance)}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#b5a97a', fontWeight: 700, textTransform: 'uppercase' }}>
                                                    {owes ? 'owes you' : c.balance < 0 ? 'advance' : 'clear'}
                                                </div>
                                            </div>
                                            <ChevronRight size={18} color="#e5dfcf" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'customers' && selectedCustomer && (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <CustomerDetail
                        customer={selectedCustomer}
                        api={api}
                        onBack={() => setSelectedCustomer(null)}
                        onAddKatha={() => setShowAddKatha(true)}
                        onManageDispute={(entry) => setSelectedDispute(entry)}
                    />
                </div>
            )}


            {activeTab === 'settings' && (
                <div style={{ padding: '20px 24px' }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1.5px solid #f0ebe0', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 900, color: '#1a1209', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store Info</h3>
                        {[
                            ['Shop Name', merchant?.shopName || '—'],
                            ['Category', merchant?.category || '—'],
                            ['WhatsApp', merchant?.whatsappNumber || '—'],
                            ['UPI ID', merchant?.upiId || '—'],
                            ['Address', merchant?.storeAddress || '—'],
                            ['Merchant ID', merchant?.merchant_id || '—']
                        ].map(([label, value], idx, arr) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f9f7f3' }}>
                                <span style={{ fontSize: '13px', color: '#92896a', fontWeight: 600 }}>{label}</span>
                                <span style={{ fontSize: '13px', color: '#1a1209', fontWeight: 700, maxWidth: '180px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    <MerchantSettings user={user} merchant={merchant} api={api} onRefresh={() => {
                        window.location.reload(); 
                    }} />

                    <button onClick={logout} style={{ marginTop: '0', width: '100%', padding: '14px', background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: '14px', color: '#dc2626', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <LogOut size={16} /> Sign Out
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '20px', opacity: 0.6 }}>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 800, color: '#92896a', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                            Crafted with love by <a href="https://gdenterprises.gnandeep.com" target="_blank" rel="noopener noreferrer" style={{ color: '#1a1209', textDecoration: 'none', borderBottom: '1px solid #e5dfcf' }}>GD Enterprises</a>
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: '9px', fontWeight: 700, color: '#b5a97a', letterSpacing: '0.05em' }}>
                            PAYWISE MERCHANT V1.0.0 · © 2026
                        </p>
                    </div>
                </div>
            )}

            {/* Floating Add Katha FAB (when in customer list) */}
            {activeTab === 'customers' && !selectedCustomer && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 40 }}>
                    <button onClick={() => setShowNewCustomer(true)}
                        style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #92400e, #78350f)', border: 'none', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(146,64,14,0.4)', color: 'white' }}>
                        <UserPlus size={24} strokeWidth={2.5} />
                    </button>
                </div>
            )}

            {/* Modals */}
            {showNewCustomer && (
                <NewCustomerModal
                    onClose={() => setShowNewCustomer(false)}
                    onSuccess={(newCust) => {
                        setShowNewCustomer(false);
                        setSelectedCustomer(newCust); // The customer detail view expects at least { name, phone }
                        setTimeout(() => setShowAddKatha(true), 150);
                    }}
                />
            )}
            {showAddKatha && selectedCustomer && (
                <AddKathaModal
                    customer={selectedCustomer}
                    merchantId={merchant._id}
                    api={api}
                    onClose={() => setShowAddKatha(false)}
                    onSaved={() => { loadCustomers(); }}
                />
            )}
            {showBulkImport && (
                <BulkImportModal
                    api={api}
                    onClose={() => setShowBulkImport(false)}
                    onDone={loadCustomers}
                />
            )}
            {selectedDispute && (
                <ManageDisputeModal
                    entry={selectedDispute}
                    api={api}
                    onClose={() => setSelectedDispute(null)}
                    onResolved={() => { loadCustomers(); }}
                />
            )}

            <style>{`
                * { box-sizing: border-box; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                input::placeholder { color: #b5a97a; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #e5dfcf; border-radius: 4px; }
            `}</style>
        </div>
    );
}
