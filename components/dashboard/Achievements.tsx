"use client";

export default function Achievements() {
  return (
    <section
      className="
        flex
        h-full
        min-h-[620px]
        w-full
        flex-col
        gap-4
      "
    >
      {/* LOGROS */}
      <div
        className="
          min-h-0
          flex-1
          overflow-hidden
          rounded-[24px]
        "
      >
        <img
          src="/dashboard/logros.png"
          alt="Logros PeakScore"
          className="
            block
            h-full
            w-full
            object-cover
            object-center
          "
        />
      </div>

      {/* FRASE */}
      <div
        className="
          h-[145px]
          shrink-0
          overflow-hidden
          rounded-[24px]
        "
      >
        <img
          src="/dashboard/meta-frase.png"
          alt="Cada esfuerzo te acerca a tu meta"
          className="
            block
            h-full
            w-full
            object-cover
            object-center
          "
        />
      </div>
    </section>
  );
}