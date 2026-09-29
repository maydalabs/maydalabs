/** Calendar checks for explicit Gregorian dates, with no clock or locale parsing.
 * Supported: full EN/TR/FR month names (day-first; English also month-first),
 * ISO YYYY-MM-DD, and adjacent full weekday names before or after the date.
 * Relative dates, missing years, slash dates and abbreviations are not inferred.
 * An empty result means no detected issue in these formats, not verified prose.
 * The original text is never changed; callers decide whether to refuse a draft.
 */
export type ReviewDateIssue = {
  code: "weekday_mismatch" | "invalid_date";
  start: number;
  end: number;
  text: string;
  date: string;
  statedWeekday: string | null;
  expectedWeekday: string | null;
};

type Language = "en" | "tr" | "fr";
const months: Record<Language, readonly string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
};
const weekdays: Record<Language, readonly string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  tr: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
};
const fold = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i");
const monthNames = new Map<string, { month: number; language: Language }>();
const weekdayNames = new Map<string, { day: number; language: Language }>();
for (const language of ["en", "tr", "fr"] as const) {
  months[language].forEach((name, index) => monthNames.set(fold(name), { month: index + 1, language }));
  weekdays[language].forEach((name, day) => weekdayNames.set(fold(name), { day, language }));
}

// The bounded token class also admits ASCII spellings of accented names. Every
// token must resolve through the dictionary; no Date.parse or fuzzy matching.
const letters = "A-Za-zÀ-ž";
type DateMention = { start: number; end: number; year: number; month: number; day: number };
type WeekdayMention = { start: number; end: number; text: string; day: number; language: Language };

function calendarDay(year: number, month: number, day: number): number | null {
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  // setUTCFullYear avoids Date.UTC's special treatment of years 0–99.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.getUTCDay();
}

function adjacentWeekdays(text: string, mention: DateMention): WeekdayMention[] {
  const results: WeekdayMention[] = [];
  const prefixStart = Math.max(0, mention.start - 40);
  const before = text.slice(prefixStart, mention.start);
  const preceding = new RegExp(`(?:^|[^${letters}0-9])([${letters}]{3,12})(?:[ \\t]+|,[ \\t]*)(?:le[ \\t]+)?$`, "i").exec(before);
  if (preceding) {
    const weekday = weekdayNames.get(fold(preceding[1]));
    if (weekday) {
      const start = prefixStart + preceding.index + preceding[0].indexOf(preceding[1]);
      if (start === 0 || !new RegExp(`[${letters}0-9]`).test(text[start - 1])) {
        results.push({ ...weekday, start, end: start + preceding[1].length, text: preceding[1] });
      }
    }
  }
  const after = text.slice(mention.end, mention.end + 40);
  const following = new RegExp(`^(?:[ \\t]+|,[ \\t]*|[ \\t]*\\([ \\t]*)([${letters}]{3,12})(?=$|[^${letters}0-9])`, "i").exec(after);
  if (following) {
    const weekday = weekdayNames.get(fold(following[1]));
    if (weekday) {
      const start = mention.end + following[0].indexOf(following[1]);
      results.push({ ...weekday, start, end: start + following[1].length, text: following[1] });
    }
  }
  return results;
}

export function findReviewDateIssues(text: string): ReviewDateIssue[] {
  const mentions: DateMention[] = [];
  const boundary = `(^|[^${letters}0-9])`;
  const end = `(?=$|[^${letters}0-9])`;
  const formats = [
    { regex: new RegExp(`${boundary}(\\d{1,2})(?:st|nd|rd|th|er)?[ \\t]+([${letters}]{3,12})[ \\t]+(\\d{4})${end}`, "gi"), order: "day-first" },
    { regex: new RegExp(`${boundary}([${letters}]{3,12})[ \\t]+(\\d{1,2})(?:st|nd|rd|th)?(?:,[ \\t]*|[ \\t]+)(\\d{4})${end}`, "gi"), order: "month-first" },
    { regex: new RegExp(`${boundary}(\\d{4})-(\\d{2})-(\\d{2})${end}`, "g"), order: "iso" },
  ] as const;
  for (const { regex, order } of formats) {
    for (const match of text.matchAll(regex)) {
      const monthName = order === "iso" ? null : monthNames.get(fold(match[order === "day-first" ? 3 : 2]));
      if (order !== "iso" && (!monthName || (order === "month-first" && monthName.language !== "en"))) continue;
      mentions.push({
        start: match.index! + match[1].length,
        end: match.index! + match[0].length,
        year: Number(match[order === "iso" ? 2 : 4]),
        month: order === "iso" ? Number(match[3]) : monthName!.month,
        day: Number(match[order === "day-first" ? 2 : order === "month-first" ? 3 : 4]),
      });
    }
  }

  const issues: ReviewDateIssue[] = [];
  for (const mention of mentions.sort((a, b) => a.start - b.start)) {
    const actualDay = calendarDay(mention.year, mention.month, mention.day);
    const date = `${String(mention.year).padStart(4, "0")}-${String(mention.month).padStart(2, "0")}-${String(mention.day).padStart(2, "0")}`;
    const adjacent = adjacentWeekdays(text, mention);
    if (actualDay === null) {
      const start = Math.min(mention.start, ...adjacent.map((weekday) => weekday.start));
      const end = Math.max(mention.end, ...adjacent.map((weekday) => weekday.end));
      issues.push({ code: "invalid_date", start, end, text: text.slice(start, end), date, statedWeekday: adjacent[0]?.text ?? null, expectedWeekday: null });
      continue;
    }
    for (const weekday of adjacent) {
      if (weekday.day === actualDay) continue;
      const start = Math.min(mention.start, weekday.start);
      const end = Math.max(mention.end, weekday.end);
      issues.push({ code: "weekday_mismatch", start, end, text: text.slice(start, end), date, statedWeekday: weekday.text, expectedWeekday: weekdays[weekday.language][actualDay] });
    }
  }
  return issues;
}
