import {
  Mail,
  Globe,
  CircleHelp,
  MessageCircle,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">

        {/* Logo */}
        <div>
          <h2 className="text-3xl font-bold text-white">
            PeakScore
          </h2>

          <p className="mt-4 leading-7 text-slate-400">
            La plataforma para preparar el ICFES con simulacros, estadísticas y
            herramientas inteligentes.
          </p>
        </div>

        {/* Producto */}
        <div>
          <h3 className="mb-4 font-semibold text-white">
            Producto
          </h3>

          <ul className="space-y-3">
            <li>Características</li>
            <li>Dashboard</li>
            <li>Precios</li>
          </ul>
        </div>

        {/* Empresa */}
        <div>
          <h3 className="mb-4 font-semibold text-white">
            Empresa
          </h3>

          <ul className="space-y-3">
            <li>Nosotros</li>
            <li>Contacto</li>
            <li>Blog</li>
          </ul>
        </div>

        {/* Redes */}
        <div>
          <h3 className="mb-4 font-semibold text-white">
            Síguenos
          </h3>

          <div className="flex gap-4">

            <Globe className="cursor-pointer transition hover:text-white" />
<CircleHelp className="cursor-pointer transition hover:text-white" />
<MessageCircle className="cursor-pointer transition hover:text-white" />
<Mail className="cursor-pointer transition hover:text-white" />

          </div>

        </div>

      </div>

      <div className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} PeakScore. Todos los derechos reservados.
      </div>
    </footer>
  );
}