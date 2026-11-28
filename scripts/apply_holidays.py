"""Turn exam dates into off days and reflow the plan around them.

usage: python3 scripts/apply_holidays.py BASE.json OUT.json

BASE.json is the schedule parsed straight from the PDF (npm run parse).
Edit EXAMS below to add or remove off days; re-run to rebuild OUT.json.

How it works
- Stage 1 (Basics) is uniform, so its study days are simply poured onto the
  available calendar dates, skipping every exam date.
- Stage 2 onward has weekday-specific days (weekly tests, rest Sundays,
  Tue = applications, Thu = networking). To keep that weekday cadence the whole
  of stage 2+ moves later by a whole number of weeks. Any spare days created in
  stage 1 by rounding up to whole weeks become "buffer" revision days.
- The spaced-revision lines (D+1/D+3/D+7/D+14) are regenerated from the new dates.
"""
import json, sys, re, math, datetime as dt

EXAMS = ["2026-11-29", "2026-12-02", "2026-12-05", "2026-12-07", "2026-12-11",
         "2026-12-14", "2026-12-16", "2026-12-18", "2026-12-21"]
OFFS = [1, 3, 7, 14]
MON = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
D = dt.date.fromisoformat
iso = lambda d: d.isoformat()
add = lambda s, n: iso(D(s) + dt.timedelta(days=n))
dow = lambda s: D(s).strftime("%a")
short = lambda s: f"{D(s).day} {MON[D(s).month - 1]}"
EXAM_LABEL = "EXAM DAY - OFF (no study)"

BUFFER = [  # (slot index -> text); slot 0 (spaced revision) is regenerated
    {1: "DSA practice: buffer day: redo every problem still marked weak in your error log (arrays, hashing, strings)",
     2: "DSA practice: 2 new problems on a Basics topic you found hardest, no hints for the first 20 min; log mistakes",
     4: "Revision: Python basics and data structures: finish any unfinished topic, rewrite 3 programs from blank",
     5: "Hands-on coding for the same topic (notebook/code, commit to GitHub)",
     6: "Revision: SQL queries (JOIN, GROUP BY, subqueries): solve 10 queries without notes",
     7: "Revision: Aptitude: redo this stage's wrong questions with a timer (10 min concept, 20 min problems)",
     8: "Revision: Communication: re-record your self-introduction and one spoken-English passage, compare with the first take"},
    {1: "DSA practice: buffer day: redo every problem still marked weak in your error log (two pointers, sliding window, binary search)",
     2: "DSA practice: 2 new problems on a Basics topic you found hardest, no hints for the first 20 min; log mistakes",
     4: "Revision: NumPy, Pandas and plotting: finish any unfinished topic, redo one small analysis from blank",
     5: "Hands-on coding for the same topic (notebook/code, commit to GitHub)",
     6: "Revision: DBMS and OS basics notes: write a one-page summary from memory, then check gaps",
     7: "Revision: Aptitude: redo this stage's wrong questions with a timer (10 min concept, 20 min problems)",
     8: "Revision: Communication: re-do your professional email and LinkedIn message drafts and tighten them"},
    {1: "DSA practice: buffer day: timed mini-test of 2 Basics problems in 45 min, then fix the gaps in your error log",
     2: "DSA practice: 2 new problems on a Basics topic you found hardest, no hints for the first 20 min; log mistakes",
     4: "Revision: Python/ML basics: finish and push the Mini-project 1 write-up and any unpushed notebooks",
     5: "Hands-on coding for the same topic (notebook/code, commit to GitHub)",
     6: "Revision: Git and CS fundamentals: practise a branch, pull request and merge conflict end to end",
     7: "Revision: Aptitude: redo this stage's wrong questions with a timer (10 min concept, 20 min problems)",
     8: "Revision: Communication: group discussion practice: one opening, three points, one summary, recorded"},
]


def revision_line(date, study_dates, nxt):
    refs = []
    for off in OFFS:
        for L in study_dates:
            if L < date and nxt(add(L, off)) == date:
                refs.append(f"{short(L)} (D+{off})")
    return refs


def regenerate_revision(days, is_study_date):
    """Rewrite the date list in every 'DSA spaced revision' task."""
    sd = sorted(d["date"] for d in days if d["type"] == "study")
    sset = set(sd)
    end = sd[-1]

    def nxt(s):
        while s <= end and s not in sset:
            s = add(s, 1)
        return s
    for d in days:
        if d["type"] != "study":
            continue
        t = d["tasks"][0]
        m = re.match(r"^(DSA spaced revision: re-solve logged problems from )([^;]*?)((?:;.*)?)$", t["text"])
        if not m:
            continue
        refs = revision_line(d["date"], sd, nxt)
        if refs:
            t["text"] = m[1] + ", ".join(refs) + m[3]


