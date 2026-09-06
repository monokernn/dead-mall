import type { Position } from './movement.ts';
import type { Settings } from './settings.ts';
export type Surface='tile'|'metal'|'carpet';
export function walkingSurface(p:Position):Surface{
  if(p.y>.05&&p.y<4.75)return 'metal';
  if(p.x<-20&&p.y<.2)return 'carpet';
  return 'tile';
}
function noiseBuffer(context:BaseAudioContext,seconds:number,decay=false){
  const buffer=context.createBuffer(decay?2:1,Math.ceil(context.sampleRate*seconds),context.sampleRate);
  let seed=2004;
  for(let channel=0;channel<buffer.numberOfChannels;channel++){
    const data=buffer.getChannelData(channel);
    for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*(decay?Math.exp(-i/data.length*6):1);}
  }
  return buffer;
}
export class MallAudio{
  private context?:AudioContext;
  private master?:GainNode;
  private music?:GainNode;
  private dry?:GainNode;
  private reverb?:GainNode;
  private analyser?:AnalyserNode;
  private sample=new Float32Array(1024);
  private footNoise?:AudioBuffer;
  private active=false;
  private distance=0;
  private suspendTimer?:ReturnType<typeof setTimeout>;
  private stepCount=0;
  private lastSurface:Surface='tile';
  private lastEffect='';
  private settings:Settings;
  constructor(settings:Settings){this.settings=settings;}
  async unlock(){
    if(!this.context)this.create();
    clearTimeout(this.suspendTimer);
    await this.context!.resume();this.apply();
  }
  private create(){
    const c=this.context=new AudioContext();
    const master=this.master=c.createGain();master.gain.value=0;
    const limiter=c.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=12;limiter.ratio.value=3;
    this.analyser=c.createAnalyser();this.analyser.fftSize=2048;
    master.connect(limiter);limiter.connect(this.analyser);this.analyser.connect(c.destination);
    const dry=this.dry=c.createGain();dry.connect(master);
    const convolution=c.createConvolver();convolution.buffer=noiseBuffer(c,2.4,true);
    this.reverb=c.createGain();this.reverb.gain.value=.13;convolution.connect(this.reverb);this.reverb.connect(master);dry.connect(convolution);
    this.music=c.createGain();this.music.gain.value=this.settings.music?1:0;this.music.connect(dry);
    const noise=c.createBufferSource();noise.buffer=noiseBuffer(c,3);noise.loop=true;
    const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=380;
    const ventilation=c.createGain();ventilation.gain.value=.065;noise.connect(filter);filter.connect(ventilation);ventilation.connect(dry);noise.start();
    // Slow, original sustained tones: no song samples or external audio downloads.
    for(const [index,frequency] of [73.416,110,164.814,174.614].entries()){
      const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.value=.009;
      const drift=c.createOscillator(),amount=c.createGain();drift.frequency.value=.023+index*.007;amount.gain.value=4;drift.connect(amount);amount.connect(osc.detune);drift.start();
      const breath=c.createOscillator(),depth=c.createGain();breath.frequency.value=.019+index*.005;depth.gain.value=.004;breath.connect(depth);depth.connect(gain.gain);breath.start();
      osc.connect(gain);gain.connect(this.music);osc.start();
    }
    for(const [x,y,z] of [[-16,3.8,-9],[16,3.8,12],[0,8,-16]]){
      const emitter=c.createPanner();emitter.panningModel='HRTF';emitter.distanceModel='inverse';emitter.refDistance=3;emitter.rolloffFactor=1.5;
      emitter.positionX.value=x;emitter.positionY.value=y;emitter.positionZ.value=z;emitter.connect(dry);
      for(const [freq,level] of [[120,.018],[240,.004],[360,.002]]){const osc=c.createOscillator(),gain=c.createGain();osc.frequency.value=freq;gain.gain.value=level;osc.connect(gain);gain.connect(emitter);osc.start();}
    }
    const arcade=c.createPanner();arcade.panningModel='HRTF';arcade.refDistance=2;arcade.rolloffFactor=2;arcade.positionX.value=-28;arcade.positionY.value=1.4;arcade.positionZ.value=1;arcade.connect(dry);
    const electronics=c.createOscillator(),electronicGain=c.createGain();electronics.type='triangle';electronics.frequency.value=659.25;electronicGain.gain.value=.005;electronics.connect(electronicGain);electronicGain.connect(arcade);electronics.start();
    this.footNoise=noiseBuffer(c,.22);
  }
  configure(settings:Settings){this.settings=settings;this.apply();}
  private apply(){
    if(!this.context)return;const now=this.context.currentTime;
    this.master!.gain.setTargetAtTime(this.active&&!this.settings.muted?this.settings.volume:0,now,.035);
    this.music!.gain.setTargetAtTime(this.settings.music?1:0,now,.12);
  }
  setActive(active:boolean){
    this.active=active;this.distance=0;clearTimeout(this.suspendTimer);this.apply();
    if(!active&&this.context)this.suspendTimer=setTimeout(()=>{if(!this.active)void this.context?.suspend().catch(()=>{});},200);
  }
  listener(p:Position,yaw:number,pitch:number){
    if(!this.context)return;
    const listener=this.context.listener,now=this.context.currentTime;
    for(const [param,value] of [[listener.positionX,p.x],[listener.positionY,p.y+1.65],[listener.positionZ,p.z],
      [listener.forwardX,-Math.sin(yaw)*Math.cos(pitch)],[listener.forwardY,Math.sin(pitch)],[listener.forwardZ,-Math.cos(yaw)*Math.cos(pitch)],
      [listener.upX,Math.sin(yaw)*Math.sin(pitch)],[listener.upY,Math.cos(pitch)],[listener.upZ,Math.cos(yaw)*Math.sin(pitch)]] as const)param.setValueAtTime(value,now);
    this.reverb!.gain.setTargetAtTime(Math.abs(p.x)<12&&p.z<14?.2:.085,now,.25);
  }
  walk(before:Position,after:Position){
    if(!this.active)return;
    this.distance+=Math.hypot(after.x-before.x,after.z-before.z,after.y-before.y);
    if(this.distance<.72)return;
    this.distance%=.72;this.lastSurface=walkingSurface(after);this.stepCount++;
    if(!this.context||this.settings.muted)return;
    const c=this.context,now=c.currentTime,surface=this.lastSurface;
    const noise=c.createBufferSource();noise.buffer=this.footNoise!;
    const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=surface==='carpet'?650:surface==='metal'?3300:2100;
    const gain=c.createGain();gain.gain.setValueAtTime(surface==='carpet'?.08:.14,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.13);
    noise.connect(filter);filter.connect(gain);gain.connect(this.dry!);noise.start();noise.stop(now+.15);
    noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};
    this.tone(surface==='metal'?210:surface==='carpet'?75:115,surface==='carpet'?.035:.065,.13);
  }
  private tone(frequency:number,volume:number,duration:number,delay=0){
    const c=this.context!;const now=c.currentTime+delay,osc=c.createOscillator(),gain=c.createGain();
    osc.frequency.setValueAtTime(frequency,now);osc.frequency.exponentialRampToValueAtTime(frequency*.72,now+duration);
    gain.gain.setValueAtTime(0,c.currentTime);gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain);gain.connect(this.dry!);osc.start(now);osc.stop(now+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  effect(kind:'arcade'|'door'){
    this.lastEffect=kind;
    if(!this.context||this.settings.muted||!this.active)return;
    if(kind==='arcade'){this.tone(740,.055,.14);this.tone(493.88,.04,.21,.13);}
    else{this.tone(170,.09,.09);this.tone(82,.075,.18,.12);}
  }
  debug(){
    let rms=0;if(this.analyser){this.analyser.getFloatTimeDomainData(this.sample);rms=Math.sqrt(this.sample.reduce((sum,n)=>sum+n*n,0)/this.sample.length);}
    return {state:this.context?.state??'uninitialized',active:this.active,muted:this.settings.muted,music:this.settings.music,volume:this.settings.volume,rms,steps:this.stepCount,surface:this.lastSurface,effect:this.lastEffect};
  }
}