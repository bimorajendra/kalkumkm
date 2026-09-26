import {
  Banner,
  Button,
  Chip,
  IsometricStack,
  NoteBox,
  ResultCard,
  SegmentedSlider,
  useTweenedNumber,
} from '@takaran/ui';
import { ThemeToggle } from '@takaran/ui/theme-toggle';
import { useState } from 'react';

const stops = [
  { value: 1, label: '1 bulan' },
  { value: 3, label: '3 bulan' },
  { value: 6, label: '6 bulan' },
  { value: 12, label: '12 bulan' },
];

export default function DevUi() {
  const [duration, setDuration] = useState(6);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tweenTarget, setTweenTarget] = useState(12500);
  const tweenedValue = useTweenedNumber(tweenTarget);

  return (
    <main className="ui-gallery">
      <header>
        <a className="brand" href="/">
          Takaran · Galeri UI
        </a>
        <ThemeToggle />
      </header>
      <h1>Komponen bersama</h1>
      <p>Galeri pengembangan untuk pemeriksaan komponen Takaran.</p>
      {bannerVisible ? (
        <Banner onDismiss={() => setBannerVisible(false)}>
          Perubahan tersimpan di perangkat ini.
        </Banner>
      ) : (
        <output>Pemberitahuan ditutup.</output>
      )}
      <section aria-labelledby="controls-title" className="ui-gallery__section">
        <h2 id="controls-title">Kontrol dan pemberitahuan</h2>
        <div className="ui-gallery__row">
          <Button>Hitung HPP</Button>
          <Button variant="secondary" navigates>
            Cek rincian
          </Button>
          <Button variant="card">Pilih resep</Button>
          <Button variant="link">Pelajari cara</Button>
          <Chip>Per porsi</Chip>
        </div>
        <NoteBox>Harga bahan dan resep tetap tersimpan di perangkat.</NoteBox>
        <SegmentedSlider
          allowCustom
          formatValueText={(value) => `${value} bulan`}
          label="Lama simpan"
          onChange={setDuration}
          stops={stops}
          value={duration}
        />
        <p aria-live="polite">Pilihan: {duration} bulan</p>
      </section>
      <section
        aria-labelledby="animation-title"
        className="ui-gallery__section"
      >
        <h2 id="animation-title">Perubahan angka</h2>
        <output aria-label="Nilai animasi">
          Rp {new Intl.NumberFormat('id-ID').format(tweenedValue)}
        </output>
        <Button
          onClick={() =>
            setTweenTarget((value) => (value === 12500 ? 15000 : 12500))
          }
          variant="secondary"
        >
          Ubah nilai
        </Button>
      </section>
      <section aria-labelledby="results-title" className="ui-gallery__section">
        <h2 id="results-title">Hasil</h2>
        <ResultCard
          actions={
            <Button variant="secondary" navigates>
              Lihat rincian
            </Button>
          }
          label="Harga jual yang disarankan"
          marginBp={4150}
          markupBp={7083}
          secondaryLabel="Untung per jam"
          secondaryValue={42500}
          tab={<Chip>Resep brownies</Chip>}
          value={12500000}
          visual={
            <IsometricStack
              layers={[
                { key: 'ingredients', label: 'Bahan', value: 3500 },
                { key: 'packaging', label: 'Kemasan', value: 1000 },
                { key: 'work', label: 'Tenaga', value: 1500 },
              ]}
              profit={2000}
            />
          }
        />
        <ResultCard
          compact
          label="Harga jual per porsi"
          marginBp={4150}
          onDetails={() => setDetailsOpen((open) => !open)}
          value={12500}
        />
        {detailsOpen ? <output>Rincian harga jual dibuka.</output> : null}
        <IsometricStack
          layers={[{ key: 'ingredients', label: 'Bahan', value: 4500 }]}
          profit={-1200}
        />
      </section>
    </main>
  );
}
