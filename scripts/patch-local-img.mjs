/**
 * Adds stable og:image URLs as localImg for link cards (skips X accounts).
 * Run: node scripts/patch-local-img.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/** Map resource page URL -> preview image URL (og or CDN). */
const PREVIEW_BY_URL = {
  // Design Inspiration (full category — first section users hit after X)
  "https://www.designspells.com/": "https://designspells.com/og.png",
  "https://mobbin.com/": "https://mobbin.com/og_image.png?v=4.0",
  "https://www.landingfolio.com/": "https://landingfolio.com/_nuxt/img/main.68a8f7f.png",
  "https://www.awwwards.com/":
    "https://assets.awwwards.com/assets/images/pages/about-certificates/awwwards.jpg",
  "https://www.daytona-park.com/freakmag/":
    "https://daytona2020.sakura.ne.jp/freak/cms/wp-content/themes/freakmag/assets/images/common/ogp.png",
  "https://rauno.me/": "https://rauno.me/og4.png",
  "https://things.inc/":
    "https://cdn.prod.website-files.com/66ea3a5528a044beafcf913e/673414b93c1fd7b39424c945_home.webp",
  "https://www.interfacecraft.dev/": "https://interfacecraft.dev/images/og.png",
  "https://gsap.com/": "https://gsap.com/GSAP-share-image.png",
  "https://spline.design/":
    "https://spline.design/_next/static/media/spline_image_banner.77c2eb63.png",
  "https://www.unicorn.studio/": "https://www.unicorn.studio/images/ogg2.png",
  "https://neumorphism.io/#e0e0e0": "https://neumorphism.io/ogImage.png",

  // UI Component Libraries (entire category)
  "https://reactbits.dev/": "https://reactbits.dev/og-pic.png",
  "https://magicui.design/": "https://magicui.design/og",
  "https://ui.aceternity.com/components": "https://ui.aceternity.com/banner.png",
  "https://www.fancycomponents.dev/": "https://fancycomponents.dev/og.jpg",
  "https://www.neobrutalism.dev/": "https://www.neobrutalism.dev/preview.png",
  "https://neo-brutalism-ui-library.vercel.app/":
    "https://neo-brutalism-ui-library.vercel.app/neo-brutalism-ogp.jpg",
  "https://cssbuttons.io/":
    "https://imagedelivery.net/KMb5EadhEKC1gAE0LkjL1g/cb814b9d-45f8-46f5-3108-91e511990200/public",
  "https://freefrontend.com/": "https://freefrontend.com/logo.png",
  "https://www.ui-layouts.com/": "https://www.ui-layouts.com/og.jpg",
  "https://21st.dev/home": "https://21st.dev/opengraph-image.png?ef9fa01da2728a64",

  // Framer Resources
  "https://remixlab.framer.wiki/":
    "https://framerusercontent.com/images/UpHooSa4ddfhfbAzr5zJ5F9Tfc.jpg",
  "https://segmentui.com/":
    "https://framerusercontent.com/images/nyd0tjQO5GGX3cbjqNuScyoqI0.png",
  "https://framer.university/":
    "https://framerusercontent.com/images/6DJtJPu5YDuZV1hElqfn1Xp57wM.png",

  // Portfolio Inspiration — first screenful
  "https://alexyc.com/":
    "https://framerusercontent.com/images/EOgjo7wp0arnNacVFqh7XvHAsM.png",
  "https://www.yubozhao.com/":
    "https://framerusercontent.com/assets/RXIi2xDbbhuQBrfe931by8ePts.png",
  "https://elishajeon.com/":
    "https://framerusercontent.com/images/nDGzQB3AJeashyNovFwC4m3rU.png",
  "https://danielsun.space/?ref=pafolios":
    "https://framerusercontent.com/assets/vz2EiviE5cqupo3teGUSdFra0.png",
  "https://pixelwrld.co/":
    "https://framerusercontent.com/images/hv1gIJJoq4ZInJWUmOR4nhAQYRQ.png",
  "https://www.arshadriyas.com/":
    "https://framerusercontent.com/assets/AWvZMxGdLkQS9XGAoc9uKysEoA.png",

  // Portfolio Platforms
  "https://www.wallofportfolios.in/?company=All":
    "https://cdn.prod.website-files.com/65c14454c8e90beca1ee629a/67742e466cad467d16f6d301_wall%20of%20portfolios.png",
  "https://opendoorscareers.com/portfolios":
    "https://storage.googleapis.com/gpt-engineer-file-uploads/ALPFWLhZZdQKkJJcGN9TgBEfvwD2/social-images/social-1772205363048-open_graph.webp",
};

function patch(path) {
  const raw = readFileSync(path, "utf8");
  const data = JSON.parse(raw);
  let n = 0;
  for (const cat of data.categories ?? []) {
    for (const item of cat.items ?? []) {
      if (item.handle && item.bio) continue;
      const img = PREVIEW_BY_URL[item.url];
      if (img) {
        item.localImg = img;
        n++;
      }
    }
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  return n;
}

const paths = [
  join(root, "src/lib/data.json"),
  join(root, "public/data/data.json"),
];
for (const p of paths) {
  const count = patch(p);
  console.log(p, "→", count, "localImg set");
}
