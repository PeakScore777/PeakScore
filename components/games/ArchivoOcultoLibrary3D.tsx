"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export type ArchivoLibraryStory = { id: string; title: string; completed?: boolean; questions: { id: string }[] };

type Props = {
  stories: ArchivoLibraryStory[];
  onSelect: (story: ArchivoLibraryStory) => void;
  disabled?: boolean;
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

function createWindowViewTexture() {
  return makeCanvasTexture((ctx, size) => {
    const sky = ctx.createLinearGradient(0, 0, 0, size);
    sky.addColorStop(0, "#182b35");
    sky.addColorStop(0.55, "#536b68");
    sky.addColorStop(1, "#a18b69");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, size, size);
    const moon = ctx.createRadialGradient(size * .68, size * .2, 8, size * .68, size * .2, size * .15);
    moon.addColorStop(0, "rgba(247,224,177,.9)");
    moon.addColorStop(1, "rgba(247,224,177,0)");
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#d9c99e";
    ctx.beginPath();
    ctx.arc(size * .68, size * .2, size * .045, 0, Math.PI * 2);
    ctx.fill();
    const hills = [
      { y: .56, color: "#354b45", peaks: [.02,.18,.31,.48,.62,.78,.94] },
      { y: .68, color: "#263c35", peaks: [.0,.12,.27,.42,.57,.72,.88,1] },
      { y: .82, color: "#182b24", peaks: [.0,.16,.3,.46,.62,.79,.93,1] },
    ];
    hills.forEach((hill, layer) => {
      ctx.fillStyle = hill.color;
      ctx.beginPath();
      ctx.moveTo(0, size);
      ctx.lineTo(0, size * hill.y);
      hill.peaks.forEach((p, i) => {
        const px = p * size;
        const py = size * (hill.y - ((i * 17 + layer * 11) % 23) / 100);
        ctx.lineTo(px, py);
      });
      ctx.lineTo(size, size * hill.y);
      ctx.lineTo(size, size);
      ctx.closePath();
      ctx.fill();
    });
    ctx.fillStyle = "rgba(190,190,158,.16)";
    ctx.fillRect(0, size * .72, size, size * .08);
    for (let i = 0; i < 34; i++) {
      const x = ((i * 83) % 100) / 100 * size;
      const y = size * (.68 + ((i * 29) % 28) / 100);
      const h = size * (.08 + ((i * 13) % 13) / 100);
      ctx.fillStyle = i % 2 ? "#14251f" : "#1b3028";
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x - h * .28, y + h * .3);
      ctx.lineTo(x + h * .28, y + h * .3);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x - 2, y + h * .2, 4, h * .3);
    }
    ctx.fillStyle = "rgba(213,220,201,.12)";
    for (let i = 0; i < 9; i++) {
      const x = i * size / 8;
      ctx.fillRect(x, size * .1, 1, size * .82);
    }
  });
}

