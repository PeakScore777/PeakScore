"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import Image from "next/image";

export type ArchivoLibrarySuspect = { id: string; name: string; role: string; description: string; motive: string; alibi: string; imageUrl: string | null };
export type ArchivoLibraryStory = { id: string; title: string; completed?: boolean; questions: { id: string }[] };

type Props = {
  stories: ArchivoLibraryStory[];
  suspectCards?: ArchivoLibrarySuspect[];
  showSuspects?: boolean;
  inspectionMode?: boolean;
  readingMode?: boolean;
  onInspectionSettled?: () => void;
  onSelectSuspect?: (suspect: ArchivoLibrarySuspect) => void;
  onOpenComputer?: () => void;
  onSelect: (story: ArchivoLibraryStory) => void;
  disabled?: boolean;
  pauseRender?: boolean;
  returnBookToShelfToken?: number;
  suspectFolderTitle?: string;
  suspectFolderCode?: string;
};

const TRIM = "#70482b";

function makeWoodTexture(base: string, grain: string, repeat: [number, number]) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 48; i += 1) {
    const y = (i * 37) % canvas.height;
    ctx.strokeStyle = i % 4 === 0 ? grain : "rgba(20,10,5,.12)";
    ctx.globalAlpha = i % 4 === 0 ? 0.34 : 0.22;
    ctx.lineWidth = i % 7 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(70, y - 3, 170, y + 4, canvas.width, y + ((i % 3) - 1) * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 2;
  return texture;
}

function makeCanvasTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void, size = 768) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createArchiveArtTexture(kind: "landscape" | "cyber-detective") {
  return makeCanvasTexture((ctx,size)=>{
    const paper=ctx.createLinearGradient(0,0,size,size);
    paper.addColorStop(0,"#e8d8b7");paper.addColorStop(.52,"#d8c49d");paper.addColorStop(1,"#b99d72");
    ctx.fillStyle=paper;ctx.fillRect(0,0,size,size);
    // Gallery canvas, warm varnish and a restrained gilt inner edge.
    ctx.fillStyle="#eee0bd";ctx.fillRect(24,24,size-48,size-48);
    ctx.save();ctx.beginPath();ctx.rect(42,42,size-84,size-84);ctx.clip();
    if(kind==="landscape"){
      const sky=ctx.createLinearGradient(0,42,0,size*.68);
      sky.addColorStop(0,"#596f78");sky.addColorStop(.38,"#a8a28b");sky.addColorStop(.72,"#e4b77f");sky.addColorStop(1,"#bd8d65");
      ctx.fillStyle=sky;ctx.fillRect(42,42,size-84,size*.62);
      const glow=ctx.createRadialGradient(size*.68,size*.35,5,size*.68,size*.35,size*.34);
      glow.addColorStop(0,"rgba(255,225,171,.9)");glow.addColorStop(1,"rgba(255,225,171,0)");
      ctx.fillStyle=glow;ctx.fillRect(42,42,size-84,size*.68);
      ctx.fillStyle="#f4d7a2";ctx.beginPath();ctx.arc(size*.68,size*.35,size*.055,0,Math.PI*2);ctx.fill();
      const mountain=(pts: Array<[number, number]>,color: string)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(42,size*.8);pts.forEach(([x,y])=>ctx.lineTo(size*x,size*y));ctx.lineTo(size-42,size*.8);ctx.closePath();ctx.fill();};
      mountain([[.05,.57],[.18,.39],[.29,.53],[.43,.28],[.53,.48],[.68,.32],[.82,.52],[.95,.4]],"#71817a");
      mountain([[.05,.64],[.2,.49],[.34,.62],[.49,.43],[.61,.59],[.77,.42],[.95,.61]],"#596f60");
      // Snowlit ridges and soft broken cloud strokes.
      ctx.strokeStyle="rgba(247,229,194,.58)";ctx.lineWidth=8;ctx.lineCap="round";
      [[.43,.28,.38,.39],[.68,.32,.63,.42],[.18,.39,.14,.48]].forEach(([x,y,x2,y2])=>{ctx.beginPath();ctx.moveTo(size*x,size*y);ctx.lineTo(size*x2,size*y2);ctx.stroke();});
      const water=ctx.createLinearGradient(0,size*.61,0,size*.91);
      water.addColorStop(0,"#b2a78b");water.addColorStop(.4,"#728b82");water.addColorStop(1,"#3e625f");
      ctx.fillStyle=water;ctx.beginPath();ctx.moveTo(42,size*.63);ctx.bezierCurveTo(size*.25,size*.57,size*.38,size*.72,size*.56,size*.65);ctx.bezierCurveTo(size*.75,size*.58,size*.83,size*.68,size-42,size*.61);ctx.lineTo(size-42,size*.89);ctx.bezierCurveTo(size*.72,size*.82,size*.53,size*.92,size*.35,size*.82);ctx.bezierCurveTo(size*.2,size*.75,size*.12,size*.85,42,size*.88);ctx.closePath();ctx.fill();
      // Banks, distant pines and foreground foliage create painterly depth.
      for(let i=0;i<125;i++){
        const x=size*(.05+(i*47%90)/100),y=size*(.59+(i*29%24)/100),h=size*(.025+(i%7)*.009);
        ctx.strokeStyle=i%3?"rgba(42,65,48,.55)":"rgba(174,142,91,.6)";ctx.lineWidth=2+(i%3);
        ctx.beginPath();ctx.moveTo(x,y+h);ctx.quadraticCurveTo(x-size*.012,y+h*.35,x+size*.006,y-h);ctx.stroke();
      }
      for(let i=0;i<44;i++){
        const x=size*(.04+(i*61%92)/100),y=size*(.71+(i*17%25)/100),r=size*(.012+(i%5)*.009);
        ctx.fillStyle=i%3===0?"#263f32":i%3===1?"#536b48":"#7b8154";
        ctx.beginPath();ctx.ellipse(x,y,r*1.5,r*.8,(i%5)*.2,0,Math.PI*2);ctx.fill();
      }
      // Visible, varied impasto brush marks rather than geometric map lines.
      for(let i=0;i<520;i++){
        const x=size*(.06+(i*73%88)/100),y=size*(.08+(i*41%82)/100),w=size*(.012+(i%6)*.009);
        ctx.strokeStyle=i%4===0?"rgba(247,222,176,.2)":i%4===1?"rgba(35,58,47,.14)":i%4===2?"rgba(203,151,105,.18)":"rgba(238,229,199,.16)";
        ctx.lineWidth=2+(i%5)*1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+w*.45,y-size*.004,x+w,y+size*.003);ctx.stroke();
      }
    } else {
      // Original cyber-forensics investigator portrait, painted like an oil-on-canvas study.
      const bg=ctx.createLinearGradient(0,42,size,size*.88);
      bg.addColorStop(0,"#172a31");bg.addColorStop(.55,"#31463f");bg.addColorStop(1,"#111d22");
      ctx.fillStyle=bg;ctx.fillRect(42,42,size-84,size-84);
      // Dim evidence-room glow and circuit-board traces.
      const halo=ctx.createRadialGradient(size*.52,size*.34,8,size*.52,size*.34,size*.52);
      halo.addColorStop(0,"rgba(197,157,99,.36)");halo.addColorStop(1,"rgba(197,157,99,0)");
      ctx.fillStyle=halo;ctx.fillRect(42,42,size-84,size-84);
      ctx.strokeStyle="rgba(115,166,154,.26)";ctx.lineWidth=4;
      for(let i=0;i<13;i++){
        const y=size*(.12+i*.06);ctx.beginPath();ctx.moveTo(size*.08,y);ctx.lineTo(size*(.24+(i%3)*.06),y);ctx.lineTo(size*(.31+(i%4)*.05),y+size*.08);ctx.stroke();
        ctx.beginPath();ctx.arc(size*(.24+(i%3)*.06),y,6,0,Math.PI*2);ctx.stroke();
      }
      // Coat and shoulders, with layered painterly highlights.
      ctx.fillStyle="#101a20";ctx.beginPath();ctx.moveTo(size*.18,size*.86);ctx.quadraticCurveTo(size*.2,size*.67,size*.39,size*.62);ctx.lineTo(size*.62,size*.62);ctx.quadraticCurveTo(size*.83,size*.69,size*.86,size*.86);ctx.closePath();ctx.fill();
      ctx.fillStyle="#31434a";ctx.beginPath();ctx.moveTo(size*.38,size*.62);ctx.lineTo(size*.5,size*.78);ctx.lineTo(size*.62,size*.62);ctx.lineTo(size*.7,size*.86);ctx.lineTo(size*.3,size*.86);ctx.closePath();ctx.fill();
      // Neck and face in warm chiaroscuro.
      ctx.fillStyle="#9b7355";ctx.fillRect(size*.445,size*.51,size*.11,size*.15);
      const face=ctx.createRadialGradient(size*.45,size*.36,10,size*.5,size*.4,size*.2);
      face.addColorStop(0,"#d8b18a");face.addColorStop(.72,"#a97857");face.addColorStop(1,"#64483c");
      ctx.fillStyle=face;ctx.beginPath();ctx.ellipse(size*.5,size*.42,size*.145,size*.205,0,0,Math.PI*2);ctx.fill();
      // Hair, focused brow, eyes and short beard: an original adult investigator.
      ctx.fillStyle="#172126";ctx.beginPath();ctx.ellipse(size*.5,size*.285,size*.16,size*.085,0,Math.PI,Math.PI*2);ctx.fill();
      ctx.fillRect(size*.35,size*.31,size*.3,size*.045);
      ctx.strokeStyle="#382c27";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(size*.405,size*.405);ctx.lineTo(size*.46,size*.414);ctx.moveTo(size*.54,size*.414);ctx.lineTo(size*.595,size*.405);ctx.stroke();
      ctx.fillStyle="#202c2e";ctx.beginPath();ctx.ellipse(size*.5,size*.56,size*.09,size*.055,0,0,Math.PI);ctx.fill();
      // Raised hand holding a magnifier over a digital evidence clue.
      ctx.strokeStyle="#c39b68";ctx.lineWidth=13;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(size*.65,size*.65);ctx.lineTo(size*.72,size*.56);ctx.stroke();
      ctx.strokeStyle="#c6a36b";ctx.lineWidth=12;ctx.beginPath();ctx.arc(size*.75,size*.48,size*.105,0,Math.PI*2);ctx.stroke();
      const lens=ctx.createRadialGradient(size*.72,size*.45,2,size*.75,size*.48,size*.1);
      lens.addColorStop(0,"rgba(132,190,183,.35)");lens.addColorStop(1,"rgba(54,112,113,.12)");
      ctx.fillStyle=lens;ctx.beginPath();ctx.arc(size*.75,size*.48,size*.09,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="rgba(179,220,208,.8)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(size*.7,size*.48);ctx.lineTo(size*.8,size*.48);ctx.moveTo(size*.75,size*.43);ctx.lineTo(size*.75,size*.53);ctx.stroke();
      // A few golden case-file marks make the subject read as digital forensics.
      ctx.fillStyle="#d2b27a";ctx.font="bold 25px Georgia";ctx.fillText("DIGITAL FORENSICS",size*.5,size*.93);
      ctx.strokeStyle="rgba(210,178,122,.48)";ctx.lineWidth=3;ctx.strokeRect(size*.1,size*.1,size*.8,size*.78);
      for(let i=0;i<320;i++){
        const x=size*(.08+(i*67%84)/100),y=size*(.08+(i*37%82)/100),w=size*(.008+(i%4)*.006);
        ctx.strokeStyle=i%2?"rgba(239,210,166,.11)":"rgba(105,159,149,.13)";
        ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y-size*.003);ctx.stroke();
      }    }
    ctx.restore();
    // Fine gilt gallery frame printed inside the canvas, plus subtle aged varnish.
    ctx.strokeStyle="#8b653a";ctx.lineWidth=8;ctx.strokeRect(31,31,size-62,size-62);
    ctx.strokeStyle="rgba(255,237,190,.62)";ctx.lineWidth=2;ctx.strokeRect(40,40,size-80,size-80);
    const varnish=ctx.createLinearGradient(0,0,size,size);varnish.addColorStop(0,"rgba(255,242,208,.08)");varnish.addColorStop(1,"rgba(83,53,30,.08)");
    ctx.fillStyle=varnish;ctx.fillRect(42,42,size-84,size-84);
  },768);
}

