import type {
  Availability,
  BudgetType,
  Duration,
  ProjectStatus,
  ProposalStatus,
} from "./schema";

/** Accounts everyone can use to explore the demo. Password comes from SEED_DEMO_PASSWORD. */
export const DEMO_CLIENT_EMAIL = "client@example.com";
export const DEMO_FREELANCER_EMAIL = "freelancer@example.com";

export const seedCategories = [
  {
    slug: "development",
    name: "Development & IT",
    description: "Web and mobile apps, APIs, DevOps, and QA.",
  },
  {
    slug: "design",
    name: "Design & Creative",
    description: "Product and brand design, illustration, and UX research.",
  },
  {
    slug: "writing",
    name: "Writing & Translation",
    description: "Copywriting, editing, technical writing, and translation.",
  },
  {
    slug: "marketing",
    name: "Marketing & Sales",
    description: "SEO, paid ads, email, social, and growth strategy.",
  },
  {
    slug: "data",
    name: "Data & Analytics",
    description: "Dashboards, data pipelines, analysis, and machine learning.",
  },
  {
    slug: "video",
    name: "Video & Audio",
    description: "Editing, motion graphics, podcasts, and voice-over.",
  },
  {
    slug: "admin",
    name: "Admin & Support",
    description: "Virtual assistance, customer support, and operations.",
  },
  {
    slug: "finance",
    name: "Finance & Accounting",
    description: "Bookkeeping, financial models, and fractional CFO work.",
  },
] as const;

type CategorySlug = (typeof seedCategories)[number]["slug"];

export type SeedClient = {
  key: string;
  name: string;
  email: string;
  companyName: string;
  joinedDaysAgo: number;
};

export const seedClients: SeedClient[] = [
  {
    key: "maya",
    name: "Maya Chen",
    email: DEMO_CLIENT_EMAIL,
    companyName: "Harbor & Pine Outfitters",
    joinedDaysAgo: 120,
  },
  {
    key: "jordan",
    name: "Jordan Blake",
    email: "jordan.blake@example.com",
    companyName: "Lumen Health Labs",
    joinedDaysAgo: 210,
  },
  {
    key: "priya",
    name: "Priya Nair",
    email: "priya.nair@example.com",
    companyName: "Fernway Travel",
    joinedDaysAgo: 95,
  },
  {
    key: "sam",
    name: "Sam Okafor",
    email: "sam.okafor@example.com",
    companyName: "Okafor Family Bakery",
    joinedDaysAgo: 60,
  },
  {
    key: "elena",
    name: "Elena García",
    email: "elena.garcia@example.com",
    companyName: "Quillstone Publishing",
    joinedDaysAgo: 300,
  },
];

export type SeedFreelancer = {
  key: string;
  name: string;
  email: string;
  joinedDaysAgo: number;
  headline: string;
  bio: string;
  category: CategorySlug;
  hourlyRate: number;
  availability: Availability;
  location: string;
  skills: string[];
  portfolio: { title: string; description: string; url?: string }[];
};

