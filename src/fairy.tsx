import React,{useEffect,useRef} from 'react'

const rnd=(a:number,b:number)=>a+Math.random()*(b-a)
const pick=<T,>(a:T[])=>a[Math.floor(Math.random()*a.length)]
const DUST=['#ffffff','#ffd6e5','#f7a8c4','#ffe9a8','#d9c6ff','#bfe6ff']
const RAINBOW=['#ff9fb8','#ffc890','#fff0a0','#a8e6c0','#a8d0ff','#d2b4ff']

/* ---------- characters (inline SVG, drawn by hand) ---------- */
export const FairySVG=({id,dress='#f7a8c4',hair='#e9a15a'}:{id:string;dress?:string;hair?:string})=>(
<svg viewBox="0 0 64 64" width="100%" height="100%" style={{overflow:'visible'}}>
 <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".95"/><stop offset="1" stopColor="#cfe6ff" stopOpacity=".75"/></linearGradient></defs>
 <g className="wing" style={{animationDelay:'-.1s'}}><ellipse cx="22" cy="20" rx="8" ry="17" transform="rotate(-28 22 20)" fill={`url(#${id})`} stroke="#fff" strokeWidth="1"/></g>
 <g className="wing" style={{animationDelay:'-.18s'}}><ellipse cx="25" cy="34" rx="6" ry="11" transform="rotate(-62 25 34)" fill={`url(#${id})`} stroke="#fff" strokeWidth="1"/></g>
 <path d="M30 31 L21 47 Q32 54 43 47 L34 31 Z" fill={dress}/>
 <path d="M23 46 Q32 51 41 46" stroke="#fff" strokeWidth="1.5" fill="none" opacity=".7"/>
 <path d="M28 50 L27 58 M36 50 L37 58" stroke="#ffd9c4" strokeWidth="2.4" strokeLinecap="round"/>
 <circle cx="27" cy="21" r="8" fill={hair}/><circle cx="25" cy="13" r="4.2" fill={hair}/>
 <circle cx="33" cy="23" r="7" fill="#ffe6d6"/>
 <path d="M26.5 19 Q33 12 40 20 Q34 17 26.5 19Z" fill={hair}/>
 <circle cx="36" cy="23.5" r="1.1" fill="#4a3340"/><ellipse cx="37.5" cy="27" rx="2" ry="1.2" fill="#f9a6bd" opacity=".8"/>
 <path d="M35 33 L50 22" stroke="#c98aa0" strokeWidth="2" strokeLinecap="round"/>
 <path d="M52 15 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8 -4.2 -4.2 -1.8 4.2 -1.8z" fill="#ffd45e" stroke="#fff" strokeWidth=".8" className="twinkle" style={{transformBox:'fill-box',transformOrigin:'center'}}/>
</svg>)

export const ButterflySVG=({id,a='#f7a8c4',b='#d9c6ff'}:{id:string;a?:string;b?:string})=>(
<svg viewBox="0 0 40 32" width="100%" height="100%" style={{overflow:'visible'}}>
 <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a}/><stop offset="1" stopColor={b}/></linearGradient></defs>
 <g className="bwing-l"><path d="M20 15 C8 0 0 4 2 14 C3 20 10 20 20 17Z" fill={`url(#${id})`} stroke="#fff" strokeWidth=".8"/><path d="M20 17 C10 20 6 30 12 30 C17 30 19 24 20 17Z" fill={`url(#${id})`} opacity=".85"/></g>
 <g className="bwing-r"><path d="M20 15 C32 0 40 4 38 14 C37 20 30 20 20 17Z" fill={`url(#${id})`} stroke="#fff" strokeWidth=".8"/><path d="M20 17 C30 20 34 30 28 30 C23 30 21 24 20 17Z" fill={`url(#${id})`} opacity=".85"/></g>
 <ellipse cx="20" cy="17" rx="1.6" ry="7" fill="#6b4a5c"/><path d="M19.5 10 Q16 4 13 4 M20.5 10 Q24 4 27 4" stroke="#6b4a5c" strokeWidth=".9" fill="none"/>
</svg>)

