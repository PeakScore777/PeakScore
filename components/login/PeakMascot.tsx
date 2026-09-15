"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PeakMascotProps {
  eyesDown?: boolean;
  coverEyes?: boolean;
  oneEyeCovered?: boolean;
  welcome?: boolean;
}

const POSES = {
  reposo: "/peaky/login/pose1_reposo.png",
  tapaOjos: "/peaky/login/pose2_tapa_ojos.png",
  bienvenido: "/peaky/login/pose3_bienvenido.png",
};

export default function PeakMascot({
  coverEyes = false,
  welcome = false,
}: PeakMascotProps) {
  const [eyesWereCovered, setEyesWereCovered] = useState(false);

  useEffect(() => {
    if (coverEyes) {
      setEyesWereCovered(true);
    }
  }, [coverEyes]);

  const pose = welcome
    ? POSES.bienvenido
    : eyesWereCovered
      ? POSES.tapaOjos
      : POSES.reposo;

  /*
   * Precargamos todas las poses para que el cambio
   * sea inmediato y no aparezca ningún espacio vacío.
   */
  useEffect(() => {
    Object.values(POSES).forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  return (
    <div
      className="
        relative
        mx-auto
        flex
        w-full
        max-w-[360px]
        justify-center
        select-none
      "
      style={{
        aspectRatio: "1 / 1",
      }}
    >
      <motion.img
        key={pose}
        src={pose}
        alt="Peaky"
        draggable={false}
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          block
          h-full
          w-full
          -translate-x-1/2
          object-contain
        "
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: 0.12,
          ease: "easeOut",
        }}
      />
    </div>
  );
}