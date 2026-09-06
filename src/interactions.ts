export type Interaction={id:string;kind:'read'|'arcade'|'door';label:string;position:[number,number,number];normal:[number,number,number];title:string;byline?:string;paragraphs?:string[]};
export const interactions:Interaction[]=[
 {id:'fall-poster',kind:'read',label:'Read the event poster',position:[5.5,2,21.59],normal:[0,0,-1],title:'Fall into something wonderful.',byline:'MERIDIAN GALLERIA / SATURDAY, OCTOBER 16, 2004',paragraphs:['Music. Family. A little magic.','Join us in Center Court from noon to 5 PM for live music, children’s crafts and a celebration of the season. Admission is free.','Visit the information desk for a full schedule. We look forward to seeing you.']},
 {id:'fountain-notice',kind:'read',label:'Read the fountain notice',position:[0,.51,7.29],normal:[0,0,1],title:'Pardon our appearance.',byline:'MALL MANAGEMENT / MAINTENANCE NOTICE',paragraphs:['The fountain is temporarily out of service.','Please do not enter the basin or remove coins. All collected change will be donated to the Meridian Community Fund when maintenance is complete.','Thank you for your patience while we make improvements.']},
 {id:'relocation',kind:'read',label:'Read the relocation notice',position:[-19.25,2.1,18.3],normal:[1,0,0],title:'We have moved.',byline:'SOFT SEASON / OCTOBER 2004',paragraphs:['Our next chapter is just around the corner.','Thank you for twelve years of familiar faces, last-minute gifts and Saturday afternoons. Your loyalty has meant more than we can say.','Please contact mall management for our new location. We hope to see you again soon.']},
 {id:'tokens',kind:'read',label:'Read the token sign',position:[-29.93,2.1,7],normal:[1,0,0],title:'Four tokens for one dollar.',byline:'ORBIT AMUSEMENTS / CUSTOMER INFORMATION',paragraphs:['Tokens are available from the change machine. Please have your dollar bills ready.','No cash value. No refunds. Tokens may only be used at Orbit Amusements.','If a machine takes your token without starting, please find an attendant. Do not strike the cabinet.']},
 {id:'renovation',kind:'read',label:'Read the renovation notice',position:[-18.7,6.9,-21.94],normal:[0,0,1],title:'Good things are on the way.',byline:'MERIDIAN GALLERIA / COMING THIS NOVEMBER',paragraphs:['A fresh new food court. More choice. More to enjoy.','We are preparing a new place to meet, take a break and find your next favorite meal. Please excuse the temporary closure of selected counters.','Keep watching this space for our reopening date.']},
 {id:'closing-note',kind:'read',label:'Read the closing instructions',position:[27.74,2.2,10.9],normal:[-1,0,0],title:'Before you leave.',byline:'OPERATIONS / CLOSING CHECKLIST',paragraphs:['Switch off advertising lights at the end of the evening. Leave emergency lighting and the east corridor circuit on.','Check the public entrances, return loose chairs to storage and leave the fountain barriers in place.','Do not reset the Center Court clock. Maintenance has been notified.','Leave the keys in the usual place.']},
 {id:'arcade',kind:'arcade',label:'Press the start button',position:[-27.16,1.05,1],normal:[1,0,0],title:'NO CREDIT',paragraphs:['The button clicks. The attract screen carries on.']},
 {id:'staff-door',kind:'door',label:'Try the staff door',position:[27.73,1.04,10.52],normal:[-1,0,0],title:'LOCKED',paragraphs:['The handle turns a little, then stops.']},
];
export function pickInteraction(eye:{x:number;y:number;z:number},direction:{x:number;y:number;z:number},visible:(item:Interaction,distance:number)=>boolean=()=>true){
 let best:Interaction|undefined,score=-Infinity;
 for(const item of interactions){
  const dx=item.position[0]-eye.x,dy=item.position[1]-eye.y,dz=item.position[2]-eye.z,distance=Math.hypot(dx,dy,dz);
  if(distance>2.8||distance<.1)continue;
  if(-dx*item.normal[0]-dy*item.normal[1]-dz*item.normal[2]<.15)continue;
  const alignment=(dx*direction.x+dy*direction.y+dz*direction.z)/distance;
  if(alignment<.965)continue;
  const priority=alignment-distance*.008;
  if(priority>score&&visible(item,distance)){best=item;score=priority;}
 }
 return best;
}