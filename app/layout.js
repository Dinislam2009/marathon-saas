import { Montserrat, Golos_Text } from "next/font/google";
import Script from "next/script";
import { DataProvider } from "@/context/DataContext";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

// ⚡ Montserrat қазақша әріптерді (cyrillic-ext) 100% толық қолдайды
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-unbounded", // Дизайн бұзылмас үшін CSS айнымалысын сақтадық
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

export default function RootLayout({ children }) {
  return (
    <html lang="kk" className={`${montserrat.variable} ${golos.variable}`}>
      <head>
        {/* ⚡ Kinescope Player SDK скрипті */}
        <Script 
          src="https://player.kinescope.io/latest/iframe.player.js" 
          strategy="afterInteractive" 
        />
      </head>
      <body>
        <LanguageProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}