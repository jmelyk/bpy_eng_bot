import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import cron from "node-cron";
import {
  initDb,
  subscribeChannel,
  unsubscribeChannel,
  getChannel,
  getActiveChannels,
  peekIndex,
  getAndIncrementIndex,
} from "./db";
import {
  generateContent,
  getMorningType,
  getEveningType,
  ContentType,
} from "./content";
import { Message } from "./messages";

dotenv.config();

const token = process.env.TOKEN || "";
if (!token) {
  console.error("TOKEN is missing. Check your environment variables.");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

let botUsername = "";
bot.getMe().then((me) => {
  botUsername = me.username || "";
  console.log(`Bot started as @${botUsername}`);
});

function extractCommand(text: string, botName: string): string | null {
  if (botName) {
    const withMention = text.match(
      new RegExp(`^\\/(\\w+)@${botName}(?:\\s|$)`, "i")
    );
    if (withMention) return withMention[1].toLowerCase();
  }
  const plain = text.match(/^\/(\w+)/);
  return plain ? plain[1].toLowerCase() : null;
}

async function send(chatId: number, text: string) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: "HTML" });
  } catch (err) {
    console.error(`Failed to send to ${chatId}:`, err);
  }
}

async function handleUpdate(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const command = extractCommand(text, botUsername);
  if (!command) return;

  const title =
    msg.chat.title ||
    (msg.chat.username ? `@${msg.chat.username}` : String(chatId));

  console.log(`Command: /${command} in "${title}" (${chatId})`);

  if (command === "start") {
    const existing = await getChannel(chatId);
    if (existing?.active) {
      await send(chatId, Message.alreadySubscribed);
      return;
    }
    await subscribeChannel(chatId, title);
    await send(chatId, Message.subscribed);
  } else if (command === "stop") {
    const existing = await getChannel(chatId);
    if (!existing || !existing.active) {
      await send(chatId, Message.alreadyUnsubscribed);
      return;
    }
    await unsubscribeChannel(chatId);
    await send(chatId, Message.unsubscribed);
  } else if (command === "preview") {
    const channel = await getChannel(chatId);
    const level = channel?.level || "C2";
    await send(chatId, Message.generating);
    try {
      const type: ContentType = Math.random() < 0.5 ? getMorningType() : getEveningType();
      const index = await peekIndex(level, type);
      const { content } = generateContent(type, level, index);
      await send(chatId, content);
    } catch (err) {
      console.error("Preview generation error:", err);
      await send(chatId, Message.errorGenerating);
    }
  } else if (command === "status") {
    const channel = await getChannel(chatId);
    await send(chatId, Message.status(channel?.active ?? false));
  } else if (command === "help") {
    await send(chatId, Message.help);
  }
}

// Auto-subscribe/unsubscribe when bot is added to or removed from a chat
bot.on("my_chat_member", async (update) => {
  const { chat, new_chat_member } = update;
  const chatId = chat.id;
  const title = chat.title || String(chatId);
  const status = new_chat_member.status;

  if (status === "administrator" || status === "member") {
    console.log(`Bot added to "${title}" (${chatId}) as ${status}`);
    await subscribeChannel(chatId, title);
    await send(chatId, Message.autoSubscribed(title));
  } else if (status === "left" || status === "kicked") {
    console.log(`Bot removed from "${title}" (${chatId})`);
    await unsubscribeChannel(chatId);
  }
});

bot.on("message", handleUpdate);
bot.on("channel_post", handleUpdate);

async function sendDailyContent(session: "morning" | "evening") {
  const channels = await getActiveChannels();
  if (channels.length === 0) {
    console.log(`No active channels for ${session} session.`);
    return;
  }

  const type = session === "morning" ? getMorningType() : getEveningType();

  // Group by level — one post generated per unique level
  const byLevel = new Map<string, number[]>();
  for (const ch of channels) {
    const ids = byLevel.get(ch.level) || [];
    ids.push(ch.id);
    byLevel.set(ch.level, ids);
  }

  for (const [level, ids] of byLevel) {
    console.log(
      `Sending ${session} ${type} [${level}] to ${ids.length} channel(s)...`
    );
    try {
      const index = await getAndIncrementIndex(level, type);
      const { content, topic } = generateContent(type, level, index);
      for (const chatId of ids) {
        await send(chatId, content);
      }
      console.log(`✅ ${session} ${type} [${level}] #${index} "${topic}" → ${ids.length} channel(s)`);
    } catch (err) {
      console.error(`Error sending ${type} for level ${level}:`, err);
    }
  }
}

async function main() {
  await initDb();
  console.log("Database initialized ✅");

  await bot.setMyCommands([
    { command: "start", description: "Subscribe to daily posts" },
    { command: "stop", description: "Unsubscribe from daily posts" },
    { command: "preview", description: "Get a sample post right now" },
    { command: "status", description: "Show subscription status" },
    { command: "help", description: "Show all commands" },
  ]);
  console.log("Bot commands registered ✅");

  // 9:00 AM Kyiv time
  cron.schedule("0 9 * * *", () => sendDailyContent("morning"), {
    timezone: "Europe/Kiev",
  });

  // 6:00 PM Kyiv time
  cron.schedule("0 18 * * *", () => sendDailyContent("evening"), {
    timezone: "Europe/Kiev",
  });

  console.log("Scheduler: 9:00 AM & 6:00 PM Kyiv time ✅");
  console.log("Bot is running 🚀");
}

main().catch(console.error);
