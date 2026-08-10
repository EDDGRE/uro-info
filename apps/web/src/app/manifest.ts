import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Uro Info — Klinisk oppslagsverk for LIS i urologi",
    short_name: "Uro Info",
    description:
      "Klinisk oppslagsverk for leger i spesialisering i urologi, med oppslag på benigne og maligne tilstander, behandlingsvalg og operasjonsteknikk.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F4EF",
    theme_color: "#16283C",
    lang: "no",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
