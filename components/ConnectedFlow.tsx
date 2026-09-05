"use client";

import { useEffect, useId, useRef } from "react";
import { FLOW_PHASES, type FlowCopy } from "@/lib/connectedFlow";

/** A progressive enhancement of a complete SSR diagram; no API or real approval. */
export function ConnectedFlow({ copy }: { copy: FlowCopy }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scene = root.querySelector(".mc-scene");
    if (!scene) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timers: ReturnType<typeof setTimeout>[] = [];
    let played = false;
    function settle() {
      timers.forEach(clearTimeout);
      timers = [];
      root!.dataset.running = "false";
      root!.dataset.stage = "settled";
    }
    function play() {
      settle();
      if (reduced.matches || document.hidden) return;
      // Start one finite sequence without remounting the hero content.
      void root!.offsetWidth;
      root!.dataset.running = "true";
      root!.dataset.stage = "gather";
      timers = FLOW_PHASES.map(([delay, phase]) => setTimeout(() => {
        if (phase === "settled") settle();
        else root!.dataset.stage = phase;
      }, delay));
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= .45 && !played) { played = true; play(); }
      else if (!entry.isIntersecting) settle();
    }, { threshold: [0, .45] });
    const onVisibility = () => { if (document.hidden) settle(); };
    observer.observe(scene);
    reduced.addEventListener("change", settle);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      settle(); observer.disconnect();
      reduced.removeEventListener("change", settle);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function rails(mobile: boolean) {
    const height = mobile ? 206 : 520;
    const p = mobile ? 250 : 575, a = mobile ? 560 : 755, out = mobile ? 855 : 910;
    const y = height * .51;
    const inputs = [.06, .24, .51, .78, .96].map(fraction => `M0 ${height*fraction} C${p*.45} ${height*fraction} ${p*.7} ${y} ${p} ${y}`);
    const outputs = [.22, .51, .8].map(fraction => `M${a} ${y} C${a+(out-a)*.5} ${y} ${out-(out-a)*.5} ${height*fraction} ${out} ${height*fraction}`);
    const prefix = `${id}-${mobile ? "mobile" : "desktop"}`;
    return <svg className={`mc-rails ${mobile ? "mc-rails-mobile" : "mc-rails-desktop"}`} viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${prefix}-in`} gradientUnits="userSpaceOnUse" x1="0" x2={p} y1="0" y2="0"><stop stopColor="#7792ff" stopOpacity=".008"/><stop offset=".46" stopColor="#7792ff" stopOpacity=".055"/><stop offset=".79" stopColor="#7792ff" stopOpacity=".3"/><stop offset="1" stopColor="#a4b6ff" stopOpacity=".85"/></linearGradient>
        <linearGradient id={`${prefix}-bridge`} gradientUnits="userSpaceOnUse" x1={p} x2={a} y1="0" y2="0"><stop stopColor="#8ca6ff"/><stop offset="1" stopColor="#7affcf"/></linearGradient>
        <linearGradient id={`${prefix}-out`} gradientUnits="userSpaceOnUse" x1={a} x2={out} y1="0" y2="0"><stop stopColor="#66f3c2"/><stop offset="1" stopColor="#8fcfba" stopOpacity=".5"/></linearGradient>
      </defs>
      <g stroke={`url(#${prefix}-in)`}>{inputs.map(d => <path key={d} d={d}/>)}</g>
      <path className="mc-bridge" stroke={`url(#${prefix}-bridge)`} d={`M${p} ${y} H${a}`}/>
      <g className="mc-output-base" stroke={`url(#${prefix}-out)`}>{outputs.map(d => <path key={d} d={d}/>)}</g>
      <path className="mc-tracer" pathLength="1000" d={inputs[1]}/><path className="mc-tracer second" pathLength="1000" d={inputs[3]}/>
      {outputs.map(d => <path key={d} className="mc-output-trace" pathLength="1000" d={d}/>) }
    </svg>;
  }

  return <div ref={rootRef} className="mc-flow" data-stage="settled" data-running="false">
    <div className="mc-scene" role="img" aria-label={copy.description}>
      <div aria-hidden="true">
        {rails(false)}{rails(true)}
        <div className="mc-prepared"><div className="mc-dossier"><i/><i/><i/></div><span className="mc-node-label">{copy.prepared}</span></div>
        <div className="mc-approval"><span className="mc-check mc-approved">✓</span><span className="mc-check mc-reviewing">···</span><span className="mc-node-label"><span className="mc-approved">{copy.approval}</span><span className="mc-reviewing">{copy.review}</span></span></div>
        <div className="mc-out mc-out-one"><div className="mc-mini-product"/><div className="mc-out-name">{copy.outputs[0]}</div></div>
        <div className="mc-out mc-out-two"><div className="mc-mini-flow"><i/><b/><i/><b/><i/></div><div className="mc-out-name">{copy.outputs[1]}</div></div>
        <div className="mc-out mc-out-three"><div className="mc-mini-journey"><i/><i/><i/></div><div className="mc-out-name">{copy.outputs[2]}</div></div>
      </div>
    </div>
  </div>;
}