function createLandscapeArtTexture() {
  return makeCanvasTexture((ctx,size)=>{
    const sky=ctx.createLinearGradient(0,0,0,size);
    sky.addColorStop(0,"#172b34");sky.addColorStop(.46,"#65786f");sky.addColorStop(.78,"#c1a47a");sky.addColorStop(1,"#8c7658");
    ctx.fillStyle=sky;ctx.fillRect(0,0,size,size);
    const glow=ctx.createRadialGradient(size*.72,size*.22,6,size*.72,size*.22,size*.32);
    glow.addColorStop(0,"rgba(255,225,174,.8)");glow.addColorStop(1,"rgba(255,225,174,0)");
    ctx.fillStyle=glow;ctx.fillRect(0,0,size,size);
    ctx.fillStyle="#ead3a5";ctx.beginPath();ctx.arc(size*.72,size*.22,size*.05,0,Math.PI*2);ctx.fill();
    for(let i=0;i<18;i++){const x=size*(.04+(i*29%88)/100),y=size*(.1+(i*17%24)/100);ctx.strokeStyle=i%2?"rgba(238,220,184,.2)":"rgba(30,47,47,.14)";ctx.lineWidth=2+(i%3)*2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+size*.05,y-size*.012,x+size*(.09+(i%3)*.018),y);ctx.stroke();}
    const ridge=(base,color,seed,amp)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,size);ctx.lineTo(0,size*base);for(let i=0;i<=20;i++){const x=size*i/20,y=size*(base-(((i*37+seed*13)%19)/100)*amp);ctx.lineTo(x,y);}ctx.lineTo(size,size*base);ctx.lineTo(size,size);ctx.closePath();ctx.fill();};
    ridge(.59,"#53645b",2,.72);ridge(.68,"#394f46",5,.54);ridge(.78,"#263e34",8,.35);
    const water=ctx.createLinearGradient(0,size*.69,0,size);water.addColorStop(0,"#89917c");water.addColorStop(.35,"#52685e");water.addColorStop(1,"#1b3331");ctx.fillStyle=water;ctx.fillRect(0,size*.69,size,size*.31);
    ctx.fillStyle="rgba(224,203,160,.2)";ctx.beginPath();ctx.moveTo(size*.62,size*.69);ctx.lineTo(size*.79,size*.69);ctx.lineTo(size*.57,size);ctx.lineTo(size*.43,size);ctx.closePath();ctx.fill();
    for(let i=0;i<28;i++){const y=size*(.73+i*.008),x=size*(.12+(i*31%72)/100),w=size*(.12+(i*11%25)/100);ctx.strokeStyle=i%4===0?"rgba(239,216,170,.48)":"rgba(196,202,174,.22)";ctx.lineWidth=i%4===0?3:1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(Math.min(size*.96,x+w),y);ctx.stroke();}
    for(let i=0;i<32;i++){const x=size*((i*43)%100)/100,y=size*(.7+((i*19)%24)/100),h=size*(.1+((i*17)%13)/100),w=h*(.28+(i%3)*.05);ctx.fillStyle=i%2?"#14291f":"#1c3328";ctx.fillRect(x-2,y-h*.08,4,h*.38);for(let k=0;k<4;k++){const yy=y-h+k*h*.19,half=w*(1-k*.16);ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x-half,yy+h*.29);ctx.lineTo(x+half,yy+h*.29);ctx.closePath();ctx.fill();}}
    ctx.fillStyle="rgba(244,225,187,.07)";for(let i=0;i<850;i++)ctx.fillRect((i*73)%size,(i*131)%size,1,1);
    ctx.strokeStyle="rgba(242,218,174,.36)";ctx.lineWidth=5;ctx.strokeRect(8,8,size-16,size-16);
  },1024);
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
  return (
    <group position={[0,0,.105]}>
      {Array.from({length:18},(_,i)=>{
        const x=((i*37)%100)/100*2.38-1.19, y=((i*61)%100)/100*1.38-.69;
        return <mesh key={i} position={[x,y,0]} rotation={[0,0,-.08]}>
          <boxGeometry args={[.009,.1+(i%3)*.025,.004]} />
          <meshBasicMaterial color="#d2e0d9" transparent opacity={.26} depthWrite={false}/>
        </mesh>;
      })}
    </group>
  );
}

