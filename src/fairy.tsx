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

/* ---------- calm layer: 2 fairies stand at the bottom (only wings move), 1 butterfly roams ---------- */
type P={x:number;y:number;vx:number;vy:number;life:number;max:number;s:number;c:string;r:number}
const STAND=[{dress:'#f7a8c4',hair:'#e9a15a',left:'calc(13rem + 14px)'},{dress:'#b9a4ee',hair:'#8a5a44',right:'calc(250px + 2.2rem)'}]

export default function Fairyland(){
 const cv=useRef<HTMLCanvasElement>(null),bf=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  const canvas=cv.current!,ctx=canvas.getContext('2d')!,el=bf.current!,still=matchMedia('(prefers-reduced-motion: reduce)').matches
  let W=innerWidth,H=innerHeight,raf=0,last=performance.now(),T=0
  const fit=()=>{W=innerWidth;H=innerHeight;const d=Math.min(devicePixelRatio||1,2);canvas.width=W*d;canvas.height=H*d;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(d,0,0,d,0,0)}
  fit();addEventListener('resize',fit)
  const ps:P[]=[]
  const burst=(x:number,y:number)=>{for(let i=0;i<30;i++)ps.push({x,y,vx:rnd(-120,120),vy:rnd(-120,100),life:0,max:rnd(.6,1.2),s:rnd(3,7),c:pick([...DUST,...RAINBOW]),r:rnd(0,6.28)})}
  const star=(x:number,y:number,r:number,rot:number)=>{ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?r*.28:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.restore()}
  const B={x:rnd(200,W-200),y:rnd(120,H-160),vx:30,vy:10,tx:rnd(60,W-60),ty:rnd(80,H-100),dead:0,dir:1}
  const SZ=38
  const place=()=>{el.style.transform=`translate3d(${B.x-SZ/2}px,${B.y-SZ/2}px,0) scaleX(${B.dir})`}
  place()
  if(still)return()=>removeEventListener('resize',fit)
  const pop=()=>{if(B.dead>0)return;burst(B.x,B.y);B.dead=5;el.style.opacity='0';el.style.pointerEvents='none'}
  el.style.pointerEvents='auto';el.addEventListener('pointerdown',pop)
  const tick=(now:number)=>{
   const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt
   if(B.dead>0){B.dead-=dt;if(B.dead<=0){B.x=rnd(60,W-60);B.y=rnd(80,H-100);B.tx=rnd(60,W-60);B.ty=rnd(80,H-100);el.style.opacity='1';el.style.pointerEvents='auto'}}
   else{
    const dx=B.tx-B.x,dy=B.ty-B.y,d=Math.hypot(dx,dy)||1
    if(d<40||Math.random()<.002){B.tx=rnd(60,W-60);B.ty=rnd(80,H-100)}
    const wob=Math.sin(T*2.4)*45,sp=48
    B.vx+=((dx/d*sp-dy/d*wob)-B.vx)*Math.min(1,dt*1.6);B.vy+=((dy/d*sp+dx/d*wob)-B.vy)*Math.min(1,dt*1.6)
    B.x+=B.vx*dt;B.y+=B.vy*dt
    if(B.vx>12)B.dir=1;else if(B.vx<-12)B.dir=-1
    el.style.transform=`translate3d(${B.x-SZ/2}px,${B.y-SZ/2+Math.sin(T*3)*5}px,0) scaleX(${B.dir}) rotate(${Math.max(-12,Math.min(12,B.vy*.1*B.dir))}deg)`
   }
   ctx.clearRect(0,0,W,H)
   for(let i=ps.length-1;i>=0;i--){const p=ps[i];p.life+=dt;if(p.life>=p.max){ps.splice(i,1);continue}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;p.vx*=.98;const k=1-p.life/p.max
    ctx.globalAlpha=Math.min(1,k*1.4);ctx.fillStyle=p.c;star(p.x,p.y,p.s*(.45+k*.55),p.r+p.life*3)}
   ctx.globalAlpha=1
   raf=requestAnimationFrame(tick)}
  raf=requestAnimationFrame(tick)
  const vis=()=>{if(document.hidden)cancelAnimationFrame(raf);else{last=performance.now();raf=requestAnimationFrame(tick)}}
  document.addEventListener('visibilitychange',vis)
  return()=>{cancelAnimationFrame(raf);removeEventListener('resize',fit);el.removeEventListener('pointerdown',pop);document.removeEventListener('visibilitychange',vis)}
 },[])
 return(<div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[45] overflow-hidden">
  <canvas ref={cv} className="absolute inset-0"/>
  {STAND.map((f,i)=><div key={i} className="absolute bottom-0 w-[58px] h-[58px] drop-shadow-[0_3px_6px_rgba(201,138,160,.4)]" style={{left:(f as any).left,right:(f as any).right}}><FairySVG id={'fw'+i} dress={f.dress} hair={f.hair}/></div>)}
  <div ref={bf} className="absolute left-0 top-0 will-change-transform cursor-pointer drop-shadow-[0_2px_4px_rgba(150,110,170,.35)]" style={{width:38,height:30}}><ButterflySVG id="bw0" a="#f7a8c4" b="#d9c6ff"/></div>
 </div>)
}
