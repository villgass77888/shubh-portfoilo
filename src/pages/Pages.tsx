import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { caseBySlug, caseStudies } from '../content/caseStudies';
import type { CaseStudy, WorkType } from '../content/caseStudies';
import { altFor } from '../content/seo';
import type { PageMeta } from '../content/seo';
import { about, serviceBySlug, services } from '../content/services';
import { inPlace, site } from '../content/site';
import { allPackProjects } from '../data/packaging';
import { streetwear } from '../data/streetwear';
import { archiveContent } from '../content/archive';
import Shell, { ContactCta, Pic } from './Shell';
import { caseMedia, sized } from './media';
import type { CaseMedia } from './media';

const SERVICE_OF: Record<WorkType, string> = {
  Branding: 'brand-identity-design',
  Web: 'website-design-development',
  Social: 'social-media-design',
  Packaging: 'packaging-design',
  Streetwear: 'streetwear-design',
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pct = (n: number) => `${(n * 100).toFixed(4)}%`;

export function Head({ kicker, title, sub, lead }: { kicker: string; title: string; sub?: string; lead: string }) {
  return (
    <header>
      <p className="pg-kicker">{kicker}</p>
      <h1 className="pg-h1">
        {title}
        {sub && <span className="pg-h1-sub">{sub}</span>}
      </h1>
      <p className="pg-lead">{lead}</p>
    </header>
  );
}

export function Sec({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="pg-sec" aria-labelledby={id} data-rv>
      <h2 id={id} className="pg-h2">
        {title}
      </h2>
      <div className="pg-body">{children}</div>
    </section>
  );
}

function CaseCards({ slugs }: { slugs: string[] }) {
  return (
    <ul className="pg-cards">
      {slugs.map((slug) => {
        const c = caseBySlug(slug);
        if (!c) return null;
        const m = caseMedia(c);
        return (
          <li key={slug} data-types={c.types.join(' ')}>
            <a className="pg-card" href={`/work/${slug}`} data-cursor="CASE STUDY">
              <Pic img={m.thumb} className={`pg-card-img${m.thumb === m.tees[0]?.image || (!m.board.length && !m.web && !m.packImages.length && !m.social.length) ? ' pg-card-img--contain' : ''}`} sizes="(max-width: 700px) 92vw, 30vw" />
              <span className="pg-card-body">
                <span className="pg-card-meta">{c.types.join(' ✦ ')}</span>
                <span className="pg-card-name">{c.name}</span>
                <span className="pg-card-line">{cap(c.summary)}.</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Case study ── */

/** The client's home-page work, laid out still: board, site recording, posts, packs, tees, logo */
function CaseHero({ c, m }: { c: CaseStudy; m: CaseMedia }) {
  return (
    <>
      {m.brand && (
        <figure className="pg-media pg-fig" data-rv>
          <div className="pg-stage" style={{ background: m.brand.stage }}>
            <div className="pg-board" style={{ aspectRatio: String(m.brand.aspect) }}>
              {m.brand.frames.map((f, i) => (
                <img
                  key={f.src}
                  src={f.src}
                  srcSet={f.srcset}
                  sizes={f.srcset ? `${(f.w * 90).toFixed(1)}vw` : undefined}
                  width={m.board[i].w}
                  height={m.board[i].h}
                  alt={m.board[i].alt}
                  loading={i < 4 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{ left: pct(f.x), top: pct(f.y * m.brand!.aspect), width: pct(f.w), height: pct(f.h * m.brand!.aspect) }}
                />
              ))}
            </div>
          </div>
          <figcaption className="pg-cap">{c.name} brand board ✦ {m.brand.industry} ✦ {m.brand.year}</figcaption>
        </figure>
      )}
      {m.web && (
        <figure className="pg-media pg-fig" data-rv>
          <video className="pg-video" src={m.web.cardVideo} poster={m.web.poster} controls muted loop playsInline preload="none" aria-label={`${m.web.name} website walkthrough`} />
          <figcaption className="pg-cap">
            {m.web.name} website ✦ {m.web.tech.join(' ✦ ')}
          </figcaption>
        </figure>
      )}
      {m.packImages.length > 0 && (
        <div className="pg-media" data-rv>
          <ul className="pg-grid pg-grid--2">
            {m.packImages.map((img, i) => (
              <li key={img.src}>
                <figure className={`pg-fig${img.flat ? ' pg-fig--flat' : ''}${i === 0 && c.pack === 'croppd-honey' ? ' pg-fig--cut' : ''}`}>
                  <Pic img={img} eager={i === 0} />
                  <figcaption className="pg-cap">{img.label}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <p className="pg-cap">
            <a href={`/work/packaging/${c.pack}`}>Open the full {c.name} gallery →</a>
          </p>
        </div>
      )}
      {m.tees.length > 0 && (
        <ul className="pg-media pg-grid pg-grid--wide" data-rv>
          {m.tees.map(({ design, image }, i) => (
            <li key={design.id}>
              <a href={`/work/streetwear/${design.id}`} data-cursor="ARTWORK">
                <figure className="pg-fig pg-fig--cut">
                  <Pic img={image} eager={i < 4} sizes="(max-width: 700px) 46vw, 22vw" />
                  <figcaption className="pg-cap">
                    {design.name} ✦ {design.print}
                  </figcaption>
                </figure>
              </a>
            </li>
          ))}
        </ul>
      )}
      {m.social.length > 0 && (
        <ul className="pg-media pg-grid pg-grid--wide" data-rv>
          {m.social.map((img, i) => (
            <li key={img.src}>
              <Pic img={img} eager={i < 4 && !m.brand} sizes="(max-width: 700px) 46vw, 22vw" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CasePage({ meta }: { meta: PageMeta }) {
  const c = caseBySlug(meta.slug!)!;
  const m = caseMedia(c);
  const next = caseStudies[(caseStudies.indexOf(c) + 1) % caseStudies.length];
  const brochureName = c.brochure ? archiveContent.brochures.names[c.brochure] : undefined;
  return (
    <article>
      <Head kicker={`${c.types.join(' ✦ ')} ✦ CASE STUDY`} title={c.name} sub={cap(c.keyword)} lead={c.answer} />
      <CaseHero c={c} m={m} />
      <Sec id="brief" title="Brief">
        {c.brief.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Sec>
      <Sec id="approach" title="Approach">
        {c.approach.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </Sec>
      <Sec id="delivered" title="What was delivered">
        <ul className="pg-list">
          {c.delivered.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </Sec>
      <Sec id="tools" title="Tools">
        <ul className="pg-chips">
          {c.tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
      </Sec>
      {m.logo && (
        <Sec id="logo" title="Logo">
          <div className="pg-logo-tile" style={{ background: m.logo.hoverBg }}>
            <Pic img={sized(m.logo.src, altFor(`${cap(m.logo.tag.toLowerCase())} logo`, m.logo.name, 'logo design'))} />
          </div>
          <p className="pg-cap">
            {m.logo.tag}
            {m.logo.typeface ? ` ✦ ${m.logo.typeface}` : ''}
          </p>
        </Sec>
      )}
      <Sec id="more" title="Related">
        <ul className="pg-chips">
          {c.types.map((type) => (
            <li key={type}>
              <a href={`/services/${SERVICE_OF[type]}`}>{serviceBySlug(SERVICE_OF[type])!.heading}</a>
            </li>
          ))}
          {brochureName && (
            <li>
              <a href={`/work/archive/brochures/${c.brochure}`}>{brochureName} brochure</a>
            </li>
          )}
          {c.smm && (
            <li>
              <a href="/work/archive">More social media creatives</a>
            </li>
          )}
        </ul>
      </Sec>
      <a className="pg-next" href={`/work/${next.slug}`} data-cursor="NEXT" data-rv>
        <small>NEXT PROJECT</small>
        <strong>{next.name}</strong>
      </a>
      <ContactCta line={`Need ${/^[aeiou]/i.test(c.keyword) ? 'an' : 'a'} ${c.types[0] === 'Web' ? 'website' : c.types[0] === 'Social' ? 'social media system' : c.types[0] === 'Packaging' ? 'pack' : c.types[0] === 'Streetwear' ? 'tee graphic' : 'brand identity'} like this?`} />
    </article>
  );
}

/* ── Services ── */

function ServicePage({ meta }: { meta: PageMeta }) {
  const s = serviceBySlug(meta.slug!)!;
  return (
    <article>
      <Head kicker="SERVICE" title={s.heading} sub={cap(s.keyword)} lead={s.answer} />
      {s.body.map((block, i) => (
        <Sec key={block.h} id={`s${i}`} title={block.h}>
          {block.p.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Sec>
      ))}
      <Sec id="process" title="Process">
        <ol className="pg-steps">
          {s.process.map((step) => (
            <li key={step.label}>
              <div>
                <b>{step.label}</b>
                <span>{step.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </Sec>
      <Sec id="work" title="Selected work">
        <CaseCards slugs={s.cases} />
      </Sec>
      <Sec id="faq" title="Questions">
        <div className="pg-faq">
          {s.faq.map((f) => (
            <div key={f.q}>
              <h3 className="pg-h3">{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </Sec>
      <ContactCta line={`Start a ${s.label.toLowerCase()} project`} />
    </article>
  );
}

function ServicesHub() {
  return (
    <article>
      <Head
        kicker="SERVICES"
        title="Design Services"
        sub="Graphic design services in India"
        lead={`${site.name} offers five design services ${inPlace()}: brand identity, website design and development, social media creatives, packaging and streetwear graphics.`}
      />
      <Sec id="list" title="What I do">
        <ol className="pg-steps">
          {services.map((s) => (
            <li key={s.slug}>
              <div>
                <b>
                  <a href={`/services/${s.slug}`}>{s.heading.toUpperCase()} →</a>
                </b>
                <span>{s.answer}</span>
              </div>
            </li>
          ))}
        </ol>
      </Sec>
      <ContactCta />
    </article>
  );
}

/* ── About / contact / work ── */

function AboutPage() {
  return (
    <article>
      <Head kicker={`DESIGNER SINCE ${site.since}`} title={about.heading} sub={site.jobTitle} lead={about.answer} />
      <div className="pg-media" data-rv>
        <Pic img={sized(site.portrait, `Portrait of ${site.name}, graphic designer`)} className="pg-portrait" eager />
      </div>
      {about.body.map((block, i) => (
        <Sec key={block.h} id={`a${i}`} title={block.h}>
          {block.p.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Sec>
      ))}
      <Sec id="tools" title="Tools">
        <ul className="pg-chips">
          {site.tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
      </Sec>
      <Sec id="services" title="Services">
        <ul className="pg-chips">
          {services.map((s) => (
            <li key={s.slug}>
              <a href={`/services/${s.slug}`}>{s.heading}</a>
            </li>
          ))}
          <li>
            <a href="/work">All work</a>
          </li>
        </ul>
      </Sec>
      <ContactCta />
    </article>
  );
}

const FILTERS: Array<WorkType | 'All'> = ['All', 'Branding', 'Web', 'Social', 'Packaging', 'Streetwear'];

function WorkPage() {
  const [filter, setFilter] = useState<WorkType | 'All'>('All');
  const shown = caseStudies.filter((c) => filter === 'All' || c.types.includes(filter));
  return (
    <article>
      <Head
        kicker={`${caseStudies.length} CASE STUDIES`}
        title="Work"
        sub="Graphic design portfolio, India"
        lead={`This is the graphic design portfolio of ${site.name}, a designer in India: ${caseStudies.length} case studies across branding, web design, social media, packaging and streetwear.`}
      />
      <div className="pg-filter" role="group" aria-label="Filter by type of work">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} data-cursor="FILTER">
            {f}
          </button>
        ))}
      </div>
      <CaseCards slugs={shown.map((c) => c.slug)} />
      <Sec id="archive" title="More work">
        <p>
          Beyond these case studies, the <a href="/work/archive">creatives archive</a> holds further social media posts for six more brands, along with <a href="/work/archive/flyers">flyers</a>,{' '}
          <a href="/work/archive/emailers">emailers</a> and <a href="/work/archive/brochures">brochures</a>.
        </p>
      </Sec>
      <ContactCta />
    </article>
  );
}

/* ── Thin gallery pages (noindex): the packaging viewer and a single tee ── */

function PackagingPage({ meta }: { meta: PageMeta }) {
  const p = allPackProjects.find((x) => x.slug === meta.slug)!;
  const c = caseBySlug(p.slug);
  const images = c ? caseMedia(c).packImages : [];
  return (
    <article>
      <Head kicker={p.meta} title={p.name} sub="Packaging gallery" lead={p.line} />
      <ul className="pg-media pg-grid pg-grid--2">
        {images.map((img, i) => (
          <li key={img.src}>
            <figure className={`pg-fig${img.flat ? ' pg-fig--flat' : ''}`}>
              <Pic img={img} eager={i === 0} />
              <figcaption className="pg-cap">{img.label}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <Sec id="steps" title="How it came together">
        <ol className="pg-steps">
          {p.steps.map((step) => (
            <li key={step.label}>
              <div>
                <b>{step.label}</b>
                <span>{step.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </Sec>
      <a className="pg-next" href={`/work/${p.slug}`} data-cursor="CASE STUDY">
        <small>READ THE CASE STUDY</small>
        <strong>{p.name}</strong>
      </a>
    </article>
  );
}

function TeePage({ meta }: { meta: PageMeta }) {
  const d = streetwear.find((x) => x.id === meta.slug)!;
  const art = (['front', 'back', 'single'] as const).filter((k) => d.art[k]).map((k) => ({ key: k, src: d.art[k]! }));
  const sheet: CSSProperties = { background: d.artBg === 'black' ? '#0B0B0B' : '#FBFAF6', padding: '6%', borderRadius: 8 };
  return (
    <article>
      <Head
        kicker={`${d.print} ✦ ${(d.teeColor ?? 'white').toUpperCase()} TEE`}
        title={d.name}
        sub="Streetwear t-shirt graphic"
        lead={`${d.name} is a streetwear t-shirt graphic by ${site.name}: a ${d.print.toLowerCase()} for a ${d.teeColor ?? 'white'} tee.`}
      />
      <ul className="pg-media pg-grid pg-grid--2">
        <li>
          <figure className="pg-fig pg-fig--cut">
            <Pic img={sized(d.model, altFor(`${d.name} t-shirt on a model`, 'streetwear', 't-shirt graphic design'))} eager />
            <figcaption className="pg-cap">On model</figcaption>
          </figure>
        </li>
        {art.map((a) => (
          <li key={a.key}>
            <figure className="pg-fig pg-fig--cut">
              <div style={sheet}>
                <Pic img={sized(a.src, altFor(`${d.name} ${a.key === 'single' ? 'print' : `${a.key} print`} artwork`, 'streetwear', 't-shirt graphic design'))} />
              </div>
              <figcaption className="pg-cap">{a.key === 'single' ? 'Artwork' : `${a.key} print`}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <a className="pg-next" href="/work/streetwear" data-cursor="CASE STUDY">
        <small>ALL TEN DESIGNS</small>
        <strong>Streetwear</strong>
      </a>
    </article>
  );
}

function NotFoundPage() {
  return (
    <article>
      <Head kicker="404" title="Page not found" lead="This page does not exist, or it has moved. Try one of these instead." />
      <ul className="pg-chips" style={{ marginTop: '2rem' }}>
        {[
          ['Home', '/'],
          ['Work', '/work'],
          ['Services', '/services'],
          ['About', '/about'],
          ['Contact', '/contact'],
        ].map(([label, href]) => (
          <li key={href}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function PageView({ meta }: { meta: PageMeta }) {
  const view = () => {
    switch (meta.kind) {
      case 'case':
        return <CasePage meta={meta} />;
      case 'service':
        return <ServicePage meta={meta} />;
      case 'services':
        return <ServicesHub />;
      case 'about':
        return <AboutPage />;
      case 'work':
        return <WorkPage />;
      case 'packaging':
        return <PackagingPage meta={meta} />;
      case 'tee':
        return <TeePage meta={meta} />;
      default:
        return <NotFoundPage />;
    }
  };
  return <Shell meta={meta}>{view()}</Shell>;
}
