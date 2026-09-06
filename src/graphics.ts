export type GraphicsQuality='balanced'|'high'|'performance';
export const graphicsProfiles={
  balanced:{pixels:1600*900,maxDpr:1,occlusion:true,reflections:true},
  high:{pixels:2560*1440,maxDpr:1.25,occlusion:true,reflections:true},
  performance:{pixels:960*600,maxDpr:1,occlusion:false,reflections:false},
} as const;
export function renderPixelRatio(width:number,height:number,dpr:number,quality:GraphicsQuality){
  const profile=graphicsProfiles[quality];
  return Math.min(dpr,profile.maxDpr,Math.sqrt(profile.pixels/(Math.max(1,width)*Math.max(1,height))));
}
