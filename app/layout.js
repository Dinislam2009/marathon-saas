import { Montserrat, Golos_Text } from "next/font/google";
import Script from "next/script";
import { DataProvider } from "@/context/DataContext";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-unbounded",
  display: "swap",
});

const golos = Golos_Text({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-golos",
  display: "swap",
});

export const metadata = {
  title: "Loopit",
  description: "Марафон және интенсивтер ұйымдастыруға арналған SaaS платформа",
};

export default async function RootLayout({ children, params }) {
  // ⚡ URL-дегі [lang] параметрін аламыз (әдепкісі 'kk')
  const resolvedParams = await params;
  const lang = resolvedParams?.lang || "kk";

  return (
    <html lang={lang} className={`${montserrat.variable} ${golos.variable}`}>
      <head>
        {/* Kinescope Player SDK */}
        <Script 
          src="https://player.kinescope.io/latest/iframe.player.js" 
          strategy="afterInteractive" 
        />
      </head>
      <body className="antialiased font-sans">
        <LanguageProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}