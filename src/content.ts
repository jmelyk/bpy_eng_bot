import { words } from "./data/words";
import { phrases } from "./data/phrases";

export type ContentType = "word" | "phrase";

export const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const levelRank: Record<string, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6,
};

export interface GeneratedContent {
  content: string;
  topic: string;
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

function pickByDay<T extends { level: string }>(
  items: T[],
  level: string,
  offset = 0
): T {
  const rank = levelRank[level] ?? 6;
  const eligible = items.filter((item) => (levelRank[item.level] ?? 6) <= rank);
  const index = (getDayOfYear() + offset) % eligible.length;
  return eligible[index];
}

function formatWord(level: string): GeneratedContent {
  const entry = pickByDay(words, level, 0);
  const syn = entry.synonym ? `\n<b>Synonym:</b> ${entry.synonym}` : "";
  const ant = entry.antonym ? `　<b>Antonym:</b> ${entry.antonym}` : "";
  const content =
    `📖 <b>Word of the Day</b>\n\n` +
    `<b>${entry.word}</b> <i>(${entry.pos})</i>\n\n` +
    `<i>${entry.definition}</i>\n\n` +
    `<b>Examples:</b>\n` +
    `• ${entry.examples[0]}\n` +
    `• ${entry.examples[1]}` +
    `${syn}${ant}`;
  return { content, topic: entry.word };
}

function formatPhrase(level: string): GeneratedContent {
  // Offset by 180 so word and phrase pick different items from their respective lists
  const entry = pickByDay(phrases, level, 180);
  const content =
    `💬 <b>Phrase of the Day</b>\n\n` +
    `<b>${entry.phrase}</b>\n\n` +
    `<i>${entry.meaning}</i>\n\n` +
    `<b>Examples:</b>\n` +
    `• ${entry.examples[0]}\n` +
    `• ${entry.examples[1]}\n\n` +
    `🏷 <b>Register:</b> ${entry.register}`;
  return { content, topic: entry.phrase };
}

export function generateContent(
  type: ContentType,
  level: string = "C2",
  _recentTopics: string[] = []
): GeneratedContent {
  return type === "word" ? formatWord(level) : formatPhrase(level);
}

export function getMorningType(_dayOfWeek: number): ContentType {
  return "word";
}

export function getEveningType(_dayOfWeek: number): ContentType {
  return "phrase";
}
