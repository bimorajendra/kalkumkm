import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PaywallSheet } from '../features/license/components/paywall-sheet';
import { hasProLicense } from '../features/license/limits';
import { QuoteBuilder } from '../features/quote/components/quote-builder';

export default function PenawaranRoute() {
  const [isPro, setIsPro] = useState<boolean>();
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    void hasProLicense()
      .then((licensed) => {
        if (active) setIsPro(licensed);
      })
      .catch(() => {
        if (active) setIsPro(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isPro === undefined)
    return (
      <main className="page">
        <output aria-live="polite">Memeriksa Takaran Pro…</output>
      </main>
    );
  if (!isPro)
    return (
      <main className="page">
        <section className="empty-state">
          <h1>Penawaran pesanan custom</h1>
          <p>Fitur ini tersedia dengan Takaran Pro.</p>
          <PaywallSheet open trigger="quote" onClose={() => navigate('/')} />
        </section>
      </main>
    );
  return <QuoteBuilder />;
}