function CurtainPanel({ side }: { side: -1 | 1 }) {
  const geometry=useMemo(()=>{
    const width=.42,height=1.48,columns=14,rows=16,positions:number[]=[],indices:number[]=[];
    for(let row=0;row<=rows;row++){const v=row/rows;for(let col=0;col<=columns;col++){const u=col/columns,pleat=Math.cos(u*Math.PI*8)*.052,gather=Math.pow(v,2)*Math.sin(u*Math.PI*8)*.018;positions.push((u-.5)*width+pleat*.18,(.5-v)*height,pleat+gather);}}
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const a=row*(columns+1)+col,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
  },[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <group position={[side*.99,-.015,.17]}>
    <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#34463a" roughness={.98} side={THREE.DoubleSide}/></mesh>
    {Array.from({length:7},(_,i)=><mesh key={i} position={[(i-3)*.061,0,.045]}><cylinderGeometry args={[.007,.007,1.43,5]}/><meshStandardMaterial color="#64745c" roughness={1}/></mesh>)}
    <mesh position={[0,-.71,.025]}><boxGeometry args={[.46,.075,.12]}/><meshStandardMaterial color="#2a382e" roughness={.96}/></mesh>
    <mesh position={[0,-.43,.095]}><torusGeometry args={[.105,.016,6,18,Math.PI]}/><meshStandardMaterial color="#b28a51" metalness={.68} roughness={.32}/></mesh>
    <mesh position={[0,.73,.035]}><boxGeometry args={[.47,.055,.12]}/><meshStandardMaterial color="#795536" roughness={.7}/></mesh>
  </group>;
}

function RainStreaks() {
  const group=useRef<THREE.Group>(null);
  const {invalidate}=useThree();
  const lastFrame=useRef(0);
  useEffect(()=>{
    let frame=0;
    let lastInvalidation=0;
    const tick=(now:number)=>{
      if(now-lastInvalidation>=1000/24){
        invalidate();
        lastInvalidation=now;
      }
      frame=window.requestAnimationFrame(tick);
    };
    frame=window.requestAnimationFrame(tick);
    return ()=>window.cancelAnimationFrame(frame);
  },[invalidate]);
  useFrame((state,delta)=>{
    if(!group.current || state.clock.elapsedTime-lastFrame.current<1/24)return;
    lastFrame.current=state.clock.elapsedTime;
    for(const drop of group.current.children){
      drop.position.y-=delta*(.42+(drop.userData.speed as number));
      drop.position.x+=delta*.035;
      if(drop.position.y<-.76){drop.position.y=.76;drop.position.x=-1.18+Math.random()*2.36;}
    }
  });
  return <group ref={group} position={[0,0,.105]}>
    {Array.from({length:34},(_,i)=>{
      const x=((i*37)%100)/100*2.38-1.19,y=((i*61)%100)/100*1.38-.69;
      return <mesh key={i} position={[x,y,0]} rotation={[0,0,-.08]} userData={{speed:(i%5)*.16}}>
        <boxGeometry args={[.006,.075+(i%4)*.025,.003]}/>
        <meshBasicMaterial color={i%4===0?"#a9c4c9":"#d2e0e4"} transparent opacity={.24+(i%4)*.035} depthWrite={false}/>
      </mesh>;
    })}
  </group>;
}

function WindowAssembly({ side }: { side: -1 | 1 }) {
  return <group position={[side*7.28,2.55,-1.55]} rotation={[0,-side*Math.PI/2,0]}>
    {/* Matte near-black storm glass: the outside disappears into the night. */}
    <mesh position={[0,0,-.095]}><boxGeometry args={[2.62,1.72,.18]}/><meshStandardMaterial color="#100f12" roughness={.96}/></mesh>
    <mesh position={[0,0,-.025]}><boxGeometry args={[2.52,1.66,.12]}/><meshStandardMaterial color="#211b19" roughness={.72}/></mesh>
    <mesh position={[0,0,.045]}><planeGeometry args={[2.32,1.43]}/><meshBasicMaterial color="#080d12" toneMapped={false} side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,0,.052]}><planeGeometry args={[2.32,1.43]}/><meshPhysicalMaterial color="#24333a" transparent opacity={.16} roughness={.18} metalness={.12} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    <RainStreaks/>
    {/* Deep oak sash and narrow mullions, visible against the dark glass. */}
    {[-1,1].map(x=><mesh key={"v"+x} position={[x*1.22,0,.105]}><boxGeometry args={[.12,1.55,.16]}/><meshStandardMaterial color="#593820" roughness={.5}/></mesh>)}
    {[-1,1].map(y=><mesh key={"h"+y} position={[0,y*.78,.105]}><boxGeometry args={[2.48,.12,.16]}/><meshStandardMaterial color="#593820" roughness={.5}/></mesh>)}
    <mesh position={[0,0,.11]}><boxGeometry args={[.075,1.48,.17]}/><meshStandardMaterial color="#68472b" roughness={.48}/></mesh>
    <mesh position={[0,0,.11]}><boxGeometry args={[2.32,.065,.17]}/><meshStandardMaterial color="#68472b" roughness={.48}/></mesh>
    {[-1,1].map(x=><mesh key={"rail"+x} position={[x*1.29,0,.12]}><boxGeometry args={[.09,1.7,.18]}/><meshStandardMaterial color="#a77b48" metalness={.22} roughness={.48}/></mesh>)}
    {[-1,1].map(y=><mesh key={"cap"+y} position={[0,y*.83,.12]}><boxGeometry args={[2.66,.085,.18]}/><meshStandardMaterial color="#a77b48" metalness={.22} roughness={.48}/></mesh>)}
    <mesh position={[0,-.91,.16]}><boxGeometry args={[2.78,.14,.42]}/><meshStandardMaterial color="#754b2d" roughness={.48}/></mesh>
    <mesh position={[0,-.825,.27]}><boxGeometry args={[2.7,.035,.2]}/><meshStandardMaterial color="#b38a55" metalness={.4} roughness={.42}/></mesh>
    <mesh position={[0,-.04,.205]}><boxGeometry args={[.045,.22,.035]}/><meshStandardMaterial color="#c7a064" metalness={.8} roughness={.25}/></mesh>
    <CurtainPanel side={-1}/><CurtainPanel side={1}/>
    {[-1,1].map(x=><mesh key={"tie"+x} position={[x*.99,-.38,.25]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.085,.012,6,16]}/><meshStandardMaterial color="#c19a60" metalness={.72} roughness={.3}/></mesh>)}
  </group>;
}

const BOTANICAL_LEAF_GEOMETRY = (() => {
  const positions: number[] = [], indices: number[] = [];
  const rows = 8, columns = 6;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    // Pointed elliptical outline with a gentle cupped surface and raised midrib.
    const width = Math.pow(Math.sin(Math.PI * t), 0.78) * 0.48;
    for (let col = 0; col <= columns; col++) {
      const u = col / columns * 2 - 1;
      const camber = (1 - Math.abs(u)) * (0.035 + Math.sin(t * Math.PI) * 0.045);
      positions.push(u * width, t, camber);
    }
  }
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const a = row * (columns + 1) + col, b = a + columns + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
})();
const BOTANICAL_BRANCH_GEOMETRY = new THREE.CylinderGeometry(0.014, 0.035, 1, 7);
const BOTANICAL_NEEDLE_GEOMETRY = new THREE.ConeGeometry(0.5, 1, 5, 1);
const BOTANICAL_NEEDLE_MATERIAL = new THREE.MeshStandardMaterial({color:"#294b32",roughness:1});
const BOTANICAL_POT_GEOMETRY = new THREE.LatheGeometry([
  new THREE.Vector2(.18,0),new THREE.Vector2(.22,.035),new THREE.Vector2(.28,.34),
  new THREE.Vector2(.31,.39),new THREE.Vector2(.34,.42),new THREE.Vector2(.31,.46),
  new THREE.Vector2(.27,.42),new THREE.Vector2(.25,.36),new THREE.Vector2(.21,.07)
],20);
const BOTANICAL_BARK = new THREE.MeshStandardMaterial({color:"#76503a",roughness:.96});
const BOTANICAL_POT = new THREE.MeshStandardMaterial({color:"#805039",roughness:.84});
const BOTANICAL_SOIL = new THREE.MeshStandardMaterial({color:"#302316",roughness:1});
const BOTANICAL_LEAF_MATERIALS = {
  ficus:new THREE.MeshStandardMaterial({color:"#527b43",roughness:.94,side:THREE.DoubleSide}),
  pine:new THREE.MeshStandardMaterial({color:"#315a3c",roughness:.98,side:THREE.DoubleSide}),
  olive:new THREE.MeshStandardMaterial({color:"#89936c",roughness:.96,side:THREE.DoubleSide}),
  fern:new THREE.MeshStandardMaterial({color:"#5c8849",roughness:.96,side:THREE.DoubleSide}),
};
type BotanicalKind = "ficus" | "pine" | "olive" | "fern";
type BotanicalMatrices = {branches:THREE.Matrix4[];leaves:THREE.Matrix4[];needles:THREE.Matrix4[]};

