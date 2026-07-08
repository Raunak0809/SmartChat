const BACKEND = 'https://smartchat-dwzm.onrender.com'

// ===== Auth Elements =====
const authPage = document.getElementById('auth-page')
const chatPage = document.getElementById('chat-page')
const loginForm = document.getElementById('login-form')
const signupForm = document.getElementById('signup-form')
const loginEmail = document.getElementById('login-email')
const loginPassword = document.getElementById('login-password')
const loginBtn = document.getElementById('login-btn')
const loginError = document.getElementById('login-error')
const signupName = document.getElementById('signup-name')
const signupEmail = document.getElementById('signup-email')
const signupPassword = document.getElementById('signup-password')
const signupBtn = document.getElementById('signup-btn')
const signupError = document.getElementById('signup-error')

// ===== Chat Elements =====
const sendBtn = document.getElementById('send-btn')
const clearBtn = document.getElementById('clear-btn')
const voiceBtn = document.getElementById('voice-btn')
const cameraBtn = document.getElementById('camera-btn')
const muteBtn = document.getElementById('mute-btn')
const fileInput = document.getElementById('file-input')
const userInput = document.getElementById('user-input')
const chatBox = document.getElementById('chat-box')
const botName = document.getElementById('bot-name')
const personalityBtns = document.querySelectorAll('.personality-btn')
const chatList = document.getElementById('chat-list')
const newChatBtn = document.getElementById('new-chat-btn')
const logoutBtn = document.getElementById('logout-btn')
const userNameDisplay = document.getElementById('user-name-display')
const toggleSidebar = document.getElementById('toggle-sidebar')
const sidebar = document.getElementById('sidebar')

// ===== State =====
let token = localStorage.getItem('token')
let currentUser = JSON.parse(localStorage.getItem('user') || 'null')
let currentChatId = null
let isMuted = false
let currentPersonality = 'smart'

// ===== Personalities =====
const personalities = {
  smart: {
    name: '🤖 SmartChat AI',
    prompt: 'You are SmartChat AI, a helpful and intelligent assistant.',
    welcome: 'Hello! I am SmartChat AI. Ask me anything!'
  },
  funny: {
    name: '😄 FunnyBot AI',
    prompt: 'You are FunnyBot, a hilarious AI assistant. Use humor and emojis!',
    welcome: 'Heyyy! 😂 I am FunnyBot! Ask me anything!'
  },
  study: {
    name: '👨‍🏫 Study AI',
    prompt: 'You are Study AI, a helpful teacher. Explain concepts clearly.',
    welcome: 'Welcome student! 📚 Ask me any concept!'
  },
  career: {
    name: '💼 Career AI',
    prompt: 'You are Career AI, an expert career counselor for Indian students.',
    welcome: 'Hello! 💼 Ask me about jobs or career advice!'
  },
  interview: {
    name: '🎯 Interview AI',
    prompt: 'You are Interview AI, an expert interview coach.',
    welcome: 'Ready to crack your interview? 🎯 Ask me anything!'
  }
}

// ===== Check if logged in =====
window.onload = function() {
  if (token && currentUser) {
    showChatPage()
  } else {
    showAuthPage()
  }
}

// ===== Show Auth Page =====
function showAuthPage() {
  authPage.style.display = 'flex'
  chatPage.style.display = 'none'
}

// ===== Show Chat Page =====
function showChatPage() {
  authPage.style.display = 'none'
  chatPage.style.display = 'flex'
  userNameDisplay.textContent = '👤 ' + currentUser.name
  loadChats()
  showWelcome(personalities.smart.welcome)
}

// ===== Switch Forms =====
function showSignup() {
  loginForm.style.display = 'none'
  signupForm.style.display = 'block'
}

function showLogin() {
  signupForm.style.display = 'none'
  loginForm.style.display = 'block'
}

// ===== Login =====
loginBtn.addEventListener('click', async function() {
  const email = loginEmail.value.trim()
  const password = loginPassword.value.trim()

  if (!email || !password) {
    loginError.textContent = 'Please fill all fields'
    return
  }

  loginBtn.textContent = 'Logging in...'

  try {
    const response = await fetch(BACKEND + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (data.success) {
      token = data.token
      currentUser = data.user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(currentUser))
      showChatPage()
    } else {
      loginError.textContent = data.error || 'Login failed'
    }

  } catch (error) {
    loginError.textContent = 'Cannot connect to server'
  }

  loginBtn.textContent = 'Login'
})

