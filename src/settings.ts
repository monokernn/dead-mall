import type { GraphicsQuality } from './graphics.ts';
export type Settings={volume:number;music:boolean;muted:boolean;sensitivity:number;steadyLighting:boolean;quality:GraphicsQuality};
export const defaults:Settings={volume:.45,music:true,muted:false,sensitivity:1,steadyLighting:true,quality:'balanced'};
const clamp=(value:unknown,fallback:number,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
export function sanitizeSettings(value:unknown):Settings{
  const s=value&&typeof value==='object'?value as Partial<Settings>:{};
  return {quality:s.quality==='high'||s.quality==='performance'?s.quality:defaults.quality,volume:clamp(s.volume,defaults.volume,0,1),sensitivity:clamp(s.sensitivity,1,.5,2),
    music:typeof s.music==='boolean'?s.music:defaults.music,muted:typeof s.muted==='boolean'?s.muted:defaults.muted,
    steadyLighting:typeof s.steadyLighting==='boolean'?s.steadyLighting:defaults.steadyLighting};
}
export function loadSettings():Settings{try{return sanitizeSettings(JSON.parse(localStorage.getItem('meridian.settings.v1')||'null'));}catch{return {...defaults};}}
export function saveSettings(settings:Settings){try{localStorage.setItem('meridian.settings.v1',JSON.stringify(settings));}catch{/* Settings still work for this visit when browser storage is unavailable. */}}