function botanicalBranch(start:THREE.Vector3,end:THREE.Vector3,thickness=1){
  const direction=end.clone().sub(start),length=direction.length();
  const quaternion=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
  return new THREE.Matrix4().compose(start.clone().add(end).multiplyScalar(.5),quaternion,new THREE.Vector3(thickness,length,thickness));
}
function botanicalLeaf(position:THREE.Vector3,direction:THREE.Vector3,scale:[number,number,number],roll=0){
  const quaternion=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
  quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),roll));
  return new THREE.Matrix4().compose(position,quaternion,new THREE.Vector3(...scale));
}
function createBotanicalMatrices(kind:BotanicalKind):BotanicalMatrices{
  const branches:THREE.Matrix4[]=[],leaves:THREE.Matrix4[]=[],needles:THREE.Matrix4[]=[];
  const branch=(a:[number,number,number],b:[number,number,number],thickness=1)=>
    branches.push(botanicalBranch(new THREE.Vector3(...a),new THREE.Vector3(...b),thickness));
  const leaf=(x:number,y:number,z:number,dx:number,dy:number,dz:number,sx:number,sy:number,sz:number,roll=0)=>
    leaves.push(botanicalLeaf(new THREE.Vector3(x,y,z),new THREE.Vector3(dx,dy,dz),[sx,sy,sz],roll));
  const random=(seed:number)=>{const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n);};
  const needle=(x:number,y:number,z:number,dx:number,dy:number,dz:number,length:number)=>{
    const direction=new THREE.Vector3(dx,dy,dz).normalize();
    const quaternion=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
    needles.push(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),quaternion,new THREE.Vector3(.022,length,.022)));
  };

  if(kind==="ficus"){
    // Ficus benjamina: a sturdy tapered trunk, seven scaffold limbs and a
    // rounded, layered canopy. Leaves are distributed around the full 360°.
    branch([0,.43,0],[.035,1.92,0],1.45);
    for(let limb=0;limb<8;limb++){
      const a=limb*Math.PI*2/8+.17;
      const y=1.02+(limb%3)*.19,r=.48+(limb%2)*.13;
      const tip:[number,number,number]=[Math.cos(a)*r,y+.72,Math.sin(a)*r];
      branch([0,y,0],tip,.76);
      for(let twig=0;twig<4;twig++){
        const t=.28+twig*.18,side=twig%2?1:-1;
        const base:[number,number,number]=[tip[0]*t,y+(tip[1]-y)*t,tip[2]*t];
        const spread=.23+random(limb*11+twig)*.13,angle=a+side*(.45+random(twig+limb*7)*.45);
        const end:[number,number,number]=[base[0]+Math.cos(angle)*spread,base[1]+.12+random(twig*3+limb)*.14,base[2]+Math.sin(angle)*spread];
        branch(base,end,.32);
        for(let n=0;n<4;n++){
          const along=.22+n*.19,px=base[0]+(end[0]-base[0])*along,py=base[1]+(end[1]-base[1])*along,pz=base[2]+(end[2]-base[2])*along;
          const az=a+(n%2?1:-1)*(.55+random(n+twig*9)*.5);
          leaf(px+Math.cos(az)*.09,py+.035,pz+Math.sin(az)*.09,
            Math.cos(az)*.55,.72+random(n+limb)*.16,Math.sin(az)*.55,.25,.37,.09,random(n*7+limb)*Math.PI);
        }
      }
    }
    // Dense inner and outer canopy layers. Fibonacci spacing avoids visible rings
    // and keeps foliage volumetric when the player circles the tree.
    for(let i=0;i<620;i++){
      const a=i*2.399963,vertical=(random(i+170)-.5)*1.22;
      const ring=.16+random(i+191)*.82;
      const y=1.76+vertical*.58,x=Math.cos(a)*ring,z=Math.sin(a)*ring*.84;
      const az=a+(random(i+203)-.5)*1.18;
      leaf(x,y,z,Math.cos(az)*(.42+random(i+208)*.22),.5+random(i+218)*.48,
        Math.sin(az)*(.42+random(i+228)*.22),.38+random(i+239)*.12,
        .34+random(i+249)*.17,.065+random(i+259)*.025,random(i+269)*Math.PI);
    }
  }else if(kind==="olive"){
    // Olive: a subtly twisted trunk, open crown and many narrow silver-green leaves.
    branch([0,.43,0],[-.06,1.18,.015],1.2);
    const leaders:[[number,number,number],[number,number,number]][]=[
      [[-.06,1.05,.015],[-.62,1.94,.18]],
      [[-.03,1.18,.01],[.55,2.08,-.22]],
      [[-.05,1.32,.02],[-.08,2.28,-.28]],
      [[-.06,.96,.01],[.72,1.72,.3]],
      [[-.08,.9,0],[-.76,1.56,-.24]],
    ];
    leaders.forEach(([a,b])=>{
      branch(a,b,.66);
      for(let twig=0;twig<4;twig++){
        const t=.34+twig*.15,base:[number,number,number]=[
          a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t
        ];
        const side=twig%2?1:-1,angle=Math.atan2(b[2]-a[2],b[0]-a[0])+side*.9;
        const end:[number,number,number]=[base[0]+Math.cos(angle)*.27,base[1]+.16,base[2]+Math.sin(angle)*.27];
        branch(base,end,.26);
        for(let n=0;n<9;n++){
          const u=n/8,px=base[0]+(end[0]-base[0])*u,py=base[1]+(end[1]-base[1])*u,pz=base[2]+(end[2]-base[2])*u;
          const sign=n%2?1:-1,az=angle+sign*.78;
          leaf(px+Math.cos(az)*.045,py+.025,pz+Math.sin(az)*.045,
            Math.cos(az)*.34,.34,Math.sin(az)*.34,.17,.25,.035,az);
        }
      }
    });
    for(let i=0;i<190;i++){
      const a=i*2.399963,r=.2+random(i+12)*.68,y=1.48+random(i+21)*.82;
      const az=a+(random(i+31)-.5)*.8;
      leaf(Math.cos(a)*r,y,Math.sin(a)*r*.72,Math.cos(az)*.42,.22+random(i+41)*.12,
        Math.sin(az)*.42,.145+random(i+51)*.025,.25+random(i+61)*.08,.03,az);
    }
  }else if(kind==="pine"){
    // Scots pine with a strong leader, staggered whorls and dense 360-degree
    // needle clusters. Individual needles are instanced cones, not broad leaves.
    branch([0,.43,0],[0,2.9,0],1.08);
    for(let tier=0;tier<11;tier++){
      const y=.68+tier*.195;
      const spread=.98-tier*.078;
      const drop=.13+(tier%3)*.035;
      const arms=10;
      for(let arm=0;arm<arms;arm++){
        const a=arm*Math.PI*2/arms+tier*.21;
        const length=spread*(.88+random(tier*31+arm)*.2);
        const tip:[number,number,number]=[Math.cos(a)*length,y-drop,Math.sin(a)*length];
        branch([0,y,0],tip,.42-tier*.024);
        for(let cluster=0;cluster<9;cluster++){
          const t=.12+cluster*.105;
          const cx=tip[0]*t,cy=y-drop*t,cz=tip[2]*t;
          for(let n=0;n<7;n++){
            const fan=(n-3)*.42+random(tier*1000+arm*71+cluster*13+n)*.18;
            const az=a+fan;
            const upward=(n%3-1)*.22+(random(cluster*17+n)*.18);
            const needleLength=.22+random(tier*700+arm*53+cluster*11+n)*.13;
            needle(cx+Math.cos(az)*.025,cy,cz+Math.sin(az)*.025,
              Math.cos(az)*(.72+random(n+arm)*.2),upward,
              Math.sin(az)*(.72+random(n+tier)*.2),needleLength);
          }
        }
      }
    }
    // Extra short tufts near the outer silhouette close the gaps between whorls.
    for(let i=0;i<420;i++){
      const a=i*2.399963,r=.22+random(i+901)*.72,y=.78+random(i+1201)*1.82;
      const taper=Math.max(.12,1-(y-.68)/2.25);
      const radius=Math.min(r,taper);
      const az=a+(random(i+1401)-.5)*.65;
      for(let n=0;n<3;n++){
        const fan=az+(n-1)*.42;
        needle(Math.cos(a)*radius,y,Math.sin(a)*radius,
          Math.cos(fan)*.78,.12+(n-1)*.12,Math.sin(fan)*.78,
          .18+random(i*3+n)*.1);
      }
    }
  }else{
    // Boston fern: arching rachises with paired, individually tapered pinnae.
    for(let frond=0;frond<18;frond++){
      const a=frond*Math.PI*2/18+(frond%2)*.08,length=.92+(frond%4)*.12;
      const end:[number,number,number]=[Math.cos(a)*length,.68+(frond%3)*.07,Math.sin(a)*length];
      branch([0,.52,0],end,.34);
      for(let segment=1;segment<=14;segment++){
        const t=segment/15,arch=Math.sin(t*Math.PI)*.27;
        const px=Math.cos(a)*length*t,py=.52+(end[1]-.52)*t+arch,pz=Math.sin(a)*length*t;
        const leafletLength=.15+Math.sin(t*Math.PI)*.15;
        for(const side of [-1,1]){
          const az=a+side*(.72+t*.16);
          const lx=px+Math.cos(az)*leafletLength*.42,lz=pz+Math.sin(az)*leafletLength*.42;
          leaf(lx,py,lz,Math.cos(az),.08,Math.sin(az),.19,leafletLength,.035,az);
        }
      }
    }
  }
  return {branches,leaves,needles};
}
function BotanicalInstances({geometry,material,matrices}:{geometry:THREE.BufferGeometry;material:THREE.Material;matrices:THREE.Matrix4[]}){
  const mesh=useRef<THREE.InstancedMesh>(null);
  useEffect(()=>{
    const instance=mesh.current;if(!instance)return;
    matrices.forEach((matrix,index)=>instance.setMatrixAt(index,matrix));
    instance.instanceMatrix.needsUpdate=true;instance.computeBoundingSphere();
  },[matrices]);
  if(!matrices.length)return null;
  return <instancedMesh ref={mesh} args={[geometry,material,matrices.length]} frustumCulled castShadow={false} receiveShadow={false}/>;
}
function PottedPlant({position,scale=1,kind="ficus"}:{position:[number,number,number];scale?:number;kind?:BotanicalKind}){
  const parts=useMemo(()=>createBotanicalMatrices(kind),[kind]);
  return <group position={position} scale={scale}>
    <mesh geometry={BOTANICAL_POT_GEOMETRY} material={BOTANICAL_POT} castShadow receiveShadow/>
    <mesh geometry={BOTANICAL_POT_GEOMETRY} position={[0,.015,0]} scale={[.78,.92,.78]} material={BOTANICAL_SOIL}/>
    <BotanicalInstances geometry={BOTANICAL_BRANCH_GEOMETRY} material={BOTANICAL_BARK} matrices={parts.branches}/>
    <BotanicalInstances geometry={BOTANICAL_LEAF_GEOMETRY} material={BOTANICAL_LEAF_MATERIALS[kind]} matrices={parts.leaves}/>
    {kind==="pine" && <BotanicalInstances geometry={BOTANICAL_NEEDLE_GEOMETRY} material={BOTANICAL_NEEDLE_MATERIAL} matrices={parts.needles}/>}
  </group>;
}

function HangingChandelier() {
  const brass="#b58a4d";
  const armGeometries=useMemo(()=>Array.from({length:6},(_,i)=>{
    const angle=i*Math.PI/3,x=Math.cos(angle)*.62,z=Math.sin(angle)*.62;
    const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,-.28,0),new THREE.Vector3(x*.55,-.12,z*.55),new THREE.Vector3(x,-.28,z));
    return new THREE.TubeGeometry(curve,12,.022,7,false);
  }),[]);
  useEffect(()=>()=>armGeometries.forEach((geometry)=>geometry.dispose()),[armGeometries]);
  return <group position={[0,3.82,-.25]}>
    <pointLight position={[0,-.12,0]} color="#ffbd70" intensity={5.5} distance={7.5} decay={2}/>
    <mesh position={[0,.04,0]}><cylinderGeometry args={[.028,.035,.34,10]}/><meshStandardMaterial color={brass} metalness={.82} roughness={.26}/></mesh>
    <mesh position={[0,-.16,0]}><sphereGeometry args={[.13,14,10]}/><meshStandardMaterial color="#d1ad70" metalness={.78} roughness={.22}/></mesh>
    <mesh position={[0,-.27,0]}><torusGeometry args={[.68,.045,8,40]}/><meshStandardMaterial color={brass} metalness={.86} roughness={.24}/></mesh>
    <mesh position={[0,-.27,0]}><cylinderGeometry args={[.24,.31,.12,20]}/><meshStandardMaterial color="#78512f" metalness={.7} roughness={.3}/></mesh>
    {Array.from({length:6},(_,i)=>{const a=i*Math.PI/3,x=Math.cos(a)*.62,z=Math.sin(a)*.62;return <group key={i}>
      <mesh geometry={armGeometries[i]}><meshStandardMaterial color={brass} metalness={.86} roughness={.24}/></mesh>
      <group position={[x,-.25,z]}>
        <mesh position={[0,.02,0]}><cylinderGeometry args={[.09,.14,.11,12]}/><meshStandardMaterial color="#9b713e" metalness={.72} roughness={.28}/></mesh>
        <mesh position={[0,.14,0]}><cylinderGeometry args={[.052,.068,.23,10]}/><meshStandardMaterial color="#e2d0aa" roughness={.72}/></mesh>
        <mesh position={[0,.285,0]}><coneGeometry args={[.045,.13,9]}/><meshStandardMaterial color="#f3c477" emissive="#e9a84e" emissiveIntensity={.8} roughness={.32}/></mesh>
        <mesh position={[0,-.12,0]}><octahedronGeometry args={[.075,0]}/><meshPhysicalMaterial color="#b9d6cf" transparent opacity={.72} roughness={.12} metalness={.25}/></mesh>
        <mesh position={[0,-.21,0]}><sphereGeometry args={[.025,8,6]}/><meshStandardMaterial color="#d5b477" metalness={.8} roughness={.22}/></mesh>
      </group>
    </group>;})}
    <mesh position={[0,-.43,0]}><sphereGeometry args={[.105,14,10]}/><meshStandardMaterial color="#c39a58" metalness={.86} roughness={.2}/></mesh>
    <mesh position={[0,-.56,0]}><coneGeometry args={[.07,.2,10]}/><meshStandardMaterial color="#a77b43" metalness={.82} roughness={.25}/></mesh>
  </group>;
}
function WallPortrait({ side, positionZ, artwork, imageUrl }: { side: -1 | 1; positionZ: number; artwork: "landscape" | "cyber-detective"; imageUrl?: string }) {
  const artTexture=useMemo(()=>createArchiveArtTexture(artwork),[artwork]);
  const [customTexture,setCustomTexture]=useState<{src:string;texture:THREE.Texture}|null>(null);
  useEffect(()=>{
    if(!imageUrl)return;
    let active=true;
    const texture=new THREE.TextureLoader().load(imageUrl,(loaded)=>{
      if(!active)return;
      const image=loaded.image as HTMLImageElement;
      const imageAspect=image.naturalWidth/Math.max(1,image.naturalHeight);
      const frameAspect=1.16/1.56;
      if(imageAspect>frameAspect){
        loaded.repeat.set(frameAspect/imageAspect,1);
        loaded.offset.set((1-loaded.repeat.x)/2,0);
      }else{
        loaded.repeat.set(1,imageAspect/frameAspect);
        loaded.offset.set(0,(1-loaded.repeat.y)/2);
      }
      loaded.colorSpace=THREE.SRGBColorSpace;
      loaded.anisotropy=4;
      loaded.needsUpdate=true;
      setCustomTexture({src:imageUrl,texture:loaded});
    });
    return ()=>{active=false;texture.dispose();};
  },[imageUrl]);
  useEffect(()=>()=>artTexture?.dispose(),[artTexture]);
  const displayedTexture=customTexture && customTexture.src===imageUrl?customTexture.texture:artTexture;
  return <group position={[side*7.27,2.55,positionZ]} rotation={[0,side===-1?Math.PI/2:-Math.PI/2,0]}>
    <mesh position={[0,0,-.105]} castShadow><boxGeometry args={[1.5,1.94,.19]}/><meshStandardMaterial color="#21130c" roughness={.82}/></mesh>
    <mesh position={[0,0,-.005]}><boxGeometry args={[1.43,1.87,.075]}/><meshStandardMaterial color="#6d4325" roughness={.5}/></mesh>
    {[[1.48,.095,0,.91],[1.48,.095,0,-.91],[.095,1.82,.69,0],[.095,1.82,-.69,0]].map(([w,h,x,y],i)=><mesh key={i} position={[x,y,.045]}><boxGeometry args={[w,h,.105]}/><meshStandardMaterial color={i%2?"#bd965b":"#9a7040"} metalness={.46} roughness={.36}/></mesh>)}
    <mesh position={[0,0,.07]}><boxGeometry args={[1.25,1.65,.035]}/><meshStandardMaterial color="#21170f" roughness={.9}/></mesh>
    <mesh position={[0,0,.095]}><planeGeometry args={[1.16,1.56]}/><meshBasicMaterial map={displayedTexture??undefined} toneMapped={false}/></mesh>
    <mesh position={[0,0,.101]}><planeGeometry args={[1.16,1.56]}/><meshBasicMaterial color="#fff0d0" transparent opacity={.035} depthWrite={false}/></mesh>
    {[-1,1].map(x=>[-1,1].map(y=><group key={x+":"+y} position={[x*.65,y*.84,.11]}><mesh rotation={[0,0,x*y*.45]}><boxGeometry args={[.12,.12,.025]}/><meshStandardMaterial color="#d0ad70" metalness={.68} roughness={.28}/></mesh><mesh><sphereGeometry args={[.025,8,6]}/><meshStandardMaterial color="#f0d49b" metalness={.72} roughness={.25}/></mesh></group>))}
    <mesh position={[0,-1.02,.03]}><boxGeometry args={[.82,.11,.1]}/><meshStandardMaterial color="#80562f" metalness={.28} roughness={.46}/></mesh>
  </group>;
}

