import React, { useState } from 'react'
import './DailyBook.css'
import {
  addManualEntry,
  scanBillOCR,
  quickSettle,
} from '../utils/merchantModules'

export default function DailyBook() {
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ name: '', price: 0 }])
  const [remarks, setRemarks] = useState('')
  const [entries, setEntries] = useState([])
  const [scanResult, setScanResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // Get merchant UPI from localStorage or props
  const merchantUpi = localStorage.getItem('merchantUpi') || 'merchant@upi'

  function addItemRow() {
    setItems([...items, { name: '', price: 0 }])
  }

  function updateItem(idx, field, value) {
    const updated = [...items]
    updated[idx][field] = field === 'price' ? parseFloat(value) || 0 : value
    setItems(updated)
  }

  function removeItem(idx) {
    setItems(items.filter((_, i) => i !== idx))
  }

  function handleAddEntry() {
    if (!customerId || items.some(i => !i.name && i.price === 0)) {
      alert('Please fill customer ID and at least one item')
      return
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0)
    const entry = addManualEntry({
      customer_id: customerId,
      item_list: items,
      total_amount: totalAmount,
      remarks,
    })

    setEntries([entry, ...entries])
    setCustomerId('')
    setItems([{ name: '', price: 0 }])
    setRemarks('')
  }

  async function handleScanBill(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const result = await scanBillOCR({ imageFile: file })
      setScanResult(result)

      if (result.success) {
        // Auto-populate items from OCR
        setItems(result.items)
      }
    } catch (err) {
      console.error('OCR error:', err)
      alert('Bill scan failed')
    } finally {
      setLoading(false)
    }
  }

  function handleQuickSettle(entry) {
    const result = quickSettle({
      transactionId: entry.id,
      merchantUpi,
      amount: entry.total_amount,
    })

    // Show UPI link (in real app, redirect to UPI or show QR)
    alert(`Settle ₹${entry.total_amount}\nUPI: ${result.upiLink}`)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="daily-book">
      <h2>Daily Book - Transaction Entry</h2>

      <div className="entry-section">
        <h3>Quick Manual Entry</h3>

        <label>
          Customer ID / Phone
          <input
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            placeholder="9999999999"
          />
        </label>

        <div className="items-table">
          <h4>Items</h4>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Price (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                      placeholder="e.g., Rice Bag"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.price}
                      onChange={e => updateItem(idx, 'price', e.target.value)}
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <button
                      className="btn-remove"
                      onClick={() => removeItem(idx)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="btn-add-row" onClick={addItemRow}>
            + Add Item
          </button>
        </div>

        <label>
          Remarks (optional)
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Notes..."
            rows="2"
          />
        </label>

        <div className="total">
          <strong>Total: ₹{totalAmount.toFixed(2)}</strong>
        </div>

        <button className="btn-add-entry" onClick={handleAddEntry}>
          Add Entry
        </button>
      </div>

      <div className="scan-section">
        <h3>Or Scan Bill (OCR)</h3>
        <label className="file-input">
          📸 Upload Bill Photo
          <input
            type="file"
            accept="image/*"
            onChange={handleScanBill}
            disabled={loading}
          />
        </label>

        {loading && <p>Scanning bill...</p>}

        {scanResult && (
          <div className="scan-result">
            <p>
              ✓ Scanned Successfully (Confidence: {(scanResult.confidence * 100).toFixed(0)}%)
            </p>
            <ul>
              {scanResult.items.map((item, idx) => (
                <li key={idx}>
                  {item.name} - ₹{item.price}
                </li>
              ))}
            </ul>
            <p>Total: ₹{scanResult.total}</p>
          </div>
        )}
      </div>

      <div className="entries-section">
        <h3>Recent Entries ({entries.length})</h3>

        {entries.length === 0 ? (
          <p>No entries yet.</p>
        ) : (
          <table className="entries-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.id.substring(0, 8)}</td>
                  <td>{entry.customer_id}</td>
                  <td>{entry.item_list.length} items</td>
                  <td className="amount">₹{entry.total_amount}</td>
                  <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                  <td>{entry.status}</td>
                  <td>
                    <button
                      className="btn-settle"
                      onClick={() => handleQuickSettle(entry)}
                    >
                      ⚡ Quick Settle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
