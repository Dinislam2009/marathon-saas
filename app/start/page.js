"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingState from "@/components/ui/LoadingState";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // ⚡ Контексті күтпей, бірден браузердің localStorage-інен рөлді аламыз
    const role = localStorage.getItem("user_role");
    
    // Демо режим үшін ұйым ID-і
    const demoOrgId = "demo-org"; 

    // ⚡ Шапшаң редирект логикасы
    switch (role) {
      case "OWNER":
        router.replace("/super-admin");
        break;
      case "ORGANIZER":
        router.replace(`/org/${demoOrgId}/admin`);
        break;
      case "CURATOR":
      case "MENTOR":
        router.replace(`/org/${demoOrgId}/mentor`);
        break;
      case "PARTICIPANT":
        router.replace(`/org/${demoOrgId}/student`);
        break;
      default:
        // Егер рөл табылмаса, бірден логин парақшасына өткізу
        router.replace("/login");
        break;
    }
  }, [router]);

  // Бағыттау орындалып жатқан миллисекундтар ішінде тек жүктелу экраны көрінеді
  return <LoadingState />;
}