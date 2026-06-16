export async function POST(req) {
  const { taskName, description } = await req.json()
  const prompt = `You are a task time estimator for someone with ADHD. Given a task, estimate realistic hours needed including context switching and breaks. Reply with ONLY valid JSON, no markdown, no backticks, no explanation. Example: {"hours": 2.5, "reason": "one line explanation"}

Task: "${taskName}"${description ? `\nDescription: "${description}"` : ''}`

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  })

  const data = await res.json()
  console.log('Gemini raw:', JSON.stringify(data))
  
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  console.log('Gemini text:', text)
  
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return Response.json(parsed)
  } catch {
    return Response.json({ hours: 2, reason: "defaulting to 2h — edit if needed" })
  }
}