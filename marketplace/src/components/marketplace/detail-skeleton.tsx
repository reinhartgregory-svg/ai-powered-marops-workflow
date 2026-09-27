import { Card, Container, Skeleton } from "@/components/ui/layout";

export function DetailPageSkeleton({ label }: { label: string }) {
  return (
    <Container className="py-10 sm:py-12">
      <div role="status" aria-label={label}>
        <Skeleton className="h-4 w-48" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-6">
            <Card className="space-y-4 p-6 sm:p-8">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </Card>
            <Card className="space-y-3 p-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="space-y-3 p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-full" />
            </Card>
          </div>
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </Container>
  );
}

export function FormPageSkeleton({ label }: { label: string }) {
  return (
    <Container className="max-w-3xl py-10 sm:py-12">
      <div role="status" aria-label={label}>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <Card className="mt-8 space-y-6 p-6 sm:p-8">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </Card>
        <span className="sr-only">Loading…</span>
      </div>
    </Container>
  );
}
