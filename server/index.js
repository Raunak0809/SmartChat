// ===== Image Analysis Route =====
app.post('/api/chat-image', async function(req, res) {

  const imageBase64 = req.body.image
  const personality = req.body.personality

  if (!imageBase64) {
    return res.json({ error: 'No image provided' })
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: personality || 'You are SmartChat AI. Analyze images and answer helpfully.'
          },
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
    })

    const data = await response.json()

    if (data.choices && data.choices[0]) {
      res.json({ reply: data.choices[0].message.content })
    } else if (data.error) {
      res.json({ error: data.error.message })
    } else {
      res.json({ error: 'Could not analyze image' })
    }

  } catch (error) {
    console.log('Image error:', error)
    res.json({ error: 'Something went wrong' })
  }
})