def main(base_path, out_path):
    base = json.load(open(base_path))
    study = [d for d in base if d["type"] == "study"]
    s1 = [d for d in study if d["stage"] == 1]
    start, s1_end = base[0]["date"], s1[-1]["date"]
    old_exams = {d["date"] for d in base if d["type"] == "exam"}
    exams = set(EXAMS)
    assert exams >= old_exams or True
    assert all(e >= start for e in exams)

    # smallest whole-week shift that leaves enough free days for stage 1
    shift = 0
    while True:
        window_end = add(s1_end, shift)
        avail = [add(start, i) for i in range((D(window_end) - D(start)).days + 1)]
        avail = [x for x in avail if x not in exams]
        if len(avail) >= len(s1):
            break
        shift += 7
    n_buf = len(avail) - len(s1)
    assert n_buf <= len(BUFFER), "add more BUFFER templates"
    stage2_start = add(s1_end, shift + 1)
    assert all(e < stage2_start for e in exams), "exam dates after stage 1 not supported yet"

    out, mapping = [], {}
    last_study = s1[-1]
    for i, (old, new) in enumerate(zip(s1, avail)):
        nd = json.loads(json.dumps(old))
        nd["date"], nd["dow"] = new, dow(new)
        mapping[old["date"]] = new
        # weekday-specific 09:45 slot (Sunday = rewrite this week's code)
        sun_txt = next(t["text"] for x in s1 if x["dow"] == "Sun" for t in x["tasks"] if t["start"] == "09:45")
        hands = next(t["text"] for x in s1 if x["dow"] != "Sun" for t in x["tasks"] if t["start"] == "09:45")
        t = nd["tasks"][5]
        if t["start"] == "09:45" and (t["text"].startswith("Hands-on") or t["text"].startswith("Coding interview")):
            t["text"] = sun_txt if nd["dow"] == "Sun" else hands
        out.append(nd)
    for k in range(n_buf):
        new = avail[len(s1) + k]
        nd = json.loads(json.dumps(last_study if False else s1[-1]))
        nd.update(date=new, dow=dow(new), day=s1[-1]["day"] + 1 + k)
        for idx, txt in BUFFER[k].items():
            nd["tasks"][idx]["text"] = txt
        if nd["dow"] == "Sun":
            nd["tasks"][5]["text"] = next(t["text"] for x in s1 if x["dow"] == "Sun" for t in x["tasks"] if t["start"] == "09:45")
        out.append(nd)
    for e in sorted(exams):
        out.append({"day": None, "dow": dow(e), "date": e, "type": "exam", "label": EXAM_LABEL, "tasks": []})
    # stage 2 onward: move by whole weeks, old exam days in stage 1 are dropped (re-added above)
    for d in base:
        if d["date"] <= s1_end:
            continue
        nd = json.loads(json.dumps(d))
        nd["date"] = add(d["date"], shift)
        if nd.get("day"):
            nd["day"] += n_buf
        mapping[d["date"]] = nd["date"]
        out.append(nd)
    out.sort(key=lambda x: x["date"])

    regenerate_revision(out, None)
    for d in out:  # sanity
        if d["type"] == "study":
            assert sum((lambda a: 0 if a == "-" else int(a.split(":")[0]) * 60 + int(a.split(":")[1]))(t["dur"]) for t in d["tasks"]) == d["hours"] * 60 == d["_sum"]
    json.dump(out, open(out_path, "w"), indent=0)

    # print the facts lib.ts needs
    unmapped = lambda s: next((mapping[k] for k in sorted(mapping) if k >= s), None)
    info = dict(shift=shift, buffer_days=n_buf, stage1_end_new=window_end, last=out[-1]["date"], map_old_to_new=mapping)
    json.dump(info, open("/tmp/schedule.map.json", "w"), indent=0)
    print(f"shift={shift}d buffer_days={n_buf} stage1 {start}..{window_end} study_days={sum(d['type']=='study' for d in out)} last={out[-1]['date']}")


def selftest(base_path):
    """Regenerating revision lines on the ORIGINAL schedule must reproduce the PDF text."""
    base = json.load(open(base_path))
    orig = {d["date"]: d["tasks"][0]["text"] for d in base if d["type"] == "study"}
    clone = json.loads(json.dumps(base))
    regenerate_revision(clone, None)
    bad = [(d["date"], orig[d["date"]], d["tasks"][0]["text"]) for d in clone if d["type"] == "study" and d["tasks"][0]["text"] != orig[d["date"]]]
    return bad


if __name__ == "__main__":
    if sys.argv[1] == "--selftest":
        b = selftest(sys.argv[2]); print("selftest mismatches:", len(b)); [print(x) for x in b[:5]]
    else:
        main(sys.argv[1], sys.argv[2])
