import { Check, X, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBMISSION_STATUS } from "@/lib/constants";

// The most characteristic piece of the whole product: a calendar-style
// grid of the marathon's days, colour-coded by outcome. Deliberately
// modelled after a GitHub contribution graph crossed with a habit
// tracker, but gamified with the "жан" (life) system.
export default function ProgressGrid({ durationDays, submissionsByDay, todayDay }) {
  const days = Array.from({ length: durationDays }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
      {days.map((day) => {
        const status = submissionsByDay[day]?.status;
        const isToday = day === todayDay;
        const isFuture = todayDay != null && day > todayDay;

        return (
          <div
            key={day}
            className={cn(
              "relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5",
              "text-xs font-medium transition-transform",
              status === SUBMISSION_STATUS.SUBMITTED && "bg-steppe text-white",
              status === SUBMISSION_STATUS.MISSED && "bg-ember/90 text-white",
              (!status || status === SUBMISSION_STATUS.PENDING) &&
                !isToday &&
                "bg-paper-dim text-mist",
              isToday && "bg-white text-horizon-dark ring-2 ring-horizon",
              isFuture && "opacity-60"
            )}
            title={`${day}-күн`}
          >
            {status === SUBMISSION_STATUS.SUBMITTED && <Check size={14} strokeWidth={3} />}
            {status === SUBMISSION_STATUS.MISSED && <X size={14} strokeWidth={3} />}
            {isToday && <Flame size={12} className="text-horizon" />}
            <span>{day}</span>
          </div>
        );
      })}
    </div>
  );
}
