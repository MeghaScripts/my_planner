import re, json, subprocess, sys
src = sys.argv[1]; out = sys.argv[2]
txt = subprocess.run(["pdftotext","-layout",src,"-"],capture_output=True,text=True).stdout
MON = {m:i+1 for i,m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split())}
hdr = re.compile(r'^\s*Day (\d+) \| (\w{3}), (\d\d) (\w{3}) (\d{4})\s+Stage (\d): (.+?) \| (\d+) study hrs\s*$')
off = re.compile(r'^\s*(\w{3}), (\d\d) (\w{3}) (\d{4})\s+(EXAM DAY.*|REST DAY.*?)\s*$')
row = re.compile(r'^\s*(\d\d:\d\d)-(\d\d:\d\d)\s+(.*?)\s{2,}(\d:\d\d|-)\s*$')
cont = re.compile(r'^\s{15,}(\S.*?)\s*$')
days=[]; cur=None; last=None
def iso(d,m,y): return f"{y}-{MON[m]:02d}-{d}"
for line in txt.split("\n"):
    if "\f" in line: line=line.replace("\f","")
    if line.strip().startswith("AI Engineer Daily Timetable |"): last=None; continue
    m=hdr.match(line)
    if m:
        cur={"day":int(m[1]),"dow":m[2],"date":iso(m[3],m[4],m[5]),"stage":int(m[6]),"stageName":m[7],"hours":int(m[8]),"type":"study","tasks":[]}
        days.append(cur); last=None; continue
    m=off.match(line)
    if m:
        cur={"day":None,"dow":m[1],"date":iso(m[2],m[3],m[4]),"type":"exam" if m[5].startswith("EXAM") else "rest","label":m[5],"tasks":[]}
        days.append(cur); last=None; continue
    if cur is None or cur["type"]!="study": continue
    m=row.match(line)
    if m:
        last={"start":m[1],"end":m[2],"text":m[3].strip(),"dur":m[4]}
        cur["tasks"].append(last); continue
    m=cont.match(line)
    if m and last is not None and not line.strip().startswith("Day "):
        last["text"]+=" "+m[1]
        continue
# validate
bad=[]
for d in days:
    if d["type"]=="study":
        s=0
        for t in d["tasks"]:
            if t["dur"]!="-":
                h,mi=t["dur"].split(":"); s+=int(h)*60+int(mi)
        d["_sum"]=s
        if abs(s-d["hours"]*60)>0: bad.append((d["date"],s/60,d["hours"]))
        if not d["tasks"]: bad.append((d["date"],"no tasks"))
json.dump(days,open(out,"w"),indent=0)
print("entries",len(days),"study",sum(d["type"]=="study" for d in days),"exam",sum(d["type"]=="exam" for d in days),"rest",sum(d["type"]=="rest" for d in days))
print("tasks",sum(len(d["tasks"]) for d in days))
print("first",days[0]["date"],"last",days[-1]["date"])
print("hour mismatches",bad)
import datetime
ds=[datetime.date.fromisoformat(d["date"]) for d in days]
exp=(ds[-1]-ds[0]).days+1
print("expected",exp,"missing",sorted(set(ds[0]+datetime.timedelta(i) for i in range(exp))-set(ds)))
