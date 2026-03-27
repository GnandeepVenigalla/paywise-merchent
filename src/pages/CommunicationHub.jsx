import React, { useState } from 'react'
import './CommunicationHub.css'
import { sendWhatsAppSummary, disputeResolution } from '../utils/merchantModules'

export default function CommunicationHub() {
  const [customers, setCustomers] = useState([
    {
      id: '9999999999',
      name: 'Rajesh Kumar',
      balance: 1250,
      store: 'Grocery Store',
      lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isBlocked: false,
      disputes: [],
    },
    {
      id: '8888888888',
      name: 'Priya Singh',
      balance: 580,
      store: 'Clothing Store',
      lastContact: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isBlocked: false,
      disputes: [],
    },
    {
      id: '7777777777',
      name: 'Amit Patel',
      balance: 320,
      store: 'Restaurant',
      lastContact: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      isBlocked: true,
      disputes: [{ id: 'disp_123', reason: 'Price mismatch on bill', status: 'under_review' }],
    },
  ])

  const [autoWeekly, setAutoWeekly] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  function handleSendWhatsApp(customer) {
    const result = sendWhatsAppSummary({
      phone: customer.id,
      amount: customer.balance,
      store: customer.store,
      customerName: customer.name,
      link: `https://paywise.example.com/customer/${customer.id}`,
    })

    // Update last contact time
    setCustomers(customers.map(c => 
      c.id === customer.id ? { ...c, lastContact: new Date() } : c
    ))

    alert(`WhatsApp sent to ${customer.name}:\n${result.message}`)
  }

  function handleRaiseDispute(customer) {
    const reason = prompt('Enter dispute reason:')
    if (!reason) return

    const transactionId = `txn_${Date.now()}`
    const { dispute, merchantBlock } = disputeResolution({
      transactionId,
      customerId: customer.id,
      merchantId: 'merchant_1',
      reason,
    })

    // Update customer with dispute and block status
    setCustomers(customers.map(c => 
      c.id === customer.id
        ? {
            ...c,
            isBlocked: true,
            disputes: [...c.disputes, dispute],
          }
        : c
    ))

    alert(`Dispute raised!\n${merchantBlock.merchantId} is now blocked from adding debt to this customer until ${new Date(dispute.blockedUntil).toLocaleDateString()}.`)
  }

  function handleResolveDispute(customer, dispute) {
    // In real app: backend would mark dispute as resolved and unblock merchant
    setCustomers(customers.map(c =>
      c.id === customer.id
        ? {
            ...c,
            isBlocked: false,
            disputes: c.disputes.map(d =>
              d.id === dispute.id ? { ...d, status: 'resolved' } : d
            ),
          }
        : c
    ))

    alert(`Dispute #${dispute.id} resolved. Customer unblocked.`)
  }

  const blockedCount = customers.filter(c => c.isBlocked).length

  return (
    <div className="communication-hub">
      <h2>Trust & Communication Hub</h2>

      <div className="summary-cards">
        <div className="card">
          <h4>Total Customers</h4>
          <p className="number">{customers.length}</p>
        </div>
        <div className="card alert">
          <h4>🚫 Blocked Customers</h4>
          <p className="number alert-text">{blockedCount}</p>
        </div>
        <div className="card">
          <h4>Weekly Auto-Summary</h4>
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoWeekly}
              onChange={e => setAutoWeekly(e.target.checked)}
            />
            <span>{autoWeekly ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
      </div>

      <div className="customers-section">
        <h3>Customers</h3>
        <table className="customers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Store</th>
              <th>Last Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id} className={customer.isBlocked ? 'blocked' : ''}>
                <td>{customer.name}</td>
                <td>{customer.id}</td>
                <td className="balance">₹{customer.balance}</td>
                <td>{customer.store}</td>
                <td>{customer.lastContact.toLocaleDateString()}</td>
                <td>
                  {customer.isBlocked ? (
                    <span className="badge blocked-badge">🚫 Blocked</span>
                  ) : (
                    <span className="badge active-badge">✓ Active</span>
                  )}
                </td>
                <td className="actions">
                  <button
                    className="btn-whatsapp"
                    onClick={() => handleSendWhatsApp(customer)}
                    title="Send WhatsApp summary"
                  >
                    💬
                  </button>
                  {!customer.isBlocked && (
                    <button
                      className="btn-dispute"
                      onClick={() => handleRaiseDispute(customer)}
                      title="Raise dispute"
                    >
                      ⚠️
                    </button>
                  )}
                  {customer.isBlocked && (
                    <button
                      className="btn-info"
                      onClick={() => setSelectedCustomer(customer)}
                      title="View disputes"
                    >
                      📋
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <div className="dispute-panel">
          <div className="dispute-header">
            <h3>Disputes for {selectedCustomer.name}</h3>
            <button
              className="btn-close"
              onClick={() => setSelectedCustomer(null)}
            >
              ✕
            </button>
          </div>

          {selectedCustomer.disputes.length === 0 ? (
            <p>No disputes.</p>
          ) : (
            <div className="disputes-list">
              {selectedCustomer.disputes.map(dispute => (
                <div key={dispute.id} className={`dispute-item ${dispute.status}`}>
                  <div className="dispute-info">
                    <strong>ID:</strong> {dispute.id}
                    <br />
                    <strong>Reason:</strong> {dispute.reason}
                    <br />
                    <strong>Status:</strong>{' '}
                    <span className={`status ${dispute.status}`}>{dispute.status.toUpperCase()}</span>
                  </div>
                  {dispute.status === 'under_review' && (
                    <button
                      className="btn-resolve"
                      onClick={() => handleResolveDispute(selectedCustomer, dispute)}
                    >
                      Resolve Dispute
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="dispute-note">
            <p>
              <strong>Note:</strong> While disputed, the merchant is blocked from adding new debt to this customer.
              Resolution requires both parties to agree.
            </p>
          </div>
        </div>
      )}

      {autoWeekly && (
        <div className="auto-summary-note">
          <p>
            ℹ️ <strong>Auto-Summary Enabled:</strong> WhatsApp summaries will be sent every Monday at 9 AM to all customers.
          </p>
        </div>
      )}
    </div>
  )
}
