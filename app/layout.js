import { Unbounded, Golos_Text } from "next/font/google";
import { DataProvider } from "@/context/DataContext";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
});

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-golos",
  display: "swap",
});

export const metadata = {
  title: "Loopit",
  description: "Марафон және интенсивтер ұйымдастыруға арналған SaaS платформа",
};

export default function RootLayout({ children }) {
  return (
    <html lang="kk" className={`${unbounded.variable} ${golos.variable}`}>
      <body>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}