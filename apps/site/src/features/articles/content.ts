export type Article = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  author?: { name: string; url?: string };
  image?: { src: string; alt: string; width: number; height: number };
  category: string;
  publishedAt: string;
  updatedAt: string;
  introduction: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  example?: {
    title: string;
    lines: string[];
    result: string;
    note: string;
  };
  references?: Array<{ label: string; href: string }>;
  calculator: { href: string; label: string };
  related: string[];
};

export const articles: Article[] = [
  {
    slug: 'cara-menghitung-hpp-makanan',
    title: 'Cara menghitung HPP makanan per porsi',
    description:
      'Pelajari cara menjumlahkan bahan, biaya produksi, hasil satu adonan, dan kemasan untuk mendapat HPP per porsi.',
    excerpt:
      'HPP per porsi berasal dari total biaya satu adonan dibagi hasilnya, lalu ditambah biaya kemasan per porsi.',
    category: 'Dasar usaha makanan',
    publishedAt: '2026-09-29',
    updatedAt: '2026-09-29',
    introduction:
      'HPP makanan per porsi adalah biaya produksi untuk menghasilkan satu porsi. Cara sederhananya, bagi total biaya satu adonan dengan jumlah porsinya, lalu tambahkan kemasan per porsi.',
    sections: [
      {
        heading: 'Catat biaya satu adonan',
        paragraphs: [
          'Hitung bahan berdasarkan jumlah yang benar-benar masuk ke resep. Jika harga tepung Rp14.000 per kilogram, harga per gramnya Rp14. Untuk 150 gram tepung, biaya yang masuk ke adonan adalah Rp2.100.',
          'Tambahkan biaya yang memang dipakai untuk membuat adonan, seperti gas atau listrik dan tenaga kerja bila kamu memasukkannya. Jangan mencampurkan biaya pribadi atau biaya yang tidak terkait produksi ke dalam resep.',
        ],
      },
      {
        heading: 'Bagi biaya adonan dengan hasilnya',
        paragraphs: [
          'Setelah seluruh biaya satu adonan dijumlahkan, bagi total itu dengan jumlah porsi yang benar-benar dihasilkan. Tambahkan biaya kemasan untuk setiap porsi setelah pembagian.',
        ],
        bullets: [
          'Biaya bahan dan produksi per porsi = total biaya satu adonan ÷ jumlah porsi.',
          'HPP per porsi = biaya bahan dan produksi per porsi + kemasan per porsi.',
        ],
      },
      {
        heading: 'Periksa satuan sebelum memakai hasil',
        paragraphs: [
          'Pastikan satuan resep sejalan dengan satuan harga beli. Harga satu kilogram perlu diubah menjadi harga per gram sebelum dikalikan dengan takaran gram. Untuk bahan yang dijual per butir, hitung sesuai jumlah butir yang digunakan.',
          'Biaya tetap dan biaya yang berubah mengikuti jumlah produksi berguna untuk analisis yang berbeda. Untuk menghitung titik impas, U.S. Small Business Administration menjelaskan pemisahan biaya tetap dan biaya variabel sebagai bagian dari perhitungannya.',
        ],
      },
    ],
    example: {
      title: 'Contoh brownies satu loyang',
      lines: [
        'Total bahan dan energi: Rp30.800',
        'Hasil: 16 potong',
        'Kemasan: Rp1.000 per potong',
      ],
      result: 'HPP per potong: Rp2.925',
      note: 'Rp30.800 ÷ 16 = Rp1.925, lalu ditambah kemasan Rp1.000.',
    },
    references: [
      {
        label: 'U.S. Small Business Administration, menghitung titik impas',
        href: 'https://legacy.sba.gov/business-guide/plan-your-business/calculate-your-startup-costs/break-even-point/calculate',
      },
    ],
    calculator: { href: '/kalkulator-hpp', label: 'Buka kalkulator HPP' },
    related: ['cara-menentukan-harga-jual-makanan', 'beda-margin-dan-markup'],
  },
  {
    slug: 'cara-menentukan-harga-jual-makanan',
    title: 'Cara menentukan harga jual makanan dari HPP',
    description:
      'Gunakan HPP dan target margin untuk menyusun harga jual. Lihat contoh hitung dan hal yang perlu diperiksa sebelum menetapkan harga.',
    excerpt:
      'Harga saran dari target margin dihitung dari HPP dibagi satu dikurangi margin, lalu margin aktual diperiksa kembali.',
    category: 'Harga jual',
    publishedAt: '2026-09-29',
    updatedAt: '2026-09-29',
    introduction:
      'Harga jual perlu menutup HPP dan menyisakan margin sesuai targetmu. Cara menghitungnya berbeda dari menambahkan persentase markup langsung ke modal.',
    sections: [
      {
        heading: 'Gunakan margin sebagai bagian dari harga jual',
        paragraphs: [
          'Jika target margin dinyatakan sebagai persentase dari harga jual, rumus dasarnya adalah HPP dibagi satu dikurangi target margin. Bila ada komisi penjualan, komisi ikut mengurangi bagian harga yang tersisa untuk menutup HPP.',
          'Rumus ini menghasilkan angka awal. Setelah itu, pertimbangkan pembulatan harga dan pastikan margin aktual dihitung kembali dari harga yang benar-benar akan dipakai.',
        ],
        bullets: [
          'Tanpa komisi: harga saran = HPP ÷ (1 − target margin).',
          'Dengan komisi: harga saran = HPP ÷ (1 − target margin − komisi).',
        ],
      },
      {
        heading: 'Masukkan biaya yang relevan',
        paragraphs: [
          'Sebelum menetapkan harga, cek bahwa HPP sudah memasukkan biaya bahan, hasil per adonan, biaya energi atau tenaga yang kamu catat, dan kemasan. Jika menjual lewat saluran yang mengambil komisi, hitung harga untuk saluran itu secara terpisah.',
          'Harga saran bukan jaminan produk akan laku atau usaha akan untung. Hasilnya bergantung pada biaya yang kamu masukkan, harga yang dibayar pembeli, dan potongan pada saluran penjualan.',
        ],
      },
    ],
    example: {
      title: 'Contoh harga brownies',
      lines: [
        'HPP: Rp2.925 per potong',
        'Target margin: 40%',
        'Pembulatan: ke atas ke Rp500',
      ],
      result: 'Harga saran: Rp5.000 per potong',
      note: 'Rp2.925 ÷ (1 − 40%) = Rp4.875 sebelum pembulatan.',
    },
    calculator: { href: '/harga-jual', label: 'Buka kalkulator harga jual' },
    related: ['cara-menghitung-hpp-makanan', 'beda-margin-dan-markup'],
  },
  {
    slug: 'beda-margin-dan-markup',
    title: 'Beda margin dan markup saat menentukan harga',
    description:
      'Margin dihitung dari harga jual, sedangkan markup dihitung dari HPP. Kenali perbedaannya lewat rumus dan contoh sederhana.',
    excerpt:
      'Margin memakai harga jual sebagai pembagi, sedangkan markup memakai HPP. Persentase yang sama menghasilkan harga berbeda.',
    category: 'Harga jual',
    publishedAt: '2026-09-29',
    updatedAt: '2026-09-29',
    introduction:
      'Margin dan markup sama-sama membandingkan harga jual dengan biaya, tetapi memakai pembagi yang berbeda. Karena itu, angka persentasenya tidak bisa saling menggantikan.',
    sections: [
      {
        heading: 'Margin memakai harga jual sebagai pembagi',
        paragraphs: [
          'Margin menunjukkan bagian dari harga jual yang tersisa setelah HPP dikurangi. Rumusnya adalah (harga jual − HPP) ÷ harga jual.',
        ],
      },
      {
        heading: 'Markup memakai HPP sebagai pembagi',
        paragraphs: [
          'Markup menunjukkan tambahan harga dibandingkan modal. Rumusnya adalah (harga jual − HPP) ÷ HPP. Jika biaya saluran penjualan berlaku, hitung margin setelah potongan tersebut agar hasil mencerminkan uang yang tersisa.',
        ],
      },
      {
        heading: 'Jangan menyamakan persentasenya',
        paragraphs: [
          'Contoh: HPP Rp3.000 dan harga jual Rp4.200 memberi selisih Rp1.200. Markup-nya 40% dari HPP, sedangkan margin-nya sekitar 28,6% dari harga jual.',
          'Saat menetapkan target harga, tentukan dulu apakah persentase yang kamu maksud adalah margin atau markup. Jika targetmu margin, jangan sekadar menambahkan persentase yang sama ke HPP.',
        ],
      },
    ],
    example: {
      title: 'Contoh perbandingan',
      lines: ['HPP: Rp3.000', 'Harga jual: Rp4.200', 'Selisih: Rp1.200'],
      result: 'Markup 40%, margin sekitar 28,6%',
      note: 'Markup: Rp1.200 ÷ Rp3.000. Margin: Rp1.200 ÷ Rp4.200.',
    },
    calculator: { href: '/margin', label: 'Buka kalkulator margin' },
    related: [
      'cara-menghitung-hpp-makanan',
      'cara-menentukan-harga-jual-makanan',
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