function WallSconce({ position }: { position: [number,number,number] }) {
  return (
    <group position={position}>
      <mesh position={[0,0,-.04]}>
        <boxGeometry args={[.28,.42,.1]}/><meshStandardMaterial color="#54371f" metalness={.42} roughness={.5}/>
      </mesh>
      <mesh position={[0,-.08,.08]} rotation={[Math.PI/2,0,0]}>
        <torusGeometry args={[.11,.018,6,16]}/><meshStandardMaterial color="#b18a50" metalness={.72} roughness={.3}/>
      </mesh>
      <mesh position={[0,.13,.09]}>
        <cylinderGeometry args={[.025,.025,.2,7]}/><meshStandardMaterial color="#b18a50" metalness={.72} roughness={.3}/>
      </mesh>
      <mesh position={[0,.25,.09]}>
        <cylinderGeometry args={[.055,.09,.16,9]}/><meshStandardMaterial color="#e9d5ad" emissive="#d99a4d" emissiveIntensity={.5} roughness={.35}/>
      </mesh>
    </group>
  );
}

function AreaRug() {
  const texture=useMemo(()=>makeCanvasTexture((ctx,size)=>{
    ctx.fillStyle="#273a30";ctx.fillRect(0,0,size,size);
    // Dense Persian-style field, with a clear border, repeated floral vines and a central medallion.
    const border=(inset: number,width: number,color: string)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.strokeRect(inset,inset,size-inset*2,size-inset*2);};
    border(18,30,"#a77c49");border(48,9,"#d2b477");border(67,3,"#765533");border(82,4,"#d2b477");
    const flower=(x: number,y: number,r: number,rotation=0)=>{
      ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
      for(let k=0;k<8;k++){ctx.save();ctx.rotate(k*Math.PI/4);ctx.fillStyle=k%2?"#8c6942":"#d0ae72";ctx.beginPath();ctx.ellipse(0,-r*.62,r*.25,r*.52,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      ctx.fillStyle="#e1c58d";ctx.beginPath();ctx.arc(0,0,r*.22,0,Math.PI*2);ctx.fill();
      ctx.restore();
    };
    const vine=(x1: number,y1: number,x2: number,y2: number,steps: number)=>{
      ctx.strokeStyle="#b18b57";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x1,y1);
      ctx.bezierCurveTo(x1+(x2-x1)*.32,y1+(y2-y1)*.12,x1+(x2-x1)*.68,y1+(y2-y1)*.88,x2,y2);ctx.stroke();
      for(let i=0;i<=steps;i++){const t=i/steps,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
        ctx.save();ctx.translate(x,y);ctx.rotate(t*Math.PI*2);
        ctx.fillStyle=i%2?"#6e8758":"#d0ae72";ctx.beginPath();ctx.ellipse(0,0,size*.009,size*.022,t*Math.PI,0,Math.PI*2);ctx.fill();ctx.restore();
      }
    };
    // Four continuous floral border runs.
    vine(size*.12,size*.105,size*.88,size*.105,20);
    vine(size*.12,size*.895,size*.88,size*.895,20);
    vine(size*.105,size*.12,size*.105,size*.88,20);
    vine(size*.895,size*.12,size*.895,size*.88,20);
    for(let i=0;i<7;i++){
      const t=.17+i*.11;
      flower(size*t,size*.105,size*.022);
      flower(size*t,size*.895,size*.022,Math.PI/8);
      flower(size*.105,size*t,size*.022,Math.PI/4);
      flower(size*.895,size*t,size*.022,-Math.PI/4);
    }
    // Central medallion: layered oval, rosette and four corner blossoms.
    const cx=size/2,cy=size/2;
    ctx.fillStyle="#1b3027";ctx.beginPath();ctx.ellipse(cx,cy,size*.19,size*.27,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#d0ae72";ctx.lineWidth=12;ctx.beginPath();ctx.ellipse(cx,cy,size*.19,size*.27,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle="#8f6c43";ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(cx,cy,size*.165,size*.245,0,0,Math.PI*2);ctx.stroke();
    flower(cx,cy,size*.12);
    for(const sx of [-1,1])for(const sy of [-1,1])flower(cx+sx*size*.27,cy+sy*size*.3,size*.055,(sx*sy)*.2);
    // Woven pile and subtle irregular fibers.
    ctx.strokeStyle="rgba(235,220,183,.075)";ctx.lineWidth=1;
    for(let y=0;y<size;y+=4){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(size,y+1);ctx.stroke();}
    ctx.strokeStyle="rgba(20,25,19,.1)";
    for(let x=0;x<size;x+=7){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+2,size);ctx.stroke();}
    // Slightly worn corners, like a real old rug.
    for(const [x,y] of [[0,0],[size,0],[0,size],[size,size]]){
      const wear=ctx.createRadialGradient(x,y,0,x,y,size*.16);
      wear.addColorStop(0,"rgba(177,143,91,.16)");wear.addColorStop(1,"rgba(177,143,91,0)");
      ctx.fillStyle=wear;ctx.fillRect(0,0,size,size);
    }
  },768),[]);
  useEffect(()=>()=>texture?.dispose(),[texture]);
  return <group position={[0,.022,.1]}>
    {/* Single coplanar textile surface: no thick backing slab or raised frame. */}
    <mesh position={[0,.006,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
      <planeGeometry args={[5.19,3.39]}/>
      <meshStandardMaterial map={texture??undefined} roughness={1} side={THREE.DoubleSide}/>
    </mesh>
  </group>;
}

function WindowReadingBench({ side }: { side: -1 | 1 }) {
  const wood=useMemo(()=>makeWoodTexture("#59351f","rgba(211,158,99,.7)",[2,1]),[]);
  useEffect(()=>()=>wood?.dispose(),[wood]);
  return <group position={[side*6.72,0,-1.55]}>
    {/* Proper built-in reading seat with a shaped oak carcass, drawers and turned legs. */}
    {[-1,1].map(x=>[-1,1].map(z=><group key={x+":"+z} position={[-side*x*.23,.39,z*1.13]}>
      <mesh castShadow>
        <cylinderGeometry args={[.055,.075,.78,12]}/>
        <meshStandardMaterial map={wood??undefined} color="#8b603b" roughness={.58}/>
      </mesh>
      <mesh position={[0,-.29,0]}><cylinderGeometry args={[.08,.085,.09,12]}/><meshStandardMaterial color="#a77b48" metalness={.18} roughness={.5}/></mesh>
    </group>))}
    <mesh position={[0,.56,0]} castShadow receiveShadow>
      <boxGeometry args={[.62,.16,2.62]}/>
      <meshStandardMaterial map={wood??undefined} color="#805633" roughness={.55}/>
    </mesh>
    {/* Three inset drawer fronts with brass pulls instead of flat Minecraft-like panels. */}
    {[-.82,0,.82].map(z=><group key={z} position={[-side*.319,.55,z]}>
      <mesh castShadow><boxGeometry args={[.035,.32,.72]}/><meshStandardMaterial color="#70472c" roughness={.62}/></mesh>
      <mesh position={[-side*.023,0,0]}><boxGeometry args={[.012,.24,.62]}/><meshStandardMaterial color="#805333" roughness={.56}/></mesh>
      <mesh position={[-side*.034,.025,0]}><boxGeometry args={[.018,.025,.16]}/><meshStandardMaterial color="#bd965b" metalness={.7} roughness={.3}/></mesh>
      <mesh position={[-side*.05,.025,0]}><sphereGeometry args={[.035,10,8]}/><meshStandardMaterial color="#d2ad70" metalness={.76} roughness={.24}/></mesh>
    </group>)}
    <mesh position={[0,.76,0]} castShadow>
      <boxGeometry args={[.78,.12,2.82]}/>
      <meshStandardMaterial map={wood??undefined} color="#93663e" roughness={.48}/>
    </mesh>
    {/* Tailored seat cushion with piping and individual upholstery seams. */}
    <RoundedBox args={[.69,.13,2.62]} radius={.055} smoothness={3} position={[-side*.01,.87,0]} castShadow>
      <meshStandardMaterial color="#45513d" roughness={.96}/>
    </RoundedBox>
    {[-.86,0,.86].map(z=><mesh key={z} position={[-side*.01,.939,z]}><boxGeometry args={[.58,.009,.012]}/><meshStandardMaterial color="#b49a69" roughness={.9}/></mesh>)}
    {/* Brass end caps and discreet wall-side brackets. */}
    {[-1,1].map(end=><mesh key={end} position={[-side*.31,.65,end*1.25]}><boxGeometry args={[.12,.09,.12]}/><meshStandardMaterial color="#a77b48" metalness={.3} roughness={.48}/></mesh>)}
  </group>;
}

function Room({ frameImages }: { frameImages: Partial<Record<"left" | "right", string>> }) {
  const wallTexture = useMemo(() => makeWoodTexture("#392319", "rgba(190,125,75,.6)", [3, 2]), []);
  const floorTexture = useMemo(() => makeWoodTexture("#69452e", "rgba(226,174,113,.65)", [5, 4]), []);
  useEffect(() => () => { wallTexture?.dispose(); floorTexture?.dispose(); }, [wallTexture, floorTexture]);
  return (
    <group>
      <mesh position={[0, 4, 0]} receiveShadow>
        <boxGeometry args={[15, 0.25, 12]} />
        <meshStandardMaterial color="#24170f" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.13, 0]} receiveShadow>
        <boxGeometry args={[15, 0.25, 12]} />
        <meshStandardMaterial color="#3a2417" roughness={0.66} />
      </mesh>
      {/* Side walls are split around real window openings, not covered by flat window decals. */}
      {[-7.4, 7.4].map((x) => (
        <group key={x}>
          {[
            { z: -4.475, width: 3.05 },
            { z: 2.925, width: 6.15 },
          ].map(({ z, width }) => (
            <mesh key={z} position={[x, 1.95, z]} receiveShadow>
              <boxGeometry args={[0.2, 4, width]} />
              <meshStandardMaterial map={wallTexture ?? undefined} color="#805a40" roughness={0.88} />
            </mesh>
          ))}
          {[
            { y: 0.83, height: 1.66 },
            { y: 3.72, height: 0.56 },
          ].map(({ y, height }) => (
            <mesh key={y} position={[x, y, -1.55]} receiveShadow>
              <boxGeometry args={[0.2, height, 2.8]} />
              <meshStandardMaterial map={wallTexture ?? undefined} color="#805a40" roughness={0.88} />
            </mesh>
          ))}
          <WindowAssembly side={x < 0 ? -1 : 1} />
        </group>
      ))}
      {/* Back wall remains a continuous library wall; shelves must never cross a door. */}
      <mesh position={[0, 1.95, -5.9]} receiveShadow>
        <boxGeometry args={[15, 4, 0.2]} />
        <meshStandardMaterial map={wallTexture ?? undefined} color="#805a40" roughness={0.88} />
      </mesh>
      {/* The entrance belongs on the opposite wall (+Z), away from the bookcases. */}
      {[-4.45, 4.45].map((x) => (
        <mesh key={x} position={[x, 1.95, 5.9]} receiveShadow>
          <boxGeometry args={[6.1, 4, 0.2]} />
          <meshStandardMaterial map={wallTexture ?? undefined} color="#805a40" roughness={0.88} />
        </mesh>
      ))}
      <mesh position={[0, 3.62, 5.9]} receiveShadow>
        <boxGeometry args={[2.8, 0.66, 0.2]} />
        <meshStandardMaterial map={wallTexture ?? undefined} color="#805a40" roughness={0.88} />
      </mesh>
      <group position={[0, 0, 5.72]} rotation={[0, Math.PI, 0]}>
        {/* Heavy oak frame and recessed double-panel door, facing into the room. */}
        <mesh position={[-1.38, 1.78, 0]} castShadow>
          <boxGeometry args={[0.18, 3.56, 0.28]} />
          <meshStandardMaterial color="#704426" roughness={0.7} />
        </mesh>
        <mesh position={[1.38, 1.78, 0]} castShadow>
          <boxGeometry args={[0.18, 3.56, 0.28]} />
          <meshStandardMaterial color="#704426" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.48, 0]} castShadow>
          <boxGeometry args={[2.94, 0.2, 0.3]} />
          <meshStandardMaterial color="#8a5a32" roughness={0.64} />
        </mesh>
        <mesh position={[0, 1.76, -0.035]} castShadow receiveShadow>
          <boxGeometry args={[2.56, 3.42, 0.13]} />
          <meshStandardMaterial color="#321a12" roughness={0.78} />
        </mesh>
        {[-0.59, 0.59].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.76, 0.045]}>
              <boxGeometry args={[1.02, 2.82, 0.035]} />
              <meshStandardMaterial color="#744528" roughness={0.72} />
            </mesh>
            <mesh position={[x, 2.55, 0.07]}>
              <boxGeometry args={[0.78, 1.12, 0.025]} />
              <meshStandardMaterial color="#4b2819" roughness={0.76} />
            </mesh>
            <mesh position={[x, 0.98, 0.07]}>
              <boxGeometry args={[0.78, 1.12, 0.025]} />
              <meshStandardMaterial color="#4b2819" roughness={0.76} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.76, 0.11]}>
          <boxGeometry args={[0.035, 3.15, 0.035]} />
          <meshStandardMaterial color="#a77b48" metalness={0.18} roughness={0.55} />
        </mesh>
        <mesh position={[0.98, 1.72, 0.15]}>
          <sphereGeometry args={[0.075, 12, 10]} />
          <meshStandardMaterial color="#c69a55" metalness={0.72} roughness={0.28} />
        </mesh>
        <mesh position={[0.98, 1.72, 0.22]}>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 10]} />
          <meshStandardMaterial color="#b88b4b" metalness={0.72} roughness={0.28} />
        </mesh>
        <mesh position={[0, 3.72, 0.03]}>
          <boxGeometry args={[1.7, 0.09, 0.08]} />
          <meshStandardMaterial color="#b68a50" metalness={0.25} roughness={0.5} />
        </mesh>
      </group>
      {[-6.7, 6.7].map((x) => (
        <mesh key={x} position={[x, 1.95, -5.76]}>
          <boxGeometry args={[0.16, 3.8, 0.18]} />
          <meshStandardMaterial color={TRIM} roughness={0.62} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14.6, 11.6]} />
        <meshStandardMaterial map={floorTexture ?? undefined} color="#c49a70" roughness={0.62} />
      </mesh>
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} position={[-6.8 + i * 0.97, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, 11.4]} />
          <meshStandardMaterial color="#21140d" roughness={0.9} />
        </mesh>
      ))}
      <group position={[0, 0, -5.65]}>
        {[-0.85, 0.25, 1.35].map((y) => (
          <mesh key={y} position={[0, y + 1.15, 0]}>
            <boxGeometry args={[12.5, 0.08, 0.55]} />
            <meshStandardMaterial color="#1b100a" roughness={0.85} />
          </mesh>
        ))}
        {[-6.1, 6.1].map((x) => (
          <mesh key={x} position={[x, 1.85, 0]}>
            <boxGeometry args={[0.18, 3.7, 0.62]} />
            <meshStandardMaterial color={TRIM} roughness={0.62} />
          </mesh>
        ))}
      </group>
      {/* Traditional dark-oak wall mouldings add depth without extra textures or lights. */}
      <group>
        <mesh position={[0,.22,-5.76]}><boxGeometry args={[14.65,.16,.16]}/><meshStandardMaterial color="#573820" roughness={.58}/></mesh>
        <mesh position={[0,3.78,-5.76]}><boxGeometry args={[14.65,.14,.16]}/><meshStandardMaterial color="#68472b" roughness={.55}/></mesh>
        {[-1,1].map(side=><group key={side}>
          <mesh position={[side*7.27,.22,0]}><boxGeometry args={[.16,.16,11.45]}/><meshStandardMaterial color="#573820" roughness={.58}/></mesh>
          <mesh position={[side*7.27,3.78,0]}><boxGeometry args={[.16,.14,11.45]}/><meshStandardMaterial color="#68472b" roughness={.55}/></mesh>
          <mesh position={[side*7.27,1.02,0]}><boxGeometry args={[.11,.075,11.3]}/><meshStandardMaterial color="#76502f" roughness={.62}/></mesh>
        </group>)}
      </group>
      {/* Plants placed in the front corners, outside the walking path. */}
      <PottedPlant position={[-6.05, 0, 4.25]} scale={1.08} kind="ficus" />
      <PottedPlant position={[6.05, 0, 4.25]} scale={1.04} kind="pine" />
      <PottedPlant position={[-6.15, 0, -3.65]} scale={0.96} kind="fern" />
      <PottedPlant position={[6.15, 0, -3.65]} scale={0.94} kind="olive" />
      <WindowReadingBench side={1} />
      <AreaRug />
      <HangingChandelier />
      {/* Shift each portrait away from the front-corner plants so the artwork stays visible. */}
      <WallPortrait side={-1} positionZ={2.55} artwork="landscape" imageUrl={frameImages.left} />
      <WallPortrait side={1} positionZ={2.55} artwork="cyber-detective" imageUrl={frameImages.right} />
      <WallSconce position={[-4.55, 2.7, -5.76]} />
      <WallSconce position={[4.55, 2.7, -5.76]} />
    </group>
  );
}
function Shelf({ y, width = 12.2 }: { y: number; width?: number }) {
  const shelfTexture = useMemo(() => makeWoodTexture("#52331f", "rgba(211,158,99,.7)", [4, 1]), []);
  useEffect(() => () => shelfTexture?.dispose(), [shelfTexture]);
  return (
    <group position={[0, y, -5.15]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.16, 0.88]} />
        <meshStandardMaterial map={shelfTexture ?? undefined} color="#c19a72" roughness={0.58} />
      </mesh>
      <mesh position={[0, -0.09, 0.43]}>
        <boxGeometry args={[width, 0.06, 0.07]} />
        <meshStandardMaterial color={TRIM} roughness={0.54} />
      </mesh>
      <mesh position={[0, 0.105, -0.27]}>
        <boxGeometry args={[width, 0.035, 0.08]} />
        <meshStandardMaterial color="#805432" roughness={0.62} />
      </mesh>
    </group>
  );
}

