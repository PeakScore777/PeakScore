export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Cargando Archivo Oculto"
      className="fixed inset-0 z-[99999] grid h-[100dvh] w-screen place-items-center overflow-hidden bg-[#920d16] px-5 text-[#fff0d3]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[.12]"
        style={{
          backgroundImage:
            "linear-gradient(90deg,transparent 49%,#30070b 50%,transparent 51%),linear-gradient(transparent 49%,#30070b 50%,transparent 51%)",
          backgroundSize: "24px 24px",
        }}
      />
      <section className="relative flex w-full max-w-[760px] flex-col items-center">
        <p className="pixel-font mb-8 flex items-center gap-3 text-[8px] uppercase tracking-[.18em] text-[#f2c99a]/85">
          <span className="h-px w-10 bg-[#f2c99a]/60" />
          PEAKSCORE
          <span className="h-px w-10 bg-[#f2c99a]/60" />
        </p>
        <div className="relative border-y-2 border-[#ffe9c9]/85 px-7 py-7 text-center [text-shadow:4px_4px_0_#4b1014]">
          <span className="absolute -left-2 -top-2 h-5 w-5 border-l-[5px] border-t-[5px] border-[#ffe9c9]" />
          <span className="absolute -right-2 -top-2 h-5 w-5 border-r-[5px] border-t-[5px] border-[#ffe9c9]" />
          <span className="absolute -bottom-2 -left-2 h-5 w-5 border-b-[5px] border-l-[5px] border-[#ffe9c9]" />
          <span className="absolute -bottom-2 -right-2 h-5 w-5 border-b-[5px] border-r-[5px] border-[#ffe9c9]" />
          <h1 className="pixel-font text-[clamp(1.45rem,5.2vw,3.8rem)] font-black uppercase leading-[1.55] tracking-[-.075em]">
            <span className="block">ARCHIVO</span>
            <span className="block">OCULTO</span>
          </h1>
          <p className="pixel-font mt-4 text-[7px] uppercase tracking-[.12em] text-[#f5d9b4]">
            INVESTIGACIÓN · EXPEDIENTE
          </p>
        </div>
        <div className="mt-12 w-full max-w-[540px]">
          <div className="h-[23px] overflow-hidden border-[3px] border-[#ffe9c9] bg-[#4b1014] p-[3px] shadow-[5px_5px_0_#4b1014]">
            <div className="relative h-full overflow-hidden bg-[#6f1b20]">
              <div className="absolute inset-y-0 w-[42%] animate-[archivo-loading_1.35s_ease-in-out_infinite] bg-[#f4bd62]" />
            </div>
          </div>
          <p className="pixel-font mt-5 text-center text-[7px] uppercase tracking-[.12em] text-[#ffe9c9]">
            PREPARANDO LA BIBLIOTECA...
          </p>
        </div>
      </section>
      <style>{`@keyframes archivo-loading { from { transform: translateX(-110%); } to { transform: translateX(250%); } } @media (prefers-reduced-motion: reduce) { .animate-\\[archivo-loading_1\\.35s_ease-in-out_infinite\\] { animation: none; } }`}</style>
    </main>
  );
}
