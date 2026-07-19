import { languageColor } from '../../lib/languageColors';

/**
 * The "language fingerprint" — a proportional stacked bar of a student's
 * GitHub language mix. This is the platform's signature visual: at a glance,
 * an HR reviewer sees not just *that* someone codes, but the shape of how.
 */
export function LanguageFingerprint({
  topLanguages,
  compact = false,
}: {
  topLanguages: Record<string, number>;
  compact?: boolean;
}) {
  const entries = Object.entries(topLanguages || {}).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (!entries.length || total === 0) {
    return (
      <div className="flex h-2 w-full items-center overflow-hidden rounded-full bg-[var(--color-line)]">
        <span className="sr-only">No GitHub language data synced yet</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
        {entries.map(([lang, pct]) => (
          <div
            key={lang}
            style={{ width: `${(pct / total) * 100}%`, backgroundColor: languageColor(lang) }}
            title={`${lang} — ${pct.toFixed(1)}%`}
          />
        ))}
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {entries.slice(0, 4).map(([lang, pct]) => (
            <span key={lang} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: languageColor(lang) }}
              />
              {lang}
              <span className="font-mono-data text-[11px]">{pct.toFixed(0)}%</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
