import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stitchRoot = path.join(
  root,
  "stitch-export",
  "swadakta-final-ux-coverage-20260612",
  "stitch_swadakta_corridor_concierge",
);

async function readStitchPage(folder) {
  return readFile(path.join(stitchRoot, folder, "code.html"), "utf8");
}

function injectBeforeHeadClose(html, content) {
  return html.replace("</head>", `${content}\n</head>`);
}

function injectBeforeBodyClose(html, content) {
  return html.replace("</body>", `${content}\n</body>`);
}

function commonHead({ title, description, canonical, ogImage = "https://swadakta.com/assets/saas-burst.png" }) {
  return `
<!-- Swadakta production metadata layered onto the direct Google Stitch export. -->
<meta name="description" content="${description}" />
<meta name="theme-color" content="#101A3A" />
<link rel="canonical" href="${canonical}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${ogImage}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${ogImage}" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/favicon.svg" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="application-name" content="Swadakta" />`.trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function linkButtonByLabel(html, label, href, ariaLabel = label) {
  const pattern = new RegExp(
    `<button([^>]*)>(\\s*${escapeRegExp(label)}(?:\\s*<span[\\s\\S]*?<\\/span>)?\\s*)<\\/button>`,
    "g",
  );
  return html.replace(pattern, `<a$1 href="${href}" aria-label="${ariaLabel}">$2</a>`);
}

function ensureTrailingNewline(html) {
  return html.endsWith("\n") ? html : `${html}\n`;
}

function routeStitchHome(html) {
  let output = html;

  output = output.replace(
    "<title>Swadakta | Your Ethical Guide to Global Corridors</title>",
    "<title>Swadakta | Ethical Global Corridor Concierge</title>",
  );
  output = output.replaceAll('"letterSpacing": "-0.02em"', '"letterSpacing": "0"');
  output = output.replaceAll('"letterSpacing": "-0.01em"', '"letterSpacing": "0"');
  output = output.replaceAll("px-margin-desktop", "px-margin-mobile md:px-margin-desktop");
  output = output.replace(
    "relative min-h-[921px] flex items-center px-margin-mobile md:px-margin-desktop overflow-hidden",
    "relative min-h-[calc(100vh-80px)] flex items-center px-margin-mobile md:px-margin-desktop py-12 md:py-16 overflow-hidden",
  );
  output = output.replace(
    'class="font-headline-xl text-headline-xl text-primary-container mb-md leading-tight"',
    'class="swadakta-hero-title font-headline-xl text-headline-xl text-primary-container mb-md leading-tight"',
  );
  output = output.replace(
    'class="font-body-lg text-body-lg text-secondary mb-xl max-w-xl"',
    'class="swadakta-hero-copy font-body-lg text-body-lg text-secondary mb-xl max-w-xl"',
  );
  output = output.replace(
    "Post tasks for verified receivers across Africa and global corridors. We bridge the gap with transparency, safety, and cultural precision.",
    "Post trusted tasks across Africa and abroad. Receivers handle proof and updates.",
  );
  output = output.replace(
    "</style>",
    `        * {
            box-sizing: border-box;
        }
        html,
        body {
            max-width: 100%;
            overflow-x: hidden;
        }
        main,
        section,
        .max-w-3xl {
            min-width: 0;
        }
        .swadakta-hero-copy {
            max-width: 100%;
            overflow-wrap: break-word;
        }
        @media (max-width: 767px) {
            .swadakta-hero-title,
            .swadakta-hero-copy {
                width: min(342px, calc(100vw - 32px)) !important;
                max-width: 342px !important;
            }
            .swadakta-hero-title {
                overflow-wrap: break-word;
                font-size: 2.35rem !important;
                line-height: 1.12 !important;
            }
            .swadakta-hero-copy {
                font-size: 0.94rem !important;
                line-height: 1.55 !important;
            }
            .swadakta-mobile-bottom-nav {
                left: 0 !important;
                right: 0 !important;
                width: min(100vw, 390px) !important;
                max-width: 390px !important;
                display: grid !important;
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }
        }
    </style>`,
  );

  output = injectBeforeHeadClose(
    output,
    commonHead({
      title: "Swadakta | Ethical Global Corridor Concierge",
      description:
        "Swadakta helps people get trusted jobs done across Africa and global corridors with verified receivers, milestone proof, payment clarity, and optional AI assistance.",
      canonical: "https://swadakta.com/",
    }),
  );

  const replacements = new Map([
    ['href="#">Home', 'href="/">Home'],
    ['href="#">Marketplace', 'href="login.html?next=%2Fportal.html%23jobs-board">Marketplace'],
    ['href="#">Concierge', 'href="brief.html">Concierge'],
    ['href="#">Verification', 'href="verification.html">Verification'],
    ['href="#">Analytics', 'href="trust.html">Trust'],
    ['href="#">Privacy Policy', 'href="privacy.html">Privacy Policy'],
    ['href="#">Terms of Service', 'href="terms.html">Terms of Service'],
    ['href="#">Job Room', 'href="messages.html">Job Room'],
    ['href="#">Track request', 'href="tracking.html">Track request'],
    ['href="#">Help Center', 'href="mailto:swadakta111@gmail.com">Help Center'],
    ['href="#">Contact Us', 'href="mailto:swadakta111@gmail.com">Contact Us'],
  ]);
  for (const [from, to] of replacements) {
    output = output.split(from).join(to);
  }

  output = output.replace(
    '<button class="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-container transition-colors">account_circle</button>',
    '<a class="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-container transition-colors" href="login.html" aria-label="Open account">account_circle</a>',
  );
  output = output.replace(
    '<button class="md:hidden material-symbols-outlined text-primary">menu</button>',
    "",
  );

  output = output.replace(
    `<button class="px-lg py-md bg-primary-container text-on-primary rounded-lg font-bold inner-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-sm">
                        Get a job done
                        <span class="material-symbols-outlined">arrow_forward</span>
</button>`,
    `<a class="px-lg py-md bg-primary-container text-on-primary rounded-lg font-bold inner-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-sm" href="brief.html">
                        Get a job done
                        <span class="material-symbols-outlined">arrow_forward</span>
</a>`,
  );

  output = output.replace(
    `<button class="px-lg py-md bg-secondary-container border border-outline-variant text-on-secondary-container rounded-lg font-bold hover:bg-surface-container-high transition-colors">
                        Find work
                    </button>`,
    `<a class="px-lg py-md bg-secondary-container border border-outline-variant text-on-secondary-container rounded-lg font-bold hover:bg-surface-container-high transition-colors" href="login.html?next=%2Fportal.html%23jobs-board">
                        Find work
                    </a>`,
  );

  output = output.replace(
    `<button class="px-xl py-lg bg-primary-container text-on-primary rounded-xl font-bold shadow-lg hover:shadow-primary-container/20 hover:-translate-y-1 transition-all">
                        Get Started Now
                    </button>`,
    `<a class="px-xl py-lg bg-primary-container text-on-primary rounded-xl font-bold shadow-lg hover:shadow-primary-container/20 hover:-translate-y-1 transition-all" href="login.html">
                        Get Started Now
                    </a>`,
  );
  output = linkButtonByLabel(output, "Get a job done", "brief.html", "Post a job");
  output = linkButtonByLabel(output, "Apply for work", "login.html?next=%2Fportal.html%23jobs-board", "Apply for work");
  output = linkButtonByLabel(
    output,
    "Explore Marketplace",
    "login.html?next=%2Fportal.html%23jobs-board",
    "Explore marketplace",
  );
  output = linkButtonByLabel(output, "Browse Jobs", "login.html?next=%2Fportal.html%23jobs-board", "Browse jobs");
  output = output.replace("Upgrade Account", "Set up both modes");
  output = linkButtonByLabel(
    output,
    "Set up both modes",
    "login.html?next=%2Fportal.html%23receiver-profile-setup",
    "Set up both modes",
  );
  output = linkButtonByLabel(output, "Create account", "login.html", "Create account");
  output = linkButtonByLabel(output, "Get Started Now", "login.html", "Get started");
  output = output.replace(
    `<button class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
<span class="material-symbols-outlined">public</span>
</button>`,
    `<a class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors" href="https://wa.me/61431455174" aria-label="Open WhatsApp">
<span class="material-symbols-outlined">public</span>
</a>`,
  );
  output = output.replace(
    `<button class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
<span class="material-symbols-outlined">share</span>
</button>`,
    `<a class="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors" href="mailto:swadakta111@gmail.com" aria-label="Email Swadakta">
<span class="material-symbols-outlined">share</span>
</a>`,
  );

  output = output.replace(
    "Funds are held in secure escrow and released only when milestones are digitally verified by both parties.",
    "Funds move through provider-confirmed payment rails, with milestone release only after proof and user approval are recorded.",
  );
  output = output.replace(
    "Secure payout once the task is verified by both parties.",
    "Milestone payout is prepared after proof and user approval are recorded.",
  );
  output = output.replace(
    "The premium marketplace for global concierge services. Hire verified agents or monetize your international expertise.",
    "A trusted marketplace for global concierge services. Get help from verified receivers or earn from local expertise.",
  );
  output = output.replace(
    "Funds held under milestone rules and ID-verified partners. We bridge the gap with transparency and safety.",
    "Payments move through provider-confirmed rails and ID-verified partners. We bridge the gap with transparency and safety.",
  );
  output = output
    .replaceAll("\u00c2\u00a9", "&copy;")
    .replaceAll("\u00e2\u2020\u2019", "->")
    .replaceAll("\u00e2\u20ac\u00a2", "-")
    .replaceAll("\u2192", "to");
  output = output.replaceAll('href="#"', 'href="/"');
  output = output.replace(
    `<a class="flex flex-col items-center justify-center text-on-surface-variant" href="/">
<span class="material-symbols-outlined">work_outline</span>
<span class="font-label-sm text-[10px]">Job Room</span>
</a>`,
    `<a class="flex flex-col items-center justify-center text-on-surface-variant" href="messages.html">
<span class="material-symbols-outlined">work_outline</span>
<span class="font-label-sm text-[10px]">Job Room</span>
</a>`,
  );
  output = output.replace(
    `<a class="flex flex-col items-center justify-center text-on-surface-variant" href="/">
<span class="material-symbols-outlined">smart_toy</span>
<span class="font-label-sm text-[10px]">AI</span>
</a>`,
    `<a class="flex flex-col items-center justify-center text-on-surface-variant" href="assistant.html">
<span class="material-symbols-outlined">smart_toy</span>
<span class="font-label-sm text-[10px]">AI</span>
</a>`,
  );
  output = output.replace(
    `<a class="flex flex-col items-center justify-center text-on-surface-variant" href="/">
<span class="material-symbols-outlined">person</span>
<span class="font-label-sm text-[10px]">Profile</span>
</a>`,
    "",
  );

  output = output.replace(
    `document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });`,
    `document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            });
        });`,
  );

  output = output.replace(
    '<nav class="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface/80 backdrop-blur-xl border-t border-white/20 shadow-lg rounded-t-xl">',
    '<nav class="swadakta-mobile-bottom-nav md:hidden fixed bottom-0 left-0 w-full z-50 grid grid-cols-3 items-center px-4 py-2 bg-surface/80 backdrop-blur-xl border-t border-white/20 shadow-lg rounded-t-xl">',
  );

  output = injectBeforeBodyClose(output, '<script src="assistant-dock.js?v=14"></script>');
  output = output.replace(
    "<body ",
    '<body data-stitch-source="swadakta_home_final_ux_refined" data-stitch-integration="public-links" ',
  );
  return output;
}

function routeStitchLogin(html) {
  let output = html;

  output = output.replace("<title>Login | Swadakta</title>", "<title>Swadakta | Sign in</title>");
  output = output.replaceAll('"letterSpacing": "-0.02em"', '"letterSpacing": "0"');
  output = output.replaceAll('"letterSpacing": "-0.01em"', '"letterSpacing": "0"');
  output = output.replaceAll("px-margin-desktop", "px-margin-mobile md:px-margin-desktop");
  output = output
    .replace("\u00a9 2024 Swadakta.", "&copy; 2026 Swadakta.")
    .replace("\u00c2\u00a9 2024 Swadakta.", "&copy; 2026 Swadakta.");

  output = output.replace(
    "</style>",
    `        * {
            box-sizing: border-box;
        }
        html,
        body {
            max-width: 100%;
            overflow-x: hidden;
        }
        [hidden] {
            display: none !important;
        }
        main,
        #swadakta-login-form,
        .swadakta-login-card,
        .swadakta-login-card .grid,
        .swadakta-login-card input {
            min-width: 0;
        }
        .swadakta-login-card {
            box-sizing: border-box;
            width: min(100%, 480px) !important;
            max-width: min(480px, calc(100vw - 32px)) !important;
            overflow: hidden;
        }
        @media (max-width: 767px) {
            main {
                padding-top: 2rem !important;
                padding-bottom: 2rem !important;
            }
            .swadakta-login-card {
                width: min(358px, calc(100vw - 32px)) !important;
                max-width: 358px !important;
                border-radius: 1.5rem !important;
                padding: 1.25rem !important;
            }
            .swadakta-login-card h1 {
                font-size: 1.9rem !important;
                line-height: 1.18 !important;
            }
            .swadakta-login-card .grid-cols-3 {
                gap: 0.5rem !important;
            }
            .account-tile-radio + label {
                padding: 0.75rem 0.35rem !important;
            }
            #login-mode-signin,
            #login-mode-create {
                min-width: 0;
                padding-inline: 0.25rem;
                font-size: 0.82rem;
            }
        }
    </style>`,
  );

  output = injectBeforeHeadClose(
    output,
    `${commonHead({
      title: "Swadakta | Sign in",
      description:
        "Sign in to Swadakta with one account for giving jobs, finding work, tracking proof, verification, payments, and AI assistance.",
      canonical: "https://swadakta.com/login",
    })}
<meta name="robots" content="noindex,nofollow" />`,
  );

  output = output.replace(
    '<div class="w-full max-w-[480px] glass-panel p-8 md:p-12 rounded-[2rem] animate-in fade-in slide-in-from-bottom-4 duration-700">',
    '<div class="swadakta-login-card glass-panel p-8 md:p-12 rounded-[2rem] animate-in fade-in slide-in-from-bottom-4 duration-700">',
  );
  output = output.replace(
    '<form class="space-y-8" onsubmit="event.preventDefault();">',
    '<form class="space-y-7" id="swadakta-login-form">',
  );
  output = output.replace('for="email">Work Email', 'for="login-email">Email');
  output = output.replace(
    'id="email" name="email" placeholder="name@company.com" required="" type="email"',
    'id="login-email" name="email" placeholder="you@example.com" required="" type="email" autocomplete="email"',
  );

  output = output.replace(
    "<!-- Account Type Selector (Tiles) -->",
    `<!-- Password Input Group -->
<div class="space-y-2">
<label class="font-label-md text-label-md text-on-surface-variant ml-1" for="login-password">Password</label>
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
<input class="w-full h-14 pl-12 pr-4 rounded-xl sunken-input font-body-md text-on-surface" id="login-password" name="password" placeholder="At least 8 characters" required="" minlength="8" type="password" autocomplete="current-password"/>
</div>
</div>
<!-- Account Type Selector (Tiles) -->`,
  );

  output = output.replace(
    "<!-- Trust Message -->",
    `<div class="grid grid-cols-2 gap-2 rounded-full bg-white/70 border border-outline-variant/30 p-1">
<button class="h-11 rounded-full bg-primary text-on-primary font-label-md text-label-md" id="login-mode-signin" type="button">Sign in</button>
<button class="h-11 rounded-full text-on-surface-variant font-label-md text-label-md" id="login-mode-create" type="button">Create account</button>
</div>
<div class="space-y-2" data-login-create-only hidden>
<label class="font-label-md text-label-md text-on-surface-variant ml-1" for="login-phone">Mobile / WhatsApp backup</label>
<div class="relative">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">phone_iphone</span>
<input class="w-full h-14 pl-12 pr-4 rounded-xl sunken-input font-body-md text-on-surface" id="login-phone" name="phone" placeholder="+61 431 455 174" type="tel" autocomplete="tel"/>
</div>
</div>
<!-- Trust Message -->`,
  );

  output = output.replace(
    `<button class="w-full h-14 bg-primary text-on-primary rounded-full font-headline-sm flex items-center justify-center gap-2 shadow-[0px_20px_40px_rgba(16,26,58,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group" type="submit">
                    Continue
                    <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>`,
    `<p class="font-label-md text-label-md text-on-surface-variant min-h-6" id="login-status" role="status"></p>
<button class="w-full h-14 bg-primary text-on-primary rounded-full font-headline-sm flex items-center justify-center gap-2 shadow-[0px_20px_40px_rgba(16,26,58,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group" id="login-submit" type="submit">
                    Sign in
                    <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
<div class="grid gap-3 sm:grid-cols-2">
<button class="h-12 glass-panel rounded-full font-label-md text-on-surface-variant" id="login-google" type="button">Continue with Google</button>
<button class="h-12 glass-panel rounded-full font-label-md text-on-surface-variant" id="login-reset" type="button">Reset password</button>
</div>`,
  );

  output = output.replace(
    `Don't have an account? <a class="text-primary font-semibold hover:underline decoration-2 underline-offset-4" href="/">Get Started</a>`,
    `New here? <button class="text-primary font-semibold hover:underline decoration-2 underline-offset-4" id="login-create-inline" type="button">Create your account</button>`,
  );
  output = output.replace(
    `Don't have an account? <a class="text-primary font-semibold hover:underline decoration-2 underline-offset-4" href="#">Get Started</a>`,
    `New here? <button class="text-primary font-semibold hover:underline decoration-2 underline-offset-4" id="login-create-inline" type="button">Create your account</button>`,
  );
  output = output.replaceAll('href="#">Privacy Policy', 'href="privacy.html">Privacy Policy');
  output = output.replaceAll('href="#">Terms of Service', 'href="terms.html">Terms of Service');
  output = output.replaceAll('href="#">Help Center', 'href="mailto:swadakta111@gmail.com">Help Center');
  output = output.replaceAll('href="#"', 'href="/"');

  output = output.replace(
    /<!-- Micro-interaction Script -->[\s\S]*?<\/script>\s*<\/body>/,
    `<script src="app-config.js?v=4"></script>
<script src="app-data.js?v=52"></script>
<script src="login.js?v=1"></script>
<script src="assistant-dock.js?v=14"></script>
</body>`,
  );
  output = output.replace(
    "<body ",
    '<body data-stitch-source="sign_in_swadakta_1" data-stitch-integration="auth" ',
  );
  return output;
}

function routeStitchWelcomeLogin(html) {
  let output = html;

  output = output.replace("<title>Swadakta | Secure Access</title>", "<title>Swadakta | Sign in</title>");
  output = output.replaceAll('"letterSpacing": "-0.02em"', '"letterSpacing": "0"');
  output = output.replaceAll('"letterSpacing": "-0.01em"', '"letterSpacing": "0"');
  output = injectBeforeHeadClose(
    output,
    `${commonHead({
      title: "Swadakta | Sign in",
      description:
        "Sign in to Swadakta with one account for giving jobs, finding work, tracking proof, verification, payments, and AI assistance.",
      canonical: "https://swadakta.com/login",
    })}
<meta name="robots" content="noindex,nofollow" />`,
  );

  output = output.replace(
    "<body ",
    '<body data-stitch-source="welcome_swadakta_final_ux" data-stitch-integration="auth" ',
  );
  output = output.replace('id="auth-form"', 'id="swadakta-login-form"');
  output = output.replace('for="email"', 'for="login-email"');
  output = output.replace(
    /id="email"([^>]*?)type="email"/,
    'id="login-email" name="email" autocomplete="email" required$1type="email"',
  );
  output = output.replace('for="password"', 'for="login-password"');
  output = output.replace(
    /id="password"([^>]*?)type="password"/,
    'id="login-password" name="password" autocomplete="current-password" required minlength="8"$1type="password"',
  );
  output = output.replace('for="phone"', 'for="login-phone"');
  output = output.replace(
    /id="phone"([^>]*?)type="tel"/,
    'id="login-phone" name="phone" autocomplete="tel"$1type="tel"',
  );
  output = output.replaceAll('name="role"', 'name="account_type"');
  output = output.replace(
    `id="toggle-signin" onclick="setMode('signin')"`,
    'id="login-mode-signin" type="button"',
  );
  output = output.replace(
    `id="toggle-signup" onclick="setMode('signup')"`,
    'id="login-mode-create" type="button"',
  );
  output = output.replace(
    '<div class="hidden space-y-lg animate-in fade-in slide-in-from-top-4 duration-500" id="signup-fields">',
    '<div data-login-create-only hidden class="space-y-lg animate-in fade-in slide-in-from-top-4 duration-500" id="signup-fields">',
  );
  output = output.replace(
    '<button class="w-full h-14 bg-primary-container text-white rounded-lg font-headline-md text-label-md inner-glow hover:bg-primary-container/90 active:scale-[0.98] transition-all-300 shadow-lg" id="submit-btn" type="submit">',
    '<p class="text-label-sm font-label-sm text-on-surface-variant min-h-6" id="login-status" role="status"></p>\n<button class="w-full h-14 bg-primary-container text-white rounded-lg font-headline-md text-label-md inner-glow hover:bg-primary-container/90 active:scale-[0.98] transition-all-300 shadow-lg" id="login-submit" type="submit">',
  );
  output = output.replace(
    '<button class="w-full h-12 flex items-center justify-center gap-md bg-white border border-secondary-container rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface transition-all-300 active:scale-[0.98]" type="button">',
    '<button class="w-full h-12 flex items-center justify-center gap-md bg-white border border-secondary-container rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface transition-all-300 active:scale-[0.98]" id="login-google" type="button">',
  );
  output = output.replace(
    `</button>
</div>
</form>`,
    `</button>
<button class="w-full h-12 flex items-center justify-center gap-md bg-surface-container-lowest border border-secondary-container rounded-lg text-label-md font-label-md text-on-surface hover:bg-surface transition-all-300 active:scale-[0.98]" id="login-reset" type="button">Reset password</button>
<p class="text-center text-label-sm font-label-sm text-on-surface-variant">New here? <button class="text-primary-container font-semibold underline underline-offset-4 decoration-primary-container/30" id="login-create-inline" type="button">Create your account</button></p>
</div>
</form>`,
  );
  output = output.replaceAll('href="#">Terms of Service', 'href="terms.html">Terms of Service');
  output = output.replaceAll('href="#">Privacy Policy', 'href="privacy.html">Privacy Policy');
  output = output.replace(
    /<script>\s*function setMode\(mode\)[\s\S]*?<\/script>\s*<\/body>/,
    `<script src="app-config.js?v=4"></script>
<script src="app-data.js?v=52"></script>
<script src="login.js?v=2"></script>
<script src="assistant-dock.js?v=14"></script>
</body>`,
  );

  return output;
}

async function main() {
  const home = routeStitchHome(await readStitchPage("swadakta_home_final_ux_refined"));
  const login = routeStitchWelcomeLogin(await readStitchPage("welcome_swadakta_final_ux"));
  await writeFile(path.join(root, "index.html"), ensureTrailingNewline(home), "utf8");
  await writeFile(path.join(root, "login.html"), ensureTrailingNewline(login), "utf8");
  console.log("Applied direct Stitch exports to index.html and login.html");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
