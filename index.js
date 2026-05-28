const express = require('express')
const app = express()
 
app.use(express.json())
 
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Max-Age', '86400')
  if (req.method === 'OPTIONS') return res.status(200).end()
  next()
})
 
// In-memory stores
let latestRates = null
let pendingLaneRequest = null
 
app.get('/', (req, res) => res.send('DAT Proxy running'))
 
// Front plugin POSTs a lane request here → extension picks it up
app.post('/request', (req, res) => {
  pendingLaneRequest = { ...req.body, requestedAt: Date.now() }
  console.log('Lane request received:', JSON.stringify(pendingLaneRequest).slice(0, 100))
  // Clear any old rates so plugin waits for fresh ones
  latestRates = null
  res.json({ success: true })
})
 
// Extension GETs pending lane request
app.get('/request', (req, res) => {
  if (!pendingLaneRequest) return res.status(404).json({ error: 'No pending request' })
  // Only serve if fresh (within 2 minutes)
  if (Date.now() - pendingLaneRequest.requestedAt > 2 * 60 * 1000) {
    pendingLaneRequest = null
    return res.status(404).json({ error: 'Request expired' })
  }
  res.json({ lane: pendingLaneRequest })
})
 
// Extension DELETEs request after processing
app.delete('/request', (req, res) => {
  pendingLaneRequest = null
  res.json({ success: true })
})
 
// Extension POSTs scraped rates here
app.post('/rates', (req, res) => {
  latestRates = { ...req.body, timestamp: Date.now() }
  console.log('Rates received:', JSON.stringify(latestRates).slice(0, 100))
  res.json({ success: true })
})
 
// Front plugin GETs rates
app.get('/rates', (req, res) => {
  if (!latestRates) return res.status(404).json({ error: 'No rates yet' })
  if (Date.now() - latestRates.timestamp > 10 * 60 * 1000) {
    latestRates = null
    return res.status(404).json({ error: 'Rates expired' })
  }
  res.json(latestRates)
})
 
// Anthropic proxy
app.post('/', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' })
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
 
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`))
 
