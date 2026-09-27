import { FreelancerGridSkeleton } from "@/components/marketplace/result-skeletons";
import { Card, Container, Skeleton } from "@/components/ui/layout";

export default function Loading() {
  return (
    <Container className="py-10 sm:py-12">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <Card className="hidden space-y-4 p-5 lg:block">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </Card>
        <FreelancerGridSkeleton />
      </div>
    </Container>
  );
}
