const express = require('express')
const app = express()

app.use(express.json())

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.get('/', (req, res) => res.send('DAT Proxy running'))

app.post('/', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
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
