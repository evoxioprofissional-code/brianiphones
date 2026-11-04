import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Brian iPhones — iPhone, MacBook e Apple Watch em Itatiba",
    template: "%s · Brian iPhones",
  },
  description:
    "Loja física em Itatiba há 6 anos. iPhones novos e seminovos revisados, troca do seu aparelho na entrada e reparo. Mais de 6 mil clientes atendidos.",
};

export const viewport: Viewport = {
  themeColor: "#f2f0eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${plexMono.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
