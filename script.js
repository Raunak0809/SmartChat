// ===== Find HTML elements =====
const sendBtn = document.getElementById('send-btn')
const clearBtn = document.getElementById('clear-btn')
const voiceBtn = document.getElementById('voice-btn')
const cameraBtn = document.getElementById('camera-btn')
const fileInput = document.getElementById('file-input')
const userInput = document.getElementById('user-input')
const chatBox = document.getElementById('chat-box')
const botName = document.getElementById('bot-name')
const personalityBtns = document.querySelectorAll('.personality-btn')

// ===== AI Personalities =====
const personalities = {
  smart: {
    name: '🤖 SmartChat AI',
    prompt: 'You are SmartChat AI, a helpful and intelligent assistant. Give clear, accurate and helpful answers.',
    welcome: 'Hello! I am SmartChat AI. Ask me anything!'
  },
  funny: {
    name: '😄 FunnyBot AI',
    prompt: 'You are FunnyBot, a hilarious AI assistant. Answer every question with humor, jokes and fun while still being helpful. Use emojis a lot!',
    welcome: 'Heyyy! 😂 I am FunnyBot! Ask me anything — I will make you laugh! 🎉'
  },
  study: {
    name: '👨‍🏫 Study AI',
    prompt: 'You are Study AI, a strict but helpful teacher. Explain concepts clearly with examples. Break down complex topics simply.',
    welcome: 'Welcome student! 📚 I am your Study AI. Ask me any concept!'
  },
  career: {
    name: '💼 Career AI',
    prompt: 'You are Career AI, an expert career counselor for engineering students in India. Give practical advice about jobs, skills, resume, internships.',
    welcome: 'Hello! 💼 I am Career AI. Ask me about jobs, internships or career advice!'
  },
  interview: {
    name: '🎯 Interview AI',
    prompt: 'You are Interview AI, an expert interview coach. Help students prepare for technical and HR interviews. Give sample questions and model answers.',
    welcome: 'Ready to crack your interview? 🎯 Ask me any interview question!'
  }
}

// Current personality
let currentPersonality = 'smart'

// Store captured image
let capturedImage = null

// ===== Welcome message on load =====
window.onload = function() {
  showWelcome(personalities.smart.welcome)
}

function showWelcome(message) {
  const welcomeDiv = document.createElement('div')
  welcomeDiv.classList.add('welcome')
  welcomeDiv.innerHTML = `🤖 <strong>${message}</strong>`
  chatBox.appendChild(welcomeDiv)
}

// ===== Personality buttons =====
personalityBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    personalityBtns.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentPersonality = btn.dataset.personality
    const selected = personalities[currentPersonality]
    botName.textContent = selected.name
    chatBox.innerHTML = ''
    showWelcome(selected.welcome)
  })
})

// ===== Get time =====
function getTime() {
  const now = new Date()
  let hours = now.getHours()
  let minutes = now.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  minutes = minutes < 10 ? '0' + minutes : minutes
  return hours + ':' + minutes + ' ' + ampm
}

// ===== Send button =====
sendBtn.addEventListener('click', function() {
  sendMessage()
})

// ===== Enter key =====
userInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') sendMessage()
})

// ===== Clear button =====
clearBtn.addEventListener('click', function() {
  chatBox.innerHTML = ''
  capturedImage = null
  showWelcome(personalities[currentPersonality].welcome)
})

// ===== Camera button =====
cameraBtn.addEventListener('click', function() {
  fileInput.click()
})

// ===== File selected =====
fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = function(event) {
    capturedImage = event.target.result

    // Show image preview in chat
    const wrapper = document.createElement('div')
    wrapper.classList.add('message-wrapper', 'user-wrapper')

    const messageDiv = document.createElement('div')
    messageDiv.classList.add('message', 'user-message')

    const img = document.createElement('img')
    img.src = capturedImage
    img.style.maxWidth = '200px'
    img.style.borderRadius = '12px'

    const caption = document.createElement('p')
    caption.textContent = '📷 Image sent — asking AI...'
    caption.style.fontSize = '12px'
    caption.style.marginTop = '6px'
    caption.style.color = '#a0a0c0'

    messageDiv.appendChild(img)
    messageDiv.appendChild(caption)

    const timeDiv = document.createElement('div')
    timeDiv.classList.add('timestamp')
    timeDiv.textContent = getTime()

    wrapper.appendChild(messageDiv)
    wrapper.appendChild(timeDiv)
    chatBox.appendChild(wrapper)
    chatBox.scrollTop = chatBox.scrollHeight

    // Send image to AI
    addMessage('AI is analyzing your image...', 'loading')
    callBackendWithImage(capturedImage)
  }
  reader.readAsDataURL(file)
  fileInput.value = ''
})

