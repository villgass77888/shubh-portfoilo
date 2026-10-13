import ContactScene from '../components/sections/outro/ContactScene';
import type { PageMeta } from '../content/seo';
import { services } from '../content/services';
import { inPlace, site } from '../content/site';
import { Head, Sec } from './Pages';
import Shell from './Shell';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function ContactPage({ meta }: { meta: PageMeta }) {
  const socials = Object.entries(site.socials).filter(([, url]) => url);
  return (
    <article>
      <Head
        kicker="CONTACT"
        title="Contact"
        sub={cap(meta.keyword ?? '')}
        lead={`To hire ${site.name}, a freelance graphic designer ${inPlace()}, send a short brief by email or phone and get a quote for branding, a website, social media, packaging or streetwear design.`}
      />
      <Sec id="reach" title="Reach me">
        <dl className="pg-dl">
          <dt>EMAIL</dt>
          <dd>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </dd>
          <dt>PHONE</dt>
          <dd>
            <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>
          </dd>
          {socials.map(([name, url]) => (
            <div key={name} style={{ display: 'contents' }}>
              <dt>{name.toUpperCase()}</dt>
              <dd>
                <a href={url} rel="me noopener" target="_blank">
                  {url.replace(/^https?:\/\//, '')}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </Sec>
      <Sec id="brief" title="What to send">
        <p>A few lines are enough to start: what your business does, what you need designed, and when you need it. You get back a scope, a timeline and a quote before any work begins.</p>
        <ul className="pg-chips">
          {services.map((s) => (
            <li key={s.slug}>
              <a href={`/services/${s.slug}`}>{s.heading}</a>
            </li>
          ))}
        </ul>
      </Sec>
      <div className="pg-bleed">
        <ContactScene />
      </div>
    </article>
  );
}

/** /contact: the facts first, then the outro's own contact scene */
export default function ContactView({ meta }: { meta: PageMeta }) {
  return (
    <Shell meta={meta}>
      <ContactPage meta={meta} />
    </Shell>
  );
}
