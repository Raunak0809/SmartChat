const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ===== Debug Environment Variables =====
const mongoURI = process.env.MONGODB_URI

console.log('MONGODB_URI exists:', !!mongoURI)
console.log('GROQ_KEY exists:', !!process.env.GROQ_API_KEY)

// ===== Connect to MongoDB =====
if (mongoURI) {
  mongoose.connect(mongoURI)
    .then(function() {
      console.log('MongoDB connected!')
    })
    .catch(function(error) {
      console.log('MongoDB error:', error.message)
    })
} else {
  console.log('No MongoDB URI found!')
}

// ===== Message Schema =====
const messageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  personality: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
})

const Message = mongoose.model('Message', messageSchema)

// ===== Test Route =====
app.get('/', function(req, res) {
  res.json({ message: 'SmartChat backend running!' })
})

// ===== Get Chat History =====
app.get('/api/history', async function(req, res) {
  try {
    const messages = await Message.find()
      .sort({ timestamp: 1 })
      .limit(50)
    res.json({ messages: messages })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// ===== Clear Chat History =====
app.delete('/api/history', async function(req, res) {
  try {
    await Message.deleteMany({})
    res.json({ message: 'History cleared!' })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// ===== Text Chat Route =====
app.post('/api/chat', async function(req, res) {
  const userMessage = req.body.message
  const personality = req.body.personality

  if (!userMessage) {
    return res.json({ error: 'No message provided' })
  }

  try {
    // Save user message to MongoDB
    if (mongoURI) {
      await Message.create({
        sender: 'user',
        text: userMessage,
        personality: personality
      })
    }

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

    if (data.choices && data.choices[0]) {
      const aiReply = data.choices[0].message.content

      // Save AI reply to MongoDB
      if (mongoURI) {
        await Message.create({
          sender: 'ai',
          text: aiReply,
          personality: personality
        })
      }

      res.json({ reply: aiReply })
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

// ===== Image Analysis Route =====
app.post('/api/chat-image', async function(req, res) {
  const imageBase64 = req.body.image
  const personality = req.body.personality

  if (!imageBase64) {
    return res.json({ error: 'No image provided' })
  }

  try {
    // Save user image message
    if (mongoURI) {
      await Message.create({
        sender: 'user',
        text: '📷 Image uploaded',
        personality: personality
      })
    }

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

    if (data.choices && data.choices[0]) {
      const aiReply = data.choices[0].message.content

      // Save AI image reply
      if (mongoURI) {
        await Message.create({
          sender: 'ai',
          text: aiReply,
          personality: personality
        })
      }

      res.json({ reply: aiReply })
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