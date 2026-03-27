// Utility functions for merchant flows and bulk upload validation (merchant app copy)

export function validateBulkUpload(excelData = [], currentState = []) {
  const index = {}
  currentState.forEach(r => {
    const key = `${r.phone}::${r.date}`
    index[key] = r
  })

  return excelData.map(row => {
    const key = `${row.phone}::${row.date}`
    const existing = index[key]
    if (existing && Number(existing.amount) !== Number(row.amount)) {
      return { ...row, conflict: true, originalAmount: existing.amount }
    }
    return { ...row, conflict: false }
  })
}

export function requestBulkCorrection(conflictRows = []) {
  conflictRows.forEach(r => {
    console.log('Requesting correction for', r.phone, r.date, 'orig:', r.originalAmount, 'new:', r.amount)
  })
  return { status: 'queued', count: conflictRows.length }
}

export function sendWhatsAppSummary({ phone, amount, store, link, customerName = 'User' }) {
  // Format WhatsApp message per spec
  const webLink = link || `https://paywise.example.com/bills?store=${encodeURIComponent(store)}`
  const message = `Hi ${customerName}, your balance at ${store} is ₹${amount}. Tap here to see your bills: ${webLink}`

  // In production: call WhatsApp Cloud API / Twilio
  console.log(`[WhatsApp] → ${phone}: ${message}`)

  return {
    status: 'sent',
    to: phone,
    message,
    timestamp: new Date().toISOString(),
    provider: 'whatsapp',
    trackingId: `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  }
}

export function createStoreProfile({ storeName, category, whatsapp, address, upi }) {
  if (!storeName || !whatsapp || !upi) {
    throw new Error('storeName, whatsapp and upi are required')
  }

  const merchant_id = `m_${Date.now()}`
  const followUrl = `https://paywise.example.com/store/${merchant_id}`

  // QR payload contains a simple follow link + upi for quick payments
  const qrPayload = encodeURIComponent(`STORE:${merchant_id}|UPI:${upi}|URL:${followUrl}`)
  const qr = `https://api.qrserver.com/v1/create-qr-code/?data=${qrPayload}&size=200x200`

  const createdAt = new Date().toISOString()

  return {
    merchant_id,
    storeName,
    category,
    whatsapp,
    address,
    upi,
    qr,
    followUrl,
    createdAt,
    verified: false,
  }
}

export function getMerchantTrustScore({ successfulSettlements = 0, disputedEdits = 0 }) {
  // Compute a ratio-based trust score mapped to [30..98]. A perfect history (no disputes)
  // maps to 98% as requested; large numbers of disputes reduce the score.
  const total = successfulSettlements + disputedEdits
  if (total === 0) return { score: '50%' }
  const successRatio = successfulSettlements / total
  // Map ratio [0..1] to score range [30..98]
  const score = Math.round(30 + successRatio * (98 - 30))
  return { score: `${score}%` }
}

export function fetchUserKathaList(allStores = [], currentUserId) {
  return allStores.filter(s => (s.balances && s.balances[currentUserId] && s.balances[currentUserId] !== 0))
}

export function renderStoreCard(store, lastTransactionDate, balance) {
  return {
    logo: store.logo || '',
    lastTransactionDate,
    total: balance,
    color: balance > 0 ? 'red' : 'green',
  }
}

export function disableUserEdits() {
  return { editable: false }
}

export function addManualEntry({ customer_id, item_list = [], total_amount = 0, remarks = '' }) {
  // Create an immutable record with a hash to prevent tampering
  const entry = {
    id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customer_id,
    item_list: Object.freeze(JSON.parse(JSON.stringify(item_list))),
    total_amount: parseFloat(total_amount),
    remarks,
    immutable: true,
    status: 'pending',
    createdAt: new Date().toISOString(),
    hash: null, // Would be SHA256(JSON.stringify(entry)) in production
  }

  // Send push notification to user (stub)
  console.log(`Push notification: New bill added by merchant for ₹${total_amount}`)
  console.log('Manual entry added', entry)
  return entry
}

export function scanBillOCR({ imageFile, merchantId }) {
  // Stub for AI vision API integration (Google Cloud Vision, AWS Rekognition, etc.)
  // In production, send imageFile to backend which calls Vision API
  // Extract item names and prices from bill image
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      // Simulate OCR parsing - in reality this would call a vision API
      const mockItems = [
        { name: 'Rice Bag', price: 250 },
        { name: 'Oil Bottle', price: 450 },
        { name: 'Sugar', price: 200 },
      ]
      const total = mockItems.reduce((sum, item) => sum + item.price, 0)
      resolve({
        success: true,
        items: mockItems,
        total,
        confidence: 0.87,
        message: 'Bill scanned successfully',
      })
    }
    if (imageFile) reader.readAsDataURL(imageFile)
  })
}

export function quickSettle({ transactionId, merchantUpi, amount = 0 }) {
  // Generate UPI payment link for quick settlement
  const upiString = `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=PaywiseSettle&am=${amount}&tn=Bill%20Settlement&tr=${transactionId}`
  return {
    status: 'cleared',
    transactionId,
    upiLink: upiString,
    clearanceTime: new Date().toISOString(),
    message: `Settlement link ready. Share with customer or open UPI app.`,
  }
}

export function disputeResolution({ transactionId, customerId, merchantId, reason = '' }) {
  // Change transaction status to Under Review and block merchant from adding debt
  // Returns merchant block and dispute record
  const dispute = {
    id: `disp_${Date.now()}`,
    transactionId,
    customerId,
    merchantId,
    reason,
    status: 'under_review',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    blockedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7-day block
  }

  // Merchant is blocked from adding debt to this customer
  const merchantBlock = {
    merchantId,
    customerId,
    reason: `Dispute #${dispute.id}`,
    isBlocked: true,
    startDate: dispute.createdAt,
    endDate: dispute.blockedUntil,
    canAddDebt: false,
  }

  console.log(`Dispute raised for transaction ${transactionId}`, dispute)
  console.log(`Merchant ${merchantId} blocked from adding debt to ${customerId}`, merchantBlock)

  return { dispute, merchantBlock }
}
