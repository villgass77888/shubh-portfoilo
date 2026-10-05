import ThankYouScene from './outro/ThankYouScene';
import ContactScene from './outro/ContactScene';
import ByeScene from './outro/ByeScene';

/**
 * Outro Section — thank-you, contact footer, closing card.
 * Each scene is its own component under ./outro/.
 */
export default function Outro() {
  return (
    <section id="section-outro" style={{ position: 'relative', zIndex: 'var(--z-content)' as any }}>
      <ThankYouScene />
      <ContactScene />
      <ByeScene />
    </section>
  );
}
