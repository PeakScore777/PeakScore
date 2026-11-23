"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type GlitchMode = "slices" | "rgb" | "scan" | "noise";
type GlitchTrigger = "always" | "hover" | "click";
type NameTag = "strong" | "span" | "h2" | "h3";
type Props = {
  text: string; className?: string; style?: CSSProperties; tag?: NameTag; mode?: GlitchMode;
  speed?: number; enableShadows?: boolean; offset?: number; shadowColors?: [string, string];
  intensity?: number; skew?: number; flicker?: boolean; trigger?: GlitchTrigger; burstDuration?: number;
};
type Settings = { speed: number; offset: number; intensity: number; skew: number; flicker: boolean; enableShadows: boolean; shadowColors: [string, string]; burstDuration: number };
const MODES: GlitchMode[] = ["slices", "rgb", "scan", "noise"];
const GLYPHS = "#%&@$?<>/\\=+*~^!";
const SLICE_STOPS: [number, number][] = [[20,50],[10,60],[15,55],[25,35],[30,40],[40,20],[10,60],[15,55],[25,35],[30,40],[20,50],[10,60],[15,55],[25,35],[30,40],[40,20],[20,50],[10,60],[15,55],[25,35],[30,40]];
function splitGraphemes(value: string) {
  type Constructor = new (locale?: string, options?: { granularity: "grapheme" }) => { segment: (input: string) => Iterable<{ segment: string }> };
  const Segmenter = (Intl as unknown as { Segmenter?: Constructor }).Segmenter;
  return Segmenter ? Array.from(new Segmenter(undefined,{granularity:"grapheme"}).segment(value), part => part.segment) : Array.from(value);
}
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
function bandAt(progress: number): [number, number] {
  const x = clamp(progress,0,1) * (SLICE_STOPS.length - 1), i = Math.min(SLICE_STOPS.length - 2,Math.floor(x)), f = x - i;
  const [t0,b0] = SLICE_STOPS[i], [t1,b1] = SLICE_STOPS[i+1];
  return [t0+(t1-t0)*f,b0+(b1-b0)*f];
}
function pingPong(time: number, period: number) { const p=(time/period)%2; return p<1?1-p:p-1; }
function fitBand(top: number,bottom: number): [number,number] { const t=clamp(top,0,100),b=clamp(bottom,0,100);return t+b>=100?[0,100]:[t,b]; }
function makeEvent(now: number,ms: number) {
  const sign=()=>Math.random()<.5?-1:1;
  return {until:now+ms*(1+Math.floor(Math.random()*3)),aTop:Math.random()*80,aHeight:5+Math.random()*22,bTop:Math.random()*85,bHeight:3+Math.random()*14,ax:sign()*(1.3+Math.random()*1.5),bx:sign()*(1.1+Math.random()*1.2),ay:(Math.random()-.5)*.5,by:(Math.random()-.5)*.5,skew:sign()*(.4+Math.random()*.6),fresh:true};
}
const stepLength=(speed:number)=>70*Math.sqrt(Math.max(.05,speed)/.5);