function spineTexture(title: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#54231d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, "#24100d");
  grad.addColorStop(0.25, "#783b29");
  grad.addColorStop(0.55, "#4c211b");
  grad.addColorStop(1, "#1c0d0a");
  ctx.fillStyle = grad;
  ctx.fillRect(15, 12, 226, 1000);
  ctx.strokeStyle = "#c6a06a";
  ctx.lineWidth = 3;
  ctx.strokeRect(29, 24, 198, 976);
  ctx.strokeStyle = "rgba(214,177,117,.55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(39, 35, 178, 954);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#e8d0a0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 23;
  ctx.font = `bold ${size}px Georgia`;
  while (ctx.measureText(title).width > 390 && size > 11) {
    size -= 2;
    ctx.font = `bold ${size}px Georgia`;
  }
  ctx.shadowColor = "rgba(0,0,0,.65)";
  ctx.shadowBlur = 4;
  ctx.fillText(title, 0, 0, 390);
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

/* eslint-disable react-hooks/immutability */
function StoryBook({
  story, index, position, carried, placed, droppedPosition, opening, targeted, returning, onReturnComplete,
}: {
  story: ArchivoLibraryStory;
  index: number;
  position: [number, number, number];
  carried: boolean;
  placed: boolean;
  droppedPosition: [number, number, number] | null;
  opening: boolean;
  targeted: boolean;
  returning: boolean;
  onReturnComplete: () => void;
}) {
  const root = useRef<THREE.Group>(null);
  const coverHinge = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const isPhysical = carried || placed || Boolean(droppedPosition) || returning;
  const returnCompleted = useRef(false);
  const texture = useMemo(() => spineTexture(story.title), [story.title]);
  const { camera, invalidate } = useThree();
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const desiredQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const viewEuler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);

  useEffect(() => () => { texture?.dispose(); }, [texture]);

  useFrame((_, delta) => {
    if (!root.current) return;
    if (!returning) returnCompleted.current = false;
    if (!carried && !placed && !droppedPosition && !returning && !opening && !hovered) return;
    if (coverHinge.current) {
      coverHinge.current.rotation.y = THREE.MathUtils.damp(coverHinge.current.rotation.y, opening ? -Math.PI : 0, 7, delta);
    }
    if (carried) {
      // Hold the book at a consistent, readable scale in the lower-right of the
      // view. Derive orientation from yaw only (not camera pitch/roll) to avoid
      // the large wobble caused by following every tiny head movement.
      viewEuler.setFromQuaternion(camera.quaternion, "YXZ");
      const yaw = viewEuler.y;
      forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      right.set(Math.cos(yaw), 0, -Math.sin(yaw));
      target.copy(camera.position).addScaledVector(forward, 0.72).addScaledVector(right, 0.22);
      target.y = camera.position.y - 0.30;
      // A fixed camera-relative pose prevents visible hand-held wobble.
      root.current.position.copy(target);
      desiredQuaternion.setFromEuler(new THREE.Euler(-0.06, yaw, 0));
      root.current.quaternion.copy(desiredQuaternion);
      root.current.scale.setScalar(0.58);
    } else if (placed) {
      // Desk top is at y=1.0025; center the 0.17-thick book on its surface.
      // Keep the right half of the desk clear for the physical book.
      target.set(1.16, 1.088, 2.45);
      root.current.position.copy(target);
      desiredQuaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      root.current.quaternion.copy(desiredQuaternion);
      root.current.scale.setScalar(1);
    } else if (droppedPosition) {
      target.set(droppedPosition[0], droppedPosition[1], droppedPosition[2]);
      root.current.position.lerp(target, 1 - Math.exp(-14 * Math.min(delta, 0.05)));
      desiredQuaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      root.current.quaternion.slerp(desiredQuaternion, 1 - Math.exp(-14 * Math.min(delta, 0.05)));
      root.current.scale.setScalar(0.92);
    } else if (returning) {
      target.set(position[0], position[1], position[2]);
      const alpha = 1 - Math.exp(-5.5 * Math.min(delta, 0.05));
      desiredQuaternion.setFromEuler(new THREE.Euler(0, 0, 0));
      root.current.position.lerp(target, alpha);
      root.current.quaternion.slerp(desiredQuaternion, alpha);
      root.current.scale.lerp(new THREE.Vector3(1, 1, 1), alpha);
      if (root.current.position.distanceTo(target) < 0.018 && !returnCompleted.current) {
        returnCompleted.current = true;
        root.current.position.copy(target);
        root.current.quaternion.copy(desiredQuaternion);
        root.current.scale.setScalar(1);
        onReturnComplete();
      } else if (!returnCompleted.current) {
        invalidate();
      }
    } else {
      target.set(position[0], position[1], position[2] + (hovered ? 0.045 : 0));
      desiredQuaternion.setFromEuler(new THREE.Euler(0, hovered ? -0.025 : 0, 0));
      root.current.position.copy(target);
      root.current.quaternion.copy(desiredQuaternion);
      root.current.scale.setScalar(1);
    }
    if (opening && coverHinge.current && Math.abs(coverHinge.current.rotation.y + Math.PI) > 0.02) invalidate();
  });

  const spineWidth = 0.09 + (index % 4) * 0.014;
  const spineHeight = 0.72 + (index % 4) * 0.045;
  const bookWidth = 0.58;
  const bookHeight = 0.78;
  const bookDepth = 0.17;

  return (
    <group ref={root} position={position} userData={{ archivoStoryId: story.id }}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => {
        setHovered(false);
        if (root.current && !carried && !placed && !droppedPosition && !returning) {
          root.current.position.set(position[0], position[1], position[2]);
          root.current.rotation.set(0, 0, 0);
          root.current.scale.setScalar(1);
        }
      }}>
      {isPhysical ? (
        <group>
          {/* Ivory page block: the red leather belongs to the covers, never to the pages. */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[bookWidth - 0.052, bookHeight - 0.052, bookDepth - 0.048]} />
            <meshStandardMaterial color="#eee4ce" roughness={0.96} />
          </mesh>
          {/* Fine page edges on the fore-edge give the book a readable paper thickness. */}
          <mesh position={[bookWidth / 2 - 0.027, 0, 0]}>
            <boxGeometry args={[0.009, bookHeight - 0.105, bookDepth - 0.075]} />
            <meshStandardMaterial color="#d7c8a8" roughness={1} />
          </mesh>
          {[-0.24,-0.16,-0.08,0,0.08,0.16,0.24].map((y)=>(
            <mesh key={y} position={[bookWidth / 2 - 0.021,y,0]}>
              <boxGeometry args={[0.012,0.003,bookDepth - 0.082]} />
              <meshStandardMaterial color="#bba984" roughness={1} />
            </mesh>
          ))}
          <group ref={coverHinge} position={[-bookWidth / 2, 0, bookDepth / 2 - 0.005]}>
            <mesh position={[bookWidth / 2, 0, 0]} castShadow>
              <boxGeometry args={[bookWidth, bookHeight, 0.035]} />
              <meshStandardMaterial color="#6a211b" roughness={0.72} />
            </mesh>
            {/* Outer leather face stays red; the reverse is lined ivory paper. */}
            <mesh position={[bookWidth / 2, 0, 0.02]}>
              <planeGeometry args={[bookWidth * 0.94, bookHeight * 0.96]} />
              <meshStandardMaterial color="#70251e" roughness={0.78} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[bookWidth / 2, 0, -0.019]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[bookWidth * 0.91, bookHeight * 0.93]} />
              <meshStandardMaterial color="#f3ead7" roughness={0.98} side={THREE.DoubleSide} />
            </mesh>
            {[-0.27,-0.18,-0.09,0,0.09,0.18,0.27].map((y)=>(
              <mesh key={y} position={[bookWidth / 2,y,-0.022]} rotation={[0,Math.PI,0]}>
                <boxGeometry args={[bookWidth * 0.66,0.003,0.002]}/>
                <meshStandardMaterial color="#cfc2aa" roughness={1}/>
              </mesh>
            ))}
          </group>
          <mesh position={[0, 0, -bookDepth / 2 + 0.005]} castShadow>
            <boxGeometry args={[bookWidth, bookHeight, 0.035]} />
            <meshStandardMaterial color="#6a211b" roughness={0.72} />
          </mesh>
          {/* Back-cover leather outside and warm-white inside page surface. */}
          <mesh position={[0, 0, -bookDepth / 2 - 0.016]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[bookWidth * 0.94, bookHeight * 0.96]} />
            <meshStandardMaterial color="#70251e" roughness={0.78} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, -bookDepth / 2 + 0.019]}>
            <planeGeometry args={[bookWidth * 0.91, bookHeight * 0.93]} />
            <meshStandardMaterial color="#f3ead7" roughness={0.98} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-bookWidth / 2 + 0.018, 0, 0]} castShadow>
            <boxGeometry args={[0.055, bookHeight, bookDepth]} />
            <meshStandardMaterial color="#32130f" roughness={0.58} />
          </mesh>

        </group>
      ) : (
        <group>
          <RoundedBox args={[spineWidth, spineHeight, 0.34]} radius={0.025} smoothness={2} castShadow receiveShadow>
            <meshStandardMaterial color="#4b2119" roughness={0.68} metalness={0.025}
              emissive={hovered ? "#6b321e" : "#000000"}
              emissiveIntensity={hovered ? 0.07 : 0} />
          </RoundedBox>
          <mesh position={[0, 0, 0.34 / 2 + 0.022]}>
            <planeGeometry args={[spineWidth * 0.9, spineHeight * 0.94]} />
            <meshStandardMaterial map={texture ?? undefined} color={texture ? "#ffffff" : "#5b2b20"} roughness={0.72} />
          </mesh>
          {story.completed && (
            <mesh position={[0, spineHeight * 0.28, 0.34 / 2 + 0.035]}>
              <circleGeometry args={[0.075, 24]} />
              <meshBasicMaterial color="#b99a62" />
            </mesh>
          )}
          {[-0.37, 0.37].map((band) => (
            <mesh key={band} position={[0, spineHeight * band, 0.34 / 2 + 0.028]}>
              <boxGeometry args={[spineWidth * 0.82, 0.018, 0.012]} />
              <meshStandardMaterial color="#cba36a" metalness={0.42} roughness={0.38} />
            </mesh>
          ))}
          <mesh position={[0, 0, -0.015]}>
            <boxGeometry args={[spineWidth * 0.84, spineHeight * 0.92, 0.34 * 0.9]} />
            <meshStandardMaterial color="#54231d" roughness={0.84} />
          </mesh>
        </group>
      )}
      {targeted && !carried && !placed && (
        <Html position={[0, spineHeight / 2 + 0.2, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f0d7a6] bg-[#21130d]/95 font-serif text-sm font-black text-[#f7e5c3] shadow-[0_0_0_2px_rgba(92,54,24,.75),0_3px_12px_rgba(0,0,0,.65)]">
            R
          </div>
        </Html>
      )}
    </group>
  );
}
/* eslint-enable react-hooks/immutability */

