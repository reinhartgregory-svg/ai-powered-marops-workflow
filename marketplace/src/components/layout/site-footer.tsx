import Link from "next/link";
import { Container } from "@/components/ui/layout";
import { APP_NAME } from "@/lib/constants";
import { LogoMark } from "./logo";

const COLUMNS = [
  {
    title: "For clients",
    links: [
      { href: "/freelancers", label: "Browse freelancers" },
      { href: "/projects/new", label: "Post a project" },
      { href: "/signup?role=client", label: "Create a client account" },
    ],
  },
  {
    title: "For freelancers",
    links: [
      { href: "/projects", label: "Browse projects" },
      { href: "/dashboard/profile", label: "Build your profile" },
      { href: "/signup?role=freelancer", label: "Create a freelancer account" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <Container className="grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <LogoMark className="size-7" />
            {APP_NAME}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            A marketplace that connects clients with independent professionals. Post a
            project, compare proposals, and hire with confidence.
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            In-app payments and messaging aren&apos;t available yet. Once you hire someone,
            you&apos;ll both see each other&apos;s email to arrange the work and payment directly.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-semibold text-slate-900">{column.title}</h2>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-600 hover:text-brand-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-slate-100">
        <Container className="py-5 text-xs text-slate-500">
          © {new Date().getFullYear()} {APP_NAME}. Demo marketplace — sample data only.
        </Container>
      </div>
    </footer>
  );
}
