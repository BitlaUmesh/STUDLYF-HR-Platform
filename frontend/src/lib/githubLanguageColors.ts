// Approximate GitHub "linguist" colors for common languages, used to color the
// language bars on student profiles. Falls back to the app's primary purple
// for anything not in the list.

export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  Vue: "#41b883",
  Elixir: "#6e4a7e",
  Scala: "#c22d40",
  Solidity: "#AA6746",
  R: "#198CE7",
  Lua: "#000080",
};

export function getLanguageColor(language: string, fallback = "var(--primary)"): string {
  return LANGUAGE_COLORS[language] || fallback;
}
