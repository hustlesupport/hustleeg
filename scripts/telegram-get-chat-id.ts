import "dotenv/config";

// After creating a bot via @BotFather and messaging it once, run this to
// find the chat_id to put in TELEGRAM_CHAT_ID.
async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("Set TELEGRAM_BOT_TOKEN in .env first, then message your bot on Telegram, then rerun this.");
    process.exit(1);
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const data = (await res.json()) as {
    ok: boolean;
    result: { message?: { chat: { id: number; first_name?: string; username?: string } } }[];
  };

  if (!data.ok) {
    console.error("Telegram API error — double-check TELEGRAM_BOT_TOKEN.", data);
    process.exit(1);
  }

  const chats = data.result.map((u) => u.message?.chat).filter(Boolean);
  if (chats.length === 0) {
    console.log("No messages found yet. Open Telegram, find your bot, send it any message, then rerun this.");
    return;
  }

  console.log("Found chat(s) — use one of these as TELEGRAM_CHAT_ID:\n");
  const seen = new Set<number>();
  for (const chat of chats) {
    if (!chat || seen.has(chat.id)) continue;
    seen.add(chat.id);
    console.log(`  ${chat.id}  (${chat.first_name ?? chat.username ?? "unknown"})`);
  }
}

main();