function WindowAssembly({ side }: { side: -1 | 1 }) {
  const viewTexture=useMemo(()=>createWindowViewTexture(),[]);
  useEffect(()=>()=>viewTexture?.dispose(),[viewTexture]);
  return <group position={[side*7.28,2.55,-1.55]} rotation={[0,side*Math.PI/2,0]}>
    <mesh position={[0,0,-.095]}><boxGeometry args={[2.62,1.72,.18]}/><meshStandardMaterial color="#1d120c" roughness={.92}/></mesh>
    <mesh position={[0,0,-.025]}><boxGeometry args={[2.52,1.66,.12]}/><meshStandardMaterial color="#805633" roughness={.58}/></mesh>
    <mesh position={[0,0,.045]}><planeGeometry args={[2.32,1.43]}/><meshBasicMaterial map={viewTexture??undefined} toneMapped={false}/></mesh>
    <mesh position={[0,0,.052]}><planeGeometry args={[2.32,1.43]}/><meshPhysicalMaterial color="#d2e1dc" transparent opacity={.09} roughness={.1} metalness={.16} depthWrite={false}/></mesh>
    <RainStreaks/>
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

function PottedPlant({ position, scale = 1 }: { position: [number,number,number]; scale?: number }) {
  const leafGeometry=useMemo(()=>{
    const points:THREE.Vector2[]=[],slits=[.13,.22,.31,.4];
    for(let i=0;i<=72;i++){const u=i/72,a=-Math.PI/2+u*Math.PI*2;let k=1;for(const cut of slits)if(Math.abs(u-cut)<.018||Math.abs(1-u-cut)<.018)k=.48;if(u<.025||u>.975)k=.2;points.push(new THREE.Vector2(Math.cos(a)*.38*k,.5+Math.sin(a)*.5*k));}
    const g=new THREE.ShapeGeometry(new THREE.Shape(points)),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,-Math.abs(p.getX(i))*.24+Math.sin(p.getY(i)*Math.PI)*.055);g.computeVertexNormals();return g;
  },[]);
  const potGeometry=useMemo(()=>new THREE.LatheGeometry([new THREE.Vector2(.18,0),new THREE.Vector2(.22,.035),new THREE.Vector2(.28,.34),new THREE.Vector2(.31,.39),new THREE.Vector2(.34,.42),new THREE.Vector2(.31,.46),new THREE.Vector2(.27,.42),new THREE.Vector2(.25,.36),new THREE.Vector2(.21,.07)],24),[]);
  useEffect(()=>()=>{leafGeometry.dispose();potGeometry.dispose();},[leafGeometry,potGeometry]);
  return <group position={position} scale={scale}>
    <mesh geometry={potGeometry} castShadow receiveShadow><meshStandardMaterial color="#85472d" roughness={.78}/></mesh>
    <mesh position={[0,.435,0]}><cylinderGeometry args={[.27,.27,.035,24]}/><meshStandardMaterial color="#2b2116" roughness={1}/></mesh>
    <mesh position={[0,.45,0]}><cylinderGeometry args={[.035,.045,.38,8]}/><meshStandardMaterial color="#53623a" roughness={.95}/></mesh>
    {Array.from({length:10},(_,i)=>{const a=i*2.399+(i%3)*.13,lean=.38+(i%4)*.12,len=.56+(i%3)*.13;return <group key={i} position={[0,.45,0]} rotation={[lean,a,(i%2?1:-1)*.12]}>
      <mesh position={[0,len*.48,0]}><cylinderGeometry args={[.012,.022,len,6]}/><meshStandardMaterial color="#52653a" roughness={.95}/></mesh>
      <mesh geometry={leafGeometry} position={[0,len,0]} rotation={[.22,0,(i%3-1)*.16]} scale={[.76+(i%3)*.12,.8+(i%2)*.14,1]} castShadow><meshStandardMaterial color={i%3===0?"#718b4c":i%3===1?"#456d3b":"#5d7c42"} roughness={.86} side={THREE.DoubleSide}/></mesh>
      <mesh position={[0,len*.66,.018]}><boxGeometry args={[.009,len*.56,.008]}/><meshStandardMaterial color="#9aa66a" roughness={1}/></mesh>
    </group>;})}
    <mesh position={[0,.47,0]}><torusGeometry args={[.285,.018,6,24]}/><meshStandardMaterial color="#b17c4b" metalness={.24} roughness={.52}/></mesh>
  </group>;
}