/* ---------- the flying layer ---------- */
type P={x:number;y:number;vx:number;vy:number;life:number;max:number;s:number;c:string;r:number}
type E={el:HTMLDivElement;x:number;y:number;vx:number;vy:number;tx:number;ty:number;sp:number;ph:number;bob:number;emit:number;size:number;wand:boolean}

const FAIRIES=[{dress:'#f7a8c4',hair:'#e9a15a',size:74},{dress:'#b9a4ee',hair:'#8a5a44',size:64},{dress:'#8fd8c0',hair:'#f2d27a',size:58}]
const BUTTERFLIES=[['#f7a8c4','#ffd9a0'],['#b9a4ee','#bfe6ff'],['#ffd45e','#f7a8c4'],['#8fd8c0','#d9c6ff'],['#f78fb3','#c9b8f0']]

export default function Fairyland(){
 const wrap=useRef<HTMLDivElement>(null),cv=useRef<HTMLCanvasElement>(null),uni=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  const root=wrap.current!,canvas=cv.current!,ctx=canvas.getContext('2d')!,still=matchMedia('(prefers-reduced-motion: reduce)').matches
  let W=innerWidth,H=innerHeight,raf=0,last=performance.now(),T=0
  const small=()=>W<700?.72:1
  const fit=()=>{W=innerWidth;H=innerHeight;const d=Math.min(devicePixelRatio||1,2);canvas.width=W*d;canvas.height=H*d;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(d,0,0,d,0,0)}
  fit();addEventListener('resize',fit)
  const ents:E[]=Array.from(root.querySelectorAll<HTMLDivElement>('[data-fly]')).map((el,i)=>{
   const wand=el.dataset.fly==='fairy',size=+(el.dataset.size||40)
   return{el,x:rnd(0,W),y:rnd(0,H),vx:rnd(-30,30),vy:rnd(-20,20),tx:rnd(40,W-40),ty:rnd(60,H-60),sp:wand?rnd(70,110):rnd(35,60),ph:rnd(0,6),bob:wand?7:12,emit:0,size,wand}
  })
  const ps:P[]=[]
  const spawn=(x:number,y:number,n=1,cols=DUST,spread=30,size=1)=>{for(let i=0;i<n&&ps.length<420;i++)ps.push({x:x+rnd(-4,4),y:y+rnd(-4,4),vx:rnd(-spread,spread),vy:rnd(-spread,spread*.6)+8,life:0,max:rnd(.7,1.5),s:rnd(3,7)*size,c:pick(cols),r:rnd(0,6.28)})}
  const star=(x:number,y:number,r:number,rot:number)=>{ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?r*.28:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.restore()}
  // unicorn flyby
  const U={on:false,x:0,y:0,base:0,t:0,next:5}
  const place=(e:E)=>{const k=small(),s=e.size*k;e.el.style.width=s+'px';e.el.style.height=s*(e.wand?1:.8)+'px'}
  ents.forEach(place)
  const draw=(e:E,dir:number,tilt:number)=>{e.el.style.transform=`translate3d(${e.x-e.size/2}px,${e.y-e.size/2+Math.sin(T*2.3+e.ph)*e.bob}px,0) scaleX(${dir}) rotate(${tilt}deg)`}
  if(still){ents.forEach((e,i)=>{e.x=W*(.1+((i*.17)%.8));e.y=H*(.15+((i*.29)%.7));draw(e,1,0)});return()=>removeEventListener('resize',fit)}
  // pointer dust + click burst
  let lx=0,ly=0
  const mv=(ev:PointerEvent)=>{const d=Math.hypot(ev.clientX-lx,ev.clientY-ly);if(d>7){spawn(ev.clientX,ev.clientY,2,DUST,22,.8);lx=ev.clientX;ly=ev.clientY}}
  const ck=(ev:PointerEvent)=>spawn(ev.clientX,ev.clientY,22,[...DUST,...RAINBOW],110,1.1)
  addEventListener('pointermove',mv);addEventListener('pointerdown',ck)
  const dirs=new Map<E,number>()
  const tick=(now:number)=>{
   const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt
   for(const e of ents){
    const dx=e.tx-e.x,dy=e.ty-e.y,d=Math.hypot(dx,dy)||1
    if(d<50||Math.random()<.0015){e.tx=rnd(30,W-30);e.ty=rnd(50,H-50);e.sp=e.wand?rnd(70,115):rnd(35,65)}
    const wob=e.wand?Math.sin(T*1.6+e.ph)*38:Math.sin(T*3+e.ph)*60
    const dvx=dx/d*e.sp+(-dy/d)*wob,dvy=dy/d*e.sp+(dx/d)*wob
    e.vx+=(dvx-e.vx)*Math.min(1,dt*1.8);e.vy+=(dvy-e.vy)*Math.min(1,dt*1.8)
    e.x+=e.vx*dt;e.y+=e.vy*dt
    let dir=dirs.get(e)||1;if(e.vx>14)dir=1;else if(e.vx<-14)dir=-1;dirs.set(e,dir)
    draw(e,dir,Math.max(-14,Math.min(14,e.vy*.12*dir)))
    e.emit+=dt;const gap=e.wand?.028:.16
    if(e.emit>gap){e.emit=0;spawn(e.x-dir*e.size*.3,e.y+e.size*.1,e.wand?2:1,e.wand?DUST:RAINBOW,e.wand?16:8,e.wand?1:.7)}
   }
   // unicorn
   const ue=uni.current
   if(ue){
    U.next-=dt
    if(!U.on&&U.next<=0){U.on=true;U.x=-90;U.base=rnd(H*.15,H*.6);U.t=0}
    if(U.on){U.t+=dt;U.x+=W/9*dt+90*dt;U.y=U.base+Math.sin(U.t*1.7)*40
     ue.style.opacity='1';ue.style.transform=`translate3d(${U.x}px,${U.y}px,0) rotate(${Math.cos(U.t*1.7)*-6}deg)`
     spawn(U.x+6,U.y+34,3,RAINBOW,26,1.3)
     if(U.x>W+120){U.on=false;U.next=rnd(35,60);ue.style.opacity='0'}}
   }
   ctx.clearRect(0,0,W,H)
   for(let i=ps.length-1;i>=0;i--){const p=ps[i];p.life+=dt;if(p.life>=p.max){ps.splice(i,1);continue}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=26*dt;p.vx*=.985;const k=1-p.life/p.max
    ctx.globalAlpha=Math.min(1,k*1.4)*.95;ctx.fillStyle=p.c
    star(p.x,p.y,p.s*(.45+k*.55),p.r+p.life*3)
    ctx.globalAlpha*=.22;ctx.beginPath();ctx.arc(p.x,p.y,p.s*1.2,0,6.28);ctx.fill()}
   ctx.globalAlpha=1
   raf=requestAnimationFrame(tick)}
  raf=requestAnimationFrame(tick)
  const vis=()=>{if(document.hidden)cancelAnimationFrame(raf);else{last=performance.now();raf=requestAnimationFrame(tick)}}
  document.addEventListener('visibilitychange',vis)
  return()=>{cancelAnimationFrame(raf);removeEventListener('resize',fit);removeEventListener('pointermove',mv);removeEventListener('pointerdown',ck);document.removeEventListener('visibilitychange',vis)}
 },[])
 return(<div ref={wrap} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[45] overflow-hidden">
  <canvas ref={cv} className="absolute inset-0"/>
  {FAIRIES.map((f,i)=><div key={'f'+i} data-fly="fairy" data-size={f.size} className="absolute left-0 top-0 will-change-transform drop-shadow-[0_3px_6px_rgba(201,138,160,.45)]"><FairySVG id={'fw'+i} dress={f.dress} hair={f.hair}/></div>)}
  {BUTTERFLIES.map(([a,b],i)=><div key={'b'+i} data-fly="butterfly" data-size={i%2?32:40} className="absolute left-0 top-0 will-change-transform drop-shadow-[0_2px_4px_rgba(150,110,170,.35)]"><ButterflySVG id={'bw'+i} a={a} b={b}/></div>)}
  <div ref={uni} className="absolute left-0 top-0 text-5xl opacity-0 will-change-transform select-none" style={{filter:'drop-shadow(0 4px 8px rgba(201,138,160,.45))'}}>🦄</div>
 </div>)
}
