export const Message = {
  help: `📚 <b>Commands:</b>\n\n/start — Subscribe to daily posts\n/stop — Unsubscribe\n/preview — Get a sample post right now\n/status — Show subscription status\n/help — Show this message`,

  subscribed: `✅ <b>Subscribed!</b>\n\nYou'll receive daily English lessons at <b>9:00 AM</b> and <b>6:00 PM</b> Kyiv time.`,

  alreadySubscribed: `✅ Already subscribed! Use /stop to unsubscribe.`,

  unsubscribed: `🔴 <b>Unsubscribed.</b> Daily posts stopped. Use /start to subscribe again.`,

  alreadyUnsubscribed: `Already not subscribed. Use /start to subscribe.`,

  status: (active: boolean) =>
    active
      ? `🟢 <b>Active</b> — daily posts at 9:00 AM &amp; 6:00 PM Kyiv time`
      : `🔴 <b>Inactive</b> — use /start to subscribe`,

  generating: `⏳ Generating content...`,

  errorGenerating: `❌ Failed to generate content. Please try again later.`,

  autoSubscribed: (title: string) =>
    `👋 <b>Hello, ${title}!</b>\n\nSubscribed! Daily English lessons will arrive at <b>9:00 AM</b> and <b>6:00 PM</b> Kyiv time.`,
};
