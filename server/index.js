const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ===== Connect to MongoDB =====
const mongoURI = process.env.MONGODB_URI

if (mongoURI) {
  mongoose.connect(mongoURI)
    .then(function() {
      console.log('MongoDB connected!')
    })
    .catch(function(error) {
      console.log('MongoDB error:', error.message)
    })
}

// ===== User Schema =====
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)

// ===== Chat Schema =====
const chatSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  title: String,
  createdAt: { type: Date, default: Date.now }
})

const Chat = mongoose.model('Chat', chatSchema)

// ===== Message Schema =====
const messageSchema = new mongoose.Schema({
  chatId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  sender: String,
  text: String,
  personality: String,
  timestamp: { type: Date, default: Date.now }
})

const Message = mongoose.model('Message', messageSchema)

// ===== Middleware — Verify Token =====
function verifyToken(req, res, next) {
  const token = req.headers.authorization

  if (!token) {
    return res.json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartchat_secret')
    req.userId = decoded.userId
    next()
  } catch (error) {
    res.json({ error: 'Invalid token' })
  }
}

// ===== Test Route =====
app.get('/', function(req, res) {
  res.json({ message: 'SmartChat backend running!' })
})

// ===== SIGNUP =====
app.post('/api/signup', async function(req, res) {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.json({ error: 'All fields required' })
  }

  try {
    // Check if email exists
    const existing = await User.findOne({ email: email })
    if (existing) {
      return res.json({ error: 'Email already exists' })
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword
    })

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'smartchat_secret',
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token: token,
      user: { name: user.name, email: user.email }
    })

  } catch (error) {
    res.json({ error: error.message })
  }
})

// ===== LOGIN =====
app.post('/api/login', async function(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.json({ error: 'Email and password required' })
  }

  try {
    // Find user
    const user = await User.findOne({ email: email })
    if (!user) {
      return res.json({ error: 'User not found' })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.json({ error: 'Wrong password' })
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'smartchat_secret',
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token: token,
      user: { name: user.name, email: user.email }
    })

  } catch (error) {
    res.json({ error: error.message })
  }
})

// ===== GET ALL CHATS (sidebar) =====
app.get('/api/chats', verifyToken, async function(req, res) {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .sort({ createdAt: -1 })
    res.json({ chats: chats })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// ===== CREATE NEW CHAT =====
app.post('/api/chats', verifyToken, async function(req, res) {
  try {
    const chat = await Chat.create({
      userId: req.userId,
      title: 'New Chat'
    })
    res.json({ chat: chat })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// ===== GET MESSAGES FOR A CHAT =====
app.get('/api/chats/:chatId/messages', verifyToken, async function(req, res) {
  try {
    const messages = await Message.find({
      chatId: req.params.chatId,
      userId: req.userId
    }).sort({ timestamp: 1 })
    res.json({ messages: messages })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// ===== DELETE CHAT =====
app.delete('/api/chats/:chatId', verifyToken, async function(req, res) {
  try {
    await Chat.deleteOne({ _id: req.params.chatId, userId: req.userId })
    await Message.deleteMany({ chatId: req.params.chatId })
    res.json({ message: 'Chat deleted' })
  } catch (error) {
    res.json({ error: error.message })
  }
})

// ===== SEND MESSAGE =====
app.post('/api/chat', verifyToken, async function(req, res) {
  const userMessage = req.body.message
  const personality = req.body.personality
  let chatId = req.body.chatId

  if (!userMessage) {
    return res.json({ error: 'No message provided' })
  }

  try {
    // Create new chat if no chatId
    if (!chatId) {
      const newChat = await Chat.create({
        userId: req.userId,
        title: userMessage.substring(0, 30) + '...'
      })
      chatId = newChat._id
    }

    // Save user message
    await Message.create({
      chatId: chatId,
      userId: req.userId,
      sender: 'user',
      text: userMessage,
      personality: personality
    })

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

      // Save AI reply
      await Message.create({
        chatId: chatId,
        userId: req.userId,
        sender: 'ai',
        text: aiReply,
        personality: personality
      })

      res.json({ reply: aiReply, chatId: chatId })
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

// ===== IMAGE ANALYSIS =====
app.post('/api/chat-image', verifyToken, async function(req, res) {
  const imageBase64 = req.body.image
  const personality = req.body.personality
  let chatId = req.body.chatId

  if (!imageBase64) {
    return res.json({ error: 'No image provided' })
  }

  try {
    if (!chatId) {
      const newChat = await Chat.create({
        userId: req.userId,
        title: '📷 Image Chat'
      })
      chatId = newChat._id
    }

    await Message.create({
      chatId: chatId,
      userId: req.userId,
      sender: 'user',
      text: '📷 Image uploaded',
      personality: personality
    })

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
                  image_url: { url: imageBase64 }
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

      await Message.create({
        chatId: chatId,
        userId: req.userId,
        sender: 'ai',
        text: aiReply,
        personality: personality
      })

      res.json({ reply: aiReply, chatId: chatId })
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