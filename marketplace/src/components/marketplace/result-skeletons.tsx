import { Card, Skeleton } from "@/components/ui/layout";

export function FreelancerGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading freelancers">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <Card className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
              <Skeleton className="mt-5 h-4 w-1/2" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ProjectListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading projects">
      <ul className="space-y-4">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <Card className="p-5">
              <div className="flex justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-11/12" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
