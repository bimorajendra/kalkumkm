import type { PublicCalculatorMode } from './content';

interface CalculatorGuide {
  title: string;
  sections: { heading: string; paragraphs: string[] }[];
  questions: { question: string; answer: string }[];
}

export const calculatorGuides: Record<PublicCalculatorMode, CalculatorGuide> = {
  hpp: {
    title: 'Panduan menghitung HPP makanan',
    sections: [
      {
        heading: 'Hitung modal per porsi dari biaya satu adonan',
        paragraphs: [
          'Jumlahkan biaya bahan yang benar-benar dipakai dan biaya produksi untuk satu adonan. Bagi jumlah itu dengan banyaknya porsi yang layak dijual, lalu tambahkan kemasan untuk setiap porsi.',
          'Pakai satuan yang sama antara resep dan ukuran belanja. Jika bahan tersisa dan masih bisa dipakai, biaya seluruh kemasan belanja tidak perlu dibebankan ke satu adonan.',
        ],
      },
      {
        heading: 'Catat biaya kecil dan hasil yang gagal dijual',
        paragraphs: [
          'Gas, listrik oven, minyak yang terserap, dan kotak sering terlewat saat menghitung modal. Catat biaya produksi per adonan dan kemasan per porsi supaya pembaginya sesuai.',
          'Tester, potongan rusak, atau hasil gosong mengurangi jumlah yang bisa dijual. Jika biaya adonan tetap, masukkan hanya porsi layak jual sebagai hasil.',
        ],
      },
      {
        heading: 'Tenaga sendiri tetap punya nilai',
        paragraphs: [
          'Upah tenaga sendiri bisa dicatat sebagai biaya supaya kamu tahu nilai kerja yang ditukar dengan pesanan. Jika belum mengambil upah, tetap bedakan uang usaha dan nilai waktumu.',
          'HPP adalah modal untuk membuat satu porsi. Harga jual perlu menutup modal, komisi saluran jual, dan bagian untung yang kamu inginkan.',
        ],
      },
    ],
    questions: [
      {
        question: 'Apa rumus HPP per porsi?',
        answer:
          'Jumlah biaya bahan dan produksi satu adonan, bagi dengan jumlah porsi layak jual, lalu tambah biaya kemasan per porsi.',
      },
      {
        question: 'Minyak, gas, dan listrik masuk hitungan?',
        answer:
          'Masukkan minyak yang dipakai serta biaya gas dan listrik yang berhubungan dengan produksi. Catat gas atau listrik untuk satu batch agar tidak tertukar dengan biaya per porsi.',
      },
      {
        question: 'Tester dan produk rusak dihitung bagaimana?',
        answer:
          'Biaya produksinya tetap ada, tetapi jangan masukkan tester atau hasil rusak ke jumlah porsi layak jual. Biaya terbagi ke jumlah yang benar-benar dapat dijual.',
      },
      {
        question: 'Apakah tenaga sendiri harus dihitung?',
        answer:
          'Kamu bisa mencatat upah tenaga sendiri agar terlihat nilai kerja dalam pesanan. Jika belum membayar upah, pertimbangkan hasil HPP tanpa menyamakan waktu kerja dengan biaya tunai.',
      },
      {
        question: 'HPP sama dengan harga jual?',
        answer:
          'Tidak. HPP menunjukkan modal membuat satu porsi. Harga jual juga mempertimbangkan komisi, biaya lain, dan untung.',
      },
    ],
  },
  price: {
    title: 'Panduan menentukan harga jual makanan',
    sections: [
      {
        heading: 'Tentukan untung dengan margin yang kamu inginkan',
        paragraphs: [
          'Margin adalah bagian keuntungan dari harga jual. Markup adalah tambahan terhadap HPP. Dua persentase itu memakai pembagi berbeda, jadi angka markup yang sama tidak menghasilkan margin yang sama.',
          'Angka 40% sering dipakai sebagai contoh ilustrasi untuk membedakan margin dan markup, bukan patokan harga. Pilih target dari biaya, tenaga, dan keadaan usahamu sendiri.',
        ],
      },
      {
        heading: 'Pembulatan membantu harga mudah dibaca',
        paragraphs: [
          'Kalkulator membulatkan harga saran ke atas mengikuti kelipatan yang kamu pilih. Periksa lagi apakah hasilnya mudah disebut saat menerima pesanan dan masih masuk akal untuk porsi yang dijual.',
          'Pembulatan dapat membuat margin akhir sedikit berbeda dari target. Lihat margin aktual setelah harga dibulatkan sebelum menaruhnya di daftar harga.',
        ],
      },
      {
        heading:
          'Bandingkan produk dengan jujur dan hitung ulang saat biaya berubah',
        paragraphs: [
          'Harga penjual lain bisa membantu memahami ukuran porsi dan isi produk yang dibandingkan. Jangan menyalin harga tanpa menyamakan bahan, berat, kemasan, dan layanan.',
          'Saat harga bahan naik, perbarui biaya bahan yang dipakai dalam resep lalu cek modal dan margin. Sesuaikan harga jika angka baru tidak lagi memberi ruang untung yang kamu perlukan.',
        ],
      },
    ],
    questions: [
      {
        question: 'Apa beda margin dan markup?',
        answer:
          'Margin membandingkan keuntungan dengan harga jual. Markup membandingkan tambahan harga dengan HPP. Keduanya memakai dasar hitung berbeda.',
      },
      {
        question: 'Kenapa kalkulator membulatkan ke atas?',
        answer:
          'Pembulatan ke atas mengikuti kelipatan pilihanmu dan mencegah harga saran turun di bawah nilai sebelum pembulatan. Hasil margin aktual bisa sedikit berubah.',
      },
      {
        question: 'Boleh mengikuti harga pesaing?',
        answer:
          'Gunakan harga lain sebagai konteks. Cocokkan porsi, isi, kemasan, dan saluran jual sebelum membandingkan, lalu periksa apakah harga tersebut menutup biayamu.',
      },
      {
        question: 'Kapan harga perlu dihitung ulang?',
        answer:
          'Periksa lagi saat harga bahan, ukuran porsi, kemasan, atau komisi berubah. Perubahan itu dapat mengurangi margin meskipun harga jual tetap.',
      },
    ],
  },
  margin: {
    title: 'Panduan membaca margin keuntungan',
    sections: [
      {
        heading: 'Margin menunjukkan bagian harga yang menjadi untung',
        paragraphs: [
          'Bandingkan uang yang tersisa setelah HPP dan komisi dengan harga jual. Sisa itu adalah keuntungan per porsi; margin menyatakannya sebagai bagian dari harga jual.',
          'Jika sisa bernilai negatif, biaya yang dimasukkan lebih besar daripada pendapatan setelah komisi. Menambah jumlah penjualan dengan susunan biaya yang sama akan menambah kerugian.',
        ],
      },
      {
        heading: 'Komisi mengurangi uang yang kamu terima',
        paragraphs: [
          'Masukkan komisi saluran jual agar hasil menunjukkan margin setelah potongan tersebut. Komisi persentase dihitung dari harga jual, sehingga uang bersih yang tersisa lebih kecil.',
          'Kalkulator ini tidak memasukkan biaya tetap, promo, atau biaya lain yang belum diisi. Tambahkan komponen itu saat memeriksa keuntungan usahamu.',
        ],
      },
      {
        heading: 'Markup dan margin memakai dasar berbeda',
        paragraphs: [
          'Menambahkan 40% dari HPP adalah contoh ilustrasi markup, bukan margin. Setelah harga terbentuk, keuntungan dibandingkan dengan harga jual untuk membaca marginnya.',
          'Untuk memilih harga, masukkan target margin ke kalkulator harga jual. Untuk memeriksa hasil harga yang sudah dipilih, gunakan kalkulator margin ini.',
        ],
      },
    ],
    questions: [
      {
        question: 'Kenapa margin saya negatif?',
        answer:
          'Harga bersih setelah komisi belum menutup HPP. Periksa harga, biaya per porsi, dan persentase komisi yang kamu masukkan.',
      },
      {
        question: 'Margin ini sudah mengurangi komisi?',
        answer:
          'Ya, jika persentase komisi diisi. Hasil menunjukkan uang setelah komisi persentase dan HPP yang kamu masukkan.',
      },
      {
        question: 'Apakah markup sama dengan margin?',
        answer:
          'Tidak. Markup memakai HPP sebagai dasar, sedangkan margin memakai harga jual. Angka 40% di sini contoh ilustrasi, bukan target yang harus kamu pakai.',
      },
      {
        question: 'Mengapa komisi membuat margin turun?',
        answer:
          'Komisi mengurangi pendapatan dari harga jual, sementara HPP tetap perlu dibayar. Karena itu bagian yang tersisa sebagai untung menjadi lebih kecil.',
      },
    ],
  },
  ojol: {
    title: 'Panduan menghitung harga untuk ojol',
    sections: [
      {
        heading: 'Komisi mengurangi pendapatan dari setiap pesanan',
        paragraphs: [
          'Masukkan persentase komisi sesuai kontrakmu. Kalkulator memakai nilai itu untuk menghitung harga saran agar target margin yang kamu pilih masih diperhitungkan setelah potongan.',
          'Tarif dan ketentuan dapat berbeda menurut kontrak. Angka komisi ilustrasi yang terisi bukan tarif resmi platform mana pun.',
        ],
      },
      {
        heading: 'Hitung harga tiap saluran secara terpisah',
        paragraphs: [
          'Harga dari pesanan langsung dan pesanan platform bisa berbeda karena biaya salurannya berbeda. Pastikan HPP yang dimasukkan tetap mewakili produk dan porsinya.',
          'Bandingkan hasil setelah pembulatan dengan harga jual langsung. Periksa kembali margin untuk setiap saluran sebelum memperbarui menu.',
        ],
      },
      {
        heading: 'Promo dan ongkir perlu diperiksa terpisah',
        paragraphs: [
          'Kalkulator ini menghitung komisi persentase. Promo yang kamu tanggung, subsidi ongkir, pajak, dan biaya tetap per pesanan tidak dihitung otomatis.',
          'Jika biaya tambahan dibagi ke penjual, masukkan dampaknya ke perhitunganmu sendiri sebelum menetapkan harga. Sesuaikan persentase dengan kontrakmu.',
        ],
      },
    ],
    questions: [
      {
        question: 'Persentase komisi apa yang harus dimasukkan?',
        answer:
          'Gunakan ketentuan yang tercantum dalam kontrakmu. Angka di kalkulator hanyalah isian ilustrasi dan bukan tarif resmi platform.',
      },
      {
        question: 'Apakah harga langsung dan harga ojol harus sama?',
        answer:
          'Belum tentu. Biaya saluran bisa berbeda. Hitung masing-masing berdasarkan HPP dan ketentuan yang berlaku untuk pesanan itu.',
      },
      {
        question: 'Apakah promo sudah masuk ke hitungan?',
        answer:
          'Belum. Kalkulator ini memperhitungkan komisi persentase saja. Periksa promo yang kamu tanggung dan biaya lain secara terpisah.',
      },
      {
        question: 'Apakah subsidi ongkir dan pajak sudah dihitung?',
        answer:
          'Belum. Keduanya tidak termasuk rumus kalkulator ini. Pertimbangkan beban yang menjadi tanggunganmu saat mengecek harga.',
      },
    ],
  },
  bep: {
    title: 'Panduan menghitung titik impas usaha',
    sections: [
      {
        heading: 'Pisahkan biaya tetap dari biaya per unit',
        paragraphs: [
          'Biaya tetap berlaku untuk periode yang kamu pilih, misalnya biaya tempat atau langganan alat. Biaya variabel bertambah bersama jumlah produk, seperti bahan dan kemasan satu porsi.',
          'Masukkan biaya produksi per unit sebagai variabel. Jangan memasukkan biaya yang sama sekali lagi ke biaya tetap karena itu membuat modal terhitung dua kali.',
        ],
      },
      {
        heading: 'Samakan periode biaya dan target penjualan',
        paragraphs: [
          'Pilih jangka waktu yang sama untuk biaya tetap dan rencana penjualan. Jika biaya tetap yang dipakai bulanan, baca hasil unit sebagai target dalam periode itu.',
          'Titik impas menghitung jumlah unit untuk menutup biaya tetap dari sisa harga setelah biaya variabel dan komisi yang dimasukkan.',
        ],
      },
      {
        heading: 'Harga harus lebih tinggi dari biaya variabel',
        paragraphs: [
          'Jika pendapatan bersih satu unit belum menutup biaya variabelnya, setiap tambahan unit tetap menambah kekurangan. Dalam keadaan itu, usaha tidak mencapai impas hanya dengan menjual lebih banyak.',
          'Periksa harga jual, biaya unit, dan komisi sebelum membaca jumlah titik impas. Kalkulator tidak menambahkan biaya lain yang tidak dimasukkan.',
        ],
      },
    ],
    questions: [
      {
        question: 'Apa yang termasuk biaya tetap?',
        answer:
          'Biaya yang kamu alokasikan untuk satu periode dan tidak langsung bertambah tiap porsi, seperti sewa atau langganan alat.',
      },
      {
        question: 'Apa yang termasuk biaya variabel?',
        answer:
          'Biaya yang bertambah ketika membuat atau menjual unit, seperti bahan, kemasan per porsi, dan biaya lain yang melekat pada tiap produk.',
      },
      {
        question: 'Periode apa yang sebaiknya dipakai?',
        answer:
          'Samakan periode biaya tetap dan jumlah penjualan yang ingin dicapai. Misalnya biaya bulanan dibaca bersama rencana penjualan bulanan.',
      },
      {
        question: 'Mengapa harga harus menutup biaya variabel?',
        answer:
          'Biaya tetap ditutup dari sisa pendapatan per unit. Jika harga setelah komisi belum menutup biaya variabel, tidak ada sisa untuk menutup biaya tetap.',
      },
    ],
  },
};
