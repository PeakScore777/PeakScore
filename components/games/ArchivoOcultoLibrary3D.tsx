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
  return makeCanvasTexture((ctx,size)=>{
    // A brighter, atmospheric mountain-valley view with layered depth and a natural lake.
    const sky=ctx.createLinearGradient(0,0,0,size);
    sky.addColorStop(0,"#6d9bb1");sky.addColorStop(.34,"#b9cbd0");sky.addColorStop(.58,"#e6d8bb");sky.addColorStop(1,"#9eaa8c");
    ctx.fillStyle=sky;ctx.fillRect(0,0,size,size);
    const sun=ctx.createRadialGradient(size*.72,size*.22,4,size*.72,size*.22,size*.25);
    sun.addColorStop(0,"rgba(255,239,197,.78)");sun.addColorStop(1,"rgba(255,239,197,0)");
    ctx.fillStyle=sun;ctx.fillRect(0,0,size,size);
    // Soft clouds with broken edges.
    for(let i=0;i<9;i++){
      const x=size*(.06+(i*31%83)/100),y=size*(.12+(i*17%20)/100),r=size*(.055+(i%3)*.018);
      ctx.fillStyle="rgba(250,247,231,.22)";
      for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(x+j*r*.28,y+Math.sin(j*1.7)*r*.12,r*(.65-j*.07),r*(.2+j*.025),0,0,Math.PI*2);ctx.fill();}
    }
    const ridge=(points,color)=>{
      ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,size);
      points.forEach(([x,y])=>ctx.lineTo(size*x,size*y));
      ctx.lineTo(size,size);ctx.closePath();ctx.fill();
    };
    ridge([[0,.53],[.08,.44],[.17,.48],[.28,.28],[.36,.4],[.48,.22],[.58,.4],[.7,.26],[.8,.43],[.9,.32],[1,.48]],"#83999a");
    // Snow-light on distant peaks.
    ctx.fillStyle="rgba(238,235,218,.65)";
    [[.28,.28],[.48,.22],[.7,.26],[.9,.32]].forEach(([x,y])=>{
      ctx.beginPath();ctx.moveTo(size*x,size*y);ctx.lineTo(size*(x-.045),size*(y+.075));ctx.lineTo(size*(x-.012),size*(y+.055));ctx.lineTo(size*(x+.015),size*(y+.09));ctx.closePath();ctx.fill();
    });
    ridge([[0,.61],[.12,.51],[.23,.57],[.38,.43],[.52,.56],[.68,.44],[.81,.56],[.94,.46],[1,.58]],"#627d72");
    // Forested slopes, with organic overlapping crowns rather than repeated triangles.
    const slope=ctx.createLinearGradient(0,size*.55,0,size);
    slope.addColorStop(0,"#78906f");slope.addColorStop(.5,"#496b4c");slope.addColorStop(1,"#263e30");
    ctx.fillStyle=slope;ctx.beginPath();ctx.moveTo(0,size*.62);
    ctx.bezierCurveTo(size*.2,size*.55,size*.25,size*.68,size*.48,size*.61);
    ctx.bezierCurveTo(size*.72,size*.55,size*.82,size*.67,size,size*.59);
    ctx.lineTo(size,size);ctx.lineTo(0,size);ctx.closePath();ctx.fill();
    // A winding lake opens toward the middle distance.
    ctx.fillStyle="#9baea1";ctx.beginPath();ctx.moveTo(0,size*.72);
    ctx.quadraticCurveTo(size*.28,size*.66,size*.48,size*.72);
    ctx.quadraticCurveTo(size*.7,size*.77,size,size*.68);
    ctx.lineTo(size,size*.91);ctx.quadraticCurveTo(size*.7,size*.84,size*.49,size*.87);
    ctx.quadraticCurveTo(size*.23,size*.82,0,size*.93);ctx.closePath();ctx.fill();
    const water=ctx.createLinearGradient(0,size*.7,0,size*.93);
    water.addColorStop(0,"rgba(188,207,196,.92)");water.addColorStop(1,"rgba(66,107,103,.95)");
    ctx.fillStyle=water;ctx.fillRect(0,size*.72,size,size*.19);
    for(let i=0;i<80;i++){
      const y=size*(.73+(i%23)*.007),x=size*((i*43)%100)/100,w=size*(.018+(i%6)*.018);
      ctx.strokeStyle=i%5===0?"rgba(248,235,201,.58)":"rgba(226,238,222,.25)";
      ctx.lineWidth=i%5===0?2.5:1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(Math.min(size,x+w),y);ctx.stroke();
    }
    // Foreground firs at varied heights and spacing.
    for(let i=0;i<34;i++){
      const x=size*((i*67+13)%100)/100,base=size*(.78+((i*19)%19)/100),h=size*(.12+((i*29)%14)/100),w=h*(.2+(i%4)*.035);
      const color=i%3===0?"#1e382a":i%3===1?"#294832":"#34563a";
      ctx.fillStyle=color;ctx.fillRect(x-size*.002,base-h*.04,size*.004,h*.34);
      for(let k=0;k<5;k++){
        const yy=base-h+k*h*.16,half=w*(1-k*.13);
        ctx.beginPath();ctx.moveTo(x,yy);ctx.quadraticCurveTo(x-half*.55,yy+h*.1,x-half,yy+h*.25);
        ctx.lineTo(x+half,yy+h*.25);ctx.quadraticCurveTo(x+half*.55,yy+h*.1,x,yy);ctx.fill();
      }
    }
    // A tiny cabin on the distant shore gives the view a recognizable scale.
    ctx.fillStyle="#6b4d36";ctx.fillRect(size*.79,size*.62,size*.045,size*.035);
    ctx.fillStyle="#49382b";ctx.beginPath();ctx.moveTo(size*.775,size*.62);ctx.lineTo(size*.812,size*.585);ctx.lineTo(size*.85,size*.62);ctx.closePath();ctx.fill();
    ctx.fillStyle="rgba(248,213,144,.8)";ctx.fillRect(size*.818,size*.635,size*.009,size*.012);
    // Warm grasses and soft foreground detail.
    for(let i=0;i<170;i++){
      const x=size*((i*41)%100)/100,y=size*(.89+((i*13)%10)/100),h=size*(.01+(i%5)*.006);
      ctx.strokeStyle=i%2?"rgba(187,183,119,.62)":"rgba(36,70,42,.72)";
      ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-size*.005,y-h*.5,x+size*.008,y-h);ctx.stroke();
    }
    const vignette=ctx.createLinearGradient(0,0,size,0);
    vignette.addColorStop(0,"rgba(18,34,31,.12)");vignette.addColorStop(.18,"rgba(18,34,31,0)");
    vignette.addColorStop(.82,"rgba(18,34,31,0)");vignette.addColorStop(1,"rgba(18,34,31,.12)");
    ctx.fillStyle=vignette;ctx.fillRect(0,0,size,size);
  },768);
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
      const mountain=(pts,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(42,size*.8);pts.forEach(([x,y])=>ctx.lineTo(size*x,size*y));ctx.lineTo(size-42,size*.8);ctx.closePath();ctx.fill();};
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

