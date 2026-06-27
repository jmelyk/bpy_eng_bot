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

function eligibleWords(level: string) {
  const rank = levelRank[level] ?? 6;
  return words.filter((w) => (levelRank[w.level] ?? 6) <= rank);
}

function eligiblePhrases(level: string) {
  const rank = levelRank[level] ?? 6;
  return phrases.filter((p) => (levelRank[p.level] ?? 6) <= rank);
}

export function listLength(type: ContentType, level: string): number {
  return type === "word"
    ? eligibleWords(level).length
    : eligiblePhrases(level).length;
}

function formatWord(level: string, index: number): GeneratedContent {
  const list = eligibleWords(level);
  const entry = list[index % list.length];
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

function formatPhrase(level: string, index: number): GeneratedContent {
  const list = eligiblePhrases(level);
  const entry = list[index % list.length];
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
  index: number = 0
): GeneratedContent {
  return type === "word"
    ? formatWord(level, index)
    : formatPhrase(level, index);
}

export function getMorningType(): ContentType {
  return "word";
}

export function getEveningType(): ContentType {
  return "phrase";
}
