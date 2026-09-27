import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { ActionForm } from "@/components/forms/action-form";
import { PortfolioItemForm, ProfileForm } from "@/components/forms/profile-forms";
import { AccessDenied } from "@/components/marketplace/access-denied";
import { ButtonLink } from "@/components/ui/button";
import { Card, Container, PageHeader } from "@/components/ui/layout";
import { requireUser } from "@/lib/auth/session";
import { LIMITS } from "@/lib/constants";
import { deletePortfolioItemAction } from "@/server/actions/profile";
import { listCategories, listSkills } from "@/server/services/catalog";
import { getProfileByUserId } from "@/server/services/freelancers";

export const metadata: Metadata = { title: "Your profile" };

export default async function EditProfilePage() {
  const user = await requireUser("/dashboard/profile");
  if (user.role !== "freelancer") {
    return (
      <AccessDenied
        title="Profiles are for freelancers"
        description="You're signed in with a client account. Clients manage their projects from the dashboard."
      />
    );
  }

  const [profile, categories, skills] = await Promise.all([
    getProfileByUserId(user.id),
    listCategories(),
    listSkills(),
  ]);
  const atLimit = (profile?.portfolio.length ?? 0) >= LIMITS.maxPortfolioItems;

  return (
    <Container className="max-w-4xl py-10 sm:py-12">
      <PageHeader
        title={profile ? "Your freelancer profile" : "Create your freelancer profile"}
        description={
          profile
            ? "Keep your profile current — it's what clients see next to every proposal you send."
            : "Your profile is how clients find you in search. You need one before you can send proposals."
        }
        actions={
          profile && (
            <ButtonLink href={`/freelancers/${profile.id}`} variant="secondary">
              <ExternalLink aria-hidden="true" className="size-4" />
              View public profile
            </ButtonLink>
          )
        }
      />

      <Card as="section" className="mt-8 p-6 sm:p-8" >
        <h2 className="sr-only">Profile details</h2>
        <ProfileForm
          categories={categories}
          skills={skills}
          initial={
            profile && {
              headline: profile.headline,
              bio: profile.bio,
              categoryId: profile.categoryId,
              hourlyRate: profile.hourlyRate,
              availability: profile.availability,
              location: profile.location,
              skills: profile.skills.map((s) => s.name),
            }
          }
        />
      </Card>

      <section id="portfolio" aria-labelledby="portfolio-heading" className="mt-10 scroll-mt-24">
        <h2 id="portfolio-heading" className="text-lg font-semibold text-slate-900">
          Portfolio
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Showcase up to {LIMITS.maxPortfolioItems} examples of past work. Image uploads aren&apos;t supported
          yet — link to a live site or case study instead.
        </p>

        {!profile ? (
          <Card className="mt-4 p-6 text-sm text-slate-600">
            Publish your profile first, then add portfolio items here.
          </Card>
        ) : (
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div>
              {profile.portfolio.length === 0 ? (
                <Card className="p-6 text-sm text-slate-600">
                  No portfolio items yet. Freelancers with portfolio items rank higher in search results.
                </Card>
              ) : (
                <ul className="space-y-3">
                  {profile.portfolio.map((item) => (
                    <li key={item.id}>
                      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900">{item.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-sm text-brand-700 hover:text-brand-800"
                            >
                              <span className="truncate">{item.url}</span>
                              <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
                              <span className="sr-only">(opens in a new tab)</span>
                            </a>
                          )}
                        </div>
                        <ActionForm
                          action={deletePortfolioItemAction}
                          fields={{ itemId: item.id }}
                          label={
                            <>
                              Remove<span className="sr-only"> {item.title}</span>
                            </>
                          }
                          pendingText="Removing…"
                          variant="ghost"
                          confirm={{
                            title: "Remove this portfolio item?",
                            description: `“${item.title}” will be removed from your public profile.`,
                            confirmLabel: "Remove item",
                          }}
                        />
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Card className="h-fit p-5">
              {atLimit ? (
                <p className="text-sm text-slate-600">
                  You&apos;ve reached the limit of {LIMITS.maxPortfolioItems} items. Remove one to add another.
                </p>
              ) : (
                <PortfolioItemForm />
              )}
            </Card>
          </div>
        )}
      </section>
    </Container>
  );
}
