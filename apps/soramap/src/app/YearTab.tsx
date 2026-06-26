// 振り返り年表タブ(SPEC §A2 W5)。firstDate 年別に登頂した山を一覧表示。
import type { Climb, MountainMeta } from "../domain/types";
import { THEME } from "../domain/theme";

type Props = {
  meta: MountainMeta;
  visits: Record<string, Climb>;
  onSelect: (id: string, name: string) => void;
};

type Entry = { id: string; name: string; pref: string };
type MonthGroup = { month: string; entries: Entry[] };
type YearGroup = { year: string; months: MonthGroup[] };

function buildYearGroups(meta: MountainMeta, visits: Record<string, Climb>): {
  groups: YearGroup[];
  undated: Entry[];
} {
  const byYearMonth: Record<string, Record<string, Entry[]>> = {};
  const undated: Entry[] = [];

  for (const [id, v] of Object.entries(visits)) {
    const info = meta.points[id];
    if (!info) continue;
    const entry = { id, name: info.name, pref: info.pref };
    if (v.firstDate) {
      const year = v.firstDate.slice(0, 4);
      const month = v.firstDate.slice(5, 7);
      ((byYearMonth[year] ??= {})[month] ??= []).push(entry);
    } else {
      undated.push(entry);
    }
  }

  const sort = (arr: Entry[]) =>
    arr.sort((a, b) => a.pref.localeCompare(b.pref, "ja") || a.name.localeCompare(b.name, "ja"));

  const groups: YearGroup[] = Object.keys(byYearMonth)
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({
      year,
      months: Object.keys(byYearMonth[year])
        .sort((a, b) => Number(b) - Number(a))
        .map((month) => ({ month, entries: sort(byYearMonth[year][month]) })),
    }));

  return { groups, undated: sort(undated) };
}

const dot = (
  <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: THEME }} />
);

function EntryList({ entries, onSelect }: { entries: Entry[]; onSelect: (id: string, name: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.id, e.name)}
          className="flex items-center gap-1 rounded-lg bg-[#1e2530] px-2 py-1 text-xs text-[#e8ecf4] hover:bg-[#262d3a] transition-colors"
        >
          {dot}
          {e.name}
        </button>
      ))}
    </div>
  );
}

export function YearTab({ meta, visits, onSelect }: Props) {
  const { groups, undated } = buildYearGroups(meta, visits);
  const total = Object.keys(visits).length;

  if (total === 0) {
    return (
      <div className="absolute inset-0 top-[88px] flex items-center justify-center text-sm text-[#8b93a3]">
        地図やリストから登頂を記録しよう
      </div>
    );
  }

  return (
    <div className="absolute inset-0 top-[88px] overflow-y-auto pb-4">
      <div className="mx-auto max-w-md space-y-6 px-4 pt-4">
        {groups.map(({ year, months }) => (
          <section key={year}>
            <h2 className="mb-2 text-lg font-bold text-emerald-300">{year}年</h2>
            <div className="space-y-4">
              {months.map(({ month, entries }) => (
                <div key={month}>
                  <div className="mb-1 flex items-baseline gap-2">
                    <h3 className="text-sm font-semibold text-[#e8ecf4]">{Number(month)}月</h3>
                    <span className="text-xs text-[#8b93a3]">{entries.length}座</span>
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
              <span className="text-xs text-[#8b93a3]">{undated.length}座</span>
            </div>
            <EntryList entries={undated} onSelect={onSelect} />
          </section>
        )}
      </div>
    </div>
  );
}
