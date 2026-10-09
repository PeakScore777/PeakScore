import MiPerfil from "@/components/perfil/MiPerfil";
import CharacterCards from "@/components/perfil/CharacterCards";
import TuRango from "@/components/perfil/tu-rango/TuRango";

export default function PerfilPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05030b] px-3 pb-12 pt-4 text-white sm:px-5 sm:pt-6 lg:px-8 lg:pt-8">
      <div className="mx-auto w-full max-w-[1240px] space-y-5 sm:space-y-6">
        <MiPerfil />

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[450px_620px] xl:justify-center">
          {/* Carta: alineada con Tu rango en escritorio */}
          <section className="mx-auto w-full min-w-0 max-w-[450px] lg:mx-0 lg:mt-5">
            <CharacterCards />
          </section>

          <section className="w-full min-w-0">
            <TuRango />
          </section>
        </div>
      </div>
    </main>
  );
}