function HangingChandelier() {
  const brass="#b58a4d";
  return <group position={[0,3.82,-.25]}>
    <mesh position={[0,.04,0]}><cylinderGeometry args={[.028,.035,.34,10]}/><meshStandardMaterial color={brass} metalness={.82} roughness={.26}/></mesh>
    <mesh position={[0,-.16,0]}><sphereGeometry args={[.13,14,10]}/><meshStandardMaterial color="#d1ad70" metalness={.78} roughness={.22}/></mesh>
    <mesh position={[0,-.27,0]}><torusGeometry args={[.68,.045,8,40]}/><meshStandardMaterial color={brass} metalness={.86} roughness={.24}/></mesh>
    <mesh position={[0,-.27,0]}><cylinderGeometry args={[.24,.31,.12,20]}/><meshStandardMaterial color="#78512f" metalness={.7} roughness={.3}/></mesh>
    {Array.from({length:6},(_,i)=>{const a=i*Math.PI/3,x=Math.cos(a)*.62,z=Math.sin(a)*.62;const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,-.28,0),new THREE.Vector3(x*.55,-.12,z*.55),new THREE.Vector3(x,-.28,z));const armGeometry=new THREE.TubeGeometry(curve,12,.022,7,false);return <group key={i}>
      <mesh geometry={armGeometry}><meshStandardMaterial color={brass} metalness={.86} roughness={.24}/></mesh>
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

function WallPortrait({ side, positionZ }: { side: -1 | 1; positionZ: number }) {
  const artTexture=useMemo(()=>createLandscapeArtTexture(),[]);
  useEffect(()=>()=>artTexture?.dispose(),[artTexture]);
  return <group position={[side*7.27,2.55,positionZ]} rotation={[0,side===-1?Math.PI/2:-Math.PI/2,0]}>
    <mesh position={[0,0,-.105]} castShadow><boxGeometry args={[1.5,1.94,.19]}/><meshStandardMaterial color="#21130c" roughness={.82}/></mesh>
    <mesh position={[0,0,-.005]}><boxGeometry args={[1.43,1.87,.075]}/><meshStandardMaterial color="#6d4325" roughness={.5}/></mesh>
    {[[1.48,.095,0,.91],[1.48,.095,0,-.91],[.095,1.82,.69,0],[.095,1.82,-.69,0]].map(([w,h,x,y],i)=><mesh key={i} position={[x,y,.045]}><boxGeometry args={[w,h,.105]}/><meshStandardMaterial color={i%2?"#bd965b":"#9a7040"} metalness={.46} roughness={.36}/></mesh>)}
    <mesh position={[0,0,.07]}><boxGeometry args={[1.25,1.65,.035]}/><meshStandardMaterial color="#21170f" roughness={.9}/></mesh>
    <mesh position={[0,0,.095]}><planeGeometry args={[1.16,1.56]}/><meshBasicMaterial map={artTexture??undefined} toneMapped={false}/></mesh>
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
  const texture = useMemo(()=>makeCanvasTexture((ctx,size)=>{
    ctx.fillStyle="#26352d";ctx.fillRect(0,0,size,size);
    ctx.strokeStyle="#b18a55";ctx.lineWidth=18;ctx.strokeRect(28,28,size-56,size-56);
    ctx.strokeStyle="rgba(218,185,126,.75)";ctx.lineWidth=5;ctx.strokeRect(52,52,size-104,size-104);
    for(let i=0;i<7;i++){
      const y=size*(.18+i*.1);ctx.strokeStyle="rgba(184,143,88,.38)";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(size*.12,y);ctx.lineTo(size*.88,y);ctx.stroke();
    }
    ctx.strokeStyle="#b18a55";ctx.lineWidth=7;
    for(let i=0;i<4;i++){const x=size*(.22+i*.18);ctx.beginPath();ctx.moveTo(x,size*.5);ctx.lineTo(size*.5,size*(.18+i*.1));ctx.stroke();}
  },512),[]);
  useEffect(()=>()=>texture?.dispose(),[texture]);
  return <mesh position={[0,.035,.1]} rotation={[-Math.PI/2,0,0]}>
    <planeGeometry args={[5.1,3.25]}/><meshStandardMaterial map={texture??undefined} roughness={1}/>
  </mesh>;
}

function Room() {
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
      <mesh position={[0, 1.95, -5.9]} receiveShadow>
        <boxGeometry args={[15, 4, 0.2]} />
        <meshStandardMaterial map={wallTexture ?? undefined} color="#b28a68" roughness={0.88} />
      </mesh>
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
      {/* Plants placed in the front corners, outside the walking path. */}
      <PottedPlant position={[-6.05, 0, 4.25]} scale={1.02} />
      <PottedPlant position={[6.05, 0, 4.25]} scale={0.96} />
      <PottedPlant position={[-6.15, 0, -3.65]} scale={0.82} />
      <AreaRug />
      <HangingChandelier />
      <WallPortrait side={-1} positionZ={4.55} />
      <WallPortrait side={1} positionZ={4.55} />
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

function bookCoverTexture(title: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createLinearGradient(0, 0, 512, 720);
  gradient.addColorStop(0, "#6c2d20");
  gradient.addColorStop(0.48, "#421a16");
  gradient.addColorStop(1, "#24100e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 720);
  ctx.strokeStyle = "#c7a16b";
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, 464, 672);
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, 428, 636);
  ctx.fillStyle = "rgba(211,177,122,.22)";
  ctx.fillRect(62, 62, 10, 596);
  ctx.fillStyle = "#e7c88e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 24px Georgia";
  ctx.fillText("EXPEDIENTE CONFIDENCIAL", 256, 235);
  ctx.font = "bold 39px Georgia";
  const words = title.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? line + " " + word : word;
    if (ctx.measureText(candidate).width > 370 && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((value, index) => ctx.fillText(value, 256, 325 + index * 48));
  ctx.font = "italic 20px Georgia";
  ctx.fillText("ARCHIVO OCULTO · PEAKSCORE", 256, 570);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
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
  story, index, position, carried, placed, droppedPosition, opening, targeted,
}: {
  story: ArchivoLibraryStory;
  index: number;
  position: [number, number, number];
  carried: boolean;
  placed: boolean;
  droppedPosition: [number, number, number] | null;
  opening: boolean;
  targeted: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const coverHinge = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(() => spineTexture(story.title), [story.title]);
  const coverTexture = useMemo(() => bookCoverTexture(story.title), [story.title]);
  const { camera, invalidate } = useThree();
  const forward = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const desiredQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => () => { texture?.dispose(); coverTexture?.dispose(); }, [texture, coverTexture]);

  useFrame((_, delta) => {
    if (!root.current) return;
    if (coverHinge.current) {
      coverHinge.current.rotation.y = THREE.MathUtils.damp(coverHinge.current.rotation.y, opening ? -Math.PI : 0, 7, delta);
    }
    if (carried) {
      camera.getWorldDirection(forward);
      target.copy(camera.position).addScaledVector(forward, 1.05);
      target.y -= 0.24;
      // Keep the book naturally in the player's hands. Automatic desk placement
      // takes over as soon as the player reaches the desk interaction radius.
      root.current.position.copy(target);
      desiredQuaternion.copy(camera.quaternion);
      root.current.quaternion.copy(desiredQuaternion);
      root.current.scale.setScalar(0.92);
    } else if (placed) {
      target.set(0, 1.085, 2.25);
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
    } else {
      root.current.position.set(position[0], position[1], position[2] + (hovered ? 0.045 : 0));
      root.current.rotation.set(0, hovered ? -0.025 : 0, 0);
      root.current.scale.setScalar(1);
    }
    if (opening && coverHinge.current && Math.abs(coverHinge.current.rotation.y + Math.PI) > 0.02) invalidate();
  });

  const spineWidth = 0.09 + (index % 4) * 0.014;
  const spineHeight = 0.72 + (index % 4) * 0.045;
  const isPhysical = carried || placed || Boolean(droppedPosition);
  const bookWidth = 0.58;
  const bookHeight = 0.78;
  const bookDepth = 0.17;

  return (
    <group ref={root} position={position} userData={{ archivoStoryId: story.id }}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}>
      {isPhysical ? (
        <group>
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[bookWidth - 0.035, bookHeight - 0.035, bookDepth - 0.025]} />
            <meshStandardMaterial color="#e8ddc6" roughness={0.92} />
          </mesh>
          <group ref={coverHinge} position={[-bookWidth / 2, 0, bookDepth / 2 - 0.005]}>
            <mesh position={[bookWidth / 2, 0, 0]} castShadow>
              <boxGeometry args={[bookWidth, bookHeight, 0.035]} />
              <meshStandardMaterial color="#54231d" roughness={0.62} />
            </mesh>
            <mesh position={[bookWidth / 2, 0, 0.02]}>
              <planeGeometry args={[bookWidth * 0.94, bookHeight * 0.96]} />
              <meshStandardMaterial map={coverTexture ?? undefined} color="#ffffff" roughness={0.68} />
            </mesh>
          </group>
          <mesh position={[0, 0, -bookDepth / 2 + 0.005]} castShadow>
            <boxGeometry args={[bookWidth, bookHeight, 0.035]} />
            <meshStandardMaterial color="#54231d" roughness={0.62} />
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
              emissive={hovered ? "#fff0c8" : "#000000"}
              emissiveIntensity={hovered ? 0.24 : 0} />
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
            <meshStandardMaterial color="#e7dcc6" roughness={0.94} />
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
function FirstPersonMovement({ carrying }: { carrying: boolean }) {
  const { camera, invalidate } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const direction = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const elapsed = useRef(0);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
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
  }, [invalidate]);

  useFrame((_, delta) => {
    if (!document.pointerLockElement) return;
    elapsed.current += Math.min(delta, 0.05);
    const speed = 3.6 * Math.min(delta, 0.05);
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();
    direction.set(0, 0, 0);
    if (keys.current.KeyW || keys.current.ArrowUp) direction.add(forward);
    if (keys.current.KeyS || keys.current.ArrowDown) direction.sub(forward);
    if (keys.current.KeyD || keys.current.ArrowRight) direction.add(right);
    if (keys.current.KeyA || keys.current.ArrowLeft) direction.sub(right);
    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed);
      const nextX = THREE.MathUtils.clamp(camera.position.x + direction.x, -6.2, 6.2);
      const nextZ = THREE.MathUtils.clamp(camera.position.z + direction.z, -4.7, 5.1);
      // Axis-separated AABB collision lets the player slide around the desk edges
      // instead of crossing the tabletop or getting stuck on a diagonal.
      const paddingX = 0.30;
      const paddingZ = 0.30;
      const collidesWithDesk = (x: number, z: number) =>
        x > -1.625 - paddingX && x < 1.625 + paddingX &&
        z > 2.25 - 0.775 - paddingZ && z < 2.25 + 0.775 + paddingZ;
      const collidesWithPlant = (x: number, z: number) =>
        [[-6.05,4.25,.76],[6.05,4.25,.72],[-6.15,-3.65,.68]].some(([px,pz,r]) =>
          Math.hypot(x-px,z-pz) < r + .3
        );
      if (!collidesWithDesk(nextX, camera.position.z) && !collidesWithPlant(nextX, camera.position.z)) camera.position.x = nextX;
      if (!collidesWithDesk(camera.position.x, nextZ) && !collidesWithPlant(camera.position.x, nextZ)) camera.position.z = nextZ;
      camera.position.y = 1.68 + Math.sin(elapsed.current * 8) * 0.018;
      invalidate();
    } else {
      camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.68, 8, delta);
    }
  });
  return null;
}

