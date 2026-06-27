export const Message = {
  hello: `👋 <b>Hello!</b>\n\nI'm <b>Daily English Bot</b> — I send daily English lessons: grammar tips, words of the day, phrases, and quizzes!\n\nUse /help to see all commands.`,

  help: `📚 <b>Commands:</b>\n\n/start — Subscribe to daily posts\n/stop — Unsubscribe\n/level — Set English level (e.g. <code>/level B2</code>)\n/preview — Get a sample post right now\n/status — Show subscription status\n/help — Show this message`,

  subscribed: `✅ <b>Subscribed!</b>\n\nYou'll receive daily English lessons at <b>9:00 AM</b> and <b>6:00 PM</b> Kyiv time.\n\nDefault level: <b>C2</b> (Proficient). Change it with:\n<code>/level A1|A2|B1|B2|C1|C2</code>`,

  alreadySubscribed: `✅ Already subscribed! Use /stop to unsubscribe or /level to change the English level.`,

  unsubscribed: `🔴 <b>Unsubscribed.</b> Daily posts stopped. Use /start to subscribe again.`,

  alreadyUnsubscribed: `Already not subscribed. Use /start to subscribe.`,

  levelUpdated: (level: string) =>
    `✅ Level updated to <b>${level}</b>. Next posts will match this level.`,

  invalidLevel: `❌ Invalid level. Choose from: <code>A1 A2 B1 B2 C1 C2</code>\n\nExample: <code>/level B2</code>`,

  status: (active: boolean, level: string) =>
    active
      ? `🟢 <b>Active</b> — daily posts at 9:00 AM &amp; 6:00 PM Kyiv time\n📊 Level: <b>${level}</b>`
      : `🔴 <b>Inactive</b> — use /start to subscribe`,

  notSubscribed: `Not subscribed yet. Use /start first.`,

  generating: `⏳ Generating content...`,

  errorGenerating: `❌ Failed to generate content. Please try again later.`,

  autoSubscribed: (title: string) =>
    `👋 <b>Hello, ${title}!</b>\n\nI'm subscribed and will send daily English lessons at <b>9:00 AM</b> and <b>6:00 PM</b> Kyiv time.\n\nDefault level: <b>C2</b> (Proficient). Change with <code>/level B1</code> (or <code>/level@botname B1</code> in channels).`,
};
