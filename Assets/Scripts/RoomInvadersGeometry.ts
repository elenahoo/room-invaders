/** Original MeshBuilder art. Owns geometry only; centimeter dimensions, +Z-facing eyes toward player. */
export type Color=[number,number,number,number];
export function obj(parent:SceneObject,name:string,p:vec3=new vec3(0,0,0)):SceneObject {
  const o=global.scene.createSceneObject(name);o.setParent(parent);o.getTransform().setLocalPosition(p);return o;
}
export class Geometry {
  constructor(private organic=false) {}
  private v:number[]=[];
  private ind:number[]=[];
  private vertex(p:number[],n:number[],c:Color):number {
    const id=this.v.length/10;
    // Baked gentle directional shading makes the unlit vertex material legible on an additive display.
    const grain=this.organic?(0.96+0.04*Math.sin(p[0]*2.37+p[1]*1.31+p[2]*2.73)*Math.sin(p[1]*3.1-p[2])):1;
    const light=(this.organic?0.68+0.32*Math.max(0,n[1]*0.7+n[2]*0.7-n[0]*0.2):0.72+0.28*Math.max(0,n[1]*0.7+n[2]*0.7-n[0]*0.2))*grain;
    this.v.push(...p,...n,c[0]*light,c[1]*light,c[2]*light,c[3]);return id;
  }
  sphere(x:number,y:number,z:number,rx:number,ry:number,rz:number,c:Color):void {
    const start=this.v.length/10,rows=10,cols=16;
    for(let a=0;a<=rows;a++) for(let b=0;b<=cols;b++) {
      const t=a/rows*Math.PI,p=b/cols*Math.PI*2;
      const n=[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)];
      this.vertex([x+rx*n[0],y+ry*n[1],z+rz*n[2]],n,c);
    }
    for(let a=0;a<rows;a++) for(let b=0;b<cols;b++) {
      const i=start+a*(cols+1)+b,j=i+cols+1;
      this.ind.push(i,i+1,j,j,i+1,j+1);
    }
  }
  box(x:number,y:number,z:number,w:number,h:number,d:number,c:Color):void {
    const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
    const face=(p:number[][],n:number[])=>{
      const ids=p.map(v=>this.vertex(v,n,c));this.ind.push(ids[0],ids[1],ids[2],ids[0],ids[2],ids[3]);
    };
    face([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],[1,0,0]);
    face([[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[x0,y0,z0]],[-1,0,0]);
    face([[x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0]],[0,1,0]);
    face([[x0,y0,z1],[x0,y0,z0],[x1,y0,z0],[x1,y0,z1]],[0,-1,0]);
    face([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1]);
    face([[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],[0,0,-1]);
  }
  /** Swept, tapering organic tube; triangle normals are checked against outward vertex normals. */
  tube(points:number[][],radii:number[],color:Color,sides=10):void {
    const start=this.v.length/10;
    points.forEach((p,i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
      const tangent=new vec3(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize();
      const ref=Math.abs(tangent.y)>.9?vec3.forward():vec3.up();
      const u=ref.cross(tangent).normalize(),v=tangent.cross(u).normalize();
      for(let k=0;k<=sides;k++){
        const t=k/sides*Math.PI*2,n=u.uniformScale(Math.cos(t)).add(v.uniformScale(Math.sin(t)));
        this.vertex([p[0]+n.x*radii[i],p[1]+n.y*radii[i],p[2]+n.z*radii[i]],[n.x,n.y,n.z],color);
      }
    });
    const tri=(a:number,b:number,c:number)=>{
      const p=(id:number)=>new vec3(this.v[id*10],this.v[id*10+1],this.v[id*10+2]);
      const n=new vec3(this.v[a*10+3]+this.v[b*10+3]+this.v[c*10+3],this.v[a*10+4]+this.v[b*10+4]+this.v[c*10+4],this.v[a*10+5]+this.v[b*10+5]+this.v[c*10+5]);
      if(p(b).sub(p(a)).cross(p(c).sub(p(a))).dot(n)<0)this.ind.push(a,c,b);else this.ind.push(a,b,c);
    };
    for(let i=0;i<points.length-1;i++)for(let k=0;k<sides;k++){
      const a=start+i*(sides+1)+k,b=a+sides+1;tri(a,a+1,b);tri(b,a+1,b+1);
    }
    // Close both nonzero-radius ends.
    for(const i of [0,points.length-1]){
      const p=points[i],j=i===0?1:i-1,q=points[j],n=new vec3(p[0]-q[0],p[1]-q[1],p[2]-q[2]).normalize();
      const center=this.vertex(p,[n.x,n.y,n.z],color);
      for(let k=0;k<sides;k++)tri(center,start+i*(sides+1)+k,start+i*(sides+1)+k+1);
    }
  }
  draw(parent:SceneObject,name:string,material:Material):SceneObject {
    const o=obj(parent,name),b=new MeshBuilder([{name:'position',components:3},{name:'normal',components:3,normalized:true},{name:'color',components:4}]);
    b.topology=MeshTopology.Triangles;b.indexType=MeshIndexType.UInt16;
    b.appendVerticesInterleaved(this.v);b.appendIndices(this.ind);
    const v=o.createComponent('Component.RenderMeshVisual') as RenderMeshVisual;
    v.mesh=b.getMesh();v.mainMaterial=material;b.updateMesh();return o;
  }
}
export function creature(parent:SceneObject,material:Material,color:Color,friend=false):SceneObject {
  const root=obj(parent,friend?'PipVisual':'InvaderVisual');
  const g=new Geometry();g.sphere(0,1,0,8,9,6.2,color);
  g.sphere(-6,10,0,1.6,3.5,1.7,color);g.sphere(6,10,0,1.6,3.5,1.7,color);
  const white:Color=[0.94,1,1,1],ink:Color=[0.06,0.09,0.23,1];
  g.sphere(0,-2,6,friend?2.2:3,0.8,0.6,ink);g.draw(root,'Body',material);
  const feet=new Geometry();
  for(let i=0;i<5;i++) feet.sphere((i-2)*3.2,-7,0,2.6,4,3,color);
  feet.draw(root,'Tentacles',material);
  const eyeMesh=new Geometry();
  const eyes=friend?[-3,3]:[0];
  for(const x of eyes) {eyeMesh.sphere(x,3.5,5.6,friend?2.9:4.8,friend?3.2:4.8,2.2,white);
    eyeMesh.sphere(x,3.6,7.6,friend?1.4:2.4,friend?1.8:2.8,0.85,ink);
    eyeMesh.sphere(x-0.5,4.6,8.2,0.65,0.8,0.4,white);}
  eyeMesh.draw(root,'Eyes',material);return root;
}
export function animateCreature(visual:SceneObject,time:number):void {
  visual.getChild(1).getTransform().setLocalRotation(quat.fromEulerAngles(0,0,Math.sin(time*5)*0.1));
  const blink=Math.sin(time*1.9)>0.985?0.16:1;
  visual.getChild(2).getTransform().setLocalScale(new vec3(1,blink,1));
}
/** Small spatial placement marker; this is gameplay geometry, not a UI control. */
export function surfaceMarker(parent:SceneObject,material:Material,name:string,color:Color):SceneObject {
  const g=new Geometry();
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;g.sphere(Math.cos(a)*5,0,Math.sin(a)*5,0.65,0.35,0.65,color);}
  g.sphere(0,0,0,1,0.4,1,color);return g.draw(parent,name,material);
}
export function lockVisual(parent:SceneObject,material:Material,color:Color):SceneObject {
  const g=new Geometry();g.box(0,0,0,6.5,5.5,3,color);
  g.sphere(0,3,0,2.6,3,1.3,color);g.sphere(0,0,1.7,0.7,1,0.3,[0.96,1,1,1]);return g.draw(parent,'LockVisual',material);
}
export function cage(parent:SceneObject,material:Material,color:Color):SceneObject {
  const g=new Geometry();
  for(const x of [-11,11]) g.box(x,0,6,0.7,26,0.7,color);
  for(const y of [-12,12]) g.box(0,y,6,23,0.7,0.7,color);
  g.box(0,0,6,0.6,24,0.6,color);return g.draw(parent,'CageBars',material);
}
