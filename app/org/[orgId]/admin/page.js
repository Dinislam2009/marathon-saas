"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, ArrowRight } from "lucide-react";
import { useData } from "@/context/DataContext";
import { MARATHON_STATUS_LABELS, MARATHON_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import * as actions from "@/app/actions";

const BADGE_TONE = {
  [MARATHON_STATUS.ACTIVE]: "steppe",
  [MARATHON_STATUS.DRAFT]: "neutral",
  [MARATHON_STATUS.COMPLETED]: "horizon",
};

export default function TenantAdminHome({ params }) {
  const { orgId } = use(params);
  const { ready, tick } = useData();
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarathons() {
      try {
        setLoading(true);
        // Базадан осы ұйымның марафондарын оқып алу
        if (actions.getMarathonsByOrgId) {
          const res = await actions.getMarathonsByOrgId(orgId);
          setMarathons(res || []);
        } else if (actions.getMarathons) {
          // Егер арнайы orgId арқылы оқитын функция болмаса, барлығын алып фильтрлейміз
          const all = await actions.getMarathons();
          const filtered = (all || []).filter(
            (m) => String(m.orgId) === String(orgId) || String(m.organizerId) === String(orgId)
          );
          setMarathons(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch marathons:", err);
      } finally {
        setLoading(false);
      }
    }

    if (ready) {
      loadMarathons();
    }
  }, [ready, orgId, tick]);

  if (!ready || loading) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Мои марафоны</h1>
          <p className="text-mist text-sm mt-1">Все твои марафоны и их участники здесь.</p>
        </div>
        <Link href={`/org/${orgId}/admin/marathons/new`}>
          <Button>
            <Plus size={16} /> Создать марафон
          </Button>
        </Link>
      </div>

      {marathons.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-mist">Марафонов пока нет. Начни с создания первого.</p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {marathons.map((marathon) => {
          const studentsCount = marathon.students?.length || 0;
          const tasksCount = marathon.tasks?.length || 0;

          return (
            <Link key={marathon.id} href={`/org/${orgId}/admin/marathons/${marathon.id}`}>
              <Card className="h-full flex flex-col gap-3 hover:border-horizon transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <h2 className="font-display font-semibold text-ink pr-2">{marathon.title}</h2>
                  <Badge tone={BADGE_TONE[marathon.status] || "neutral"}>
                    {MARATHON_STATUS_LABELS[marathon.status] || "Черновик"}
                  </Badge>
                </div>
                <p className="text-sm text-mist line-clamp-2">{marathon.description}</p>
                <div className="flex items-center gap-4 text-sm text-mist mt-auto pt-2 border-t border-mist-light">
                  <span className="flex items-center gap-1.5">
                    <Users size={14} /> {studentsCount} участников
                  </span>
                  <span>{tasksCount}/{marathon.durationDays || 21} заданий готово</span>
                </div>
                <p className="text-xs text-mist">Начало: {formatDate(marathon.startDate)}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-horizon-dark">
                  Управлять <ArrowRight size={14} />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}