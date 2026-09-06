export type Position = { x: number; y: number; z: number };
export type Rect = { x1: number; x2: number; z1: number; z2: number };
export type Obstacle = Rect & { bottom: number; top: number };
export const HEIGHT = 4.8;
export const RADIUS = 0.27;
export const SPEED = 1.8;
export const SPRINT_MULTIPLIER = 2.5;
export const LOOK_SENSITIVITY = .0016;
export function movementSpeed(keys:ReadonlySet<string>){
  return SPEED*(keys.has('ShiftLeft')||keys.has('ShiftRight')?SPRINT_MULTIPLIER:1);
}
export function movementDelta(forward:number,side:number,yaw:number,dt:number,speed:number){
  const length=Math.hypot(forward,side);
  if(length===0)return {x:0,z:0};
  const distance=speed*dt/length;
  return {x:(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*distance,
    z:(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*distance};
}
export const SPAWN: Position = { x: 0, y: 0, z: 19 };
export const ESCALATOR_CENTERS=[-1.55,1.55] as const;
export const NORTH_GALLERY_SEGMENTS=[[-7.4,9.2],[0,.6],[7.4,9.2]] as const;
export const ramps = ESCALATOR_CENTERS.map(x => ({ x1: x - 1.05, x2: x + 1.05, z1: -13, z2: -3 }));
export const ground: Rect[] = [
  { x1: -20, x2: 20, z1: -22, z2: 22 },
  { x1: -30, x2: -19, z1: -6, z2: 8 },
  { x1: 19, x2: 28, z1: 4, z2: 12 },
];
export const upper: Rect[] = [
  { x1: -20, x2: -12, z1: -22, z2: 22 },
  { x1: 12, x2: 20, z1: -22, z2: 22 },
  { x1: -20, x2: 20, z1: 10, z2: 22 },
  { x1: -20, x2: 20, z1: -22, z2: -10 },
];
export const obstacles: Obstacle[] = [];
export function addObstacle(x: number, z: number, w: number, d: number, bottom: number, top: number) {
  obstacles.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2, bottom, top });
}
const inside = (x: number, z: number, r: Rect) => x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2;
function supported(x: number, z: number, surfaces: Rect[]) {
  return [[0,0], [RADIUS,0], [-RADIUS,0], [0,RADIUS], [0,-RADIUS]].every(
    ([dx,dz]) => surfaces.some(r => inside(x + dx, z + dz, r)));
}
export function floorAt(x: number, z: number, currentY: number): number | null {
  // Ramps take precedence over the upper landing, preventing a snap at the balcony edge.
  for (const ramp of ramps) {
    if (inside(x, z, ramp)) {
      if (x < ramp.x1 + RADIUS || x > ramp.x2 - RADIUS) return null;
      const y = (ramp.z2 - z) / (ramp.z2 - ramp.z1) * HEIGHT;
      return Math.abs(y - currentY) <= 0.2 ? y : null;
    }
  }
  if (currentY > HEIGHT - 0.2 && supported(x,z,upper)) return HEIGHT;
  if (currentY < 0.2 && supported(x,z,ground)) return 0;
  return null;
}
function free(x: number, y: number, z: number) {
  return !obstacles.some(o => {
    if (y + 1.7 <= o.bottom + 0.02 || y >= o.top - 0.02) return false;
    const cx = Math.max(o.x1, Math.min(x,o.x2));
    const cz = Math.max(o.z1, Math.min(z,o.z2));
    return (x-cx)**2 + (z-cz)**2 < RADIUS**2;
  });
}
export function canOccupy(p: Position) {
  const y = floorAt(p.x,p.z,p.y);
  return y !== null && free(p.x,y,p.z);
}
export function move(position: Position, dx: number, dz: number): Position {
  const p = { ...position };
  // Substeps prevent tunnelling even when the frame rate drops.
  const count = Math.max(1, Math.ceil(Math.hypot(dx,dz) / 0.07));
  for (let i = 0; i < count; i++) {
    for (const axis of ['x','z'] as const) {
      const next = { ...p, [axis]: p[axis] + (axis === 'x' ? dx : dz) / count };
      const y = floorAt(next.x,next.z,p.y);
      if (y !== null && free(next.x,y,next.z)) { p.x = next.x; p.z = next.z; p.y = y; }
    }
  }
  return p;
}
export function zone(p: Position): string {
  if (p.y > 4.6) return p.z < -14 ? 'Food court' : 'Upper gallery';
  if (p.y > 0.2) return 'Escalators';
  if (p.x < -20) return 'Orbit Amusements';
  if (p.x > 20) return 'Photo booth';
  if (p.z > 17) return 'Main entrance';
  if (p.x < -12) return 'West gallery';
  if (p.x > 12) return 'East gallery';
  return 'Center Court';
}
