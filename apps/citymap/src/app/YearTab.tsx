// 振り返り年表タブ(SPEC §A1 W5)。firstDate 年別に塗った自治体を一覧表示。
import type { CityMeta, Visit } from "../domain/types";
import { LEVELS } from "../domain/levels";

type Props = {
  meta: CityMeta;
  visits: Record<string, Visit>;
  onSelect: (cityId: string, name: string) => void;
};

type Entry = { cityId: string; name: string; pref: string; level: number };
type MonthGroup = { month: string; entries: Entry[] };
type YearGroup = { year: string; months: MonthGroup[] };

function buildYearGroups(meta: CityMeta, visits: Record<string, Visit>): {
  groups: YearGroup[];
  undated: Entry[];
} {
  const byYearMonth: Record<string, Record<string, Entry[]>> = {};
  const undated: Entry[] = [];

  for (const [cityId, v] of Object.entries(visits)) {
    const info = meta.cities[cityId];
    if (!info) continue;
    const entry = { cityId, name: info.name, pref: info.pref, level: v.level };
    if (v.firstDate) {
      const year = v.firstDate.slice(0, 4);
      const month = v.firstDate.slice(5, 7);
      ((byYearMonth[year] ??= {})[month] ??= []).push(entry);
    } else {
      undated.push(entry);
    }
  }

  // 都道府県→名前順でソート
  const sort = (arr: Entry[]) =>
    arr.sort((a, b) => a.pref.localeCompare(b.pref) || a.name.localeCompare(b.name));

  const groups: YearGroup[] = Object.keys(byYearMonth)
    .sort((a, b) => Number(b) - Number(a)) // 新しい年が上
    .map((year) => ({
      year,
      months: Object.keys(byYearMonth[year])
        .sort((a, b) => Number(b) - Number(a)) // 新しい月が上
        .map((month) => ({ month, entries: sort(byYearMonth[year][month]) })),
    }));

  return { groups, undated: sort(undated) };
}

const levelDot = (level: number) => {
  const c = LEVELS[level]?.color ?? "#1a1f2a";
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: c }}
      title={LEVELS[level]?.label}
    />
  );
};

type EntryListProps = {
  entries: Entry[];
  onSelect: (id: string, name: string) => void;
};

function EntryList({ entries, onSelect }: EntryListProps) {
  // 都道府県ごとにまとめる
  const byPref: Record<string, typeof entries> = {};
  for (const e of entries) {
    (byPref[e.pref] ??= []).push(e);
  }

  return (
    <div className="space-y-2">
      {Object.entries(byPref).map(([pref, cities]) => (
        <div key={pref}>
          <p className="mb-1 text-[11px] text-[#8b93a3]">{pref}</p>
          <div className="flex flex-wrap gap-1.5">
            {cities.map((c) => (
              <button
                key={c.cityId}
                onClick={() => onSelect(c.cityId, c.name)}
                className="flex items-center gap-1 rounded-lg bg-[#1e2530] px-2 py-1 text-xs text-[#e8ecf4] hover:bg-[#262d3a] transition-colors"
              >
                {levelDot(c.level)}
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function YearTab({ meta, visits, onSelect }: Props) {
  const { groups, undated } = buildYearGroups(meta, visits);
  const total = Object.keys(visits).length;

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#8b93a3]">
        地図をタップして自治体を記録しよう
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto pb-4 pt-[var(--scorebar-h,160px)]">
      <div className="mx-auto max-w-md space-y-6 px-4 pt-4">
        {groups.map(({ year, months }) => (
          <section key={year}>
            <h2 className="mb-2 text-lg font-bold text-cyan-300">{year}年</h2>
            <div className="space-y-4">
              {months.map(({ month, entries }) => (
                <div key={month}>
                  <div className="mb-1 flex items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-[#e8ecf4]">{Number(month)}月</h3>
                    <span className="text-xs text-[#8b93a3]">{entries.length}自治体</span>
                  </div>
                  <EntryList entries={entries} onSelect={onSelect} />
                </div>
              ))}
            </div>
          </section>
        ))}

        {undated.length > 0 && (
          <section>
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-[#8b93a3]">日付不明</h2>
              <span className="text-xs text-[#8b93a3]">{undated.length}自治体</span>
            </div>
            <EntryList entries={undated} onSelect={onSelect} />
          </section>
        )}
      </div>
    </div>
  );
}
