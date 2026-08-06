// Этап 6: POST /ai/chat
// Проксирует сообщение пользователя в Google Gemini (бесплатный тариф)
// с системным промптом о правилах платформы и помощи в оформлении репорта.

// Файл самодостаточный (без импорта из ../_shared) — так его можно
// вставить и задеплоить прямо через Supabase Dashboard, без CLI.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// gemini-2.0-flash устарела и на новых ключах даёт лимит 0 в бесплатном тарифе —
// используем актуальную бесплатную модель.
const GEMINI_MODEL = "gemini-2.5-flash"

const SYSTEM_PROMPT = `Ты — ассистент платформы Kepil, гражданской экоплатформы Каспия (Актау).
Помогаешь жителям оформить репорт о проблеме (мусор / нефть и промышленное загрязнение / дикая природа и браконьерство),
отвечаешь на вопросы о правилах платформы и начислении баллов.

Баллы: мусор — 10, нефть/загрязнение — 30, дикая природа/браконьерство — 40 (начисляются после подтверждения модератором
или автоматически при высокой уверенности ИИ). Участие в акции уборки — 25 баллов, организация своей акции — 50 баллов.
Баллы можно обменять на награды партнёров в каталоге.

Если пользователь описывает проблему — уточни категорию, место и предложи прикрепить фото при создании репорта на сайте
(кнопка «Новый репорт»). Не выдавай никаких официальных юридических статусов и не обещай действий инспекции/полиции —
платформа только уведомляет, решение всегда за инспекцией на месте.

Отвечай кратко и по делу, на русском языке, дружелюбным тоном.`

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { message, history } = await req.json()
    if (!message || typeof message !== "string") {
      return json({ error: "message обязателен" }, 400)
    }

    const priorTurns = Array.isArray(history)
      ? history
          .slice(-10)
          .filter((m: unknown) => isMessage(m))
          .map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          }))
      : []

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${Deno.env.get(
        "GEMINI_API_KEY"
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [...priorTurns, { role: "user", parts: [{ text: message }] }],
        }),
      }
    )

    if (!geminiRes.ok) {
      return json({ error: `Gemini API: ${await geminiRes.text()}` }, 502)
    }

    const geminiData = await geminiRes.json()
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

    return json({ reply })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function isMessage(m: unknown): m is { role: string; content: string } {
  return (
    typeof m === "object" &&
    m !== null &&
    typeof (m as Record<string, unknown>).role === "string" &&
    typeof (m as Record<string, unknown>).content === "string"
  )
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
