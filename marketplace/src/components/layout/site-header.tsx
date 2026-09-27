import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { getCurrentUser } from "@/lib/auth/session";
import { Logo } from "./logo";
import { MobileMenu, UserMenu } from "./menus";
import { NavLink } from "./nav-link";

const PRIMARY_LINKS = [
  { href: "/freelancers", label: "Find talent" },
  // Posting a project is a client task, not "finding work".
  { href: "/projects", label: "Find work", exclude: ["/projects/new"] },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const menuUser = user
    ? { id: user.id, name: user.name, email: user.email, role: user.role }
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/75">
      <Container className="relative flex h-16 items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {PRIMARY_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} exclude={link.exclude}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {menuUser ? (
            <>
              <NavLink href="/dashboard" exact>
                Dashboard
              </NavLink>
              {menuUser.role === "client" && (
                <ButtonLink href="/projects/new" size="sm" className="mx-1">
                  Post a project
                </ButtonLink>
              )}
              <UserMenu user={menuUser} />
            </>
          ) : (
            <>
              <NavLink href="/login">Log in</NavLink>
              <ButtonLink href="/signup" size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>
        <div className="ml-auto md:hidden">
          <MobileMenu user={menuUser} primaryLinks={PRIMARY_LINKS} />
        </div>
      </Container>
    </header>
  );
}
