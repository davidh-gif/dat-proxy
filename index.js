const express = require('express')
const app = express()
 
app.use(express.json())
 
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Max-Age', '86400')
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
})
 
app.get('/', (req, res) => res.send('DAT Proxy running'))
 
app.post('/', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' })
    }
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
 
