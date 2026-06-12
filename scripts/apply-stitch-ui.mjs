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
    ['href="#">Marketplace', 'href="portal.html#jobs-board">Marketplace'],
    ['href="#">Concierge', 'href="brief.html">Concierge'],
    ['href="#">Verification', 'href="verification.html">Verification'],
    ['href="#">Analytics', 'href="trust.html">Trust'],
    ['href="#">Privacy Policy', 'href="privacy.html">Privacy Policy'],
    ['href="#">Terms of Service', 'href="terms.html">Terms of Service'],
    ['href="#">Job Room', 'href="messages.html">Job Room'],
  ]);
  for (const [from, to] of replacements) {
    output = output.split(from).join(to);
  }

  output = output.replace(
    '<button class="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-container transition-colors">account_circle</button>',
    '<a class="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-container transition-colors" href="portal.html" aria-label="Open account">account_circle</a>',
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
    `<a class="px-lg py-md bg-secondary-container border border-outline-variant text-on-secondary-container rounded-lg font-bold hover:bg-surface-container-high transition-colors" href="portal.html#jobs-board">
                        Find work
                    </a>`,
  );

  output = output.replace(
    `<button class="px-xl py-lg bg-primary-container text-on-primary rounded-xl font-bold shadow-lg hover:shadow-primary-container/20 hover:-translate-y-1 transition-all">
                        Get Started Now
                    </button>`,
    `<a class="px-xl py-lg bg-primary-container text-on-primary rounded-xl font-bold shadow-lg hover:shadow-primary-container/20 hover:-translate-y-1 transition-all" href="portal.html">
                        Get Started Now
                    </a>`,
  );

  output = output.replace(
    "Funds are held in secure escrow and released only when milestones are digitally verified by both parties.",
    "Funds move through provider-confirmed payment rails, with milestone release only after proof and user approval are recorded.",
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

  output = injectBeforeBodyClose(output, '<script src="assistant-dock.js?v=11"></script>');
  output = output.replace(
    "<body ",
    '<body data-stitch-source="swadakta_home_final_ux_coverage" ',
  );
  return output;
}

async function main() {
  const home = routeStitchHome(await readStitchPage("swadakta_home_final_ux_coverage"));
  await writeFile(path.join(root, "index.html"), home, "utf8");
  console.log("Applied direct Stitch home export to index.html");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
