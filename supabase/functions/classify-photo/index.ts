// Этап 6: POST /ai/classify-photo
// Отправляет фото репорта в Google Gemini (бесплатный тариф, есть vision),
// получает { label, confidence }. При высокой уверенности и совпадении
// с заявленной категорией — репорт автоматически переводится в 'verified'
// (баллы начислит триггер из Этапа 3). При низкой уверенности статус
// остаётся 'pending_review' — ждёт модератора.

import { createClient } from "npm:@supabase/supabase-js@2"
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts"

// Файл самодостаточный (без импорта из ../_shared) — так его можно
// вставить и задеплоить прямо через Supabase Dashboard, без CLI.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const CONFIDENCE_THRESHOLD = 0.7
const GEMINI_MODEL = "gemini-2.0-flash"

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { report_id } = await req.json()
    if (!report_id) {
      return json({ error: "report_id обязателен" }, 400)
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("id, photo_url, category, status")
      .eq("id", report_id)
      .single()

    if (fetchError || !report) {
      return json({ error: "Репорт не найден" }, 404)
    }
    if (!report.photo_url) {
      return json({ error: "У репорта нет фото" }, 400)
    }

    const photoResp = await fetch(report.photo_url)
    if (!photoResp.ok) {
      return json({ error: "Не удалось загрузить фото для проверки" }, 502)
    }
    const mimeType = photoResp.headers.get("content-type") || "image/jpeg"
    const photoBytes = new Uint8Array(await photoResp.arrayBuffer())
    const photoBase64 = encodeBase64(photoBytes)

    const prompt =
      `Ты — модератор экоплатформы Kepil. Пользователь заявил категорию "${report.category}" ` +
      `(litter — мусор, oil — нефть/промышленное загрязнение, wildlife — дикая природа/браконьерство). ` +
      `Посмотри на фото и определи: 1) какая категория реально изображена ` +
      `(litter/oil/wildlife/unclear — unclear, если фото не по теме, постановочное или неразборчивое), ` +
      `2) насколько ты уверен, что фото настоящее и соответствует заявленной категории (число от 0.0 до 1.0).`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${Deno.env.get(
        "GEMINI_API_KEY"
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: photoBase64 } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                label: { type: "STRING", enum: ["litter", "oil", "wildlife", "unclear"] },
                confidence: { type: "NUMBER" },
                reasoning: { type: "STRING" },
              },
              required: ["label", "confidence", "reasoning"],
            },
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      return json({ error: `Gemini API: ${await geminiRes.text()}` }, 502)
    }

    const geminiData = await geminiRes.json()
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!rawText) {
      return json({ error: "Не удалось разобрать ответ ИИ" }, 502)
    }

    const parsed = JSON.parse(rawText) as {
      label: string
      confidence: number
      reasoning: string
    }

    const confidence = Math.max(0, Math.min(1, parsed.confidence))
    const matchesCategory = parsed.label === report.category
    const shouldAutoVerify = matchesCategory && confidence >= CONFIDENCE_THRESHOLD

    const update: Record<string, unknown> = {
      ai_label: parsed.label,
      ai_confidence: confidence,
    }
    if (shouldAutoVerify) {
      update.status = "verified"
    }

    const { error: updateError } = await supabase
      .from("reports")
      .update(update)
      .eq("id", report_id)

    if (updateError) {
      return json({ error: updateError.message }, 500)
    }

    return json({ label: parsed.label, confidence, auto_verified: shouldAutoVerify })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}