function MouseLookControls() {
  const { camera, invalidate } = useThree();
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  useEffect(() => {
    const lockChange = () => invalidate();
    const move = (event: MouseEvent) => {
      if (!document.pointerLockElement) return;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= event.movementX * 0.0072;
      euler.x -= event.movementY * 0.0072;
      euler.x = THREE.MathUtils.clamp(euler.x, -Math.PI / 2.15, Math.PI / 2.15);
      camera.quaternion.setFromEuler(euler);
      invalidate();
    };
    window.addEventListener("mousemove", move);
    document.addEventListener("pointerlockchange", lockChange);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("pointerlockchange", lockChange);
    };
  }, [camera, euler, invalidate]);
  return null;
}
/* eslint-enable react-hooks/immutability */

function LibraryInteractionController({
  stories, disabled, carriedId, placedId, onCarry, onPlace, onOpen, onTargetChange, onNearDeskChange,
}: {
  stories: ArchivoLibraryStory[];
  disabled: boolean;
  carriedId: string | null;
  placedId: string | null;
  onCarry: (id: string | null) => void;
  onPlace: (id: string | null) => void;
  onOpen: (story: ArchivoLibraryStory) => void;
  onTargetChange: (id: string | null) => void;
  onNearDeskChange: (near: boolean) => void;
}) {
  const { camera, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const center = useMemo(() => new THREE.Vector2(0, 0), []);
  const targetId = useRef<string | null>(null);
  const carriedRef = useRef(carriedId);
  const placedRef = useRef(placedId);
  const nearDeskRef = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdCode = useRef<string | null>(null);
  const targetCheckElapsed = useRef(0);

  useEffect(() => { carriedRef.current = carriedId; }, [carriedId]);
  useEffect(() => { placedRef.current = placedId; }, [placedId]);

  useFrame((_, delta) => {
    if (disabled || !document.pointerLockElement) return;
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
    const deskDistance = Math.hypot(camera.position.x, camera.position.z - 2.25);
    const near = deskDistance < 2.25;
    if (near !== nearDeskRef.current) {
      nearDeskRef.current = near;
      onNearDeskChange(near);
    }
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
      if (event.repeat || disabled || !document.pointerLockElement || holdCode.current) return;
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
  }, [disabled, onCarry, onOpen, onPlace, onTargetChange, stories]);
  return null;
}

function Desk() {
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
      <group position={[-0.95, 1.02, -0.12]}>
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.24, 0.28, 0.09, 24]} />
          <meshStandardMaterial color="#8b612f" metalness={0.72} roughness={0.32} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.035, 0.05, 0.72, 12]} />
          <meshStandardMaterial color="#75502a" metalness={0.65} roughness={0.34} />
        </mesh>
        <mesh position={[0, 0.8, 0]} rotation={[0.12, 0, -0.12]}>
          <cylinderGeometry args={[0.22, 0.5, 0.34, 32, 1, true]} />
          <meshStandardMaterial color="#30402a" metalness={0.42} roughness={0.36} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 0.66, 0]} intensity={24} distance={4} color="#ffca75" />
      </group>
    </group>
  );
}

