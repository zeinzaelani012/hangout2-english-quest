// One-off audit: every writing activity across all units x levels, as the
// learner actually receives it (post applyD2). Flags any typed item with NO
// stimulus — no tiles/words, no audio, no img, no wrong-sentence display —
// which is the "students don't know what to write" class.
import { units } from '../src/data/units';
import type { Activity } from '../src/types';

interface Row {
  unit: number;
  level: string;
  activityId: string;
  type: string;
  prompt: string;
  problems: string[];
  itemDetail: string;
}

const rows: Row[] = [];

const payloadItems = (a: Activity): any[] => {
  const p = a.payload as any;
  if (Array.isArray(p?.items)) return p.items;
  return [];
};

for (const unit of units) {
  for (const level of ['easy', 'core', 'challenging'] as const) {
    const acts: Activity[] = [...(unit.levels[level] ?? []), ...(unit.bossActivities[level] ?? [])];
    for (const a of acts) {
      if (a.skill !== 'writing') continue;
      const items = payloadItems(a);
      const problems: string[] = [];
      const detail: string[] = [];

      if (a.type === 'diaryPrompt' || a.type === 'guidedParagraph') {
        const p = a.payload as any;
        const hasChart = !!(p?.chart || p?.menu);
        const hasStarters = !!(p?.starters || p?.sentenceStarters);
        const picker = !!(p?.chooseSeason || p?.chooseRoom);
        // Free production is scaffolded by the template sentence, the
        // requirements list, the checklist, or any of the structured supports.
        if (!hasChart && !hasStarters && !picker && !p?.template && !(Array.isArray(p?.requirements) && p.requirements.length)) {
          problems.push('no template/requirements/chart/starters/picker');
        }
        detail.push(`chart=${!!p?.chart} menu=${!!p?.menu} starters=${hasStarters} picker=${picker} template=${!!p?.template} reqs=${p?.requirements?.length ?? 0} checklist=${p?.checklist?.length ?? 0} minWords=${p?.minimumWords ?? '-'}`);
      } else if (Array.isArray(items) && items.length > 0) {
        for (const it of items) {
          const tiles = Array.isArray(it.tiles) || Array.isArray(it.words);
          const stimulus =
            tiles || it.audio || it.img || (a.type === 'sentenceRepair' && it.wrong) || it.sentence || it.q;
          if (!stimulus) {
            problems.push(`item ${it.id ?? '?'}: NO stimulus (tiles=${tiles} audio=${!!it.audio} img=${!!it.img})`);
          }
          detail.push(
            `${it.id}: tiles=${tiles ? (it.tiles ?? it.words).length : 'n'} audio=${!!it.audio} img=${!!it.img} prompt="${(it.prompt ?? '').slice(0, 40)}"`,
          );
        }
      } else {
        problems.push('no items array');
      }

      rows.push({
        unit: unit.id,
        level,
        activityId: a.id,
        type: a.type,
        prompt: (a.prompt ?? '').slice(0, 60),
        problems,
        itemDetail: detail.join(' | '),
      });
    }
  }
}

let flagged = 0;
for (const r of rows) {
  const flag = r.problems.length > 0;
  if (flag) flagged++;
  console.log(
    `${flag ? '!!' : '  '} U${r.unit} ${r.level.padEnd(11)} ${r.activityId.padEnd(22)} ${r.type.padEnd(14)} "${r.prompt}"`,
  );
  console.log(`     ${r.itemDetail}`);
  for (const p of r.problems) console.log(`     PROBLEM: ${p}`);
}
console.log(`\n${rows.length} writing activities audited, ${flagged} flagged.`);
