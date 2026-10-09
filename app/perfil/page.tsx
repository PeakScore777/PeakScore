import MiPerfil from "@/components/perfil/MiPerfil";
import CharacterCards from "@/components/perfil/CharacterCards";
import TuRango from "@/components/perfil/tu-rango/TuRango";

export default function PerfilPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05030b] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto grid w-full max-w-[1050px] grid-cols-1 items-start justify-center gap-8 lg:grid-cols-[420px_530px] lg:gap-8">
        {/* Columna izquierda: personajes y rango */}
        <aside className="w-full min-w-0">
          <CharacterCards />
          <TuRango />
        </aside>

        {/* Columna derecha: tarjeta principal del perfil */}
        <section className="w-full min-w-0">
          <MiPerfil />
        </section>
      </div>
    </main>
  );
}