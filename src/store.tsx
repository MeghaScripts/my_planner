import React,{createContext,useContext,useEffect,useRef,useState,useCallback} from 'react'
import {State,initial,iso} from './lib'
const open=()=>new Promise<IDBDatabase>((res,rej)=>{const r=indexedDB.open('study-universe',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})
const dbGet=async()=>{const d=await open();return new Promise<any>((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get('state');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
const dbSet=async(v:any)=>{const d=await open();return new Promise<void>((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,'state');t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
interface Ctx{s:State;upd:(f:(d:State)=>void)=>void;replace:(s:State)=>void;today:string;now:number}
const C=createContext<Ctx>(null as any)
export const useApp=()=>useContext(C)
export function Provider({children}:{children:React.ReactNode}){
  const [s,setS]=useState<State|null>(null),[now,setNow]=useState(Date.now()),t=useRef<any>(0)
  useEffect(()=>{dbGet().then(v=>setS({...initial(),...(v||{})})).catch(()=>setS(initial()));const i=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(i)},[])
  const save=useCallback((v:State)=>{clearTimeout(t.current);t.current=setTimeout(()=>dbSet(v),250)},[])
  const upd=useCallback((f:(d:State)=>void)=>setS(p=>{const n=structuredClone(p!);f(n);save(n);return n}),[save])
  const replace=useCallback((v:State)=>{setS(v);dbSet(v)},[])
  if(!s)return <div className="p-10 text-mauve">Loading your universe…</div>
  return <C.Provider value={{s,upd,replace,today:iso(new Date(now)),now}}>{children}</C.Provider>
}
