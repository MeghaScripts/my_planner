import React,{useEffect,useState} from 'react'
import {Provider,useApp} from './store'
import {Widgets,Banner} from './ui'
import {Dashboard,Schedule,Calendar} from './pages1'
import {DSA,AI,CS,Aptitude,Interview,Projects,Applications,Journal,Analytics,Settings} from './pages2'
import {clock,TASKS,secOf} from './lib'
import {LayoutDashboard,CalendarCheck,CalendarDays,Code2,Brain,Server,Calculator,Mic,FolderGit2,Briefcase,BookHeart,LineChart,SettingsIcon,Menu,Timer} from 'lucide-react'
const NAV:[string,string,any,any][]=[['dashboard','Dashboard',LayoutDashboard,Dashboard],['schedule','Daily Schedule',CalendarCheck,Schedule],['calendar','Calendar',CalendarDays,Calendar],['dsa','DSA Tracker',Code2,DSA],['ai','AI / ML Tracker',Brain,AI],['cs','CS Fundamentals',Server,CS],['aptitude','Aptitude Tracker',Calculator,Aptitude],['interview','Interview Preparation',Mic,Interview],['projects','Projects',FolderGit2,Projects],['applications','Applications',Briefcase,Applications],['journal','Daily Journal',BookHeart,Journal],['analytics','Analytics',LineChart,Analytics],['settings','Settings',SettingsIcon,Settings]]
const Decor=()=><div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
 {[[8,12],[22,70],[40,25],[58,82],[73,18],[88,60],[95,35],[15,45]].map(([x,y],i)=><span key={i} className="absolute text-rose twinkle" style={{left:x+'%',top:y+'%',animationDelay:i*.7+'s',fontSize:12+i%3*6}}>✦</span>)}
 {[[10,40],[55,75],[30,20]].map(([t,d],i)=><span key={i} className="absolute left-0 text-6xl opacity-40" style={{top:t+'%',animation:`drift ${70+i*25}s linear infinite`,animationDelay:`-${d}s`}}>☁️</span>)}
</div>
function Shell(){const {s,now}=useApp(),[r,setR]=useState(location.hash),[m,setM]=useState(false)
 useEffect(()=>{const f=()=>{setR(location.hash);setM(false);window.scrollTo(0,0)};addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[])
 const cur=r.replace('#/','').split('?')[0]||'dashboard',P=(NAV.find(n=>n[0]===cur)||NAV[0])[3],run=TASKS.find(t=>s.logs[t.id]?.run)
 return(<div className="h-screen w-full flex overflow-hidden"><Decor/><aside className={`${m?'block':'hidden'} lg:block fixed lg:relative z-40 h-screen w-52 shrink-0 bg-blush border-r border-rose/40 p-3 overflow-y-auto`}><div className="font-serif text-xl text-mauve">☁️ My Study Universe</div><div className="text-[10px] italic mb-3">Dream it. Learn it. Build it. Achieve it.</div>{NAV.map(([k,l,I])=><a key={k} href={`#/${k}`} className={`flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm font-bold mb-0.5 transition hover:translate-x-1 ${cur===k?'bg-deep text-white':'hover:bg-rose/30 text-mauve'}`}><I size={15}/>{l}</a>)}</aside>
 <main className="relative z-10 flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden p-3"><div className="flex items-center gap-3 mb-2"><button className="lg:hidden btn" onClick={()=>setM(!m)}><Menu size={16}/></button>{run&&<a href={`#/schedule?d=${run.date}`} className="chip bg-butter flex items-center gap-1"><Timer size={12}/>{clock(secOf(s.logs[run.id],now))} · {run.text.slice(0,40)}</a>}</div>
 <div className="grid grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_250px] gap-4"><div key={cur} className="page-in min-w-0 max-w-full"><P/></div><div className="hidden xl:block sticky top-0 self-start max-h-[calc(100vh-1.5rem)] overflow-y-auto"><Widgets/></div></div><div className="xl:hidden mt-4"><Widgets/></div></main></div>)}
export default function App(){return <Provider><Shell/></Provider>}