export const seedFreelancers: SeedFreelancer[] = [
  {
    key: "alex",
    name: "Alex Rivera",
    email: DEMO_FREELANCER_EMAIL,
    joinedDaysAgo: 180,
    headline: "Full-stack engineer for fast, accessible web apps",
    bio: "I build production web applications with React, Next.js, and Node.js, from the first database table to the last pixel. Over the past eight years I've shipped booking systems, internal dashboards, and e-commerce storefronts for startups and small businesses. I care about accessibility, tests that catch real bugs, and handing over code your next developer will thank you for.",
    category: "development",
    hourlyRate: 85,
    availability: "available",
    location: "Austin, TX",
    skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Accessibility"],
    portfolio: [
      {
        title: "Class booking platform for a yoga studio chain",
        description: "Rebuilt scheduling and memberships for 6 studios; bookings grew 40% after launch and no-shows dropped with SMS reminders.",
        url: "https://example.com/portfolio/studio-booking",
      },
      {
        title: "Inventory dashboard for a regional distributor",
        description: "Real-time stock levels across three warehouses, replacing a nightly spreadsheet export.",
      },
    ],
  },
  {
    key: "amara",
    name: "Amara Osei",
    email: "amara.osei@example.com",
    joinedDaysAgo: 400,
    headline: "Product designer turning complex workflows into calm interfaces",
    bio: "I'm a product designer with a background in healthcare software. I run lightweight research, map the workflow, and then design interfaces that feel obvious to the people who use them every day. I deliver Figma files with a tidy component library and stay involved through development so the details survive the build.",
    category: "design",
    hourlyRate: 95,
    availability: "limited",
    location: "Toronto, Canada",
    skills: ["Figma", "UI/UX Design", "User Research", "Design Systems", "Prototyping"],
    portfolio: [
      {
        title: "Clinic intake redesign",
        description: "Cut average patient intake time from 11 to 6 minutes by restructuring a 9-step form into a guided flow.",
        url: "https://example.com/portfolio/clinic-intake",
      },
      {
        title: "Design system for a fintech startup",
        description: "90+ documented components with accessibility notes, adopted across web and mobile teams.",
      },
      {
        title: "Mobile banking onboarding",
        description: "Usability-tested prototype that raised completion rates in testing from 58% to 81%.",
      },
    ],
  },
  {
    key: "diego",
    name: "Diego Martins",
    email: "diego.martins@example.com",
    joinedDaysAgo: 250,
    headline: "Mobile developer shipping React Native and Swift apps",
    bio: "I help teams launch mobile apps that feel native on both platforms. I've worked on fitness, delivery, and event apps with offline sync, push notifications, and in-app purchases. I write clear release notes, keep the App Store review process painless, and hand over well-documented code.",
    category: "development",
    hourlyRate: 75,
    availability: "available",
    location: "Lisbon, Portugal",
    skills: ["React Native", "Swift", "TypeScript", "Firebase", "iOS"],
    portfolio: [
      {
        title: "Event check-in app",
        description: "Offline-first QR check-in used at conferences of up to 5,000 attendees.",
      },
    ],
  },
  {
    key: "hannah",
    name: "Hannah Weiss",
    email: "hannah.weiss@example.com",
    joinedDaysAgo: 520,
    headline: "Conversion copywriter for SaaS and e-commerce brands",
    bio: "I write websites, landing pages, and email sequences that sound like you on your best day and give readers a clear reason to act. Every project starts with customer interviews and review mining so the words come from your buyers, not from a thesaurus. I've written for B2B software, outdoor gear, and skincare brands.",
    category: "writing",
    hourlyRate: 70,
    availability: "available",
    location: "Berlin, Germany",
    skills: ["Copywriting", "Email Marketing", "Content Strategy", "SEO Writing"],
    portfolio: [
      {
        title: "Homepage rewrite for a B2B scheduling tool",
        description: "New positioning and page copy; demo requests up 27% in the first month.",
      },
      {
        title: "Welcome email series for a skincare brand",
        description: "Five-email onboarding flow that became the brand's top revenue-generating automation.",
      },
    ],
  },
  {
    key: "kenji",
    name: "Kenji Watanabe",
    email: "kenji.watanabe@example.com",
    joinedDaysAgo: 330,
    headline: "Data analyst building dashboards teams actually use",
    bio: "I turn messy spreadsheets and databases into dashboards and reports that answer real business questions. I work in SQL, Python, and your BI tool of choice, and I always document metric definitions so everyone reads the numbers the same way. Past clients include retailers, nonprofits, and SaaS companies.",
    category: "data",
    hourlyRate: 80,
    availability: "available",
    location: "Osaka, Japan",
    skills: ["SQL", "Python", "Power BI", "Data Visualization", "Excel"],
    portfolio: [
      {
        title: "Retail sales dashboard",
        description: "Unified POS and e-commerce data into one weekly dashboard for a 12-store retailer.",
      },
    ],
  },
  {
    key: "sofia",
    name: "Sofia Rossi",
    email: "sofia.rossi@example.com",
    joinedDaysAgo: 150,
    headline: "Brand identity and packaging designer",
    bio: "I design brand identities with personality: logos, color systems, typography, and packaging that stand out on a crowded shelf. I work closely with founders through a structured three-round process, and deliver a brand guide so your team and future designers stay consistent.",
    category: "design",
    hourlyRate: 65,
    availability: "available",
    location: "Milan, Italy",
    skills: ["Brand Identity", "Logo Design", "Packaging Design", "Adobe Illustrator"],
    portfolio: [
      {
        title: "Identity for a small-batch coffee roaster",
        description: "Logo, bag design, and café signage for a roaster opening its first retail location.",
        url: "https://example.com/portfolio/roaster-brand",
      },
    ],
  },
  {
    key: "marcus",
    name: "Marcus Johnson",
    email: "marcus.johnson@example.com",
    joinedDaysAgo: 610,
    headline: "Performance marketer for Google and Meta ads",
    bio: "I manage paid acquisition for e-commerce and lead-gen businesses spending $5k–$150k a month. I start with tracking you can trust, then run disciplined creative and audience tests. You get a weekly report in plain English: what we spent, what it returned, and what we're testing next.",
    category: "marketing",
    hourlyRate: 90,
    availability: "limited",
    location: "Atlanta, GA",
    skills: ["Google Ads", "Meta Ads", "Google Analytics", "Conversion Optimization"],
    portfolio: [
      {
        title: "Paid social relaunch for an apparel brand",
        description: "Rebuilt account structure and creative testing; return on ad spend improved from 1.8x to 3.1x.",
      },
    ],
  },
  {
    key: "lina",
    name: "Lina Haddad",
    email: "lina.haddad@example.com",
    joinedDaysAgo: 90,
    headline: "Arabic–English translator and localization specialist",
    bio: "I translate and localize websites, apps, and marketing materials between Arabic and English, with a focus on natural phrasing and right-to-left layout quality. I've worked with travel, education, and healthcare organizations and can coordinate review with your in-market team.",
    category: "writing",
    hourlyRate: 45,
    availability: "available",
    location: "Amman, Jordan",
    skills: ["Translation", "Localization", "Arabic", "Proofreading"],
    portfolio: [],
  },
  {
    key: "tom",
    name: "Tom Becker",
    email: "tom.becker@example.com",
    joinedDaysAgo: 700,
    headline: "DevOps engineer for reliable, affordable cloud infrastructure",
    bio: "I help small engineering teams stop firefighting. I set up CI/CD, infrastructure as code, monitoring, and sensible alerting on AWS or GCP, and I regularly cut cloud bills by 20–40% along the way. Everything I build is documented so your team can run it without me.",
    category: "development",
    hourlyRate: 110,
    availability: "unavailable",
    location: "Munich, Germany",
    skills: ["AWS", "Terraform", "Docker", "Kubernetes", "CI/CD"],
    portfolio: [
      {
        title: "Kubernetes migration for a logistics startup",
        description: "Moved 14 services from hand-managed VMs to managed Kubernetes with zero-downtime deploys.",
      },
    ],
  },
  {
    key: "grace",
    name: "Grace Kim",
    email: "grace.kim@example.com",
    joinedDaysAgo: 200,
    headline: "Video editor and motion designer for YouTube and social",
    bio: "I edit long-form YouTube videos and cut them into short-form clips that keep viewers watching. I handle pacing, sound design, captions, and simple motion graphics, and I can build a repeatable template so your channel looks consistent week after week.",
    category: "video",
    hourlyRate: 55,
    availability: "available",
    location: "Seoul, South Korea",
    skills: ["Video Editing", "Motion Graphics", "Adobe Premiere Pro", "After Effects"],
    portfolio: [
      {
        title: "Weekly edits for an education channel",
        description: "Edited 60+ episodes; average view duration increased 22% after a pacing overhaul.",
      },
    ],
  },
  {
    key: "rafael",
    name: "Rafael Souza",
    email: "rafael.souza@example.com",
    joinedDaysAgo: 45,
    headline: "Shopify developer for growing online stores",
    bio: "I build and customize Shopify themes, set up apps that don't slow your store down, and migrate stores from other platforms without losing SEO. Clients hire me when they've outgrown a template but don't need a full custom build.",
    category: "development",
    hourlyRate: 60,
    availability: "available",
    location: "São Paulo, Brazil",
    skills: ["Shopify", "Liquid", "JavaScript", "E-commerce", "CSS"],
    portfolio: [],
  },
  {
    key: "nadia",
    name: "Nadia Petrova",
    email: "nadia.petrova@example.com",
    joinedDaysAgo: 380,
    headline: "Bookkeeper and fractional controller for small businesses",
    bio: "I keep small businesses' books clean and close them on time every month. I work in QuickBooks Online and Xero, set up simple processes for receipts and approvals, and deliver a monthly summary you can actually read. I'm used to working alongside outside CPAs at tax time.",
    category: "finance",
    hourlyRate: 50,
    availability: "limited",
    location: "Remote (EU time zones)",
    skills: ["Bookkeeping", "QuickBooks", "Xero", "Financial Reporting"],
    portfolio: [],
  },
  {
    key: "owen",
    name: "Owen Brennan",
    email: "owen.brennan@example.com",
    joinedDaysAgo: 130,
    headline: "Technical SEO consultant for content-heavy sites",
    bio: "I fix the technical problems that keep good content from ranking: crawl budget, site speed, internal linking, structured data, and migrations. I deliver prioritized audits with effort estimates, and I can work directly with your developers to ship the fixes.",
    category: "marketing",
    hourlyRate: 100,
    availability: "available",
    location: "Dublin, Ireland",
    skills: ["SEO", "Google Analytics", "Content Strategy", "Site Audits"],
    portfolio: [
      {
        title: "Migration for a 20,000-page recipe site",
        description: "Replatformed without traffic loss and recovered 18% organic growth within a quarter.",
      },
    ],
  },
  {
    key: "zoe",
    name: "Zoe Adeyemi",
    email: "zoe.adeyemi@example.com",
    joinedDaysAgo: 75,
    headline: "Executive virtual assistant for busy founders",
    bio: "I manage inboxes, calendars, travel, and the endless small tasks that eat up a founder's week. I'm organized, discreet, and proactive — I'll suggest better systems rather than just follow the old ones. Comfortable with Notion, Google Workspace, and most CRMs.",
    category: "admin",
    hourlyRate: 30,
    availability: "available",
    location: "Lagos, Nigeria",
    skills: ["Calendar Management", "Customer Support", "Notion", "Data Entry"],
    portfolio: [],
  },
  {
    key: "ivan",
    name: "Ivan Kowalski",
    email: "ivan.kowalski@example.com",
    joinedDaysAgo: 260,
    headline: "Machine learning engineer for practical AI features",
    bio: "I build machine learning features that earn their keep: search ranking, recommendations, forecasting, and document classification. I start with a baseline you can measure against, and only reach for complex models when the data justifies it. Python, SQL, and cloud deployment.",
    category: "data",
    hourlyRate: 120,
    availability: "limited",
    location: "Warsaw, Poland",
    skills: ["Python", "Machine Learning", "SQL", "Data Engineering"],
    portfolio: [
      {
        title: "Demand forecasting for a grocery chain",
        description: "Reduced perishable waste by 15% with store-level forecasts refreshed nightly.",
      },
    ],
  },
  {
    key: "chloe",
    name: "Chloé Martin",
    email: "chloe.martin@example.com",
    joinedDaysAgo: 30,
    headline: "Podcast producer and audio editor",
    bio: "I produce podcasts end to end: editing, mixing, show notes, and publishing. I remove the ums and the long pauses without making anyone sound robotic, and I can help plan a season so your show has a clear arc.",
    category: "video",
    hourlyRate: 40,
    availability: "available",
    location: "Lyon, France",
    skills: ["Audio Editing", "Podcast Production", "Adobe Audition"],
    portfolio: [],
  },
];