/* R3F camera and scratch vectors are intentionally mutated inside the render loop. */
/* eslint-disable react-hooks/immutability */
function FirstPersonMovement({ disabled = false }: { disabled?: boolean }) {
  const { camera, invalidate, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const direction = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const elapsed = useRef(0);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (disabled || document.pointerLockElement !== gl.domElement) return;
      if (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      keys.current[event.code] = true;
      invalidate();
    };
    const up = (event: KeyboardEvent) => { keys.current[event.code] = false; invalidate(); };
    const clear = () => { keys.current = {}; invalidate(); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [disabled, gl, invalidate]);

  useFrame((_, delta) => {
    if (disabled || document.pointerLockElement !== gl.domElement) return;
    elapsed.current += Math.min(delta, 0.05);
    const speed = 3.2 * Math.min(delta, 0.05);
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0; forward.normalize();
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0; right.normalize();
    direction.set(0, 0, 0);
    if (keys.current.KeyW || keys.current.ArrowUp) direction.add(forward);
    if (keys.current.KeyS || keys.current.ArrowDown) direction.sub(forward);
    if (keys.current.KeyD || keys.current.ArrowRight) direction.add(right);
    if (keys.current.KeyA || keys.current.ArrowLeft) direction.sub(right);
    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed);
      const nextX = THREE.MathUtils.clamp(camera.position.x + direction.x, -6.2, 6.2);
      const nextZ = THREE.MathUtils.clamp(camera.position.z + direction.z, -4.7, 5.1);
      const paddingX = 0.46, paddingZ = 0.46;
      const collidesWithDesk = (x: number, z: number) =>
        x > -1.625 - paddingX && x < 1.625 + paddingX &&
        z > 2.25 - 0.775 - paddingZ && z < 2.25 + 0.775 + paddingZ;
      const collidesWithPlant = (x: number, z: number) =>
        [[-6.05,4.25,.76],[6.05,4.25,.72],[-6.15,-3.65,.68],[6.15,-3.65,.68]].some(([px,pz,r]) => Math.hypot(x-px,z-pz) < r + .3);
      if (!collidesWithDesk(nextX, camera.position.z) && !collidesWithPlant(nextX, camera.position.z)) camera.position.x = nextX;
      if (!collidesWithDesk(camera.position.x, nextZ) && !collidesWithPlant(camera.position.x, nextZ)) camera.position.z = nextZ;
      camera.position.y = 1.68;
      invalidate();
    }
  });
  return null;
}

function MouseLookControls({ disabled = false }: { disabled?: boolean }) {
  const { camera, invalidate, gl } = useThree();
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  useEffect(() => {
    const move = (event: MouseEvent) => {
      // Native Pointer Lock owns mouse look. ESC releases it; clicking Enter
      // reacquires it once, without a separate drag-to-look mode.
      if (disabled || document.pointerLockElement !== gl.domElement) return;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= event.movementX * 0.0024;
      euler.x -= event.movementY * 0.0024;
      euler.x = THREE.MathUtils.clamp(euler.x, -Math.PI / 2.15, Math.PI / 2.15);
      camera.quaternion.setFromEuler(euler);
      invalidate();
    };
    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, [camera, disabled, euler, gl, invalidate]);
  return null;
}

function InspectionCamera({ active, onSettled }: { active: boolean; onSettled?: () => void }) {
  const { camera, invalidate } = useThree();
  const saved = useRef<{ position: THREE.Vector3; quaternion: THREE.Quaternion; fov: number } | null>(null);
  const previousActive = useRef(false);
  const animating = useRef(false);
  const destination = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const targetQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const pose = useMemo(() => new THREE.PerspectiveCamera(), []);
  const targetFov = useRef(68);

  useEffect(() => { invalidate(); }, [active, invalidate]);

  useFrame((_, delta) => {
    // Do nothing to the normal room camera until the player explicitly presses F.
    if (active && !previousActive.current) {
      saved.current = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        fov: camera instanceof THREE.PerspectiveCamera ? camera.fov : 68,
      };
      targetFov.current = 49;
      // Cenital: cámara perpendicular al plano del expediente para leer el papel
      // como si estuviera sostenido frente al jugador, sin perspectiva rasante.
      destination.set(0, 2.62, 2.20);
      look.set(0, 1.014, 2.20);
      pose.position.copy(destination);
      pose.up.set(0, 0, -1);
      pose.lookAt(look);
      targetQuaternion.copy(pose.quaternion);
      animating.current = true;
    } else if (!active && previousActive.current && saved.current) {
      // F again restores the exact position and view from before inspection.
      destination.copy(saved.current.position);
      targetQuaternion.copy(saved.current.quaternion);
      targetFov.current = saved.current.fov;
      animating.current = true;
    }

    previousActive.current = active;
    if (!animating.current) return;

    const alpha = 1 - Math.exp(-5.2 * Math.min(delta, 0.05));
    camera.position.lerp(destination, alpha);
    camera.quaternion.slerp(targetQuaternion, alpha);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov.current, 5.2, Math.min(delta, 0.05));
      camera.updateProjectionMatrix();
    }

    const closePosition = camera.position.distanceTo(destination) < 0.006;
    const closeRotation = 1 - Math.abs(camera.quaternion.dot(targetQuaternion)) < 0.0005;
    const closeFov = !(camera instanceof THREE.PerspectiveCamera) || Math.abs(camera.fov - targetFov.current) < 0.04;
    if (closePosition && closeRotation && closeFov) {
      camera.position.copy(destination);
      camera.quaternion.copy(targetQuaternion);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = targetFov.current;
        camera.updateProjectionMatrix();
      }
      animating.current = false;
      if (!active) saved.current = null;
      else onSettled?.();
    } else {
      invalidate();
    }
  });
  return null;
}
/* eslint-enable react-hooks/immutability */

function LibraryInteractionController({
  stories, disabled, carriedId, placedId, onCarry, onPlace, onOpen, onTargetChange, onReturnToShelf,
}: {
  stories: ArchivoLibraryStory[];
  disabled: boolean;
  carriedId: string | null;
  placedId: string | null;
  onCarry: (id: string | null) => void;
  onPlace: (id: string | null) => void;
  onOpen: (story: ArchivoLibraryStory) => void;
  onTargetChange: (id: string | null) => void;
  onReturnToShelf: (id: string) => void;
}) {
  const { camera, scene, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const center = useMemo(() => new THREE.Vector2(0, 0), []);
  const targetId = useRef<string | null>(null);
  const carriedRef = useRef(carriedId);
  const placedRef = useRef(placedId);
  const holdTimer = useRef<number | null>(null);
  const holdCode = useRef<string | null>(null);
  const targetCheckElapsed = useRef(0);

  useEffect(() => { carriedRef.current = carriedId; }, [carriedId]);
  useEffect(() => { placedRef.current = placedId; }, [placedId]);

  useFrame((_, delta) => {
    if (disabled || document.pointerLockElement !== gl.domElement) return;
    targetCheckElapsed.current += delta;
    if (targetCheckElapsed.current < 0.10) return;
    targetCheckElapsed.current = 0;
    let nextId: string | null = null;
    if (!carriedRef.current && !placedRef.current) {
      raycaster.setFromCamera(center, camera);
      const bookRoots = scene.children.filter((child) => typeof child.userData.archivoStoryId === "string");
      const hits = raycaster.intersectObjects(bookRoots, true);
      for (const hit of hits) {
        let node: THREE.Object3D | null = hit.object;
        while (node) {
          const id = node.userData.archivoStoryId;
          if (typeof id === "string") { nextId = id; break; }
          node = node.parent;
        }
        if (nextId) break;
      }
    }
    if (nextId !== targetId.current) {
      targetId.current = nextId;
      onTargetChange(nextId);
    }
    const deskEdgeX = Math.max(0, Math.abs(camera.position.x) - 1.95);
    const deskEdgeZ = Math.max(0, Math.abs(camera.position.z - 2.25) - 1.05);
    const near = Math.hypot(deskEdgeX, deskEdgeZ) < 0.92;
    if (near && carriedRef.current && !placedRef.current) {
      const id = carriedRef.current;
      carriedRef.current = null;
      placedRef.current = id;
      onCarry(null);
      onPlace(id);
    }
  });

  useEffect(() => {
    const clearHold = () => {
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
      holdCode.current = null;
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.repeat || disabled || document.pointerLockElement !== gl.domElement || holdCode.current) return;
      let action: (() => void) | null = null;
      if (event.code === "KeyR" && !carriedRef.current && !placedRef.current && targetId.current) {
        event.preventDefault();
        const id = targetId.current;
        action = () => {
          carriedRef.current = id;
          onCarry(id);
          onTargetChange(null);
        };
      } else if (event.code === "KeyC" && placedRef.current) {
        event.preventDefault();
        const story = stories.find((item) => item.id === placedRef.current);
        if (story) action = () => onOpen(story);
      } else if (event.code === "KeyE" && (carriedRef.current || placedRef.current)) {
        event.preventDefault();
        const id = carriedRef.current ?? placedRef.current;
        if (id) {
          action = () => {
            carriedRef.current = null;
            placedRef.current = null;
            targetId.current = null;
            onCarry(null);
            onPlace(null);
            onTargetChange(null);
            onReturnToShelf(id);
          };
        }
      }
      if (!action) return;
      holdCode.current = event.code;
      holdTimer.current = window.setTimeout(() => {
        const run = action;
        clearHold();
        run?.();
      }, 560);
    };
    const keyUp = (event: KeyboardEvent) => {
      if (holdCode.current === event.code) clearHold();
    };
    const blur = () => clearHold();
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    return () => {
      clearHold();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
    };
  }, [disabled, gl.domElement, onCarry, onOpen, onPlace, onTargetChange, onReturnToShelf, stories]);
  return null;
}

