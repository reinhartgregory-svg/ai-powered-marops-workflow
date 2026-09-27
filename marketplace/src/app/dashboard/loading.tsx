import { Card, Container, Skeleton } from "@/components/ui/layout";

export default function Loading() {
  return (
    <Container className="py-10 sm:py-12">
      <div role="status" aria-label="Loading dashboard" className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-12" />
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={i} className="space-y-3 p-5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </Card>
          ))}
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </Container>
  );
}
