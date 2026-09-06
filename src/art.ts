import * as THREE from 'three';

export type Artwork = { texture: THREE.CanvasTexture; text: string[] };
type Context = CanvasRenderingContext2D;

export function random(seed = 41) {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}
function canvas(width: number, height: number) {
  const element = document.createElement('canvas'); element.width = width; element.height = height;
  return { element, c: element.getContext('2d')! };
}
function texture(element: HTMLCanvasElement, repeat = false) {
  const map = new THREE.CanvasTexture(element);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  if (repeat) map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return map;
}
function noise(c: Context, width: number, height: number, seed: number, count: number, alpha = .08) {
  const rng = random(seed);
  for (let i = 0; i < count; i++) {
    c.fillStyle = rng() > .5 ? `rgba(28,24,20,${rng()*alpha})` : `rgba(255,244,213,${rng()*alpha})`;
    c.fillRect(rng()*width, rng()*height, 1+rng()*2, 1+rng()*2);
  }
}
function age(c: Context, w: number, h: number) {
  noise(c,w,h,73,4500,.13);
  const edge = c.createLinearGradient(0,0,w,0);
  edge.addColorStop(0,'#30291f36');edge.addColorStop(.07,'#30291f00');edge.addColorStop(.9,'#30291f00');edge.addColorStop(1,'#30291f36');
  c.fillStyle=edge;c.fillRect(0,0,w,h);
}
export function surface(kind: 'tile'|'plaster'|'carpet'|'ceiling'|'metal'|'mosaic') {
  const {element,c}=canvas(512,512);const rng=random(19);
  if(kind==='tile'){
    c.fillStyle='#7d7a69';c.fillRect(0,0,512,512);
    for(let y=0;y<4;y++)for(let x=0;x<4;x++){
      const value=173+Math.floor(rng()*17);
      c.fillStyle=`rgb(${value+15},${value+10},${value-5})`;
      c.fillRect(x*128+2,y*128+2,124,124);
      c.strokeStyle='#eee6cb70';c.lineWidth=1;c.strokeRect(x*128+3,y*128+3,122,122);
    }
    noise(c,512,512,92,30000,.2);
    for(let i=0;i<70;i++){
      const x=rng()*512,y=rng()*512,r=10+rng()*70;
      const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#51443509');g.addColorStop(1,'#51443500');
      c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    }
    c.strokeStyle='#4a453928';c.lineWidth=1;
    c.beginPath();c.moveTo(128,340);c.lineTo(180,367);c.lineTo(174,389);c.lineTo(215,420);c.stroke();
  }else if(kind==='plaster'){
    c.fillStyle='#c3bda7';c.fillRect(0,0,512,512);noise(c,512,512,18,25000,.06);
    for(let i=0;i<30;i++){const x=rng()*512;c.fillStyle='#473d2710';c.fillRect(x,350+rng()*100,1+rng()*5,120);}
  }else if(kind==='carpet'){
    c.fillStyle='#353242';c.fillRect(0,0,512,512);
    noise(c,512,512,57,35000,.12);
    for(let i=0;i<30;i++){
      const x=rng()*512,y=rng()*512;c.save();c.translate(x,y);c.rotate(rng()*6);
      c.strokeStyle=['#748b813e','#bd91684d','#8d789561'][i%3];c.lineWidth=3;
      c.beginPath();c.moveTo(-15,8);c.lineTo(-3,-12);c.lineTo(12,10);c.stroke();
      c.beginPath();c.arc(0,0,18,0,2.3);c.stroke();c.restore();
    }
  }else if(kind==='ceiling'){
    c.fillStyle='#777669';c.fillRect(0,0,512,512);
    for(let x=0;x<4;x++)for(let y=0;y<4;y++){
      c.fillStyle=(x+y)%5===0?'#9f9d8d':'#b6b5a3';c.fillRect(x*128+2,y*128+2,124,124);
      for(let i=0;i<350;i++){c.fillStyle='#4a473030';c.fillRect(x*128+rng()*120+4,y*128+rng()*120+4,1,1);}
    }
  }else if(kind==='metal'){
    c.fillStyle='#90918a';c.fillRect(0,0,512,512);
    for(let y=0;y<512;y++){c.fillStyle=`rgba(20,25,22,${rng()*.12})`;c.fillRect(0,y,512,1);}
    noise(c,512,512,26,5000,.12);
  }else{
    c.fillStyle='#656e61';c.fillRect(0,0,512,512);
    for(let x=0;x<16;x++)for(let y=0;y<16;y++){
      c.fillStyle=['#627d75','#79948c','#93a395','#456b64','#9ba398'][Math.floor(rng()*5)];
      c.fillRect(x*32+2,y*32+2,28,28);
    }
    noise(c,512,512,61,9000,.15);
  }
  return texture(element,true);
}

