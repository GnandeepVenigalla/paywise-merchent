import React, { useState } from 'react'
import './MerchantBulkImport.css'
import {
  validateBulkUpload,
  requestBulkCorrection,
  sendWhatsAppSummary,
} from '../utils/merchantModules'

// Merchant Bulk Import page
export default function MerchantBulkImport() {
  const [rows, setRows] = useState([])
  const [conflicts, setConflicts] = useState([])

  // Example CurrentState - in real app this should come from API
  const CurrentState = [
    { phone: '9999999999', amount: 250, date: '2026-03-01', remarks: 'Previous' },
    { phone: '8888888888', amount: 120, date: '2026-03-04', remarks: 'Snack' },
  ]

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (!lines.length) return []
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    const entries = lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim())
      const obj = {}
      header.forEach((h, i) => (obj[h] = cols[i] || ''))
      return {
        phone: obj.phone || obj.phone_number || '',
        amount: parseFloat(obj.amount || '0') || 0,
        date: obj.date || '',
        remarks: obj.remarks || '',
      }
    })
    return entries
  }

  function handleFile(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target.result
      const parsed = parseCSV(text)
      const validated = validateBulkUpload(parsed, CurrentState)
      setRows(validated)
      setConflicts(validated.filter(r => r.conflict))
    }
    reader.readAsText(f)
  }

  function handleNotify(row) {
    // send summary / notification to a single customer
    sendWhatsAppSummary({ phone: row.phone, amount: row.amount, store: 'Demo Store' })
    alert(`Notification queued for ${row.phone}`)
  }

  function handleRequestCorrections() {
    const conflictRows = rows.filter(r => r.conflict)
    requestBulkCorrection(conflictRows)
    alert('Correction requests sent for conflict rows.')
  }

  return (
    <div className="merchant-bulk-import">
      <h2>Merchant Bulk Import</h2>
      <p>Upload a CSV with columns: Phone, Amount, Date, Remarks</p>

      <input type="file" accept=".csv" onChange={handleFile} />

      {rows.length > 0 && (
        <>
          <h3>Preview</h3>
          <table className="bulk-table">
            <thead>
              <tr>
                <th>Phone</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className={r.conflict ? 'conflict' : ''}>
                  <td>{r.phone}</td>
                  <td className={r.conflict ? 'conflict-amount' : ''}>
                    {r.amount}
                    {r.conflict && r.originalAmount != null && (
                      <div className="original">original: {r.originalAmount}</div>
                    )}
                  </td>
                  <td>{r.date}</td>
                  <td>{r.remarks}</td>
                  <td>
                    {r.conflict && (
                      <button className="btn-notify" onClick={() => handleNotify(r)}>
                        Notify Customer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {conflicts.length > 0 && (
            <div className="conflict-actions">
              <strong>{conflicts.length} conflict(s) detected.</strong>
              <button onClick={handleRequestCorrections}>Request Bulk Correction</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
