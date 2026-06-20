const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

app.post('/api/chat', async function(req, res) {

  const userMessage = req.body.message

  if (!userMessage) {
    return res.json({ error: 'No message provided' })
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are SmartChat AI, a helpful assistant built by an engineering student. You are friendly, smart, and always helpful.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    })

    const data = await response.json()
    const aiReply = data.choices[0].message.content
    res.json({ reply: aiReply })

  } catch (error) {
    console.log('Error:', error)
    res.json({ error: 'Something went wrong' })
  }
})

app.listen(3000, function() {
  console.log('SmartChat backend running on port 3000!')
})  