export function signage(title: string, subtitle: string, style=0, aspect=5.33): Artwork {
  const width=Math.max(256,Math.min(2048,Math.round(192*aspect)));
  const {element,c}=canvas(width,192);
  const palettes=[['#364e48','#e1d6b5'],['#645462','#e5d4b6'],['#b29e78','#353e34'],['#292e34','#cbba95']];
  const [bg,fg]=palettes[style%4];c.fillStyle=bg;c.fillRect(0,0,width,192);
  c.strokeStyle=fg;c.globalAlpha=.4;c.strokeRect(12,12,width-24,168);c.globalAlpha=1;
  c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';
  c.font=style%2?'italic 67px Georgia':'500 61px Georgia';c.fillText(title,width/2,76,width-50);
  c.font='17px Arial';c.fillText(subtitle.toUpperCase().split('').join(' '),width/2,143,width-60);
  age(c,width,192);return {texture:texture(element),text:[title,subtitle]};
}
export function notice(title: string, lines: string[], footer='MERIDIAN GALLERIA'): Artwork {
  const {element,c}=canvas(512,640);c.fillStyle='#d9d0af';c.fillRect(0,0,512,640);
  c.fillStyle='#414c43';c.fillRect(0,0,512,112);c.fillStyle='#e4ddc3';c.font='bold 30px Arial';c.textAlign='center';
  c.fillText(title,256,68,464);
  c.fillStyle='#484b3e';c.font='25px Georgia';
  lines.forEach((line,i)=>c.fillText(line,256,190+i*46,450));
  c.strokeStyle='#88816a';c.beginPath();c.moveTo(40,538);c.lineTo(472,538);c.stroke();
  c.font='16px Arial';c.fillText(footer,256,581,452);
  age(c,512,640);return {texture:texture(element),text:[title,...lines,footer]};
}
export function fallPoster(): Artwork {
  const {element,c}=canvas(600,840);c.fillStyle='#d3c499';c.fillRect(0,0,600,840);
  c.fillStyle='#474d3f';c.font='18px Arial';c.textAlign='center';c.fillText('MERIDIAN GALLERIA PRESENTS',300,58);
  c.fillStyle='#986647';c.beginPath();c.arc(430,370,184,0,Math.PI*2);c.fill();
  c.fillStyle='#667563';c.beginPath();c.ellipse(120,400,110,225,-.5,0,Math.PI*2);c.fill();
  for(let i=0;i<7;i++){c.strokeStyle='#d9ba7955';c.lineWidth=2;c.beginPath();c.arc(430,370,50+i*20,0,Math.PI*2);c.stroke();}
  c.fillStyle='#f0e3bb';c.font='italic 100px Georgia';c.fillText('Fall into',305,296);c.fillText('something',300,401);c.fillText('wonderful.',300,506);
  c.fillStyle='#3c483a';c.font='bold 29px Arial';c.fillText('SATURDAY, OCTOBER 16',300,660);
  c.font='23px Georgia';c.fillText('Music. Family. A little magic.',300,713);
  c.font='16px Arial';c.fillText('NOON – 5 PM  /  CENTER COURT',300,767);
  age(c,600,840);return {texture:texture(element),text:['MERIDIAN GALLERIA PRESENTS','Fall into something wonderful.','SATURDAY, OCTOBER 16','Music. Family. A little magic.','NOON – 5 PM / CENTER COURT']};
}
export function directory(): Artwork {
  const {element,c}=canvas(768,1024);c.fillStyle='#d5ccb0';c.fillRect(0,0,768,1024);
  c.fillStyle='#344e45';c.fillRect(0,0,768,150);c.fillStyle='#ece1c0';c.font='45px Georgia';c.fillText('Meridian Galleria',40,72);
  c.font='18px Arial';c.fillText('FIND YOUR EVERYDAY EXTRAORDINARY',43,115);
  c.fillStyle='#405447';c.font='bold 21px Arial';c.fillText('YOU ARE HERE  /  LEVEL 1',42,208);
  c.fillStyle='#7d8d7c';c.fillRect(90,255,580,365);c.fillStyle='#c3b99b';c.fillRect(210,326,340,215);
  c.strokeStyle='#f0e6ca';c.lineWidth=4;c.strokeRect(125,285,510,305);
  c.fillStyle='#54756b';c.beginPath();c.arc(380,440,54,0,Math.PI*2);c.fill();
  c.fillStyle='#e5dcc0';c.font='16px Arial';c.textAlign='center';c.fillText('FOUNTAIN',380,446);
  c.fillStyle='#b27454';c.beginPath();c.arc(382,590,11,0,Math.PI*2);c.fill();
  c.fillStyle='#394b40';c.textAlign='left';
  const entries=['01   Center Court','02   Sunvale Records','03   Dayframe Photo','04   Orbit Amusements','05   Food Court — Level 2'];
  c.font='24px Georgia';entries.forEach((v,i)=>c.fillText(v,70,692+i*44));
  c.font='16px Arial';c.fillText('RESTROOMS ↑     ESCALATORS ↑     EXIT ↓',70,964);
  age(c,768,1024);return {texture:texture(element),text:['Meridian Galleria','FIND YOUR EVERYDAY EXTRAORDINARY','YOU ARE HERE / LEVEL 1',...entries,'RESTROOMS','ESCALATORS','EXIT']};
}
export function menu(kind:number): Artwork {
  const {element,c}=canvas(1536,320);c.fillStyle='#232f2a';c.fillRect(0,0,1536,320);
  const lists=[
    [['Butter croissant','1.75'],['Cinnamon fold','2.25'],['Coffee & pastry','3.50']],
    [['Garden noodles','4.25'],['Chicken bowl','5.50'],['Lunch special','6.95']],
    [['Classic soda','1.25'],['Vanilla float','2.75'],['Orange cream','2.50']]
  ];
  const headings=['BAKED THIS MORNING','MADE FRESH. EVERY DAY.','A LITTLE SOMETHING SWEET.'];
  c.fillStyle='#c2a879';c.font='23px Arial';c.fillText(headings[kind],45,48);
  c.strokeStyle='#b99f6855';c.beginPath();c.moveTo(45,70);c.lineTo(1491,70);c.stroke();
  c.fillStyle='#d4ceaf';c.font='32px Georgia';
  lists[kind].forEach(([name,price],i)=>{c.textAlign='left';c.fillText(name,45,123+i*63);c.textAlign='right';c.fillText('$'+price,1490,123+i*63);});
  c.textAlign='left';c.fillStyle='#8d9a87';c.font='17px Arial';c.fillText('PLEASE ORDER AT THE COUNTER',45,301);
  age(c,1536,320);return {texture:texture(element),text:[headings[kind],...lists[kind].map(([n,p])=>n+' $'+p),'PLEASE ORDER AT THE COUNTER']};
}
export function arcadeScreen(on:boolean): Artwork {
  const {element,c}=canvas(512,512);c.fillStyle=on?'#092325':'#101919';c.fillRect(0,0,512,512);
  if(on){
    c.strokeStyle='#286368';c.lineWidth=2;
    for(let i=0;i<12;i++){c.beginPath();c.moveTo(256,230);c.lineTo(-350+i*100,512);c.stroke();}
    for(let i=0;i<9;i++){const y=242+(i/8)**2*270;c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}
    c.strokeStyle='#b07a98';c.lineWidth=4;c.beginPath();c.arc(256,203,77,Math.PI,Math.PI*2);c.stroke();
    c.fillStyle='#b7d7b3';c.textAlign='center';c.font='bold 46px monospace';c.fillText('STAR DRIFTER',256,99);
    c.font='15px monospace';c.fillText('HIGH SCORE  024850',256,138);
    c.fillStyle='#a5b8a1';c.font='22px monospace';c.fillText('INSERT COIN',256,395);
    c.fillStyle='#627f72';c.font='12px monospace';c.fillText('© 1998 ORBIT AMUSEMENTS',256,470);
  }
  for(let y=0;y<512;y+=4){c.fillStyle='#00000030';c.fillRect(0,y,512,1);}
  const g=c.createRadialGradient(256,256,60,256,256,320);g.addColorStop(0,'#00000000');g.addColorStop(1,'#00000099');c.fillStyle=g;c.fillRect(0,0,512,512);
  return {texture:texture(element),text:on?['STAR DRIFTER','HIGH SCORE 024850','INSERT COIN','© 1998 ORBIT AMUSEMENTS']:[]};
}
export function clockFace(): Artwork {
  const {element,c}=canvas(512,512);c.fillStyle='#c8c6ae';c.beginPath();c.arc(256,256,250,0,Math.PI*2);c.fill();
  c.strokeStyle='#353e36';
  for(let i=0;i<60;i++){const a=i/60*Math.PI*2;c.lineWidth=i%5===0?7:2;c.beginPath();c.moveTo(256+Math.sin(a)*(i%5===0?204:218),256-Math.cos(a)*(i%5===0?204:218));c.lineTo(256+Math.sin(a)*233,256-Math.cos(a)*233);c.stroke();}
  function hand(angle:number,length:number,width:number){c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(256,256);c.lineTo(256+Math.sin(angle)*length,256-Math.cos(angle)*length);c.stroke();}
  hand((8+17/60)/12*Math.PI*2,135,12);hand(17/60*Math.PI*2,191,7);
  c.fillStyle='#353e36';c.beginPath();c.arc(256,256,13,0,Math.PI*2);c.fill();
  c.font='20px Georgia';c.textAlign='center';c.fillText('MERIDIAN',256,350);
  return {texture:texture(element),text:['MERIDIAN']};
}
export function softShadow() {
  const {element,c}=canvas(128,128);
  const gradient=c.createRadialGradient(64,64,10,64,64,63);
  gradient.addColorStop(0,'#15140fe0');gradient.addColorStop(.35,'#1e1c16aa');gradient.addColorStop(1,'#1e1c1600');
  c.fillStyle=gradient;c.fillRect(0,0,128,128);return texture(element);
}
export function scuffs() {
  const {element,c}=canvas(512,512);const rng=random(112);
  for(let i=0;i<40;i++){c.save();c.translate(rng()*512,rng()*512);c.rotate(rng()*6);
    c.strokeStyle='#342a2420';c.lineWidth=1+rng()*3;c.beginPath();c.ellipse(0,0,4+rng()*8,12+rng()*12,0,0,Math.PI*.85);c.stroke();c.restore();}
  return texture(element);
}