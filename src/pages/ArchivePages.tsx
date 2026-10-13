import { archive, imagesOf } from '../data/archive';
import type { ArchiveImage, Brochure, BrochurePage } from '../data/archive';
import { archiveContent } from '../content/archive';
import { altFor } from '../content/seo';
import type { PageMeta } from '../content/seo';
import { site } from '../content/site';
import Shell, { ContactCta, Pic } from './Shell';
import type { Img } from './media';

const TYPE_LABEL: Record<string, string> = { post: 'post', story: 'story', 'reel-cover': 'reel cover', banner: 'banner' };
const img = (a: ArchiveImage, alt: string): Img => ({ src: a.src, srcset: a.srcset, w: a.w, h: a.h, alt });
const page = (p: BrochurePage, alt: string): Img => ({ src: p.src, w: p.w, h: p.h, alt });
const coverOf = (b: Brochure) => b.cover ?? b.gatefold?.cover.src ?? b.pages[0]?.src ?? '';
const SIZES = '(max-width: 700px) 46vw, 22vw';

function Head({ kicker, title, sub, lead }: { kicker: string; title: string; sub: string; lead: string }) {
  return (
    <header>
      <p className="pg-kicker">{kicker}</p>
      <h1 className="pg-h1">
        {title}
        <span className="pg-h1-sub">{sub}</span>
      </h1>
      <p className="pg-lead">{lead}</p>
    </header>
  );
}