export default function GlitchDisplayName({
  text,className="",style,tag="strong",mode="slices",speed=1,enableShadows=true,offset=10,
  shadowColors=["#ff0000","#00ffff"],intensity=.5,skew=0,flicker=false,trigger="always",burstDuration=.6
}: Props) {
  const Tag=tag, rootRef=useRef<HTMLDivElement|null>(null), charRefs=useRef<Array<HTMLSpanElement|null>>([]);
  const settings:Settings={speed,offset,intensity,skew,flicker,enableShadows,shadowColors,burstDuration};
  const settingsRef=useRef(settings); settingsRef.current=settings;
  const safeMode=MODES.includes(mode)?mode:"slices";
  const safeTrigger:GlitchTrigger=trigger==="hover"||trigger==="click"?trigger:"always";
  const chars=safeMode==="noise"?splitGraphemes(text):null, charCount=chars?.length??0;

  useEffect(()=>{
    const root=rootRef.current;if(!root)return;
    const reduce=Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    const cells=charRefs.current.slice(0,charCount).filter((cell):cell is HTMLSpanElement=>Boolean(cell));
    const written:Record<string,string>={},swaps=new Map<number,number>();
    let raf=0,last=0,clock=0,visible=true,hovering=false,burstEnd=0,nextStep=0;
    let event:ReturnType<typeof makeEvent>|null=null,alpha=1,jitter=[1,1,0,0];

    const write=(name:string,value:string)=>{if(written[name]===value)return;written[name]=value;root.style.setProperty(name,value);};
    const rest=()=>{
      write("--ps-glitch-a-top","0%");write("--ps-glitch-a-bottom","100%");write("--ps-glitch-b-top","0%");write("--ps-glitch-b-bottom","100%");
      write("--ps-glitch-a-x","0px");write("--ps-glitch-a-y","0px");write("--ps-glitch-b-x","0px");write("--ps-glitch-b-y","0px");
      write("--ps-glitch-a-shadow","none");write("--ps-glitch-b-shadow","none");write("--ps-glitch-skew","0deg");write("--ps-glitch-alpha","1");write("--ps-glitch-split","0");
      swaps.forEach((_,i)=>cells[i]?.removeAttribute("data-glyph"));swaps.clear();event=null;
    };
    const active=(now:number)=>!reduce&&visible&&(safeTrigger==="always"||(safeTrigger==="hover"&&hovering)||now<burstEnd);
    const swap=(i:number,now:number,ms:number,s:Settings)=>{
      const cell=cells[i];if(!cell||cell.textContent===" ")return;
      cell.setAttribute("data-glyph",GLYPHS[Math.floor(Math.random()*GLYPHS.length)]);
      cell.style.setProperty("--ps-glitch-glyph",s.enableShadows?s.shadowColors[i%2]:"currentColor");
      swaps.set(i,now+ms*(1+Math.floor(Math.random()*3)));
    };
    const step=(now:number,s:Settings,power:number)=>{
      const ms=stepLength(s.speed);if(event&&now>=event.until)event=null;
      if(!event&&Math.random()<power*power*.35)event=makeEvent(now,ms);
      jitter=[.6+Math.random()*.8,.6+Math.random()*.8,Math.random()*2-1,Math.random()*2-1];
      alpha=s.flicker && Math.random() < (0.04 + 0.16 * power) ? 0.45 + Math.random() * 0.35 : 1;
      if(cells.length){
        swaps.forEach((until,i)=>{if(now<until)return;cells[i]?.removeAttribute("data-glyph");swaps.delete(i);});
        const chance=.01+.16*power*power;
        cells.forEach((_,i)=>{if(Math.random()<(swaps.has(i) ? 0.35 : chance))swap(i,now,ms,s);});
        if(event?.fresh){const start=Math.floor(Math.random()*cells.length),run=2+Math.floor(Math.random()*3);for(let k=0;k<run;k++)swap((start+k)%cells.length,now,ms,s);}
      }
      if(event)event.fresh=false;
      nextStep=now+ms*(.7+Math.random()*.6);
    };
    const frame=(now:number)=>{
      raf=0;if(!active(now)){rest();last=0;return;}
      const s=settingsRef.current,dt=last?Math.min(.1,(now-last)/1000):0;last=now;clock+=dt;
      const bursting=now<burstEnd,burstLeft=bursting?1-((now-(burstEnd-Math.max(1,s.burstDuration*1000)))/Math.max(1,s.burstDuration*1000))*.55:0;
      const power=Math.max(clamp(s.intensity,0,1),burstLeft);if(now>=nextStep)step(now,s,power);
      const live=event&&now<event.until?event:null,scale=.4+1.2*power,off=Math.max(0,s.offset),pace=Math.max(.05,s.speed);
      let a:[number,number]=[0,100],b:[number,number]=[0,100],ax=0,ay=0,bx=0,by=0,split=0;
      if(safeMode==="slices"){
        a=bandAt(pingPong(clock,3*pace));b=bandAt(pingPong(clock,2*pace));ax=off*scale;bx=-off*scale;
        if(live){a=[live.aTop,100-live.aTop-live.aHeight];b=[live.bTop,100-live.bTop-live.bHeight];ax=off*scale*live.ax;bx=off*scale*live.bx;ay=off*live.ay;by=off*live.by;}
      }else if(safeMode==="rgb"){
        const spread=off*(.22+.45*power);ax=spread*jitter[0];bx=-spread*jitter[1];ay=off*.06*jitter[2];by=off*.06*jitter[3];
        if(live){ax=off*scale*Math.abs(live.ax);bx=-off*scale*Math.abs(live.bx);ay=off*live.ay;by=off*live.by;}
        split=s.enableShadows?.9:.4;
      }else if(safeMode==="scan"){
        const pass=2.4*pace,cycle=pass*(1+(1-power)*1.2),local=clock%cycle,height=9+9*power;
        if(local<pass){const dir=Math.floor(clock/cycle)%2?-1:1,center=-height+(local/pass)*(100+2*height),trail=center-height*1.5,thin=height*.35;a=[center-height/2,100-(center+height/2)];b=[trail-thin/2,100-(trail+thin/2)];ax=off*scale*1.5*dir*(.75+.25*Math.sin(clock*23));bx=-ax*.5;}
        if(live){b=[live.bTop,100-live.bTop-live.bHeight];bx=off*scale*live.bx*1.4;}
      }
      a=fitBand(a[0],a[1]);b=fitBand(b[0],b[1]);const shadows=s.enableShadows&&safeMode!=="rgb";
      write("--ps-glitch-a-top",a[0].toFixed(2)+"%");write("--ps-glitch-a-bottom",a[1].toFixed(2)+"%");
      write("--ps-glitch-b-top",b[0].toFixed(2)+"%");write("--ps-glitch-b-bottom",b[1].toFixed(2)+"%");
      write("--ps-glitch-a-x",ax.toFixed(2)+"px");write("--ps-glitch-a-y",ay.toFixed(2)+"px");
      write("--ps-glitch-b-x",bx.toFixed(2)+"px");write("--ps-glitch-b-y",by.toFixed(2)+"px");
      write("--ps-glitch-a-shadow",shadows?(-ax/2).toFixed(2)+"px 0 "+s.shadowColors[0]:"none");
      write("--ps-glitch-b-shadow",shadows?(-bx/2).toFixed(2)+"px 0 "+s.shadowColors[1]:"none");
      write("--ps-glitch-skew",(live?s.skew*live.skew:0).toFixed(2)+"deg");write("--ps-glitch-alpha",alpha.toFixed(2));write("--ps-glitch-split",String(split));
      raf=requestAnimationFrame(frame);
    };
    const wake=()=>{if(raf||!active(performance.now()))return;last=0;raf=requestAnimationFrame(frame);};
    const onEnter=()=>{hovering=true;wake();},onLeave=()=>{hovering=false;};
    const onClick=()=>{const now=performance.now(),s=settingsRef.current;burstEnd=now+Math.max(.1,s.burstDuration)*1000;event=makeEvent(now,stepLength(s.speed));nextStep=now;wake();};
    if(safeTrigger==="hover"){root.addEventListener("pointerenter",onEnter);root.addEventListener("pointerleave",onLeave);}
    if(safeTrigger==="click")root.addEventListener("click",onClick);
    const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)wake();}):null;
    observer?.observe(root);wake();
    return ()=>{cancelAnimationFrame(raf);observer?.disconnect();root.removeEventListener("pointerenter",onEnter);root.removeEventListener("pointerleave",onLeave);root.removeEventListener("click",onClick);rest();};
  },[safeMode,safeTrigger,charCount]);

  const rootStyle={...style,"--ps-glitch-color-a":enableShadows?shadowColors[0]:"currentColor","--ps-glitch-color-b":enableShadows?shadowColors[1]:"currentColor"} as CSSProperties;
  return <Tag ref={rootRef as never} className={`ps-glitch-name ps-glitch-name--${safeMode} ${className}`} style={rootStyle} aria-label={text}>
    <span className="ps-glitch-text" aria-hidden={chars?"true":undefined}>
      {chars?chars.map((char,i)=><span key={i} ref={el=>{charRefs.current[i]=el;}} className="ps-glitch-char">{char}</span>):text}
    </span>
    {chars&&<span className="ps-glitch-sr">{text}</span>}
    <span className="ps-glitch-slice ps-glitch-slice--b" aria-hidden="true">{text}</span>
    <span className="ps-glitch-slice ps-glitch-slice--a" aria-hidden="true">{text}</span>
  </div>;
}
