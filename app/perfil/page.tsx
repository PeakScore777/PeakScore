import MiPerfil from "@/components/perfil/MiPerfil";
import CharacterCards from "@/components/perfil/CharacterCards";
import TuRango from "@/components/perfil/tu-rango/TuRango";

export default function PerfilPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#05030b] px-3 pb-24 pt-4 text-white sm:px-5 sm:pt-6 lg:px-6 lg:pb-10 lg:pt-6 xl:px-7">
      <div className="mx-auto w-full min-w-0 max-w-[1600px]">
        <div className="space-y-5 sm:space-y-6">
          <MiPerfil />

          <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-5 xl:grid-cols-[minmax(0,450px)_minmax(0,620px)] xl:justify-center xl:gap-6">
            <section className="mx-auto w-full min-w-0 max-w-[450px] lg:mx-0 lg:max-w-none">
              <CharacterCards />
            </section>

            <section className="w-full min-w-0">
              <TuRango />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}