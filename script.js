// ===== Find HTML elements =====
const sendBtn = document.getElementById('send-btn')
const clearBtn = document.getElementById('clear-btn')
const userInput = document.getElementById('user-input')
const chatBox = document.getElementById('chat-box')

// NO API KEY HERE ✅
// API key is safely in server/.env

// ===== Welcome message =====
window.onload = function() {
  const welcomeDiv = document.createElement('div')
  welcomeDiv.classList.add('welcome')
  welcomeDiv.innerHTML = `
    🤖 <strong>Welcome to SmartChat AI!</strong><br>
    I am your personal AI assistant.<br>
    Ask me anything — I am here to help!
  `
  chatBox.appendChild(welcomeDiv)
}

// ===== Get current time =====
function getTime() {
  const now = new Date()
  let hours = now.getHours()
  let minutes = now.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  minutes = minutes < 10 ? '0' + minutes : minutes
  return hours + ':' + minutes + ' ' + ampm
}

// ===== Send button click =====
sendBtn.addEventListener('click', function() {
  sendMessage()
})

// ===== Enter key =====
userInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendMessage()
  }
})

// ===== Clear button =====
clearBtn.addEventListener('click', function() {
  chatBox.innerHTML = ''
  const welcomeDiv = document.createElement('div')
  welcomeDiv.classList.add('welcome')
  welcomeDiv.innerHTML = `
    🤖 <strong>Chat cleared!</strong><br>
    Start a new conversation below.
  `
  chatBox.appendChild(welcomeDiv)
})

// ===== Main send function =====
function sendMessage() {
  const message = userInput.value.trim()
  if (message === '') return

  addMessage(message, 'user')
  userInput.value = ''
  addMessage('AI is thinking...', 'loading')

  // Calls YOUR backend ✅
  callBackend(message)
}

// ===== Add message with timestamp =====
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

// ===== Call YOUR backend =====
async function callBackend(message) {

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message
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