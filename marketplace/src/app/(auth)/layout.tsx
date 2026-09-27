import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/layout";

const POINTS = [
  "Post projects and get proposals from skilled freelancers",
  "Compare bids, shortlist, and hire in a few clicks",
  "Freelancers track every application in one dashboard",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16">
      <div className="order-2 hidden lg:order-1 lg:block">
        <div className="sticky top-28 rounded-3xl bg-brand-900 p-10 text-white">
          <p className="text-sm font-medium text-brand-200">Why teams use us</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight">
            Great work starts with the right match.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-brand-50">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-300" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="order-1 mx-auto w-full max-w-md lg:order-2">{children}</div>
    </Container>
  );
}
