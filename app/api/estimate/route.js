export async function POST(req) {
  const { taskName, description } = await req.json()
  const prompt = `You are a task time estimator for someone with ADHD. Given a task, estimate realistic hours needed including context switching and breaks.

Task: "${taskName}"
${description ? `Description: "${description}"` : ''}

Reply with ONLY a JSON object like this, nothing else:
{"hours": 2.5, "reason": "one line explanation"}`

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  })

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return Response.json(JSON.parse(clean))
  } catch {
    return Response.json({ hours: 2, reason: "couldn't estimate, defaulting to 2h" })
  }
}