function LibraryWorld({
  stories, onSelect, disabled,
  carriedId, setCarriedId, placedId, setPlacedId,
  targetId, setTargetId, setNearDesk,
}: Props & {
  carriedId: string | null;
  setCarriedId: (id: string | null) => void;
  placedId: string | null;
  setPlacedId: (id: string | null) => void;
  targetId: string | null;
  setTargetId: (id: string | null) => void;
  setNearDesk: (near: boolean) => void;
}) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const perRow = 36;
  const rows = Math.max(1, Math.ceil(stories.length / perRow));
  const shelfY = useMemo(() => Array.from({ length: Math.min(rows, 3) }, (_, i) => 0.25 + i * 1.1), [rows]);

  return (
    <>
      <color attach="background" args={["#130c08"]} />
      <fog attach="fog" args={["#130c08", 12, 24]} />
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#f1d9b5", "#1b1009", 0.68]} />
      <directionalLight position={[-4, 7, 3]} intensity={1.15} castShadow
        shadow-mapSize-width={640} shadow-mapSize-height={640}
        shadow-camera-near={0.1} shadow-camera-far={20}
        shadow-camera-left={-8} shadow-camera-right={8}
        shadow-camera-top={7} shadow-camera-bottom={-2} shadow-bias={-0.00015} />
      <pointLight position={[-4, 3.2, -3.6]} intensity={72} distance={8} decay={2} color="#e9ad69" />
      <pointLight position={[4, 3.3, -3.7]} intensity={62} distance={8} decay={2} color="#d78e4e" />
      <Room />
      <Desk />
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
            targeted={targetId === story.id} />
        );
      })}
      <FirstPersonMovement carrying={Boolean(carriedId)} />
      <MouseLookControls />
      <LibraryInteractionController
        stories={stories}
        disabled={disabled}
        carriedId={carriedId}
        placedId={placedId}
        onCarry={setCarriedId}
        onPlace={setPlacedId}
        onOpen={(story) => {
          if (openingId) return;
          setOpeningId(story.id);
          window.setTimeout(() => onSelect(story), 620);
          window.setTimeout(() => {
            setOpeningId((current) => current === story.id ? null : current);
          }, 4500);
        }}
        onTargetChange={setTargetId}
        onNearDeskChange={setNearDesk}
      />
    </>
  );
}

