"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import LoadingState from "@/components/ui/LoadingState";

export default function Home() {
  const router = useRouter();
  const { ready } = useData();

  useEffect(() => {
    if (!ready) return;

    // ⚡ localStorage-тан пайдаланушының нақты рөлін оқу
    const role = localStorage.getItem("user_role");
    
    // Сенің жобаңдағы демо ұйым ID-і (болашақта базадан келген orgId-ге ауыстыруға болады)
    const demoOrgId = "demo-org"; 

    // ⚡ Пайдаланушыны рөліне сәйкес бірден нақты сілтемеге лақтыру (Авто-Редирект)
    switch (role) {
      case "OWNER":
        router.replace("/super-admin"); // Супер Админ парақшасы
        break;
      case "ORGANIZER":
        router.replace(`/org/${demoOrgId}/admin`); // Ұйымдастырушы кабинеті
        break;
      case "CURATOR":
      case "MENTOR":
        router.replace(`/org/${demoOrgId}/mentor`); // Куратор/Ментор кабинеті
        break;
      case "PARTICIPANT":
        router.replace(`/org/${demoOrgId}/student`); // Оқушы кабинеті
        break;
      default:
        // Егер рөл анықталмаса немесе қате болса, қайта логинге жіберу
        router.replace("/login");
        break;
    }
  }, [ready, router]);

  // Редирект жасалып жатқан кезде экранда тек әдемі Loading анимациясы тұрады
  return <LoadingState />;
}