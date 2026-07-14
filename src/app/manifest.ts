import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StakeControl",
    short_name: "StakeControl",
    description: "Registro y autocontrol de apuestas deportivas.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#1E3A8A",
    icons: [
      {
        src: "/brand/stakecontrol-app-icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