export default function ArchivoOcultoLibrary3D({ stories, onSelect, disabled = false }: Props) {
  const [locked, setLocked] = useState(false);
  const [carriedId, setCarriedId] = useState<string | null>(null);
  const [placedId, setPlacedId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [nearDesk, setNearDesk] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => { setLocked(document.pointerLockElement !== null); setLockError(null); };
    const failed = () => setLockError("No se pudo activar el control del ratón. Haz clic de nuevo para intentarlo.");
    document.addEventListener("pointerlockchange", sync);
    document.addEventListener("pointerlockerror", failed);
    return () => {
      document.removeEventListener("pointerlockchange", sync);
      document.removeEventListener("pointerlockerror", failed);
    };
  }, []);
  return (
    <div className="archivo-library-world relative h-full min-h-[min(78svh,820px)] w-full overflow-hidden">
      <Canvas
        frameloop={disabled ? "never" : "demand"}
        dpr={[1, 1.2]}
        camera={{ position: [0, 1.68, 4.8], fov: 68 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <LibraryWorld
          stories={stories}
          onSelect={onSelect}
          disabled={disabled}
          carriedId={carriedId}
          setCarriedId={setCarriedId}
          placedId={placedId}
          setPlacedId={setPlacedId}
          targetId={targetId}
          setTargetId={setTargetId}
          setNearDesk={setNearDesk}
        />
      </Canvas>
      {!locked && (
        <button type="button" onClick={() => {
          const canvas = document.querySelector(".archivo-library-world canvas") as HTMLCanvasElement | null;
          if (!canvas || document.pointerLockElement) return;
          try {
            const result = canvas.requestPointerLock();
            if (result && typeof result.catch === "function") {
              void result.catch(() => setLockError("El navegador no permitió capturar el ratón. Haz clic otra vez dentro de la habitación."));
            }
          } catch {
            setLockError("El navegador no permitió capturar el ratón. Haz clic otra vez dentro de la habitación.");
          }
        }} className="group absolute bottom-7 left-1/2 z-20 -translate-x-1/2 rounded-xl border border-[#cda76d]/75 bg-gradient-to-b from-[#49301c]/95 to-[#170e09]/95 px-7 py-3.5 text-center text-xs font-black tracking-[.16em] text-[#f8e8c9] shadow-[0_8px_28px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,230,185,.16)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[#f5d9a5] hover:shadow-[0_12px_32px_rgba(0,0,0,.65)] active:translate-y-0">
          ENTRAR A LA BIBLIOTECA
          <span className="mt-1.5 block text-[9px] font-medium tracking-[.08em] text-[#d7c29d]">WASD · CAMINAR &nbsp; RATÓN · MIRAR &nbsp; ESC · LIBERAR</span>
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
      {locked && (targetId || carriedId || placedId) && (
        <div className="pointer-events-none absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-[#c89b5d]/70 bg-[#160d08]/95 px-4 py-3 text-[#f4e4c5] shadow-[0_12px_38px_rgba(0,0,0,.5)] backdrop-blur-md">
          <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#d6ad70] bg-gradient-to-b from-[#754323] to-[#32190f] font-serif text-lg font-black shadow-[inset_0_1px_2px_rgba(255,255,255,.2)]">{placedId ? "C" : "R"}</span>
          <span className="text-left">
            <span className="block text-[11px] font-bold tracking-wide">{placedId ? "MANTÉN C PARA ABRIR" : carriedId ? "ACÉRCATE A LA MESA" : "MANTÉN R PARA RECOGER"}</span>
            <span className="mt-0.5 block text-[9px] text-[#d1b98f]">{placedId ? "Abre el expediente sobre la mesa" : carriedId ? "El libro se colocará automáticamente" : "Mira el lomo del libro que quieres"}</span>
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-5 left-5 z-10 rounded-md border border-[#d9bd8d]/25 bg-[#170e09]/65 px-3 py-2 font-mono text-[9px] tracking-wide text-[#f1dfbd]/85 backdrop-blur">
        WASD · CAMINAR &nbsp; MANTÉN R · TOMAR &nbsp; ACÉRCATE A LA MESA · COLOCAR &nbsp; MANTÉN C · ABRIR
      </div>
    </div>
  );
}
