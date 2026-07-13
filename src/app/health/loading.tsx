import { Skeleton } from "@/components/ui/Skeleton";

export default function HealthLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-28 rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Skeleton className="h-96 rounded-3xl" />
        <div className="space-y-6">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
