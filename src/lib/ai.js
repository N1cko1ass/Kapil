import { supabase } from './supabase'

export async function classifyPhoto(reportId) {
  const { data, error } = await supabase.functions.invoke('classify-photo', {
    body: { report_id: reportId },
  })
  if (error) throw error
  return data
}

export async function sendChatMessage(message, history) {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message, history },
  })
  if (error) throw error
  return data.reply
}
