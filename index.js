const express = require('express')
const app = express()
 
app.use(express.json())
 
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Max-Age', '86400')
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS preflight received')
    return res.status(200).end()
  }
  next()
})
 
app.get('/', (req, res) => {
  console.log('GET / received')
  res.send('DAT Proxy running')
})
 
app.post('/', async (req, res) => {
  console.log('POST / received')
  console.log('API key present:', !!process.env.ANTHROPIC_API_KEY)
  console.log('API key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 15))
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.log('ERROR: No API key found')
      return res.status(500).json({ error: 'API key not configured' })
    }
    console.log('Calling Anthropic...')
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    })
    console.log('Anthropic response status:', response.status)
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    console.log('ERROR:', err.message)
    res.status(500).json({ error: err.message })
  }
})
 
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`))
 
