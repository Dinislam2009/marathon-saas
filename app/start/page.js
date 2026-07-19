"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/ui/LoadingState";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // ⚡ Контексті күтпей, бірден браузердің localStorage-інен рөлді аламыз[cite: 4]
    const role = localStorage.getItem("user_role");
    
    // ⚡ Сенің папка құрылымыңдағы нақты атау (тік жақшасыз)[cite: 2]
    const currentOrgFolder = "orgId"; 

    // ⚡ Базадағы нақты рөлдер мен папка иерархиясына сай шапшаң редирект[cite: 2, 3]
    switch (role) {
      case "OWNER":
        router.replace("/super-admin"); // Супер-админ папкасы
        break;
      case "ORGANIZER":
        router.replace(`/org/${currentOrgFolder}/admin`); // org/orgId/admin[cite: 2]
        break;
      case "CURATOR":
        router.replace(`/org/${currentOrgFolder}/mentor`); // org/orgId/mentor[cite: 2]
        break;
      case "PARTICIPANT":
        router.replace(`/org/${currentOrgFolder}/student`); // org/orgId/student[cite: 2]
        break;
      default:
        // Егер рөл табылмаса, логин парақшасына қайтару[cite: 4]
        router.replace("/login");
        break;
    }
  }, [router]);

  // Бағыттау орындалып жатқан миллисекундтар ішінде тек жүктелу экраны көрінеді[cite: 4]
  return <LoadingState />;
}