export type SeedProposal = {
  freelancer: string;
  status: ProposalStatus;
  bidAmount: number;
  estimatedDuration: Duration;
  coverLetter: string;
  daysAgo: number;
};

export type SeedProject = {
  key: string;
  client: string;
  title: string;
  description: string;
  category: CategorySlug;
  budgetType: BudgetType;
  budgetMin: number;
  budgetMax: number;
  status: ProjectStatus;
  skills: string[];
  daysAgo: number;
  proposals: SeedProposal[];
};

export const seedProjects: SeedProject[] = [
  {
    key: "storefront",
    client: "maya",
    title: "Rebuild our outdoor gear storefront in Next.js",
    description:
      "We sell tents, packs, and apparel online and our current storefront is slow on mobile and hard to update. We'd like a developer to rebuild the storefront in Next.js on top of our existing product API.\n\nScope:\n- Product listing and detail pages with filters by activity and size\n- Cart and checkout handoff to our existing payment provider\n- Content pages our team can edit\n- Lighthouse performance score of 90+ on mobile\n\nWe have designs ready in Figma. Please share a store or app you've built and how you'd approach performance.",
    category: "development",
    budgetType: "fixed",
    budgetMin: 6000,
    budgetMax: 9000,
    status: "open",
    skills: ["Next.js", "React", "TypeScript", "E-commerce"],
    daysAgo: 3,
    proposals: [
      {
        freelancer: "rafael",
        status: "submitted",
        bidAmount: 6500,
        estimatedDuration: "1_3_months",
        coverLetter:
          "Hi Maya — I've built a dozen e-commerce storefronts and know how much mobile speed matters for conversion. I'd start with a performance budget, use static generation for product pages with on-demand revalidation when inventory changes, and keep the checkout handoff simple. I can share two recent stores with 95+ mobile Lighthouse scores.",
        daysAgo: 2,
      },
      {
        freelancer: "diego",
        status: "shortlisted",
        bidAmount: 8200,
        estimatedDuration: "1_3_months",
        coverLetter:
          "I'd love to help. Most of my recent work is mobile apps, but I've built three Next.js storefronts and I think about them the way I think about apps: fast first load, instant navigation, and graceful behavior on flaky connections. I'd propose weekly demos so you can steer early.",
        daysAgo: 2,
      },
    ],
  },
  {
    key: "brand",
    client: "sam",
    title: "Logo and packaging refresh for a family bakery",
    description:
      "We're a third-generation family bakery getting ready to sell our bread and cookies in local grocery stores. Our current logo was drawn in 1987 and doesn't print well on packaging.\n\nWe need a refreshed logo that keeps some of our heritage, a simple color palette, and packaging designs for a bread bag and a cookie box. Printer-ready files required.",
    category: "design",
    budgetType: "fixed",
    budgetMin: 1500,
    budgetMax: 3000,
    status: "open",
    skills: ["Brand Identity", "Logo Design", "Packaging Design"],
    daysAgo: 6,
    proposals: [
      {
        freelancer: "sofia",
        status: "shortlisted",
        bidAmount: 2400,
        estimatedDuration: "2_4_weeks",
        coverLetter:
          "What a lovely brief! Heritage bakeries are some of my favorite projects. I'd begin by looking through your archive — old signage, recipe cards, photos — to find details worth keeping, then present three directions. Packaging would follow once the logo is approved, with printer-ready dielines for both formats.",
        daysAgo: 5,
      },
    ],
  },
  {
    key: "dashboard",
    client: "jordan",
    title: "Patient outcomes dashboard in Power BI",
    description:
      "Our clinical operations team tracks patient outcomes across four clinics in a set of spreadsheets. We'd like a Power BI dashboard that pulls from our SQL database, shows outcome trends by clinic and program, and refreshes daily.\n\nYou'll work with our data lead to define metrics. De-identified data only — no patient information will be shared.",
    category: "data",
    budgetType: "hourly",
    budgetMin: 60,
    budgetMax: 95,
    status: "open",
    skills: ["Power BI", "SQL", "Data Visualization"],
    daysAgo: 8,
    proposals: [
      {
        freelancer: "kenji",
        status: "submitted",
        bidAmount: 80,
        estimatedDuration: "2_4_weeks",
        coverLetter:
          "I've built similar outcome dashboards for two nonprofits. My approach: agree on metric definitions first and document them in the report itself, then build a clean star schema so the dashboard stays fast as data grows. I'd expect 40–60 hours including a handover session for your team.",
        daysAgo: 7,
      },
    ],
  },
  {
    key: "copy",
    client: "priya",
    title: "Website copy for a sustainable travel agency",
    description:
      "Fernway Travel plans low-impact trips in South and Southeast Asia. We're launching a new website and need copy for the homepage, about page, and six destination pages.\n\nThe tone should be warm and knowledgeable, never preachy. We'll provide interviews with our guides and past traveler reviews to work from.",
    category: "writing",
    budgetType: "fixed",
    budgetMin: 1200,
    budgetMax: 2000,
    status: "open",
    skills: ["Copywriting", "Content Strategy", "SEO Writing"],
    daysAgo: 1,
    proposals: [],
  },
  {
    key: "ads",
    client: "maya",
    title: "Set up and manage Meta ads for spring launch",
    description:
      "We're launching a new line of lightweight hiking packs in March and want to run Meta ads for 8 weeks around the launch. We need campaign setup, creative testing with our photography, and weekly reporting.\n\nMonthly ad spend will be around $12k. Please describe how you structure creative tests.",
    category: "marketing",
    budgetType: "hourly",
    budgetMin: 60,
    budgetMax: 100,
    status: "open",
    skills: ["Meta Ads", "Conversion Optimization", "Google Analytics"],
    daysAgo: 10,
    proposals: [
      {
        freelancer: "marcus",
        status: "submitted",
        bidAmount: 90,
        estimatedDuration: "1_3_months",
        coverLetter:
          "Launches are where disciplined testing pays off. I'd set up a clean campaign structure with a dedicated testing budget, rotate 3–4 creative concepts per week, and move winners into scaling campaigns. You'd get a Monday report with spend, return, and what's next. Happy to walk through a recent outdoor apparel launch on a call.",
        daysAgo: 9,
      },
      {
        freelancer: "owen",
        status: "declined",
        bidAmount: 95,
        estimatedDuration: "1_3_months",
        coverLetter:
          "While my focus is SEO, I've run paid social for several content brands and can pair launch ads with search-optimized landing pages so the campaign keeps paying off after the ads stop.",
        daysAgo: 9,
      },
    ],
  },
  {
    key: "podcast",
    client: "elena",
    title: "Edit and produce a 10-episode author interview podcast",
    description:
      "Quillstone Publishing is launching a podcast where our editors interview authors about their craft. We record remotely; each episode is about 45 minutes of raw audio.\n\nWe need editing, mixing, show notes, and publishing to our podcast host for a 10-episode first season.",
    category: "video",
    budgetType: "fixed",
    budgetMin: 1500,
    budgetMax: 2500,
    status: "open",
    skills: ["Audio Editing", "Podcast Production"],
    daysAgo: 4,
    proposals: [
      {
        freelancer: "chloe",
        status: "submitted",
        bidAmount: 1800,
        estimatedDuration: "1_3_months",
        coverLetter:
          "Author interviews are such a good format. I'd create a consistent intro and outro, level the remote recordings so every guest sounds present, and write show notes with timestamps and book links. I can turn episodes around within 3 business days.",
        daysAgo: 3,
      },
    ],
  },
  {
    key: "mobile",
    client: "jordan",
    title: "React Native app for patient appointment reminders",
    description:
      "We want a simple mobile app that lets patients see upcoming appointments, get reminders, and confirm or reschedule. It will connect to our existing scheduling API.\n\nMust meet accessibility guidelines and support English and Spanish. We will handle App Store and Play Store accounts.",
    category: "development",
    budgetType: "fixed",
    budgetMin: 12000,
    budgetMax: 18000,
    status: "open",
    skills: ["React Native", "TypeScript", "Accessibility", "iOS"],
    daysAgo: 12,
    proposals: [
      {
        freelancer: "alex",
        status: "shortlisted",
        bidAmount: 15500,
        estimatedDuration: "1_3_months",
        coverLetter:
          "Accessibility is where I'd put the most care here — large text support, screen reader labels, and clear confirmation states matter a lot for patients. I've built React Native apps with localization from day one, and I'd plan the reminder logic around your API's existing appointment states.",
        daysAgo: 11,
      },
      {
        freelancer: "diego",
        status: "submitted",
        bidAmount: 14000,
        estimatedDuration: "1_3_months",
        coverLetter:
          "I've shipped four React Native apps with push reminders and offline caching. For this one I'd prototype the reschedule flow first and test it with a few patients before building everything out.",
        daysAgo: 10,
      },
    ],
  },
  {
    key: "bookkeeping",
    client: "sam",
    title: "Monthly bookkeeping in QuickBooks Online",
    description:
      "Our bakery needs ongoing monthly bookkeeping: categorizing transactions, reconciling two bank accounts and one credit card, and a short monthly summary. About 300 transactions a month.",
    category: "finance",
    budgetType: "hourly",
    budgetMin: 35,
    budgetMax: 55,
    status: "open",
    skills: ["Bookkeeping", "QuickBooks"],
    daysAgo: 14,
    proposals: [],
  },
  {
    key: "va",
    client: "priya",
    title: "Part-time virtual assistant for trip operations",
    description:
      "We need a detail-oriented assistant for about 15 hours a week to confirm bookings with local partners, keep our trip calendar updated, and answer routine traveler emails. Overlap with India Standard Time mornings is required.",
    category: "admin",
    budgetType: "hourly",
    budgetMin: 18,
    budgetMax: 30,
    status: "open",
    skills: ["Calendar Management", "Customer Support", "Data Entry"],
    daysAgo: 5,
    proposals: [
      {
        freelancer: "zoe",
        status: "submitted",
        bidAmount: 28,
        estimatedDuration: "over_3_months",
        coverLetter:
          "I currently support a travel startup with bookings and customer email, and I'm available during IST mornings. I'd set up a shared tracker so you can see every booking's status at a glance.",
        daysAgo: 4,
      },
    ],
  },
  {
    key: "api",
    client: "elena",
    title: "Build a REST API for our manuscript submission portal",
    description:
      "We accept manuscript submissions by email and it's chaos. We'd like a small Node.js API and simple web form so authors can submit manuscripts, and our editors can track each submission's status.\n\nPostgreSQL preferred. We have an in-house developer who will maintain it after launch, so documentation and tests are important.",
    category: "development",
    budgetType: "fixed",
    budgetMin: 4000,
    budgetMax: 7000,
    status: "open",
    skills: ["Node.js", "PostgreSQL", "TypeScript"],
    daysAgo: 2,
    proposals: [
      {
        freelancer: "alex",
        status: "submitted",
        bidAmount: 5200,
        estimatedDuration: "2_4_weeks",
        coverLetter:
          "This is right in my wheelhouse. I'd build the API with TypeScript and PostgreSQL, include an OpenAPI spec and integration tests, and pair with your in-house developer during the last week so the handover is smooth.",
        daysAgo: 1,
      },
    ],
  },
  {
    key: "seo-audit",
    client: "priya",
    title: "Technical SEO audit before our site relaunch",
    description:
      "Before we launch our new site we'd like a technical SEO audit of the staging site and a redirect plan from our old URLs. Deliverable is a prioritized list of issues our developer can work through.",
    category: "marketing",
    budgetType: "fixed",
    budgetMin: 800,
    budgetMax: 1500,
    status: "in_progress",
    skills: ["SEO", "Site Audits"],
    daysAgo: 30,
    proposals: [
      {
        freelancer: "owen",
        status: "accepted",
        bidAmount: 1200,
        estimatedDuration: "1_2_weeks",
        coverLetter:
          "Pre-launch is the best time for an audit. I'd crawl staging and production side by side, map every indexed URL to its new home, and flag anything that would cost you rankings. You'd get a spreadsheet your developer can work from directly.",
        daysAgo: 29,
      },
      {
        freelancer: "hannah",
        status: "declined",
        bidAmount: 1400,
        estimatedDuration: "2_4_weeks",
        coverLetter:
          "I'd pair a technical review with a content audit so your new pages launch with copy that ranks and converts.",
        daysAgo: 28,
      },
    ],
  },
  {
    key: "inventory",
    client: "maya",
    title: "Connect our inventory system to the online store",
    description:
      "Stock levels in our warehouse system and our online store drift apart, which leads to overselling. We need a small integration that syncs inventory every 15 minutes and alerts us when a sync fails.",
    category: "development",
    budgetType: "fixed",
    budgetMin: 2500,
    budgetMax: 4000,
    status: "in_progress",
    skills: ["Node.js", "TypeScript", "E-commerce"],
    daysAgo: 40,
    proposals: [
      {
        freelancer: "alex",
        status: "accepted",
        bidAmount: 3200,
        estimatedDuration: "2_4_weeks",
        coverLetter:
          "I built a very similar sync for a regional distributor. I'd make the job idempotent so retries are safe, log every run, and send alerts to your team's email when a sync fails twice in a row.",
        daysAgo: 38,
      },
      {
        freelancer: "rafael",
        status: "declined",
        bidAmount: 2800,
        estimatedDuration: "2_4_weeks",
        coverLetter:
          "I've connected several Shopify stores to warehouse systems and can have a first version running within two weeks.",
        daysAgo: 37,
      },
    ],
  },
  {
    key: "explainer",
    client: "jordan",
    title: "90-second animated explainer video",
    description:
      "We need a short animated video explaining how our remote monitoring program works for patients. Script is written; we need storyboard, animation, and voice-over coordination.",
    category: "video",
    budgetType: "fixed",
    budgetMin: 3000,
    budgetMax: 5000,
    status: "completed",
    skills: ["Motion Graphics", "After Effects"],
    daysAgo: 75,
    proposals: [
      {
        freelancer: "grace",
        status: "accepted",
        bidAmount: 4200,
        estimatedDuration: "2_4_weeks",
        coverLetter:
          "I'd storyboard the script first so we agree on every scene before animation starts, and keep the style calm and reassuring for patients.",
        daysAgo: 72,
      },
    ],
  },
  {
    key: "translation",
    client: "priya",
    title: "Translate trip guides from English to Arabic",
    description:
      "We'd like to translate three trip guides (about 6,000 words total) into Arabic for a partner agency in the Gulf. We've paused this while we finalize the partnership.",
    category: "writing",
    budgetType: "fixed",
    budgetMin: 600,
    budgetMax: 900,
    status: "closed",
    skills: ["Translation", "Arabic"],
    daysAgo: 50,
    proposals: [
      {
        freelancer: "lina",
        status: "submitted",
        bidAmount: 750,
        estimatedDuration: "1_2_weeks",
        coverLetter:
          "I've translated travel content for two agencies in the region and can adapt the guides so they read naturally for Gulf travelers.",
        daysAgo: 48,
      },
    ],
  },
  {
    key: "design-system",
    client: "elena",
    title: "Design a reading app onboarding flow",
    description:
      "We're building a companion reading app for our book club members. We need a designer to create the onboarding flow (5–7 screens) in Figma, including a light design system we can extend.",
    category: "design",
    budgetType: "hourly",
    budgetMin: 70,
    budgetMax: 110,
    status: "open",
    skills: ["Figma", "UI/UX Design", "Design Systems"],
    daysAgo: 7,
    proposals: [
      {
        freelancer: "amara",
        status: "submitted",
        bidAmount: 95,
        estimatedDuration: "2_4_weeks",
        coverLetter:
          "Onboarding is where reading apps win or lose people. I'd start with a quick round of interviews with book club members, then prototype and test the flow before polishing visuals.",
        daysAgo: 6,
      },
    ],
  },
];
