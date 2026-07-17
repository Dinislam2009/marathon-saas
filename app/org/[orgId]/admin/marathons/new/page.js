"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";
import { DEFAULT_DURATION_DAYS } from "@/lib/constants";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewMarathonPage({ params }) {
  const { orgId } = use(params);
  const router = useRouter();
  const { createMarathon } = useData();

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationDays: DEFAULT_DURATION_DAYS,
    startDate: todayIso(),
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const marathon = createMarathon(orgId, {
      ...form,
      durationDays: Number(form.durationDays) || DEFAULT_DURATION_DAYS,
      startDate: new Date(form.startDate).toISOString(),
    });
    router.push(`/org/${orgId}/admin/marathons/${marathon.id}`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-ink w-fit"
      >
        <ArrowLeft size={14} /> Артқа
      </button>

      <Card>
        <CardHeader title="Жаңа марафон құру" subtitle="Негізгі ақпаратты толтыр — тапсырмаларды кейін қосасың." />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Марафон атауы</span>
            <input
              required
              autoFocus
              placeholder="мыс. 21 күндік дисциплина марафоны"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-xl border border-mist-light px-3 py-2.5 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Сипаттама</span>
            <textarea
              rows={3}
              placeholder="Марафон не туралы, оқушылар не үйренеді?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-xl border border-mist-light px-3 py-2.5 text-sm resize-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Ұзақтығы (күн)</span>
              <input
                type="number"
                min={1}
                max={90}
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                className="rounded-xl border border-mist-light px-3 py-2.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Басталу күні</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="rounded-xl border border-mist-light px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Бас тарту
            </Button>
            <Button type="submit">Марафонды құру</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
