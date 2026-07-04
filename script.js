const sendBtn = document.getElementById('send-btn')
const clearBtn = document.getElementById('clear-btn')
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
    welcome: 'Heyyy! 😂 I am FunnyBot! Ask me anything and I will make you laugh while helping you! 🎉'
  },
  study: {
    name: '👨‍🏫 Study AI',
    prompt: 'You are Study AI, a strict but helpful teacher. Explain concepts clearly with examples. Break down complex topics simply. Always encourage learning.',
    welcome: 'Welcome student! 📚 I am your Study AI. Ask me any concept and I will explain it clearly!'
  },
  career: {
    name: '💼 Career AI',
    prompt: 'You are Career AI, an expert career counselor for engineering students in India. Give practical advice about jobs, skills, resume, internships, and career growth.',
    welcome: 'Hello! 💼 I am Career AI. Ask me about jobs, internships, resume tips, or career advice!'
  },
  interview: {
    name: '🎯 Interview AI',
    prompt: 'You are Interview AI, an expert interview coach. Help students prepare for technical and HR interviews. Give sample questions, model answers, and tips.',
    welcome: 'Ready to crack your interview? 🎯 I am Interview AI! Ask me any interview question!'
  }
}

// Current personality
let currentPersonality = 'smart'

// ===== Show welcome message =====
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

    // Remove active from all buttons
    personalityBtns.forEach(b => b.classList.remove('active'))

    // Add active to clicked button
    btn.classList.add('active')

    // Change personality
    currentPersonality = btn.dataset.personality
    const selected = personalities[currentPersonality]

    // Update header name
    botName.textContent = selected.name

    // Clear chat and show new welcome
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
  showWelcome(personalities[currentPersonality].welcome)
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

// ===== Call backend =====
async function callBackend(message) {

  // Send personality prompt with message
  const selectedPrompt = personalities[currentPersonality].prompt

  try {
    const response = await fetch('https://smartchat-dwzm.onrender.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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