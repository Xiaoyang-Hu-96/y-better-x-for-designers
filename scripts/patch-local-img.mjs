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

  // Design Inspiration — extra stable previews
  "https://variant.com/community": "https://variant.com/favicon-light.svg",

  // UI — Uiverse (Microlink meta image CDN)
  "https://uiverse.io/":
    "https://imagedelivery.net/KMb5EadhEKC1gAE0LkjL1g/c802e23e-4d13-44ef-a2fe-46c467571900/public",

  // Portfolio Inspiration — bulk og / Framer assets
  "https://www.sujankhadgi.com/": "https://sujankhadgi.com/og-thumbnail.png?v=2",
  "https://ryo.lu/": "https://ryo.lu/favicon.png",
  "https://www.liandongzhou.com/":
    "https://framerusercontent.com/assets/1oBQ5S4DCK6DJMORWSN5fPqkF4.png",
  "https://www.serenali.ca/":
    "https://cdn.prod.website-files.com/6375aba502e4024e31970c83/672fdcf3187e27cc9ce6e276_cursor.png",
  "https://www.uttkarsh.design/":
    "https://framerusercontent.com/images/kxfGGTI5f87PMBIBJp1XxPIvcXg.png",
  "https://www.thibaut.cool/":
    "https://framerusercontent.com/assets/DdeqJSa9nKbflQimrk8W7BYFDI.png",
  "https://www.marco.fyi/":
    "https://cdn.prod.website-files.com/62c89bdb7c26b515f632de67/6317913448d0943c95005700_twitter-og-img.png",
  "https://gautams.framer.website/":
    "https://framerusercontent.com/images/vHoDDWp9wNuWLuPgXODg04rR5A.png",
  "https://angeloarcilla.com/":
    "https://framerusercontent.com/assets/HQ8DEI4shJtfWZsmiVfPkWxVu1c.png",
  "https://oguzyagiz.com/": "https://oguzyagiz.com/images/og/home.png",
  "https://alric.framer.website/":
    "https://framerusercontent.com/assets/9FErA1R9lb9J925PipAsR4qgM.png",
  "https://emmi.framer.website/":
    "https://framerusercontent.com/images/xN1cpVhyjSWIOT24GLCRkOnc.png",
  "https://jasonspielman.com/notebooklm":
    "https://jasonspielman.com/_assets/v11/95d7732b121da16788e666fc6792a8e2f3da8e46.png",
  "https://jackiehu.design/":
    "https://framerusercontent.com/images/EymWq1q7hfKo4pdk9jYG5M6MaQ.png",
  "https://pham.codes/": "https://pham.codes/images/hero.png",
  "https://tomthings.fr/": "https://tomthings.fr/og_image.png",
  "https://adasilv2.framer.website/":
    "https://framerusercontent.com/images/eaHuiaQdZxmPWNWbtk5oNo09Bo.png",
  "https://syedadam.com/":
    "https://framerusercontent.com/assets/rhHhcGXtZvFQjfZ1i58RasbZxY.png",
  "https://www.kingermayank.com/":
    "https://framerusercontent.com/assets/0xeePXTdA5ElbitK7I8z3eh4Alk.jpeg",
  "https://jackiezhang.co.za/":
    "https://framerusercontent.com/images/rD6rBlswWHwt3kseTKnf98TFUQ8.png",
  "https://www.lfs.gd/":
    "https://framerusercontent.com/assets/Z1McKxeqGJSTgOVqfAYx7FLPNM.png",
  "https://tantannguyen.com/":
    "https://framerusercontent.com/images/hIxUFf1Drx1QBJGms9IVkz6NV4.png?width=1440&height=1446",
  "https://www.tsui-mou.com/":
    "https://framerusercontent.com/assets/e1z91gDNtuxqFIgGCkLChhPFOSY.png",
  "https://www.uxdayshankar.com/":
    "https://framerusercontent.com/images/FFEtDBBuU1BQhX97vDhxCPKhU.png?scale-down-to=512&width=1200&height=485",
  "https://www.seungmee-lee.com/": "https://seungmee-lee.com/og.jpg",
  "https://xiaoyanghu.com/":
    "https://framerusercontent.com/assets/BNcmSNoDz85vmhw2XVGHSg9p6A.jpg",

  // Portfolio Platforms
  "https://www.bestfolios.com/home": "https://bestfolios.com/images/logo.svg",
  "https://www.linkedin.com/in/anetakmiecik/":
    "https://media.licdn.com/dms/image/v2/D4D03AQE5tYZJa3l4Pw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1730206240101?e=2147483647&v=beta&t=eYYa5on_2umxRyW8bzu5S-w8uVguiaU1WRZRiTzokWY",
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
