import { NextRequest, NextResponse } from "next/server";

const DANE_MUNICIPALITIES_URL =
  "https://geoportal.dane.gov.co/mparcgis/rest/services/Divipola/Serv_DIVIPOLA_MGN_2025/FeatureServer/317/query";

type Municipality = {
  code: string;
  name: string;
  departmentCode: string;
};

export async function GET(
  request: NextRequest
) {
  try {
    const department =
      request.nextUrl.searchParams.get(
        "department"
      );

    /* ========================================================
       VALIDACIÓN
    ======================================================== */

    if (!department) {
      return NextResponse.json(
        {
          error:
            "Falta el código del departamento.",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^\d{2}$/.test(department)) {
      return NextResponse.json(
        {
          error:
            "Código de departamento inválido.",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       CONSULTA DANE
    ======================================================== */

    const params = new URLSearchParams({
      where: `DPTO_CCDGO='${department}'`,
      outFields:
        "MPIO_CCDGO,MPIO_CNMBRE,DPTO_CCDGO",
      returnGeometry: "false",
      orderByFields:
        "MPIO_CNMBRE ASC",
      f: "json",
    });

    const response = await fetch(
      `${DANE_MUNICIPALITIES_URL}?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    /* ========================================================
       ERROR HTTP
    ======================================================== */

    if (!response.ok) {
      console.error(
        "[PeakScore] Error HTTP DANE:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        {
          error:
            "No se pudo consultar el servicio de municipios.",
        },
        {
          status: 502,
        }
      );
    }

    /* ========================================================
       RESPUESTA DANE
    ======================================================== */

    const data = await response.json();

    if (data?.error) {
      console.error(
        "[PeakScore] Error devuelto por DANE:",
        data.error
      );

      return NextResponse.json(
        {
          error:
            "El servicio de municipios devolvió un error.",
        },
        {
          status: 502,
        }
      );
    }

    /* ========================================================
       NORMALIZAR MUNICIPIOS
    ======================================================== */

    let municipalities: Municipality[] =
      Array.isArray(data?.features)
        ? data.features
            .map((feature: any) => {
              const attributes =
                feature?.attributes ?? {};

              return {
                code: String(
                  attributes.MPIO_CCDGO ??
                    ""
                ).trim(),

                name: String(
                  attributes.MPIO_CNMBRE ??
                    ""
                ).trim(),

                departmentCode:
                  String(
                    attributes.DPTO_CCDGO ??
                      ""
                  ).trim(),
              };
            })
            .filter(
              (
                item: Municipality
              ) =>
                item.code.length > 0 &&
                item.name.length > 0 &&
                item.departmentCode ===
                  department
            )
        : [];

    /* ========================================================
       ELIMINAR DUPLICADOS
    ======================================================== */

    const municipalityMap =
      new Map<string, Municipality>();

    for (const municipality of municipalities) {
      municipalityMap.set(
        municipality.code,
        municipality
      );
    }

    municipalities = Array.from(
      municipalityMap.values()
    );

    /* ========================================================
       CÚCUTA
       
       DIVIPOLA:
       Departamento: 54
       Municipio: 54001
    ======================================================== */

    if (department === "54") {
      const cucutaExists =
        municipalities.some(
          (municipality) =>
            municipality.code ===
              "54001" ||
            municipality.name
              .toLowerCase()
              .normalize("NFD")
              .replace(
                /[\u0300-\u036f]/g,
                ""
              ) === "cucuta"
        );

      if (!cucutaExists) {
        municipalities.push({
          code: "54001",
          name: "Cúcuta",
          departmentCode: "54",
        });
      }
    }

    /* ========================================================
       ORDEN ALFABÉTICO
       
       localeCompare permite ordenar correctamente
       nombres con tildes como Cúcuta, Ábrego, etc.
    ======================================================== */

    municipalities.sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
          "es",
          {
            sensitivity: "base",
          }
        )
    );

    /* ========================================================
       RESPUESTA
    ======================================================== */

    return NextResponse.json(
      municipalities,
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, max-age=3600, s-maxage=3600",
        },
      }
    );
  } catch (error) {
    console.error(
      "[PeakScore] Error interno cargando municipios:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno al cargar los municipios.",
      },
      {
        status: 500,
      }
    );
  }
}