function PottedPlant({ position, scale = 1, kind = "broadleaf" }: { position: [number,number,number]; scale?: number; kind?: "broadleaf" | "pine" | "fern" }) {
  const leafGeometry=useMemo(()=>{
    const positions:number[]=[],indices:number[]=[];
    const rows=24,columns=16;
    for(let row=0;row<=rows;row++){
      const t=row/rows;
      // Broad, rounded paddle leaf with a gentle heart-shaped base and pointed tip.
      const width=Math.pow(Math.sin(Math.PI*Math.pow(t,.82)),.72)*.34;
      for(let col=0;col<=columns;col++){
        const u=col/columns*2-1;
        const x=u*width;
        const y=t*.94;
        const z=(1-u*u)*Math.sin(Math.PI*t)*.065 + Math.sin(t*Math.PI)*.012;
        positions.push(x,y,z);
      }
    }
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const a=row*(columns+1)+col,b=a+columns+1;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    g.setIndex(indices);g.computeVertexNormals();return g;
  },[]);
  const potGeometry=useMemo(()=>new THREE.LatheGeometry([
    new THREE.Vector2(.18,0),new THREE.Vector2(.22,.035),new THREE.Vector2(.28,.34),
    new THREE.Vector2(.31,.39),new THREE.Vector2(.34,.42),new THREE.Vector2(.31,.46),
    new THREE.Vector2(.27,.42),new THREE.Vector2(.25,.36),new THREE.Vector2(.21,.07)
  ],28),[]);
  useEffect(()=>()=>{leafGeometry.dispose();potGeometry.dispose();},[leafGeometry,potGeometry]);
  if(kind==="pine") return <group position={position} scale={scale}>
    <mesh geometry={potGeometry} castShadow><meshStandardMaterial color="#76503a" roughness={.82}/></mesh>
    <mesh position={[0,.78,0]}><cylinderGeometry args={[.035,.055,.72,8]}/><meshStandardMaterial color="#60432d" roughness={1}/></mesh>
    {[0,1,2,3,4].map((tier)=>{
      const radius=.43-tier*.055,height=.56-tier*.035,y=.66+tier*.28;
      return <group key={tier} position={[0,y,0]}>
        <mesh position={[0,height*.35,0]} castShadow><coneGeometry args={[radius,height,9,2]}/><meshStandardMaterial color={tier%2?"#244331":"#31563b"} roughness={.96} flatShading/></mesh>
        <mesh position={[0,height*.37,.012]}><coneGeometry args={[radius*.92,height*.96,9,2]}/><meshStandardMaterial color="#3e6946" roughness={1} wireframe={false}/></mesh>
      </group>;
    })}
  </group>;
  if(kind==="fern") return <group position={position} scale={scale}>
    <mesh geometry={potGeometry} castShadow><meshStandardMaterial color="#8a5035" roughness={.82}/></mesh>
    {Array.from({length:11},(_,i)=>{
      const angle=i*Math.PI*2/11,lean=.35+(i%4)*.08,length=.9+(i%3)*.13;
      return <group key={i} position={[0,.5,0]} rotation={[Math.cos(angle)*lean,angle,-Math.sin(angle)*lean]}>
        <mesh geometry={leafGeometry} position={[0,length*.48,0]} scale={[.62,length,.72]}>
          <meshStandardMaterial color={i%3===0?"#527c42":i%3===1?"#71934f":"#3f693d"} roughness={1} side={THREE.DoubleSide}/>
        </mesh>
      </group>;
    })}
  </group>;
  return <group position={position} scale={scale}>
    <mesh geometry={potGeometry} castShadow receiveShadow><meshStandardMaterial color="#85472d" roughness={.78}/></mesh>
    <mesh position={[0,.435,0]}><cylinderGeometry args={[.27,.27,.035,28]}/><meshStandardMaterial color="#302316" roughness={1}/></mesh>
    {/* Strong upright crown and separated stems keep the plant full, not drooping. */}
    <mesh position={[0,.67,0]}><cylinderGeometry args={[.045,.06,.46,9]}/><meshStandardMaterial color="#4c6939" roughness={.9}/></mesh>
    {Array.from({length:8},(_,i)=>{
      const angle=i*Math.PI*.77;
      const lean=.34+(i%4)*.095;
      const length=.78+(i%3)*.1;
      const height=.62+(i%3)*.045;
      const axis=new THREE.Vector3(Math.cos(angle),0,Math.sin(angle));
      return <group key={i} position={[0,.56,0]} rotation={[axis.z*lean,angle,-axis.x*lean]}>
        <mesh position={[0,length*.28,0]}>
          <cylinderGeometry args={[.009,.018,length*.58,7]}/>
          <meshStandardMaterial color="#587342" roughness={.92}/>
        </mesh>
        <mesh geometry={leafGeometry} position={[0,length*.48,0]} scale={[1.08,length,1]} receiveShadow>
          <meshStandardMaterial color={i%3===0?"#52763e":i%3===1?"#66894a":"#3f6737"} roughness={.88} side={THREE.DoubleSide}/>
        </mesh>
        <mesh position={[0,length*.48+.46*length,.018]}>
          <cylinderGeometry args={[.004,.007,.78*length,5]}/>
          <meshStandardMaterial color="#91a66a" roughness={1}/>
        </mesh>
      </group>;
    })}
    <mesh position={[0,.47,0]}><torusGeometry args={[.285,.018,7,28]}/><meshStandardMaterial color="#b17c4b" metalness={.24} roughness={.52}/></mesh>
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
  const [customTexture,setCustomTexture]=useState<THREE.Texture|null>(null);
  useEffect(()=>{
    if(!imageUrl){setCustomTexture(null);return;}
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
      setCustomTexture(loaded);
    });
    return ()=>{active=false;texture.dispose();setCustomTexture(null);};
  },[imageUrl]);
  useEffect(()=>()=>artTexture?.dispose(),[artTexture]);
  const displayedTexture=customTexture??artTexture;
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
    const border=(inset,width,color)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.strokeRect(inset,inset,size-inset*2,size-inset*2);};
    border(18,30,"#a77c49");border(48,9,"#d2b477");border(67,3,"#765533");border(82,4,"#d2b477");
    const flower=(x,y,r,rotation=0)=>{
      ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
      for(let k=0;k<8;k++){ctx.save();ctx.rotate(k*Math.PI/4);ctx.fillStyle=k%2?"#8c6942":"#d0ae72";ctx.beginPath();ctx.ellipse(0,-r*.62,r*.25,r*.52,0,0,Math.PI*2);ctx.fill();ctx.restore();}
      ctx.fillStyle="#e1c58d";ctx.beginPath();ctx.arc(0,0,r*.22,0,Math.PI*2);ctx.fill();
      ctx.restore();
    };
    const vine=(x1,y1,x2,y2,steps)=>{
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
      <PottedPlant position={[-6.05, 0, 4.25]} scale={1.02} kind="broadleaf" />
      <PottedPlant position={[6.05, 0, 4.25]} scale={1.02} kind="pine" />
      <PottedPlant position={[-6.15, 0, -3.65]} scale={0.82} kind="fern" />
      <PottedPlant position={[6.15, 0, -3.65]} scale={0.78} kind="broadleaf" />
      <WindowReadingBench side={1} />
      <AreaRug />
      <HangingChandelier />
      <WallPortrait side={-1} positionZ={4.55} artwork="landscape" imageUrl={frameImages.left} />
      <WallPortrait side={1} positionZ={4.55} artwork="cyber-detective" imageUrl={frameImages.right} />
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
  const isPhysical = carried || placed || Boolean(droppedPosition);
  const texture = useMemo(() => spineTexture(story.title), [story.title]);
  // The large cover texture is created only while a book is actually in use.
  const [coverTexture, setCoverTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    if (!isPhysical) { setCoverTexture(null); return; }
    const next = bookCoverTexture(story.title);
    setCoverTexture(next);
    return () => { next?.dispose(); };
  }, [isPhysical, story.title]);
  const { camera, invalidate } = useThree();
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const desiredQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => () => { texture?.dispose(); }, [texture]);

  useFrame((_, delta) => {
    if (!root.current) return;
    // Shelf books are static: skip per-frame transforms until one is hovered, carried or opened.
    if (!carried && !placed && !droppedPosition && !opening && !hovered) return;
    if (coverHinge.current) {
      coverHinge.current.rotation.y = THREE.MathUtils.damp(coverHinge.current.rotation.y, opening ? -Math.PI : 0, 7, delta);
    }
    if (carried) {
      camera.getWorldDirection(forward);
      right.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
      target.copy(camera.position).addScaledVector(forward, 0.88).addScaledVector(right, 0.30);
      target.y -= 0.30;
      // Keep the book naturally in the player's hands. Automatic desk placement
      // takes over as soon as the player reaches the desk interaction radius.
      root.current.position.copy(target);
      const yaw = Math.atan2(-forward.x, -forward.z);
      desiredQuaternion.setFromEuler(new THREE.Euler(0, yaw, 0));
      root.current.quaternion.copy(desiredQuaternion);
      root.current.scale.setScalar(0.48);
    } else if (placed) {
      // Desk top is at y=1.0025; center the 0.17-thick book on its surface.
      // The right half stays clear of the banker lamp.
      target.set(0.48, 1.088, 2.58);
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
  const bookWidth = 0.58;
  const bookHeight = 0.78;
  const bookDepth = 0.17;

  return (
    <group ref={root} position={position} userData={{ archivoStoryId: story.id }}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => {
        setHovered(false);
        if (root.current && !carried && !placed && !droppedPosition) {
          root.current.position.set(position[0], position[1], position[2]);
          root.current.rotation.set(0, 0, 0);
          root.current.scale.setScalar(1);
        }
      }}>
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
              <meshStandardMaterial map={coverTexture ?? undefined} color="#ffffff" roughness={0.68} side={THREE.DoubleSide} />
            </mesh>
          </group>
          <mesh position={[0, 0, -bookDepth / 2 + 0.005]} castShadow>
            <boxGeometry args={[bookWidth, bookHeight, 0.035]} />
            <meshStandardMaterial color="#54231d" roughness={0.62} />
          </mesh>
          <mesh position={[0, 0, -bookDepth / 2 - 0.016]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[bookWidth * 0.94, bookHeight * 0.96]} />
            <meshStandardMaterial map={coverTexture ?? undefined} color="#ffffff" roughness={0.72} side={THREE.DoubleSide} />
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
      const paddingX = 0.46;
      const paddingZ = 0.46;
      const collidesWithDesk = (x: number, z: number) =>
        x > -1.625 - paddingX && x < 1.625 + paddingX &&
        z > 2.25 - 0.775 - paddingZ && z < 2.25 + 0.775 + paddingZ;
      const collidesWithPlant = (x: number, z: number) =>
        [[-6.05,4.25,.76],[6.05,4.25,.72],[-6.15,-3.65,.68],[6.15,-3.65,.68]].some(([px,pz,r]) =>
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
    const deskEdgeX = Math.max(0, Math.abs(camera.position.x) - 1.95);
    const deskEdgeZ = Math.max(0, Math.abs(camera.position.z - 2.25) - 1.05);
    const near = Math.hypot(deskEdgeX, deskEdgeZ) < 0.92;
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
      {/* Antique banker lamp: a proper brass stem and downward-facing green glass shade. */}
      <group position={[-0.95, 1.02, -0.12]}>
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.25, 0.29, 0.09, 28]} />
          <meshStandardMaterial color="#9b713d" metalness={0.82} roughness={0.27} />
        </mesh>
        <mesh position={[0, 0.105, 0]}>
          <torusGeometry args={[0.22, 0.018, 7, 28]} />
          <meshStandardMaterial color="#d0a35e" metalness={0.88} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.025, 0.04, 0.62, 12]} />
          <meshStandardMaterial color="#a77a42" metalness={0.84} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.74, 0]}>
          <sphereGeometry args={[0.24, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#31513b" metalness={0.28} roughness={0.24} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.74, 0]}>
          <torusGeometry args={[0.235, 0.018, 7, 24]} />
          <meshStandardMaterial color="#bd9254" metalness={0.84} roughness={0.24} />
        </mesh>
        <mesh position={[0, 0.93, 0]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color="#c99d5a" metalness={0.78} roughness={0.24} />
        </mesh>
        <pointLight position={[0, 0.62, 0]} intensity={8} distance={2.8} color="#ffca75" />
      </group>
    </group>
  );
}

function LibraryWorld({
  stories, onSelect, disabled, frameImages,
  carriedId, setCarriedId, placedId, setPlacedId,
  targetId, setTargetId, setNearDesk,
}: Props & {
  frameImages: Partial<Record<"left" | "right", string>>;
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
      <directionalLight position={[-4, 7, 3]} intensity={1.0} castShadow
        shadow-mapSize-width={512} shadow-mapSize-height={512}
        shadow-camera-near={0.1} shadow-camera-far={20}
        shadow-camera-left={-8} shadow-camera-right={8}
        shadow-camera-top={7} shadow-camera-bottom={-2} shadow-bias={-0.00015} />
      <pointLight position={[-4, 3.2, -3.6]} intensity={34} distance={7} decay={2} color="#e9ad69" />
      <pointLight position={[4, 3.3, -3.7]} intensity={30} distance={7} decay={2} color="#d78e4e" />
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
        dpr={[1, 1.08]}
        camera={{ position: [0, 1.68, 4.8], fov: 68 }}
        gl={{ antialias: false, powerPreference: "high-performance", stencil: false, depth: true }}
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
          frameImages={frameImages}
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
          const tracks = stormAudioRef.current;
          tracks.forEach((audio) => { void audio.play().catch(() => undefined); });
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
