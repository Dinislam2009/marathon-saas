"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const LanguageContext = createContext({
  lang: "ru",
  changeLanguage: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("ru");
  const pathname = usePathname();
  const router = useRouter();

  // 1. URL ішінен тілді синхронды түрде бақылау
  useEffect(() => {
    const segments = pathname?.split("/") || [];
    const urlLang = segments[1];

    if (["kk", "ru"].includes(urlLang)) {
      setLang(urlLang);
      localStorage.setItem("app_lang", urlLang);
    }
  }, [pathname]);

  const changeLanguage = (newLang) => {
    if (newLang === lang) return;

    setLang(newLang);
    localStorage.setItem("app_lang", newLang);

    const segments = pathname?.split("/") || [];
    if (["kk", "ru"].includes(segments[1])) {
      segments[1] = newLang;
      router.push(segments.join("/"));
    } else {
      router.push(`/${newLang}${pathname}`);
    }
  };

  // ⚡ `if (!mounted) return null;` алып тасталды. 
  // Енді сайттың HTML-і серверден лезде тез жүктеледі.
  return (
    <LanguageContext.Provider value={{ lang, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);