function Index() {
  return (
    <article>
      <Head
        kicker={`${archive.totalCreatives}+ CREATIVES`}
        title="Creatives Archive"
        sub="Social media creatives archive"
        lead={`This archive holds more social media creatives by ${site.name}: ${archive.totalCreatives} posts, stories and carousels for ${archive.brands.length} brands, plus flyers, emailers and brochures.`}
      />
      <section className="pg-sec" aria-labelledby="brands" data-rv>
        <h2 id="brands" className="pg-h2">
          Brands
        </h2>
        <ul className="pg-cards">
          {archive.brands.map((b) => {
            const first = b.items[0] && imagesOf(b.items[0])[0];
            return (
              <li key={b.slug}>
                <a className="pg-card" href={`/work/archive/${b.slug}`} data-cursor="OPEN">
                  {first && <Pic img={img(first, altFor('Social media creative', b.name, 'social media design'))} className="pg-card-img" sizes="(max-width: 700px) 92vw, 30vw" />}
                  <span className="pg-card-body">
                    <span className="pg-card-meta">{b.count} CREATIVES</span>
                    <span className="pg-card-name">{b.name}</span>
                    <span className="pg-card-line">{b.about.split('. ')[0]}.</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="pg-sec" aria-labelledby="print" data-rv>
        <h2 id="print" className="pg-h2">
          Print and email
        </h2>
        <ol className="pg-steps">
          {[
            ['FLYERS & BILLBOARDS', '/work/archive/flyers', archiveContent.flyers.intro],
            ['EMAILERS', '/work/archive/emailers', archiveContent.emailers.intro],
            ['BROCHURES', '/work/archive/brochures', archiveContent.brochures.intro],
          ].map(([label, href, text]) => (
            <li key={href}>
              <div>
                <b>
                  <a href={href}>{label} →</a>
                </b>
                <span>{text}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <ContactCta />
    </article>
  );
}

function BrandPage({ meta }: { meta: PageMeta }) {
  const b = archive.brands.find((x) => x.slug === meta.slug)!;
  const i = archive.brands.indexOf(b);
  const next = archive.brands[(i + 1) % archive.brands.length];
  const all = b.items.flatMap((item) => imagesOf(item));
  return (
    <article>
      <Head kicker={`${b.count} CREATIVES`} title={b.name} sub={`${b.name} social media creatives`} lead={b.about} />
      <ul className="pg-media pg-grid pg-grid--wide">
        {all.map((a, n) => (
          <li key={a.src}>
            <Pic img={img(a, altFor(`Social media ${TYPE_LABEL[a.type] ?? 'post'} ${n + 1}`, b.name, 'social media design'))} eager={n < 4} sizes={SIZES} />
          </li>
        ))}
      </ul>
      <a className="pg-next" href={`/work/archive/${next.slug}`} data-cursor="NEXT">
        <small>NEXT BRAND</small>
        <strong>{next.name}</strong>
      </a>
      <ContactCta line="Need a feed like this?" />
    </article>
  );
}

function Flyers() {
  return (
    <article>
      <Head
        kicker={`${archive.flyers.length} PIECES`}
        title="Flyers & Billboards"
        sub="Flyer design portfolio"
        lead={`This is the flyer design portfolio of ${site.name}: large-format flyers and billboards for events, real estate and product launches.`}
      />
      <ul className="pg-media pg-grid pg-grid--2">
        {archive.flyers.map((f, n) => (
          <li key={f.src}>
            <figure className="pg-fig">
              <Pic img={img(f, altFor(`${f.title} ${f.type === 'banner' ? 'billboard' : 'flyer'}`, f.title, 'flyer design'))} eager={n < 2} />
              <figcaption className="pg-cap">{f.title}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <ContactCta />
    </article>
  );
}

function Emailers() {
  return (
    <article>
      <Head
        kicker={`${archive.emailers.length} EMAILERS`}
        title="Emailers"
        sub="Emailer design portfolio"
        lead={`This is the emailer design portfolio of ${site.name}: long-form email and newsletter layouts for hospitality and travel brands.`}
      />
      {archive.emailers.map((e, n) => (
        <section key={e.slug} className="pg-sec" aria-labelledby={`e${n}`} data-rv={n ? '' : undefined}>
          <h2 id={`e${n}`} className="pg-h2">
            {e.from}
          </h2>
          <figure className="pg-fig pg-long">
            <Pic img={img(e.image, altFor(`Emailer “${e.subject}”`, e.from, 'emailer design'))} eager={n === 0} sizes="(max-width: 800px) 92vw, 720px" />
            <figcaption className="pg-cap">Subject: {e.subject}</figcaption>
          </figure>
        </section>
      ))}
      <ContactCta />
    </article>
  );
}

function Brochures() {
  return (
    <article>
      <Head
        kicker={`${archive.brochures.length} BROCHURES`}
        title="Brochures"
        sub="Brochure design portfolio"
        lead={`This is the brochure design portfolio of ${site.name}: company brochures, pitch decks, a gatefold and brand guidelines, each one open to read page by page.`}
      />
      <ul className="pg-media pg-cards">
        {archive.brochures.map((b) => (
          <li key={b.slug}>
            <a className="pg-card" href={`/work/archive/brochures/${b.slug}`} data-cursor="READ">
              <img className="pg-card-img" src={coverOf(b)} alt={altFor('Brochure cover', b.name, 'brochure design')} loading="lazy" decoding="async" />
              <span className="pg-card-body">
                <span className="pg-card-meta">
                  {b.pageCount} {b.kind === 'gatefold' ? 'PANELS' : 'PAGES'}
                </span>
                <span className="pg-card-name">{b.name}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <ContactCta />
    </article>
  );
}

function BrochurePageView({ meta }: { meta: PageMeta }) {
  const b = archive.brochures.find((x) => x.slug === meta.slug)!;
  const sheets: BrochurePage[] = b.gatefold ? [b.gatefold.cover, ...b.gatefold.gates, ...b.gatefold.inside, b.gatefold.back] : b.pages;
  return (
    <article>
      <Head
        kicker={`${b.pageCount} ${b.kind === 'gatefold' ? 'PANELS' : 'PAGES'}`}
        title={b.name}
        sub="Brochure design"
        lead={`${b.name} is a ${b.kind === 'gatefold' ? 'gatefold brochure' : 'brochure'} designed by ${site.name}, shown here ${b.kind === 'gatefold' ? 'panel by panel' : 'page by page'}.`}
      />
      <ul className="pg-media pg-grid">
        {sheets.map((p, n) => (
          <li key={p.src}>
            <Pic img={page(p, altFor(`Brochure ${b.kind === 'gatefold' ? 'panel' : 'page'} ${n + 1}`, b.name, 'brochure design'))} eager={n < 3} />
          </li>
        ))}
      </ul>
      <a className="pg-next" href="/work/archive/brochures" data-cursor="BACK">
        <small>BACK TO THE SHELF</small>
        <strong>Brochures</strong>
      </a>
    </article>
  );
}

export default function ArchiveView({ meta }: { meta: PageMeta }) {
  const view = () => {
    switch (meta.kind) {
      case 'archive-brand':
        return <BrandPage meta={meta} />;
      case 'flyers':
        return <Flyers />;
      case 'emailers':
        return <Emailers />;
      case 'brochures':
        return <Brochures />;
      case 'brochure':
        return <BrochurePageView meta={meta} />;
      default:
        return <Index />;
    }
  };
  return <Shell meta={meta}>{view()}</Shell>;
}

/** Key images of an archive page, for the image sitemap */
export const archiveImages = (meta: PageMeta): string[] => {
  if (meta.kind === 'archive-brand') return (archive.brands.find((b) => b.slug === meta.slug)?.items ?? []).slice(0, 10).map((it) => imagesOf(it)[0].src);
  if (meta.kind === 'flyers') return archive.flyers.map((f) => f.src);
  if (meta.kind === 'emailers') return archive.emailers.map((e) => e.image.src);
  if (meta.kind === 'brochures') return archive.brochures.map(coverOf).filter(Boolean);
  return [];
};
