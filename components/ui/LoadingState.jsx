export default function LoadingState({ label = "Жүктелуде…" }) {
  return (
    <div className="flex items-center justify-center py-24 text-mist text-sm gap-2">
      <span className="h-2 w-2 rounded-full bg-horizon animate-pulse" />
      {label}
    </div>
  );
}