function Desk({ onOpenComputer }: { onOpenComputer?: () => void }) {
  return (
    <group position={[0, 0, 2.25]}>
      <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.25, 0.16, 1.55]} />
        <meshStandardMaterial color="#4a2b19" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.99, 0]} castShadow>
        <boxGeometry args={[3.1, 0.025, 1.4]} />
        <meshStandardMaterial color="#8d613a" roughness={0.38} metalness={0.04} />
      </mesh>
      {[-1.42, 1.42].flatMap((x) => [-0.62, 0.62].map((z) => (
        <mesh key={x + ":" + z} position={[x, 0.43, z]} castShadow>
          <boxGeometry args={[0.14, 0.88, 0.14]} />
          <meshStandardMaterial color="#2d1a10" roughness={0.62} />
        </mesh>
      )))}
      {/* Physical investigation workstation: CRT monitor, stand, keyboard and mouse. */ }
      <group position={[0, 1.02, -0.56]} rotation={[0, 0, 0]} scale={0.78}>
        <RoundedBox args={[1.17, 0.87, 0.23]} radius={0.075} smoothness={4} position={[0, 0.43, -0.02]} castShadow receiveShadow>
          <meshStandardMaterial color="#303631" roughness={0.48} metalness={0.16} />
        </RoundedBox>
        <mesh position={[0, 0.43, -0.145]} castShadow>
          <boxGeometry args={[0.98, 0.68, 0.035]} />
          <meshStandardMaterial color="#111714" roughness={0.32} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.43, 0.085]} castShadow>
          <boxGeometry args={[1.035, 0.72, 0.025]} />
          <meshStandardMaterial color="#080d0c" roughness={0.28} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.43, 0.102]}>
          <boxGeometry args={[0.985, 0.67, 0.008]} />
          <meshBasicMaterial color="#18251f" />
        </mesh>
        <mesh position={[0, 0.43, 0.112]}>
          <boxGeometry args={[0.96, 0.64, 0.006]} />
          <meshBasicMaterial color="#21372d" />
        </mesh>
        <mesh position={[0, 0.43, 0.125]}>
          <boxGeometry args={[0.92, 0.60, 0.003]} />
          <meshBasicMaterial color="#15251f" />
        </mesh>
        <mesh position={[0, 0.43, 0.132]} onClick={(event) => { event.stopPropagation(); onOpenComputer?.(); }} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = "auto"; }}>
          <planeGeometry args={[0.92, 0.60]} />
          <meshBasicMaterial color="#263e32" />
        </mesh>
        <mesh position={[0, 0.43, 0.139]} onClick={(event) => { event.stopPropagation(); onOpenComputer?.(); }}>
          <planeGeometry args={[0.84, 0.52]} />
          <meshBasicMaterial color="#172b22" />
        </mesh>
        <mesh position={[0, 0.58, 0.145]}>
          <planeGeometry args={[0.42, 0.035]} />
          <meshBasicMaterial color="#b7c9a6" />
        </mesh>
        <mesh position={[0, 0.48, 0.145]}>
          <planeGeometry args={[0.66, 0.012]} />
          <meshBasicMaterial color="#738b70" />
        </mesh>
        <mesh position={[0, 0.43, 0.145]}>
          <planeGeometry args={[0.52, 0.012]} />
          <meshBasicMaterial color="#738b70" />
        </mesh>
        <mesh position={[0, 0.38, 0.145]}>
          <planeGeometry args={[0.60, 0.012]} />
          <meshBasicMaterial color="#738b70" />
        </mesh>
        <mesh position={[0, -0.015, -0.005]} castShadow>
          <boxGeometry args={[0.22, 0.12, 0.22]} />
          <meshStandardMaterial color="#333a35" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0.43, 0.08, 0.104]}>
          <sphereGeometry args={[0.012, 10, 8]} />
          <meshBasicMaterial color="#8fbf72" />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={`vent-${i}`} position={[-0.39 + i * 0.045, 0.08, 0.105]}>
            <boxGeometry args={[0.025, 0.006, 0.004]} />
            <meshStandardMaterial color="#111714" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, -0.09, 0.015]} castShadow>
          <boxGeometry args={[0.52, 0.055, 0.30]} />
          <meshStandardMaterial color="#343a34" metalness={0.5} roughness={0.38} />
        </mesh>
        <mesh position={[0, -0.105, 0.18]} castShadow>
          <boxGeometry args={[0.88, 0.055, 0.30]} />
          <meshStandardMaterial color="#262d29" roughness={0.62} />
        </mesh>
        {Array.from({ length: 48 }, (_, i) => (
          <mesh key={i} position={[-0.39 + (i % 12) * 0.071, -0.073, 0.09 + Math.floor(i / 12) * 0.062]} castShadow>
            <boxGeometry args={[0.052, 0.012, 0.042]} />
            <meshStandardMaterial color={i % 12 === 11 ? "#596b5a" : "#727b70"} roughness={0.75} />
          </mesh>
        ))}
        <mesh position={[0.68, -0.075, 0.27]} castShadow>
          <boxGeometry args={[0.12, 0.07, 0.18]} />
          <meshStandardMaterial color="#353b36" roughness={0.58} />
        </mesh>
        <mesh position={[0.68, -0.035, 0.27]} castShadow>
          <boxGeometry args={[0.075, 0.012, 0.12]} />
          <meshStandardMaterial color="#727d70" roughness={0.62} />
        </mesh>
      </group>
    </group>
  );
}

