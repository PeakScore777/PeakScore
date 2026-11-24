"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import "./ReactBitsGlitchText.css";

type Props = {
  children: string;
  className?: string;
  style?: CSSProperties;
  speed?: number;
  intensity?: number;
  burstDuration?: number;
  offset?: number;
  skew?: number;
  flicker?: boolean;
  fontWeight?: number | string;
  enableShadows?: boolean;
  shadowColors?: [string, string];
};

const SLICE_STOPS: [number, number][] = [
  [20,50],[10,60],[15,55],[25,35],[30,40],[40,20],[10,60],
  [15,55],[25,35],[30,40],[20,50],[10,60],[15,55],[25,35],
  [30,40],[40,20],[20,50],[10,60],[15,55],[25,35],[30,40]
];
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const bandAt=(u:number):[number,number]=>{
  const x=clamp(u,0,1)*(SLICE_STOPS.length-1);
  const i=Math.min(SLICE_STOPS.length-2,Math.floor(x));
  const f=x-i; const [t0,b0]=SLICE_STOPS[i]; const [t1,b1]=SLICE_STOPS[i+1];
  return [t0+(t1-t0)*f,b0+(b1-b0)*f];
};
const pingPong=(time:number,period:number)=>{const p=(time/period)%2;return p<1?1-p:p-1;};
const fitBand=(top:number,bottom:number):[number,number]=>{
  const t=clamp(top,0,100),b=clamp(bottom,0,100);
  return t+b>=100?[0,100]:[t,b];
};
const stepLength=(speed:number)=>70*Math.sqrt(Math.max(0.05,speed)/0.5);
type EventState={until:number;aTop:number;aHeight:number;bTop:number;bHeight:number;ax:number;bx:number;ay:number;by:number;skew:number;fresh:boolean};
const makeEvent=(now:number,ms:number):EventState=>{
  const r=Math.random,sign=()=>r()<0.5?-1:1;
  return {until:now+ms*(1+Math.floor(r()*3)),aTop:r()*80,aHeight:5+r()*22,bTop:r()*85,bHeight:3+r()*14,ax:sign()*(1.3+r()*1.5),bx:sign()*(1.1+r()*1.2),ay:(r()-0.5)*0.5,by:(r()-0.5)*0.5,skew:sign()*(0.4+r()*0.6),fresh:true};
};

export default function ReactBitsGlitchText({
  children,className="",style,speed=1,intensity=0.5,burstDuration=0.6,offset=10,
  skew=0,flicker=false,fontWeight=900,enableShadows=true,
  shadowColors=["#ff0000","#00ffff"]
}:Props){
  const rootRef=useRef<HTMLDivElement>(null);
  const settingsRef=useRef({speed,intensity,burstDuration,offset,skew,flicker,enableShadows,shadowColors});
  settingsRef.current={speed,intensity,burstDuration,offset,skew,flicker,enableShadows,shadowColors};

  useEffect(()=>{
    const root=rootRef.current;if(!root)return;
    const reduce=Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    const written:Record<string,string>={};
    let raf=0,last=0,clock=0,visible=true,nextStep=0,event:EventState|null=null,alpha=1;
    let jitter=[1,1,0,0];
    const write=(name:string,value:string)=>{if(written[name]===value)return;written[name]=value;root.style.setProperty(name,value);};
    const rest=()=>{
      write("--glitch-a-top","0%");write("--glitch-a-bottom","100%");
      write("--glitch-b-top","0%");write("--glitch-b-bottom","100%");
      write("--glitch-a-x","0px");write("--glitch-a-y","0px");
      write("--glitch-b-x","0px");write("--glitch-b-y","0px");
      write("--glitch-a-shadow","none");write("--glitch-b-shadow","none");
      write("--glitch-skew","0deg");write("--glitch-alpha","1");event=null;
    };
    const frame=(now:number)=>{
      raf=0;
      if(reduce||!visible||document.hidden){rest();last=0;return;}
      const s=settingsRef.current;
      const dt=last?Math.min(0.1,(now-last)/1000):0;last=now;clock+=dt;
      const ms=stepLength(s.speed);
      if(event&&now>=event.until)event=null;
      const power=clamp(s.intensity,0,1);
      if(now>=nextStep){
        if(!event&&Math.random()<power*power*0.35)event=makeEvent(now,ms);
        jitter=[0.6+Math.random()*0.8,0.6+Math.random()*0.8,Math.random()*2-1,Math.random()*2-1];
        alpha=s.flicker&&Math.random()<0.04+0.16*power?0.45+Math.random()*0.35:1;
        nextStep=now+ms*(0.7+Math.random()*0.6);
      }
      const live=event&&now<event.until?event:null;
      const scale=0.4+1.2*power,off=Math.max(0,s.offset),pace=Math.max(0.05,s.speed);
      let a=bandAt(pingPong(clock,3*pace)),b=bandAt(pingPong(clock,2*pace));
      let ax=off*scale,bx=-off*scale,ay=0,by=0;
      if(live){
        a=[live.aTop,100-live.aTop-live.aHeight];b=[live.bTop,100-live.bTop-live.bHeight];
        ax=off*scale*live.ax;bx=off*scale*live.bx;ay=off*live.ay;by=off*live.by;
        event.fresh=false;
      }
      a=fitBand(a[0],a[1]);b=fitBand(b[0],b[1]);
      const shadows=s.enableShadows;
      write("--glitch-a-top",a[0].toFixed(2)+"%");write("--glitch-a-bottom",a[1].toFixed(2)+"%");
      write("--glitch-b-top",b[0].toFixed(2)+"%");write("--glitch-b-bottom",b[1].toFixed(2)+"%");
      write("--glitch-a-x",ax.toFixed(2)+"px");write("--glitch-a-y",ay.toFixed(2)+"px");
      write("--glitch-b-x",bx.toFixed(2)+"px");write("--glitch-b-y",by.toFixed(2)+"px");
      write("--glitch-a-shadow",shadows?`${(-ax/2).toFixed(2)}px 0 ${s.shadowColors[0]}`:"none");
      write("--glitch-b-shadow",shadows?`${(-bx/2).toFixed(2)}px 0 ${s.shadowColors[1]}`:"none");
      write("--glitch-skew",((live?s.skew*live.skew:0)).toFixed(2)+"deg");
      write("--glitch-alpha",alpha.toFixed(2));
      raf=requestAnimationFrame(frame);
    };
    const wake=()=>{if(raf||reduce||document.hidden)return;last=0;raf=requestAnimationFrame(frame);};
    const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)wake();}):null;
    observer?.observe(root);
    const onVisibility=()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else wake();};
    document.addEventListener("visibilitychange",onVisibility);wake();
    return ()=>{cancelAnimationFrame(raf);observer?.disconnect();document.removeEventListener("visibilitychange",onVisibility);rest();};
  },[]);

  const rootStyle={
    ...style,
    fontWeight: fontWeight ?? style?.fontWeight,
    "--glitch-color-a":enableShadows?shadowColors[0]:"currentColor",
    "--glitch-color-b":enableShadows?shadowColors[1]:"currentColor"
  } as CSSProperties;
  return <div ref={rootRef} className={`ps-reactbits-glitch glitch glitch--slices ${className}`} style={rootStyle}>
    <span className="glitch__text">{children}</span>
    <span className="glitch__slice glitch__slice--b" aria-hidden="true">{children}</span>
    <span className="glitch__slice glitch__slice--a" aria-hidden="true">{children}</span>
  </div>;
}