// ===== Signup =====
signupBtn.addEventListener('click', async function() {
  const name = signupName.value.trim()
  const email = signupEmail.value.trim()
  const password = signupPassword.value.trim()

  if (!name || !email || !password) {
    signupError.textContent = 'Please fill all fields'
    return
  }

  signupBtn.textContent = 'Creating account...'

  try {
    const response = await fetch(BACKEND + '/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })

    const data = await response.json()

    if (data.success) {
      token = data.token
      currentUser = data.user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(currentUser))
      showChatPage()
    } else {
      signupError.textContent = data.error || 'Signup failed'
    }

  } catch (error) {
    signupError.textContent = 'Cannot connect to server'
  }

  signupBtn.textContent = 'Sign Up'
})

// ===== Logout =====
logoutBtn.addEventListener('click', function() {
  token = null
  currentUser = null
  currentChatId = null
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  showAuthPage()
})

// ===== Toggle Sidebar =====
toggleSidebar.addEventListener('click', function() {
  sidebar.classList.toggle('hidden')
})

// ===== Load Chats =====
async function loadChats() {
  try {
    const response = await fetch(BACKEND + '/api/chats', {
      headers: { 'Authorization': token }
    })
    const data = await response.json()

    chatList.innerHTML = ''

    if (data.chats && data.chats.length > 0) {
      data.chats.forEach(function(chat) {
        addChatToSidebar(chat)
      })
    }

  } catch (error) {
    console.log('Load chats error:', error)
  }
}

// ===== Add Chat to Sidebar =====
function addChatToSidebar(chat) {
  const item = document.createElement('div')
  item.classList.add('chat-item')
  item.dataset.chatId = chat._id

  if (chat._id === currentChatId) {
    item.classList.add('active')
  }

  item.innerHTML = `
    <span class="chat-item-title">💬 ${chat.title}</span>
    <button class="delete-chat-btn" onclick="deleteChat('${chat._id}', event)">🗑</button>
  `

  item.addEventListener('click', function() {
    openChat(chat._id)
  })

  chatList.appendChild(item)
}

// ===== Open Chat =====
async function openChat(chatId) {
  currentChatId = chatId
  chatBox.innerHTML = ''

  // Update active state
  document.querySelectorAll('.chat-item').forEach(item => {
    item.classList.remove('active')
    if (item.dataset.chatId === chatId) {
      item.classList.add('active')
    }
  })

  try {
    const response = await fetch(BACKEND + '/api/chats/' + chatId + '/messages', {
      headers: { 'Authorization': token }
    })
    const data = await response.json()

    if (data.messages && data.messages.length > 0) {
      data.messages.forEach(function(msg) {
        addMessage(msg.text, msg.sender)
      })
    }

  } catch (error) {
    console.log('Open chat error:', error)
  }
}

// ===== Delete Chat =====
async function deleteChat(chatId, event) {
  event.stopPropagation()

  try {
    await fetch(BACKEND + '/api/chats/' + chatId, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    })

    if (currentChatId === chatId) {
      currentChatId = null
      chatBox.innerHTML = ''
      showWelcome(personalities[currentPersonality].welcome)
    }

    loadChats()

  } catch (error) {
    console.log('Delete error:', error)
  }
}

// ===== New Chat Button =====
newChatBtn.addEventListener('click', function() {
  currentChatId = null
  chatBox.innerHTML = ''
  document.querySelectorAll('.chat-item').forEach(item => {
    item.classList.remove('active')
  })
  showWelcome(personalities[currentPersonality].welcome)
})

// ===== Personality Buttons =====
personalityBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    personalityBtns.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentPersonality = btn.dataset.personality
    const selected = personalities[currentPersonality]
    botName.textContent = selected.name
  })
})

// ===== Welcome Message =====
function showWelcome(message) {
  const welcomeDiv = document.createElement('div')
  welcomeDiv.classList.add('welcome')
  welcomeDiv.innerHTML = `🤖 <strong>${message}</strong>`
  chatBox.appendChild(welcomeDiv)
}

