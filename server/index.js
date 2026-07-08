const express = require('express')
const cors = require('cors')
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/', function(req, res) {
  res.json({ message: 'SmartChat backend running!' })
})

app.post('/api/chat', async function(req, res) {
  const userMessage = req.body.message
  const personality = req.body.personality

  if (!userMessage) {
    return res.json({ error: 'No message provided' })
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
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
              content: personality || 'You are SmartChat AI, a helpful assistant.'
            },
            {
              role: 'user',
              content: userMessage
            }
          ]
        })
      }
    )

    const data = await response.json()
    console.log('Chat response:', JSON.stringify(data))

    if (data.choices && data.choices[0]) {
      res.json({ reply: data.choices[0].message.content })
    } else if (data.error) {
      res.json({ error: data.error.message })
    } else {
      res.json({ error: 'No reply from AI' })
    }

  } catch (error) {
    console.log('Chat error:', error.message)
    res.json({ error: error.message })
  }
})

app.post('/api/chat-image', async function(req, res) {
  const imageBase64 = req.body.image
  const personality = req.body.personality

  if (!imageBase64) {
    return res.json({ error: 'No image provided' })
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64
                  }
                },
                {
                  type: 'text',
                  text: 'Please analyze this image and describe what you see. If there is any text, math problem, or question in the image, please answer it.'
                }
              ]
            }
          ]
        })
      }
    )

    const data = await response.json()
    console.log('Image response:', JSON.stringify(data))

    if (data.choices && data.choices[0]) {
      res.json({ reply: data.choices[0].message.content })
    } else if (data.error) {
      res.json({ error: data.error.message })
    } else {
      res.json({ error: 'Could not analyze image' })
    }

  } catch (error) {
    console.log('Image error:', error.message)
    res.json({ error: error.message })
  }
})
app.listen(3000, function() {
  console.log('SmartChat backend running on port 3000!')
})