function LibraryWorld({
  stories, suspectCards, showSuspects, inspectionMode, readingMode, onInspectionSettled, onSelectSuspect, onOpenComputer, onSelect, disabled, frameImages, returnBookToShelfToken, suspectFolderTitle, suspectFolderCode,
  carriedId, setCarriedId, placedId, setPlacedId,
  targetId, setTargetId, returningBookId, setReturningBookId,
}: Props & {
  frameImages: Partial<Record<"left" | "right", string>>;
  returningBookId: string | null;
  setReturningBookId: (id: string | null) => void;
  carriedId: string | null;
  setCarriedId: (id: string | null) => void;
  placedId: string | null;
  setPlacedId: (id: string | null) => void;
  targetId: string | null;
  setTargetId: (id: string | null) => void;
}) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [previousReturnToken, setPreviousReturnToken] = useState(returnBookToShelfToken);
  if (previousReturnToken !== returnBookToShelfToken) {
    setPreviousReturnToken(returnBookToShelfToken);
    setOpeningId(null);
  }
  const perRow = 36;
  const rows = Math.max(1, Math.ceil(stories.length / perRow));
  const shelfY = useMemo(() => Array.from({ length: Math.min(rows, 3) }, (_, i) => 0.25 + i * 1.1), [rows]);

  return (
    <>
      <color attach="background" args={["#130c08"]} />
      <fog attach="fog" args={["#130c08", 12, 24]} />
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#f1d9b5", "#1b1009", 0.68]} />
      <directionalLight position={[-4, 7, 3]} intensity={1.0} castShadow
        shadow-mapSize-width={512} shadow-mapSize-height={512}
        shadow-camera-near={0.1} shadow-camera-far={20}
        shadow-camera-left={-8} shadow-camera-right={8}
        shadow-camera-top={7} shadow-camera-bottom={-2} shadow-bias={-0.00015} />
      <pointLight position={[-4, 3.2, -3.6]} intensity={34} distance={7} decay={2} color="#e9ad69" />
      <pointLight position={[4, 3.3, -3.7]} intensity={30} distance={7} decay={2} color="#d78e4e" />
      <Room frameImages={frameImages} />
      <Desk onOpenComputer={onOpenComputer} />
      {showSuspects && suspectCards && suspectCards.length > 0 && (
        <Html
          position={[0, 1.014, 2.20]}
          transform
          center
          scale={0.1616}
          rotation={[-Math.PI / 2, 0, 0]}
          distanceFactor={4.7}
          zIndexRange={[45, 0]}
        >
          <section
            aria-label="Carpeta de sospechosos del expediente"
            className="archivo-case-folder relative w-[440px] overflow-hidden border-[7px] border-[#705538] text-[#322719] shadow-[0_16px_35px_rgba(28,14,5,.58)]"
            style={{
              backgroundColor: "#e7d6b4",
              backgroundImage: "url('/archivo-oculto/textures/parchment.svg'), linear-gradient(135deg,#f0e2c4 0%,#d7c29a 100%)",
              backgroundSize: "640px 640px,cover",
            }}
          >
            <div className="pointer-events-none absolute inset-[7px] border border-[#9f8050]/70" />
            <div className="relative flex min-h-[30px] items-center justify-between gap-3 border-b border-[#b79a6a] bg-[#e5d4b2] px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#6b5537]">
              <span>Archivo de personas vinculadas</span>
              <span className="whitespace-nowrap">Expediente {suspectFolderCode || "S/C"} · {suspectCards?.length ?? 0} fichas</span>
            </div>
            <div className="relative px-3 pb-2.5 pt-2.5">
              <div className="flex items-start justify-between gap-5 border-b-2 border-[#92774e] pb-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#7d6744]">Archivo de personas vinculadas</p>
                  <h2 className="mt-1 font-serif text-[35px] font-bold uppercase leading-none tracking-[.02em] text-[#2d2519]">
                    Personas de interés
                  </h2>
                  <p className="mt-2 font-serif text-[13px] italic text-[#705b3c]">
                    {suspectFolderTitle || "Registro fotográfico y documental"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Image src="/archivo-oculto/stamps/confidencial.svg" alt="Confidencial" width={700} height={160} unoptimized draggable={false} className="w-[150px] opacity-95" />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#816b49]">Ficha documental</span>
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                {suspectCards.map((suspect, index) => (
                  <button
                    key={suspect.id}
                    type="button"
                    data-opf-no-flip
                    aria-label={"Abrir expediente individual de " + suspect.name}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectSuspect?.(suspect);
                    }}
                    className="archivo-folder-suspect group relative min-w-0 border border-[#ad9468] bg-[#f0e3c6]/95 p-2 text-left shadow-[0_5px_10px_rgba(49,32,14,.22)] transition duration-200 ease-out hover:z-20 hover:-translate-y-3 hover:rotate-0 hover:scale-[1.035] hover:border-[#795b37] hover:shadow-[0_15px_20px_rgba(40,25,10,.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b3d31]"
                    style={{ rotate: (index % 2 === 0 ? "-0.7deg" : "0.7deg") }}
                  >
                    <span className="pointer-events-none absolute -top-[5px] left-1/2 z-10 h-[13px] w-[64px] -translate-x-1/2 rotate-[-2deg] border border-[#baa47c]/70 bg-[#dfd0ae]/85 shadow-sm" />
                    <span className="relative block overflow-hidden border-[5px] border-[#e8d9b9] bg-[#31291e] shadow-inner">
                      {suspect.imageUrl ? (
                        <Image
                          src={suspect.imageUrl}
                          alt={"Retrato ficticio de " + suspect.name}
                          draggable={false}
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={index === 0 ? "high" : "auto"}
                          width={420}
                          height={470}
                          unoptimized
                          className="block aspect-[4/4.35] w-full object-cover object-top transition duration-300 group-hover:scale-[1.035] group-hover:contrast-[1.04]"
                        />
                      ) : (
                        <span className="grid aspect-[4/4.35] w-full place-items-center font-serif text-5xl text-[#ead9b6]">{suspect.name.slice(0, 1)}</span>
                      )}
                    </span>
                    <span className="mt-2 block border-b border-dashed border-[#a99268] pb-1 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#8e7046]">
                      Ficha {String(index + 1).padStart(2, "0")} · PS-{suspectFolderCode || "SC"}-{String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="mt-1.5 block truncate font-serif text-[16px] font-bold leading-tight text-[#302619]">
                      {suspect.name}
                    </span>
                    <span className="mt-1 block min-h-[26px] text-[10px] font-semibold uppercase leading-[1.4] tracking-[.05em] text-[#745b39]">
                      {suspect.role}
                    </span>
                    <span className="mt-2 flex items-center justify-between border-t border-[#c0a982] pt-1.5 font-sans text-[10px] font-semibold uppercase tracking-[.08em] text-[#856a43]">
                      <span>Consultar ficha</span>
                      <span className="font-serif text-[17px] leading-none transition-transform group-hover:translate-x-1">›</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t-2 border-[#92774e] pt-2.5">
                <div className="flex items-center gap-2">
                  <Image src="/archivo-oculto/stamps/revision-evidencia.svg" alt="Revisión de evidencia" width={240} height={240} unoptimized draggable={false} className="h-[38px] w-[38px] opacity-85" />
                  <p className="font-mono text-[8px] font-bold uppercase tracking-[.14em] text-[#6f6043]">
                    Registro fotográfico · {suspectCards.length} personas
                    <span className="mt-0.5 block font-normal tracking-[.08em]">Anexo de consulta · expediente ficticio</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="max-w-[170px] font-serif text-[11px] italic leading-[1.35] text-[#735c3d]">
                    La vinculación no constituye prueba de responsabilidad.
                  </p>
                  <Image src="/archivo-oculto/stamps/huella.svg" alt="" aria-hidden="true" width={180} height={220} unoptimized draggable={false} className="h-[42px] w-[32px] opacity-60" />
                </div>
              </div>
            </div>
          </section>
        </Html>
      )}
      {shelfY.map((y) => <Shelf key={y} y={y} />)}
      {stories.map((story, index) => {
        const row = Math.floor(index / perRow);
        const column = index % perRow;
        const booksInRow = Math.min(perRow, stories.length - row * perRow);
        const height = 0.72 + (index % 4) * 0.045;
        const y = shelfY[Math.min(row, shelfY.length - 1)] + 0.08 + height / 2;
        const x = (column - (booksInRow - 1) / 2) * 0.32;
        return (
          <StoryBook key={story.id} story={story} index={index}
            position={[x, y, -5.65]}
            carried={carriedId === story.id}
            placed={placedId === story.id}
            droppedPosition={null}
            opening={openingId === story.id}
            targeted={targetId === story.id}
            returning={returningBookId === story.id}
            onReturnComplete={() => setReturningBookId(null)} />
        );
      })}
      <FirstPersonMovement disabled={Boolean(inspectionMode || readingMode)} />
      <MouseLookControls disabled={Boolean(inspectionMode || readingMode)} />
      <InspectionCamera active={Boolean(inspectionMode)} onSettled={onInspectionSettled} />
      <LibraryInteractionController
        stories={stories}
        disabled={Boolean(disabled || inspectionMode || readingMode || returningBookId)}
        carriedId={carriedId}
        placedId={placedId}
        onCarry={setCarriedId}
        onPlace={setPlacedId}
        onReturnToShelf={setReturningBookId}
        onOpen={(story) => {
          if (openingId) return;
          setOpeningId(story.id);
          // Give the portraits time to land on the desk before switching to the book reader.
          window.setTimeout(() => onSelect(story), 1550);
          window.setTimeout(() => {
            setOpeningId((current) => current === story.id ? null : current);
          }, 4500);
        }}
        onTargetChange={setTargetId}
      />
    </>
  );
}

export default function ArchivoOcultoLibrary3D({ stories, suspectCards = [], showSuspects = false, inspectionMode = false, readingMode = false, onInspectionSettled, onSelectSuspect, onOpenComputer, onSelect, disabled = false, pauseRender = false, returnBookToShelfToken = 0, suspectFolderTitle, suspectFolderCode }: Props) {
  const [locked, setLocked] = useState(false);
  const [carriedId, setCarriedId] = useState<string | null>(null);
  const [placedId, setPlacedId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [returningBookId, setReturningBookId] = useState<string | null>(null);
  const [previousReturnToken, setPreviousReturnToken] = useState(returnBookToShelfToken);
  if (previousReturnToken !== returnBookToShelfToken) {
    setPreviousReturnToken(returnBookToShelfToken);
    setReturningBookId(placedId ?? carriedId);
    setCarriedId(null);
    setPlacedId(null);
    setTargetId(null);
  }
  const [lockError, setLockError] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [frameImages, setFrameImages] = useState<Partial<Record<"left" | "right", string>>>({});
  const stormAudioRef = useRef<HTMLAudioElement[]>([]);
  useEffect(() => {
    const tracks = [
      new Audio("/audio/caso-cero/lluvia-ventana.wav"),
      new Audio("/audio/caso-cero/ambiente-rio-lluvia.wav"),
    ];
    tracks[0].volume = 0.28;
    tracks[1].volume = 0.16;
    tracks.forEach((audio) => { audio.loop = true; audio.preload = "none"; });
    stormAudioRef.current = tracks;
    return () => {
      tracks.forEach((audio) => { audio.pause(); audio.currentTime = 0; });
      stormAudioRef.current = [];
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/games/archivo-oculto/frames", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { frames?: { slot: "left" | "right"; image_url: string }[] } | null) => {
        if (!active || !Array.isArray(data?.frames)) return;
        const next: Partial<Record<"left" | "right", string>> = {};
        for (const frame of data.frames) next[frame.slot] = frame.image_url;
        setFrameImages(next);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onHelpKey = (event: KeyboardEvent) => {
      if (event.code !== "KeyH" || event.repeat || readingMode || inspectionMode) return;
      event.preventDefault();
      setControlsOpen((open) => !open);
    };
    window.addEventListener("keydown", onHelpKey);
    return () => window.removeEventListener("keydown", onHelpKey);
  }, [inspectionMode, readingMode]);

  useEffect(() => {
    const syncPointerLock = () => {
      const canvas = document.querySelector(".archivo-library-world canvas");
      const isLocked = canvas instanceof HTMLCanvasElement && document.pointerLockElement === canvas;
      setLocked(isLocked);
      setLockError(null);
    };
    const onPointerLockError = () => {
      setLockError("No se pudo activar el control de cámara. Haz clic en «Entrar a la biblioteca» para intentarlo de nuevo.");
      setLocked(false);
    };
    document.addEventListener("pointerlockchange", syncPointerLock);
    document.addEventListener("pointerlockerror", onPointerLockError);
    return () => {
      document.removeEventListener("pointerlockchange", syncPointerLock);
      document.removeEventListener("pointerlockerror", onPointerLockError);
    };
  }, []);
  return (
    <div className="archivo-library-world relative h-full min-h-[min(78svh,820px)] w-full overflow-hidden">
      <Canvas
        frameloop={disabled || pauseRender ? "never" : "demand"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.68, 4.8], fov: 67.5 }}
        gl={{ antialias: true, powerPreference: "high-performance", stencil: false, depth: true }}
        shadows
        onCreated={({ gl }) => {
          gl.domElement.tabIndex = 0;
          gl.domElement.style.outline = "none";
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <LibraryWorld
          stories={stories}
          suspectCards={suspectCards}
          showSuspects={showSuspects}
          inspectionMode={inspectionMode}
          readingMode={readingMode}
          onInspectionSettled={onInspectionSettled}
          onSelectSuspect={onSelectSuspect}
          onOpenComputer={onOpenComputer}
          onSelect={onSelect}
          disabled={disabled}
          frameImages={frameImages}
          returnBookToShelfToken={returnBookToShelfToken}
          suspectFolderTitle={suspectFolderTitle}
          suspectFolderCode={suspectFolderCode}
          carriedId={carriedId}
          setCarriedId={setCarriedId}
          placedId={placedId}
          setPlacedId={setPlacedId}
          targetId={targetId}
          setTargetId={setTargetId}
          returningBookId={returningBookId}
          setReturningBookId={setReturningBookId}
        />
      </Canvas>
      {!locked && !inspectionMode && !readingMode && (
        <button
          type="button"
          onClick={() => {
            const canvas = document.querySelector(".archivo-library-world canvas") as HTMLCanvasElement | null;
            if (!canvas) return;
            setLockError(null);
            // Invoke Pointer Lock synchronously in the trusted click, without
            // focusing or changing any state before the browser request.
            try {
              const result = canvas.requestPointerLock();
              if (result && typeof result.catch === "function") {
                void result.catch(() => setLockError("No se pudo activar la cámara. Vuelve a pulsar Entrar a la biblioteca."));
              }
            } catch {
              setLockError("No se pudo activar la cámara. Vuelve a pulsar Entrar a la biblioteca.");
            }
            const tracks = stormAudioRef.current;
            tracks.forEach((audio) => { void audio.play().catch(() => undefined); });
          }}
          className="group absolute bottom-7 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#cda76d]/75 bg-gradient-to-b from-[#49301c]/95 to-[#170e09]/95 px-7 py-3.5 text-center text-xs font-black tracking-[.16em] text-[#f8e8c9] shadow-[0_8px_28px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,230,185,.16)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[#f5d9a5] hover:shadow-[0_12px_32px_rgba(0,0,0,.65)] active:translate-y-0"
        >
          ENTRAR A LA BIBLIOTECA
          <span className="mt-1.5 block text-[9px] font-medium tracking-[.08em] text-[#d7c29d]">WASD · MOVERSE · MOUSE · MIRAR · ESC · SALIR</span>
        </button>
      )}
      {lockError && !locked && <div role="status" className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded border border-[#d9bd8d]/40 bg-[#170e09]/95 px-4 py-2 text-center text-xs text-[#f1dfbd]">{lockError}</div>}
      {locked && (
        <div aria-hidden="true" className="archivo-game-crosshair pointer-events-none absolute left-1/2 top-1/2 z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-[#f8e7c4] shadow-[0_0_4px_#000]" />
          <span className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-[#f8e7c4] shadow-[0_0_4px_#000]" />
          <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-[#f8e7c4] shadow-[0_0_4px_#000]" />
          <span className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-[#f8e7c4] shadow-[0_0_4px_#000]" />
          <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff3d9]" />
        </div>
      )}
      <div className="pointer-events-none absolute left-5 top-5 text-[10px] uppercase tracking-[.22em] text-[#d9bd8d]/75">
        BIBLIOTECA · {stories.length} {stories.length === 1 ? "LIBRO" : "LIBROS"}
      </div>
      {locked && !inspectionMode && (targetId || carriedId || placedId) && (
        <div className="pointer-events-none absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-[#c89b5d]/70 bg-[#160d08]/95 px-4 py-3 text-[#f4e4c5] shadow-[0_12px_38px_rgba(0,0,0,.5)] backdrop-blur-md">
          <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#d6ad70] bg-gradient-to-b from-[#754323] to-[#32190f] font-serif text-lg font-black shadow-[inset_0_1px_2px_rgba(255,255,255,.2)]">{placedId ? "C" : "R"}</span>
          <span className="text-left">
            <span className="block text-[11px] font-bold tracking-wide">{placedId ? "MANTÉN C PARA ABRIR" : carriedId ? "ACÉRCATE A LA MESA" : "MANTÉN R PARA RECOGER"}</span>
            <span className="mt-0.5 block text-[9px] text-[#d1b98f]">{placedId ? "C abre · Mantén E para devolver al estante" : carriedId ? "Acércate a la mesa · Mantén E para devolver" : "Mira el lomo del libro que quieres"}</span>
          </span>
        </div>
      )}
      {!readingMode && !inspectionMode && (
        <>
          <button
            type="button"
            onClick={() => setControlsOpen((open) => !open)}
            aria-expanded={controlsOpen}
            className="absolute right-5 top-5 z-40 border border-[#b18a56]/65 bg-[#18110b]/90 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-[#ecd9b6] shadow-lg backdrop-blur hover:border-[#e3c38e]"
          >
            H · Controles
          </button>
          {controlsOpen && (
            <section className="absolute right-5 top-16 z-40 w-[min(340px,calc(100%-40px))] border border-[#b18a56]/80 bg-[#17130e]/[.97] p-4 text-[#f0dfc1] shadow-[0_18px_55px_rgba(0,0,0,.72)]">
              <div className="mb-3 flex items-center justify-between border-b border-[#a98453]/50 pb-2">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[.2em] text-[#c59d67]">Manual operativo</p>
                  <h3 className="mt-1 font-serif text-lg font-bold">Controles de biblioteca</h3>
                </div>
                <button type="button" onClick={() => setControlsOpen(false)} aria-label="Cerrar controles" className="border border-[#a98453]/55 px-2 py-1 text-xs hover:bg-white/10">×</button>
              </div>
              <div className="space-y-2 text-[11px]">
                {[
                  ["W A S D", "Desplazarse por la habitación"],
                  ["MOUSE", "Mirar alrededor"],
                  ["ESC", "Liberar el cursor sin salir de la habitación"],
                  ["R · mantener", "Recoger el libro que estás mirando"],
                  ["C · mantener", "Abrir el libro colocado sobre la mesa"],
                  ["E · mantener", "Devolver al estante el libro llevado o colocado"],
                  ["SHIFT", "Cerrar la lectura y devolver el libro al estante"],
                  ["F", "Inspeccionar sospechosos durante la lectura"],
                  ["H", "Mostrar u ocultar este manual"]
                ].map(([key, description]) => (
                  <div key={key} className="grid grid-cols-[112px_1fr] items-center gap-2 border-b border-[#947348]/20 pb-1.5 last:border-0">
                    <kbd className="inline-flex w-fit border border-[#a98453]/60 bg-[#3a2a19] px-2 py-1 font-mono text-[9px] font-bold text-[#f4dfb7]">{key}</kbd>
                    <span className="leading-relaxed text-[#d4c2a1]">{description}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-[#a98453]/40 pt-2 text-[9px] leading-relaxed text-[#b79d76]">Consejo: después de pulsar ESC, usa el botón «Entrar a la biblioteca» para volver a capturar el mouse.</p>
            </section>
          )}
          <div className="pointer-events-none absolute bottom-5 left-5 z-10 rounded-md border border-[#d9bd8d]/25 bg-[#170e09]/65 px-3 py-2 font-mono text-[9px] tracking-wide text-[#f1dfbd]/85 backdrop-blur">
            WASD · MOVERSE &nbsp; MOUSE · MIRAR &nbsp; ESC · CURSOR &nbsp; R · TOMAR &nbsp; C · ABRIR &nbsp; E · DEVOLVER &nbsp; H · CONTROLES
          </div>
        </>
      )}
    </div>
  );
}
