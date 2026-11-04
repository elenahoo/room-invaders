/** Local geometric feature scan. No semantic object labels, uploads or fabricated hit positions. */
export type SurfaceSample={position:vec3;normal:vec3;camera:vec3;seen:number;stable:number};
export function suitableSurface(s:SurfaceSample):boolean {
  const p=s.position,n=s.normal,c=s.camera;
  if(![p.x,p.y,p.z,n.x,n.y,n.z].every(Number.isFinite))return false;
  const distance=p.sub(c).length,height=p.y-c.y;
  return distance>=60&&distance<=600&&height>=-145&&height<=45&&n.y> -0.35&&n.length>0.8;
}
/** Geometric feature helper retained for manual/diagnostic use. Automatic candidates prefer raised tops. */
export function hasSurfaceFeature(s:SurfaceSample,neighbors:SurfaceSample[]):boolean {
  if(s.normal.y>0.45)return true;
  return neighbors.some(t=>{
    const d=t.position.sub(s.position),length=d.length;
    return t!==s&&length>=8&&length<=100&&d.dot(s.normal)<-4;
  });
}
export class RoomInvadersAutoScan {
  private grid:vec2[]=[];
  private floorY:number|null=null;
  private observations=0;
  setFloor(y:number):void {if(Number.isFinite(y))this.floorY=this.floorY===null?y:Math.min(y,this.floorY);}
  diagnostics(){return {groundEstimate:this.floorY,observations:this.observations,samples:this.samples.length,raisedTopCount:this.samples.filter(s=>this.aboveGround(s.position)&&s.normal.y>.55).length};}
  aboveGround(p:vec3):boolean {return this.floorY!==null&&p.y>this.floorY+22;}
  private index=0;
  private samples:SurfaceSample[]=[];
  private scanningSince=0;
  constructor(){for(const y of [0.8,0.5,0.2,0.95,0.65,0.35])for(const x of [0.2,0.35,0.5,0.65,0.8])this.grid.push(new vec2(x,y));this.reset();}
  reset():void {this.floorY=null;this.observations=0;this.index=0;this.samples=[];this.scanningSince=getTime();}
  next():vec2 {return this.grid[this.index++%this.grid.length];}
  accept(position:vec3,normal:vec3,camera:vec3):void {
    if(normal.length<0.8)return;
    this.observations++;
    // Conservative ground estimate: lowest measured upward surface in the survey.
    // Observe lower surfaces even when too low to be selected as a spawn.
    if(normal.normalize().y>.8&&position.y<camera.y-90)this.setFloor(position.y);
    const now=getTime(),s={position,normal:normal.normalize(),camera,seen:now,stable:1};
    if(!suitableSurface(s))return;
    this.samples=this.samples.filter(t=>now-t.seen<24);
    const old=this.samples.find(t=>t.position.sub(position).length<8&&t.normal.dot(s.normal)>0.9);
    if(old){if(now-old.seen>0.35)s.stable=old.stable+1;else s.stable=old.stable;
      this.samples.splice(this.samples.indexOf(old),1);}
    this.samples.push(s);if(this.samples.length>160)this.samples.shift();
  }
  candidate(selected:vec3[],origin:vec3):SurfaceSample|null {
    if(this.observations<48)return null;
    return this.samples.filter(s=>getTime()-s.seen<3&&s.stable>=2&&this.aboveGround(s.position)&&(selected.length===0?hasSurfaceFeature(s,this.samples):s.normal.y>.55)
      &&distanceFits(s.position,origin,selected)&&selected.every(p=>p.sub(s.position).length>=75))
      .sort((a,b)=>(b.normal.y>0.45?1:0)-(a.normal.y>0.45?1:0)||b.stable-a.stable)[0]??null;
  }
  message(count:number):string {
    return getTime()-this.scanningSince<12?'Scanning '+(count===0?'near (1–2.5 m)':'far (3–6 m)')+' room surface. '+count+'/3 found.'
      :'Look '+(count===0?'down toward nearby furniture':'toward farther furniture')+', or use Place myself. '+count+'/3 found.';
  }
}

/** Measured setup distances from one fixed player origin, in Lens centimetres. */
export function distanceFits(p:vec3,origin:vec3,selected:vec3[]):boolean{
 const d=p.sub(origin).length;
 return selected.length===0?d>=100&&d<=250:d>=300&&d<=600&&d>=selected[0].sub(origin).length+100;
}
