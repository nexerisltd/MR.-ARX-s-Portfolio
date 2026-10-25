// ---- Telegram notification (optional: env TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID) ----
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
async function tg(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: text.slice(0, 3800), parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch { /* notification fail korle kichu atkabe na */ }
}
