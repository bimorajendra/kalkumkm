export type PublicCalculatorMode = 'hpp' | 'margin' | 'bep' | 'price' | 'ojol';

export interface CalculatorExample {
  description: string;
  values: Record<string, string>;
}

export const calculatorLinks = [
  { mode: 'hpp', href: '/kalkulator-hpp', label: 'Hitung HPP per porsi' },
  { mode: 'price', href: '/harga-jual', label: 'Tentukan harga jual' },
  { mode: 'margin', href: '/margin', label: 'Bandingkan margin dan markup' },
  {
    mode: 'ojol',
    href: '/harga-ojol',
    label: 'Hitung harga setelah komisi ojol',
  },
  { mode: 'bep', href: '/bep', label: 'Hitung jumlah jual untuk impas' },
] as const;

export const calculatorExamples: Record<
  PublicCalculatorMode,
  CalculatorExample
> = {
  hpp: {
    description:
      'Satu loyang brownies memakai bahan Rp 27.800, energi Rp 3.000, menghasilkan 16 potong, dan kemasan Rp 1.000 per potong. Angka ini ilustrasi, bukan harga pasar.',
    values: {
      material: '27800',
      production: '3000',
      yield: '16',
      packaging: '1000',
    },
  },
  margin: {
    description:
      'Ilustrasi brownies dengan HPP Rp 2.925 dan harga jual Rp 5.000 tanpa komisi. Bandingkan persentase untung terhadap harga jual dengan persentase terhadap modal.',
    values: { hpp: '2925', price: '5000', commission: '0' },
  },
  price: {
    description:
      'Ilustrasi HPP brownies Rp 2.925 dengan target margin 40% dan pembulatan Rp 500. Margin dihitung dari harga jual, bukan tambahan persentase di atas modal.',
    values: { hpp: '2925', margin: '40', rounding: '500' },
  },
  ojol: {
    description:
      'Ilustrasi HPP Rp 2.925, target margin 40%, dan komisi 20%. Ganti komisi sesuai kontrakmu. Angka 20% bukan tarif resmi platform tertentu.',
    values: { hpp: '2925', margin: '40', commission: '20', rounding: '500' },
  },
  bep: {
    description:
      'Ilustrasi biaya tetap Rp 100.000, biaya variabel Rp 3.000 per unit, harga jual Rp 5.000, dan komisi 10%. Gunakan biaya tetap dan target penjualan dari periode yang sama.',
    values: { fixed: '100000', hpp: '3000', price: '5000', commission: '10' },
  },
};

export const calculatorNotes: Record<PublicCalculatorMode, string> = {
  hpp: 'Masukkan biaya bahan yang benar-benar dipakai, bukan seluruh struk belanja. Jumlah porsi adalah hasil yang layak dijual. Biaya gas dan tenaga masuk per adonan; kemasan masuk per porsi.',
  margin:
    'Margin memakai harga jual sebagai pembagi. Markup memakai HPP sebagai pembagi dan di sini ditampilkan sebelum komisi. Komisi mengurangi keuntungan yang kamu terima. Nilai negatif berarti rugi.',
  price:
    'Target margin 40% berbeda dari markup 40%. Harga saran dibulatkan ke atas sesuai kelipatan yang kamu pilih. Pastikan HPP sudah mencakup kemasan, energi, dan tenaga jika dibayar.',
  ojol: 'Kalkulator ini hanya memperhitungkan komisi persentase. Biaya tetap per pesanan, pajak, subsidi ongkir, dan promo bertingkat perlu diperiksa terpisah. Target margin ditambah komisi harus kurang dari 100%.',
  bep: 'Biaya variabel bertambah saat kamu membuat satu unit lagi. Biaya tetap tetap ada dalam periode yang dipilih. Hindari memasukkan biaya tetap dua kali ke HPP dan kolom biaya tetap. Jika harga setelah komisi belum menutup biaya variabel, menambah penjualan belum membuat usaha impas.',
};
