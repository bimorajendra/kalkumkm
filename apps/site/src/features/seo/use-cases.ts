export type UseCaseGroup =
  | 'Kue & roti'
  | 'Makanan berat'
  | 'Camilan & frozen'
  | 'Minuman'
  | 'Lainnya';

export const useCaseGroups: UseCaseGroup[] = [
  'Kue & roti',
  'Makanan berat',
  'Camilan & frozen',
  'Minuman',
  'Lainnya',
];

export const useCases = [
  {
    slug: 'hpp-brownies',
    group: 'Kue & roti',
    example: {
      description:
        'Ilustrasi satu loyang: bahan Rp 27.800, energi Rp 3.000, 16 potong layak jual, dan kemasan Rp 1.000 per potong. Ganti dengan harga dari strukmu.',
      values: {
        material: '27800',
        production: '3000',
        yield: '16',
        packaging: '1000',
      },
    },
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
    group: 'Makanan berat',
    example: {
      description:
        'Ilustrasi 50 kotak: bahan seluruh menu Rp 400.000, gas dan tenaga Rp 80.000, serta kotak dan perlengkapan Rp 2.000 per porsi. Angka ini bukan harga pasar.',
      values: {
        material: '400000',
        production: '80000',
        yield: '50',
        packaging: '2000',
      },
    },
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
    group: 'Camilan & frozen',
    example: {
      description:
        'Ilustrasi 60 bungkus produk layak jual: bahan Rp 300.000, produksi Rp 60.000, dan plastik serta label Rp 1.500 per bungkus. Isi jumlah hasil dengan bungkus, bukan jumlah potong di dalamnya.',
      values: {
        material: '300000',
        production: '60000',
        yield: '60',
        packaging: '1500',
      },
    },
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
    group: 'Makanan berat',
    example: {
      description:
        'Ilustrasi 20 mangkuk: nasi, lauk, dan saus Rp 280.000, produksi Rp 40.000, serta wadah dan sendok Rp 2.000 per mangkuk. Ganti takaran dan biaya sesuai menumu.',
      values: {
        material: '280000',
        production: '40000',
        yield: '20',
        packaging: '2000',
      },
    },
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
    group: 'Minuman',
    example: {
      description:
        'Ilustrasi 20 gelas kopi susu: bahan termasuk es Rp 90.000, produksi Rp 10.000, serta gelas, tutup, dan sedotan Rp 1.000 per gelas. Gunakan ukuran gelas yang sama untuk semua porsi.',
      values: {
        material: '90000',
        production: '10000',
        yield: '20',
        packaging: '1000',
      },
    },
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
    group: 'Lainnya',
    example: {
      description:
        'Ilustrasi 12 paket: total HPP seluruh isi Rp 600.000, perakitan Rp 60.000, serta kotak luar, pita, dan kartu Rp 15.000 per paket. Kemasan produk yang sudah masuk HPP isi tidak perlu dihitung lagi.',
      values: {
        material: '600000',
        production: '60000',
        yield: '12',
        packaging: '15000',
      },
    },
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
  {
    slug: 'hpp-nastar',
    group: 'Kue & roti',
    title: 'Cara menghitung HPP nastar per toples',
    description:
      'Hitung modal nastar per toples dari bahan, olesan, hasil matang, dan kemasan Lebaran.',
    intro:
      'Nastar dijual per toples, tetapi dibuat dari satu adonan. Cocokkan jumlah kue yang masuk ke setiap toples dengan hasil yang benar-benar matang dan utuh.',
    headings: [
      [
        'Catat isian dan olesan',
        'Nanas untuk selai, mentega, telur olesan, dan bahan adonan punya takaran sendiri. Hitung selai yang dipakai di dalam kue, bukan seluruh selai yang masih tersimpan.',
      ],
      [
        'Bagi biaya menurut isi toples',
        'Hitung banyak nastar matang yang layak dikemas, lalu tentukan berapa butir untuk satu toples. Sisa butir dari satu batch dapat direncanakan untuk pesanan berikutnya.',
      ],
      [
        'Masukkan toples dan pelindungnya',
        'Toples, kertas alas, segel, dan pita menambah biaya per kemasan. Catat tiap perlengkapan satu kali agar tidak terhitung ganda.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: bahan dan selai Rp 320.000, produksi Rp 40.000, hasil 8 toples, kemasan Rp 2.500 per toples.',
      values: {
        material: '320000',
        production: '40000',
        yield: '8',
        packaging: '2500',
      },
    },
  },
  {
    slug: 'hpp-kue-ulang-tahun-custom',
    group: 'Kue & roti',
    title: 'Cara menghitung HPP kue ulang tahun custom per kue',
    description:
      'Rinci modal kue ulang tahun custom per pesanan, termasuk bahan dekorasi, alas, dan kotaknya.',
    intro:
      'Kue custom mengikuti ukuran dan permintaan tiap pemesan. Pisahkan bahan kue dari dekorasi khusus agar perubahan desain tidak menyamarkan biaya pesanan.',
    headings: [
      [
        'Rinci desain sebelum menerima pesanan',
        'Catat lapisan, isian, fondant atau krim, warna, dan hiasan sesuai brief pelanggan. Perubahan desain setelah bahan dibeli bisa menambah pemakaian dan waktu kerja.',
      ],
      [
        'Hitung kue dan dekorasi bersama',
        'Harga satu kue terdiri dari bahan dasar, isi, dan dekorasi yang dipakai untuk kue itu. Catat bahan yang dibeli khusus pesanan terpisah dari stok yang masih bisa digunakan.',
      ],
      [
        'Nilai waktu menghias',
        'Waktu membuat lapisan dan menghias sering lebih panjang daripada memanggang. Catat tenaga dan sesi revisi yang disepakati, lalu tambahkan papan alas serta kotak tinggi per kue.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: bahan serta dekorasi Rp 220.000, produksi Rp 30.000, hasil 1 kue, alas dan kotak Rp 8.000.',
      values: {
        material: '220000',
        production: '30000',
        yield: '1',
        packaging: '8000',
      },
    },
  },
  {
    slug: 'hpp-cookies',
    group: 'Kue & roti',
    title: 'Cara menghitung HPP cookies per stoples',
    description:
      'Hitung modal cookies per stoples dengan memperhatikan campuran adonan, hasil panggang, dan kemasan.',
    intro:
      'Resep cookies bisa memakai topping dan isian dengan berat berbeda. Tetapkan satu ukuran adonan supaya isi stoples dan biaya setiap batch mudah dibandingkan.',
    headings: [
      [
        'Pisahkan topping yang harganya mudah berubah',
        'Cokelat, kacang, dan buah kering punya takaran berbeda. Timbang pemakaian ke dalam adonan, terutama jika satu topping hanya dipakai pada varian tertentu.',
      ],
      [
        'Gunakan hasil setelah dipanggang',
        'Sebagian cookies bisa melebar atau pecah saat dipanggang. Hitung yang cukup utuh untuk dijual, lalu tentukan jumlah per stoples agar ukurannya konsisten.',
      ],
      [
        'Cocokkan kemasan dengan cara jual',
        'Masukkan stoples, stiker segel, kertas alas, dan pelindung kirim bila digunakan. Cookies satuan untuk hampers dapat memakai biaya kemasan berbeda dari stoples.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: adonan dan topping Rp 180.000, produksi Rp 20.000, hasil 30 stoples, kemasan Rp 1.500 per stoples.',
      values: {
        material: '180000',
        production: '20000',
        yield: '30',
        packaging: '1500',
      },
    },
  },
  {
    slug: 'hpp-donat',
    group: 'Kue & roti',
    title: 'Cara menghitung HPP donat per buah',
    description:
      'Hitung modal donat per buah dari adonan, minyak goreng, topping, dan kertas pembungkus.',
    intro:
      'Donat digoreng per batch, lalu bisa diberi topping berbeda. Hitung biaya adonan dan minyak produksi bersama hasilnya, kemudian pisahkan hiasan varian yang tidak dipakai semua donat.',
    headings: [
      [
        'Perhatikan minyak yang terserap',
        'Minyak di wajan tidak seluruhnya masuk ke donat. Catat pemakaian produksi dengan cara yang sama setiap batch; jangan membebankan satu wajan penuh ke satu buah.',
      ],
      [
        'Topping mengikuti varian',
        'Gula, cokelat, meses, dan isian punya takaran per donat. Untuk varian campur, jumlahkan biaya tiap varian menurut komposisi batch yang benar-benar dibuat.',
      ],
      [
        'Hitung yang layak dijual',
        'Donat yang terlalu gelap, kempis, atau rusak tetap memakai adonan. Gunakan hasil layak jual sebagai pembagi dan tambahkan alas atau kotak sesuai cara pesanan dikemas.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: adonan dan minyak Rp 150.000, produksi Rp 25.000, hasil 25 buah, kertas atau kemasan Rp 800 per buah.',
      values: {
        material: '150000',
        production: '25000',
        yield: '25',
        packaging: '800',
      },
    },
  },
  {
    slug: 'hpp-roti-manis',
    group: 'Kue & roti',
    title: 'Cara menghitung HPP roti manis per buah',
    description:
      'Hitung modal roti manis per buah dari adonan, isian, pemanggangan, dan kantong roti.',
    intro:
      'Roti manis menggabungkan adonan, isian, dan waktu fermentasi. Catat hasil setelah dipanggang, bukan jumlah potongan adonan sebelum masuk oven.',
    headings: [
      [
        'Pisahkan adonan dan isiannya',
        'Cokelat, keju, sosis, atau selai dapat memakai biaya berbeda. Timbang isian per roti agar satu varian tidak menanggung biaya varian lain.',
      ],
      [
        'Masukkan pemanggangan dan hasil matang',
        'Oven dipakai untuk satu batch. Catat energi sebagai biaya batch, lalu gunakan jumlah roti matang yang bisa dijual setelah pemeriksaan bentuk dan isi.',
      ],
      [
        'Hitung produk gagal fermentasi',
        'Roti yang bantat atau pecah tetap memakai bahan dan energi. Kurangi dari jumlah yang layak dijual, dan masukkan kantong atau label yang menyertai tiap roti.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: adonan dan isian Rp 180.000, produksi Rp 30.000, hasil 20 buah, kantong Rp 1.000 per buah.',
      values: {
        material: '180000',
        production: '30000',
        yield: '20',
        packaging: '1000',
      },
    },
  },
  {
    slug: 'hpp-risoles',
    group: 'Camilan & frozen',
    title: 'Cara menghitung HPP risoles per buah',
    description:
      'Hitung modal risoles per buah dari kulit, ragout, lapisan tepung roti, minyak, dan kemasan.',
    intro:
      'Risoles memakai beberapa lapisan, dan tiap tahap dapat menghasilkan produk gagal. Hitung satu buah yang selesai dibuat agar biaya kulit, isi, dan pelapis tidak terlewat.',
    headings: [
      [
        'Catat kulit dan isian per buah',
        'Bahan kulit dan ragout dibuat dalam batch berbeda. Ukur berapa kulit dan isian yang dipakai satu risoles agar sisa adonan tidak dianggap terjual seluruhnya.',
      ],
      [
        'Tambahkan pelapis dan minyak',
        'Tepung panir serta telur pelapis ikut membentuk biaya. Catat minyak untuk menggoreng batch dengan pola yang konsisten dan masukkan juga biaya produksi lainnya.',
      ],
      [
        'Bedakan siap goreng dan siap jual',
        'Jika dijual beku, tambahkan wadah dan label kemasan beku. Jika digoreng dulu, gunakan hasil yang lolos penggorengan sebagai jumlah produk layak jual.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: kulit dan isian Rp 110.000, produksi Rp 15.000, hasil 40 buah, kemasan Rp 500 per buah.',
      values: {
        material: '110000',
        production: '15000',
        yield: '40',
        packaging: '500',
      },
    },
  },
  {
    slug: 'hpp-dimsum',
    group: 'Camilan & frozen',
    title: 'Cara menghitung HPP dimsum per porsi',
    description:
      'Hitung modal dimsum per porsi dari adonan isi, kulit, saus, proses kukus, dan wadah.',
    intro:
      'Satu porsi dimsum dapat berisi beberapa buah dan saus. Samakan satuan hasil batch dengan satuan yang kamu jual, lalu hitung isi per porsi secara konsisten.',
    headings: [
      [
        'Timbang isi dan kulit',
        'Gunakan berat adonan isi dan kulit yang dipakai pada tiap buah. Perubahan besar isi akan mengubah jumlah porsi yang bisa dibuat dari satu batch.',
      ],
      [
        'Masukkan proses kukus atau beku',
        'Biaya kukus berlaku untuk satu batch. Jika dijual beku, masukkan wadah dan label yang menjaga produk selama penyimpanan; saus terpisah dihitung sesuai isi pesanan.',
      ],
      [
        'Tetapkan isi satu porsi',
        'Hitung berapa buah dimsum dan berapa banyak saus yang masuk ke satu pesanan. Jangan membagi biaya batch dengan jumlah porsi jika satuan jualmu sebenarnya per buah.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: isi dan kulit Rp 240.000, produksi kukus Rp 30.000, hasil 50 porsi, wadah Rp 1.200 per porsi.',
      values: {
        material: '240000',
        production: '30000',
        yield: '50',
        packaging: '1200',
      },
    },
  },
  {
    slug: 'hpp-pempek',
    group: 'Makanan berat',
    title: 'Cara menghitung HPP pempek per porsi',
    description:
      'Hitung modal pempek per porsi, termasuk ikan, sagu, cuko, pemanggangan atau penggorengan, dan wadah.',
    intro:
      'Pempek per porsi biasanya disajikan bersama cuko dan pelengkap. Pisahkan bahan adonan dari kuah agar jumlah sajian dan biaya cuko ikut terhitung.',
    headings: [
      [
        'Hitung rasio ikan dan sagu dari adonan',
        'Takaran ikan dan sagu menentukan bahan untuk satu batch. Catat biaya masing-masing berdasarkan jumlah yang masuk ke adonan, bukan harga seluruh belanja.',
      ],
      [
        'Masukkan cuko dan pelengkap',
        'Cuko, timun, dan mi dapat disiapkan terpisah. Ukur isi yang menyertai satu porsi agar biaya pendamping tidak hilang dari perhitungan.',
      ],
      [
        'Samakan cara olah dan satuan jual',
        'Pempek rebus yang digoreng saat dipesan punya biaya proses berbeda dari yang langsung disajikan. Gunakan biaya produksi sesuai cara jual, lalu hitung wadah per porsi.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: adonan ikan dan sagu Rp 230.000, produksi Rp 20.000, hasil 30 porsi, wadah Rp 1.000 per porsi.',
      values: {
        material: '230000',
        production: '20000',
        yield: '30',
        packaging: '1000',
      },
    },
  },
  {
    slug: 'hpp-nasi-kotak',
    group: 'Makanan berat',
    title: 'Cara menghitung HPP nasi kotak per kotak',
    description:
      'Hitung HPP nasi kotak per kotak dari nasi, lauk, pelengkap, tenaga pesanan, dan kemasan.',
    intro:
      'Nasi kotak dikerjakan menurut jumlah pesanan acara. Hitung isi setiap kotak dan perlengkapan yang menyertainya, lalu cek kembali jumlah porsi yang benar-benar disiapkan.',
    headings: [
      [
        'Rinci isi satu kotak',
        'Tentukan berat nasi, lauk, sayur, sambal, dan kerupuk per kotak. Jika lauk punya pilihan, hitung biaya tiap susunan menu sebagai produk yang berbeda.',
      ],
      [
        'Pisahkan belanja batch dan kemasan',
        'Biaya memasak nasi dan lauk berlaku untuk batch pesanan, sedangkan kotak, sendok, tisu, dan kantong dihitung per kotak sesuai paket yang dijanjikan.',
      ],
      [
        'Masukkan kerja persiapan acara',
        'Waktu membungkus dan menata pesanan besar perlu dibedakan dari waktu memasak. Gunakan hasil produksi yang sudah dikonfirmasi agar makanan cadangan tidak dianggap sebagai kotak terjual.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: bahan nasi dan lauk Rp 450.000, produksi Rp 50.000, hasil 40 kotak, perlengkapan Rp 3.000 per kotak.',
      values: {
        material: '450000',
        production: '50000',
        yield: '40',
        packaging: '3000',
      },
    },
  },
  {
    slug: 'hpp-ayam-geprek',
    group: 'Makanan berat',
    title: 'Cara menghitung HPP ayam geprek per porsi',
    description:
      'Rinci HPP ayam geprek per porsi, dari ayam dan sambal hingga nasi, minyak, serta kotak makan.',
    intro:
      'Ayam geprek menggabungkan ayam goreng, sambal, dan nasi. Ukuran ayam serta jumlah sambal per porsi perlu tetap agar biaya antarpesanan sebanding.',
    headings: [
      [
        'Hitung ayam dengan ukuran porsi',
        'Timbang bagian ayam yang disajikan setelah dipotong sesuai pesanan. Jika ayam dibeli utuh, masukkan bagian yang benar-benar dipakai dan catat sisa yang dapat dimanfaatkan.',
      ],
      [
        'Jangan lupakan sambal dan minyak',
        'Cabai, bawang, dan minyak sambal dihitung dari takaran batch. Minyak goreng ayam dipakai bersama satu batch, sedangkan tepung pelapis mengikuti jumlah potong.',
      ],
      [
        'Pisahkan makan di tempat dan bungkus',
        'Nasi dan perlengkapan dapat berbeda antara pesanan langsung dan bungkus. Untuk kotak, tambahkan wadah serta sendok yang benar-benar diberikan kepada pelanggan.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: ayam, nasi, dan sambal Rp 260.000, produksi Rp 50.000, hasil 35 porsi, kotak Rp 2.500 per porsi.',
      values: {
        material: '260000',
        production: '50000',
        yield: '35',
        packaging: '2500',
      },
    },
  },
  {
    slug: 'hpp-seblak',
    group: 'Makanan berat',
    title: 'Cara menghitung HPP seblak per mangkuk',
    description:
      'Hitung modal seblak per mangkuk dari kerupuk, kuah, topping pilihan, proses masak, dan wadah.',
    intro:
      'Isi seblak sering berubah mengikuti topping dan tingkat kuah yang diminta. Tetapkan takaran dasar per mangkuk dan catat tambahan sebagai varian terpisah.',
    headings: [
      [
        'Tentukan resep dasar per mangkuk',
        'Timbang kerupuk, bumbu, telur, dan kuah untuk porsi dasar. Gunakan ukuran mangkuk yang sama supaya porsi dan jumlah hasil per batch tidak bergeser.',
      ],
      [
        'Pisahkan topping tambahan',
        'Sosis, ceker, bakso, dan sayuran punya biaya yang mengikuti pilihan pelanggan. Harga seblak topping lengkap sebaiknya dihitung dari isi yang benar-benar disajikan.',
      ],
      [
        'Catat biaya memasak per pesanan',
        'Seblak dimasak saat dipesan sehingga gas atau energi mengikuti jumlah pesanan. Jika dibungkus, gunakan wadah yang aman untuk kuah dan pisahkan sambal atau pelengkap sesuai cara sajinya.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: bahan seblak dan topping Rp 180.000, produksi Rp 30.000, hasil 30 mangkuk, wadah Rp 1.500 per mangkuk.',
      values: {
        material: '180000',
        production: '30000',
        yield: '30',
        packaging: '1500',
      },
    },
  },
  {
    slug: 'hpp-es-kopi-susu',
    group: 'Minuman',
    title: 'Cara menghitung HPP es kopi susu per gelas',
    description:
      'Hitung modal es kopi susu per gelas dari espresso, susu, gula aren, es, dan cup bersegel.',
    intro:
      'Es kopi susu punya takaran cairan per gelas. Konsentrasikan perhitungan pada hasil espresso, susu, gula aren, es, dan ukuran cup yang kamu sajikan.',
    headings: [
      [
        'Ukur espresso dari biji kopi yang terpakai',
        'Harga biji dihitung dari gram yang masuk ke satu seduhan, termasuk sisa uji giling yang tidak dapat dipakai untuk pesanan. Jangan membagi biaya seluruh kantong kopi ke satu gelas.',
      ],
      [
        'Samakan volume susu, gula, dan es',
        'Tetapkan resep takaran untuk satu ukuran cup. Ukur gula aren dan susu yang dituang, lalu tentukan apakah es termasuk dalam volume sajian yang kamu janjikan.',
      ],
      [
        'Hitung cup dan seal per gelas',
        'Cup, tutup atau seal, sedotan, dan kantong bawa dapat menambah biaya pesanan. Catat sesuai kemasan yang benar-benar diberikan, bukan semua pilihan sekaligus.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: kopi, susu, gula aren, dan es Rp 185.000, produksi Rp 35.000, hasil 35 gelas, cup dan seal Rp 2.500 per gelas.',
      values: {
        material: '185000',
        production: '35000',
        yield: '35',
        packaging: '2500',
      },
    },
  },
  {
    slug: 'hpp-sambal-botolan',
    group: 'Lainnya',
    title: 'Cara menghitung HPP sambal botolan per botol',
    description:
      'Hitung HPP sambal botolan per botol dengan memperhitungkan susut masak, tutup, segel, dan label.',
    intro:
      'Sambal botolan kehilangan sebagian berat saat dimasak. Hitung hasil setelah matang dan siap diisi, bukan hanya total berat cabai sebelum dimasak.',
    headings: [
      [
        'Masukkan susut saat menumis dan memasak',
        'Air menguap selama sambal dimasak sehingga berat akhirnya berubah. Catat hasil matang yang bisa dikemas untuk mengetahui berapa botol yang benar-benar dihasilkan satu batch.',
      ],
      [
        'Tambahkan minyak dan bahan pengawet resep',
        'Hitung minyak, bawang, garam, dan bahan lain sesuai pemakaian batch. Jika ada varian teri atau bawang tambahan, perlakukan isi tambahannya sebagai varian terpisah.',
      ],
      [
        'Hitung wadah hingga segel',
        'Botol, tutup, segel, dan label dipakai per kemasan. Sisihkan botol yang tidak lolos pemeriksaan tutup atau kebersihan dari jumlah hasil yang dijual.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: cabai dan bahan lain Rp 210.000, produksi Rp 45.000, hasil 42 botol, botol dan segel Rp 3.500 per botol.',
      values: {
        material: '210000',
        production: '45000',
        yield: '42',
        packaging: '3500',
      },
    },
  },
  {
    slug: 'hpp-keripik',
    group: 'Camilan & frozen',
    title: 'Cara menghitung HPP keripik per bungkus',
    description:
      'Hitung modal keripik per bungkus setelah memperhitungkan susut bahan, minyak, bumbu, dan plastik.',
    intro:
      'Bahan keripik menyusut setelah dikupas, dipotong, atau digoreng. Gunakan hasil keripik siap kemas supaya isi tiap bungkus sesuai berat jual.',
    headings: [
      [
        'Timbang bahan sebelum dan sesudah diolah',
        'Catat bahan layak olah dan hasil kering atau goreng yang siap dijual. Perubahan berat membuat jumlah bungkus berbeda dari jumlah bahan mentah.',
      ],
      [
        'Hitung minyak dan bumbu yang menempel',
        'Bumbu tabur dan minyak yang terbawa dalam keripik masuk ke biaya batch. Ukur resep bumbu per produksi, terutama bila satu bahan dipakai untuk rasa tertentu saja.',
      ],
      [
        'Tetapkan berat isi kemasan',
        'Berat bersih per bungkus menentukan berapa kemasan yang keluar dari batch. Tambahkan plastik, label, dan seal; hitung hasil yang utuh setelah pemeriksaan kerenyahan.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: bahan mentah dan bumbu Rp 220.000, produksi Rp 50.000, hasil 48 bungkus, plastik dan label Rp 1.500 per bungkus.',
      values: {
        material: '220000',
        production: '50000',
        yield: '48',
        packaging: '1500',
      },
    },
  },
  {
    slug: 'hpp-kue-basah',
    group: 'Kue & roti',
    title: 'Cara menghitung HPP kue basah per kotak',
    description:
      'Hitung HPP kue basah per kotak dari bahan, kukusan, alas mika, dan jumlah kue yang layak jual.',
    intro:
      'Kue basah sering dijual satuan atau campur dalam kotak. Tentukan isi kotak terlebih dahulu agar biaya jenis kue dan alas tidak tercampur.',
    headings: [
      [
        'Pisahkan resep tiap jenis kue',
        'Kue lapis, dadar gulung, dan klepon memakai bahan serta hasil adonan yang berbeda. Hitung masing-masing batch sebelum merangkai kotak campur.',
      ],
      [
        'Masukkan proses kukus atau rebus',
        'Kukusan dan perebusan memakai energi untuk satu batch. Masukkan waktu menunggu serta pemeriksaan hasil yang matang supaya produk mentah atau terlalu lembek tidak masuk jumlah jual.',
      ],
      [
        'Hitung kotak campur dan alasnya',
        'Daun alas, cup kecil, mika, dan label bergantung pada susunan kotak. Gunakan isi aktual yang dipesan sebagai acuan, bukan jumlah potongan semua jenis kue secara terpisah.',
      ],
    ],
    example: {
      description:
        'Angka ilustrasi, bukan harga pasar: bahan aneka kue Rp 170.000, produksi Rp 30.000, hasil 50 kotak, alas dan mika Rp 2.000 per kotak.',
      values: {
        material: '170000',
        production: '30000',
        yield: '50',
        packaging: '2000',
      },
    },
  },
] as const;

export function getUseCase(slug: string) {
  return useCases.find((item) => item.slug === slug);
}
