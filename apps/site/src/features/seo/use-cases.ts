export const useCases = [
  {
    slug: 'hpp-brownies',
    title: 'Cara menghitung HPP brownies per potong',
    description:
      'Hitung HPP brownies dari bahan, energi oven, hasil potong, dan kemasan untuk menetapkan harga jual.',
    intro:
      'HPP brownies per potong bergantung pada biaya bahan yang benar-benar dipakai, biaya produksi satu loyang, jumlah potongan yang layak dijual, dan kemasan setiap potong.',
    headings: [
      [
        'Catat biaya bahan satu loyang',
        'Kalikan takaran bahan dengan harga per gram, mililiter, atau butir. Jika cokelat yang dipakai 200 gram dari kemasan satu kilogram, masukkan biaya 200 gram ke resep.',
      ],
      [
        'Masukkan hasil yang bisa dijual',
        'Bagi total biaya loyang dengan jumlah potong yang benar-benar bisa dijual. Potongan tester atau bagian yang rusak jangan dihitung sebagai produk terjual.',
      ],
      [
        'Tambahkan kemasan dan tentukan harga',
        'Tambahkan biaya kemasan per potong setelah pembagian biaya loyang. Gunakan kalkulator harga jual untuk melihat harga berdasarkan target margin.',
      ],
    ],
  },
  {
    slug: 'hpp-katering',
    title: 'Cara menghitung HPP katering per porsi',
    description:
      'Susun HPP katering dengan memperhitungkan bahan, lauk, tenaga, kemasan, dan jumlah porsi yang diproduksi.',
    intro:
      'Untuk katering, jumlah porsi pesanan menjadi dasar perencanaan bahan dan biaya. Pisahkan biaya satu kali produksi dari biaya yang bertambah pada setiap kotak.',
    headings: [
      [
        'Hitung seluruh komponen menu',
        'Catat takaran bahan untuk nasi, lauk, sayur, pelengkap, dan saus. Gunakan biaya sesuai takaran resep, bukan harga satu kemasan penuh jika sisanya masih bisa dipakai.',
      ],
      [
        'Pisahkan biaya batch dan per kotak',
        'Energi dan tenaga produksi dapat dicatat per batch. Kotak, sendok, dan tisu dicatat per porsi agar jumlah pesanan langsung memperlihatkan kebutuhan kemasan.',
      ],
      [
        'Uji jumlah pesanan',
        'Gunakan kalkulator pesanan untuk mengalikan kebutuhan sesuai jumlah porsi dan melihat perkiraan daftar belanja.',
      ],
    ],
  },
  {
    slug: 'hpp-frozen-food',
    title: 'Cara menghitung HPP frozen food',
    description:
      'Hitung biaya frozen food per kemasan dari bahan, hasil produksi, susut, dan kemasan.',
    intro:
      'Produk frozen food sering dibuat dalam batch lalu dijual dalam kemasan. Samakan satuan hasil produksi dengan satuan jual, misalnya jumlah potong per bungkus.',
    headings: [
      [
        'Ukur hasil setelah produksi',
        'Catat jumlah produk yang benar-benar lolos pemeriksaan dan masuk kemasan. Jika ada produk rusak, biaya batch tetap terbagi pada produk layak jual.',
      ],
      [
        'Masukkan biaya kemasan',
        'Plastik, label, dan biaya tambahan yang digunakan untuk setiap bungkus ditambahkan ke biaya produk per kemasan.',
      ],
      [
        'Periksa harga tiap saluran',
        'Komisi saluran penjualan mengubah bagian harga yang diterima. Hitung harga untuk tiap saluran secara terpisah sebelum menetapkan daftar harga.',
      ],
    ],
  },
  {
    slug: 'hpp-rice-bowl',
    title: 'Cara menghitung HPP rice bowl',
    description:
      'Hitung HPP rice bowl dari nasi, lauk, saus, topping, wadah, dan biaya produksi.',
    intro:
      'Rice bowl menggabungkan bahan utama dan pelengkap dalam satu porsi. Resep yang terukur membantu menjaga porsi dan biaya tetap konsisten.',
    headings: [
      [
        'Standarkan takaran per mangkuk',
        'Tentukan berat nasi, lauk, saus, dan topping yang dipakai untuk satu porsi. Konversi harga bahan ke satuan yang sama dengan takaran resep.',
      ],
      [
        'Hitung wadah dan perlengkapan',
        'Masukkan mangkuk, tutup, sendok, dan kantong bila selalu digunakan untuk pesanan. Biaya ini ikut membentuk HPP per porsi.',
      ],
      [
        'Gunakan jumlah pesanan untuk belanja',
        'Masukkan porsi pesanan ke kalkulator order untuk melihat total bahan dan kemasan yang perlu disiapkan.',
      ],
    ],
  },
  {
    slug: 'hpp-minuman',
    title: 'Cara menghitung HPP minuman per gelas',
    description:
      'Hitung HPP minuman dari takaran cairan, bubuk, pemanis, topping, es, dan gelas.',
    intro:
      'Biaya minuman dihitung dari takaran yang masuk ke satu gelas, termasuk topping dan kemasan. Gunakan satuan mililiter atau gram agar biaya tiap bahan sebanding.',
    headings: [
      [
        'Ukur takaran resep',
        'Catat jumlah susu, kopi, sirup, bubuk, gula, dan es sesuai ukuran gelas. Untuk bahan konsentrat, pakai volume yang benar-benar dituangkan.',
      ],
      [
        'Masukkan topping dan kemasan',
        'Tambahkan topping, segel, sedotan, dan gelas jika termasuk dalam penyajian. Biaya kecil yang selalu dipakai tetap dihitung per porsi.',
      ],
      [
        'Sesuaikan harga dengan komisi',
        'Jika minuman dijual lewat platform dengan komisi, gunakan kalkulator harga ojol untuk menghitung harga yang memperhitungkan potongan tersebut.',
      ],
    ],
  },
  {
    slug: 'hpp-hampers',
    title: 'Cara menghitung HPP hampers makanan',
    description:
      'Hitung biaya hampers dari isi produk, kemasan luar, kartu, pita, dan biaya perakitan.',
    intro:
      'Hampers menggabungkan beberapa produk dan kemasan tambahan. Hitung biaya setiap isi terlebih dahulu, lalu tambahkan komponen khusus paket.',
    headings: [
      [
        'Jumlahkan HPP semua isi',
        'Gunakan HPP setiap produk sesuai jumlah yang masuk ke paket. Jika paket berisi dua produk yang berbeda, jumlahkan biaya keduanya.',
      ],
      [
        'Tambahkan kemasan luar dan perakitan',
        'Kotak hampers, pelindung, kartu, pita, dan waktu perakitan dapat ditambahkan sebagai biaya paket agar tidak tertinggal dari perhitungan.',
      ],
      [
        'Cek sisa margin pada harga paket',
        'Bandingkan total HPP dengan harga paket. Jika ada komisi saluran jual, masukkan potongan itu saat menentukan harga yang ditawarkan.',
      ],
    ],
  },
] as const;

export function getUseCase(slug: string) {
  return useCases.find((item) => item.slug === slug);
}