// ===== Get Time =====
function getTime() {
  const now = new Date()
  let hours = now.getHours()
  let minutes = now.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  minutes = minutes < 10 ? '0' + minutes : minutes
  return hours + ':' + minutes + ' ' + ampm
}

// ===== Send Button =====
sendBtn.addEventListener('click', function() {
  sendMessage()
})

userInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') sendMessage()
})

// ===== Clear Button =====
clearBtn.addEventListener('click', function() {
  chatBox.innerHTML = ''
  window.speechSynthesis.cancel()
  showWelcome(personalities[currentPersonality].welcome)
})

// ===== Mute Button =====
muteBtn.addEventListener('click', function() {
  isMuted = !isMuted
  if (isMuted) {
    muteBtn.textContent = '🔇'
    muteBtn.classList.add('muted')
    window.speechSynthesis.cancel()
  } else {
    muteBtn.textContent = '🔊'
    muteBtn.classList.remove('muted')
  }
})

// ===== Camera Button =====
cameraBtn.addEventListener('click', function() {
  fileInput.click()
})

fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = function(event) {
    const imageData = event.target.result

    const wrapper = document.createElement('div')
    wrapper.classList.add('message-wrapper', 'user-wrapper')

    const messageDiv = document.createElement('div')
    messageDiv.classList.add('message', 'user-message')

    const img = document.createElement('img')
    img.src = imageData
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

    addMessage('AI is analyzing your image...', 'loading')
    callBackendWithImage(imageData)
  }
  reader.readAsDataURL(file)
  fileInput.value = ''
})

// ===== Send Message =====
function sendMessage() {
  const message = userInput.value.trim()
  if (message === '') return
  addMessage(message, 'user')
  userInput.value = ''
  addMessage('AI is thinking...', 'loading')
  callBackend(message)
}

// ===== Speak Text =====
function speakText(text) {
  if (isMuted) return
  window.speechSynthesis.cancel()
  const speech = new SpeechSynthesisUtterance()
  speech.text = text
  speech.lang = 'en-IN'
  speech.rate = 1.0
  speech.pitch = 1.0
  speech.volume = 1.0
  const voices = window.speechSynthesis.getVoices()
  const englishVoice = voices.find(voice => voice.lang.includes('en'))
  if (englishVoice) speech.voice = englishVoice
  window.speechSynthesis.speak(speech)
}

// ===== Add Message =====
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

// ===== Call Backend =====
async function callBackend(message) {
  const selectedPrompt = personalities[currentPersonality].prompt

  try {
    const response = await fetch(BACKEND + '/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        message: message,
        personality: selectedPrompt,
        chatId: currentChatId
      })
    })

    const data = await response.json()
    const loading = document.querySelector('.loading')
    if (loading) loading.remove()

    if (data.reply) {
      addMessage(data.reply, 'ai')
      speakText(data.reply)

      // Update chatId and reload sidebar
      if (!currentChatId && data.chatId) {
        currentChatId = data.chatId
        loadChats()
      }

    } else if (data.error) {
      addMessage('Error: ' + data.error, 'ai')
    }

  } catch (error) {
    const loading = document.querySelector('.loading')
    if (loading) loading.remove()
    addMessage('Cannot connect to server!', 'ai')
  }
}

// ===== Call Backend With Image =====
async function callBackendWithImage(imageBase64) {
  try {
    const response = await fetch(BACKEND + '/api/chat-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        image: imageBase64,
        personality: personalities[currentPersonality].prompt,
        chatId: currentChatId
      })
    })

    const data = await response.json()
    const loading = document.querySelector('.loading')
    if (loading) loading.remove()

    if (data.reply) {
      addMessage(data.reply, 'ai')
      speakText(data.reply)

      if (!currentChatId && data.chatId) {
        currentChatId = data.chatId
        loadChats()
      }

    } else if (data.error) {
      addMessage('Error: ' + data.error, 'ai')
    }

  } catch (error) {
    const loading = document.querySelector('.loading')
    if (loading) loading.remove()
    addMessage('Cannot analyze image right now!', 'ai')
  }
}

// ===== Voice Input =====
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
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

  recognition.onerror = function() {
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