// ===== Send message =====
function sendMessage() {
  const message = userInput.value.trim()
  if (message === '') return

  addMessage(message, 'user')
  userInput.value = ''
  addMessage('AI is thinking...', 'loading')
  callBackend(message)
}

// ===== Add message =====
function addMessage(text, sender) {

  if (sender === 'loading') {
    const loadingDiv = document.createElement('div')
    loadingDiv.classList.add('loading')
    loadingDiv.textContent = text
    chatBox.appendChild(loadingDiv)
    chatBox.scrollTop = chatBox.scrollHeight
    return
  }

  const wrapper = document.createElement('div')
  wrapper.classList.add('message-wrapper')
  wrapper.classList.add(sender === 'user' ? 'user-wrapper' : 'ai-wrapper')

  const messageDiv = document.createElement('div')
  messageDiv.classList.add('message')
  messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message')
  messageDiv.textContent = text

  const timeDiv = document.createElement('div')
  timeDiv.classList.add('timestamp')
  timeDiv.textContent = getTime()

  wrapper.appendChild(messageDiv)
  wrapper.appendChild(timeDiv)
  chatBox.appendChild(wrapper)
  chatBox.scrollTop = chatBox.scrollHeight
}

// ===== Call backend with text =====
async function callBackend(message) {
  const selectedPrompt = personalities[currentPersonality].prompt

  try {
    const response = await fetch('https://smartchat-dwzm.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        personality: selectedPrompt
      })
    })

    const data = await response.json()
    const loading = document.querySelector('.loading')
    if (loading) loading.remove()

    if (data.reply) {
      addMessage(data.reply, 'ai')
    } else if (data.error) {
      addMessage('Error: ' + data.error, 'ai')
    }

  } catch (error) {
    const loading = document.querySelector('.loading')
    if (loading) loading.remove()
    addMessage('Cannot connect to server!', 'ai')
  }
}

// ===== Call backend with image =====
async function callBackendWithImage(imageBase64) {
  try {
    const response = await fetch('https://smartchat-dwzm.onrender.com/api/chat-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageBase64,
        personality: personalities[currentPersonality].prompt
      })
    })

    const data = await response.json()
    const loading = document.querySelector('.loading')
    if (loading) loading.remove()

    if (data.reply) {
      addMessage(data.reply, 'ai')
    } else if (data.error) {
      addMessage('Error: ' + data.error, 'ai')
    }

  } catch (error) {
    const loading = document.querySelector('.loading')
    if (loading) loading.remove()
    addMessage('Cannot analyze image right now!', 'ai')
  }
}

// ===== VOICE INPUT =====
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {

  const SpeechRecognition = window.SpeechRecognition
    || window.webkitSpeechRecognition

  const recognition = new SpeechRecognition()
  recognition.lang = 'en-IN'
  recognition.continuous = false
  recognition.interimResults = false

  voiceBtn.addEventListener('click', function() {
    if (voiceBtn.classList.contains('listening')) {
      recognition.stop()
      voiceBtn.classList.remove('listening')
      voiceBtn.textContent = '🎤'
    } else {
      recognition.start()
      voiceBtn.classList.add('listening')
      voiceBtn.textContent = '🔴'
      userInput.placeholder = 'Listening...'
    }
  })

  recognition.onresult = function(event) {
    const spokenText = event.results[0][0].transcript
    userInput.value = spokenText
    voiceBtn.classList.remove('listening')
    voiceBtn.textContent = '🎤'
    userInput.placeholder = 'Type or speak...'
    sendMessage()
  }

  recognition.onerror = function(event) {
    voiceBtn.classList.remove('listening')
    voiceBtn.textContent = '🎤'
    userInput.placeholder = 'Type or speak...'
  }

  recognition.onend = function() {
    voiceBtn.classList.remove('listening')
    voiceBtn.textContent = '🎤'
    userInput.placeholder = 'Type or speak...'
  }

} else {
  voiceBtn.style.display = 'none'
}