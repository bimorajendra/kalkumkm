import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kebijakan privasi',
  description: 'Data apa yang Takaran simpan, untuk apa, dan berapa lama.',
};

const sections = [
  {
    title: 'Data yang kami terima',
    body: 'Saat masuk dengan Google, kami menerima nama, alamat email, dan foto profil dari akun Google-mu. Kami menyimpan bahan, resep, takaran, harga, saluran jual, dan pengaturan yang kamu masukkan sendiri. Untuk pembelian Pro, kami menerima nama usaha, nomor WhatsApp, status dan nominal pesanan, serta waktu persetujuan. Untuk daftar tunggu, kami menerima nama usaha, nomor WhatsApp, jenis jualan, waktu persetujuan, dan sumber kunjungan bila tersedia. Mayar memproses data kontak dan pembayaran untuk membuat invoice.',
  },
  {
    title: 'Untuk apa data dipakai',
    body: 'Data akun dipakai untuk membuka aplikasimu. Data bahan dan resep dipakai hanya untuk menghitung dan menampilkannya kembali kepadamu. Kami tidak membagikannya, tidak menjualnya, dan tidak memakainya untuk iklan. Data pembelian dipakai untuk memproses pembayaran, memeriksa status invoice, dan membuka fitur Pro di akunmu. Data daftar tunggu dipakai untuk mengabari soal Takaran.',
  },
  {
    title: 'Siapa yang bisa melihatnya',
    body: 'Hanya kamu, lewat akunmu. Setiap data terikat ke akunmu dan server menolak permintaan ke data akun lain. Pengelola Takaran bisa melihat daftar pesanan (nama usaha, nomor WhatsApp, status pembayaran) untuk membantu bila ada masalah pembayaran, tetapi tidak membuka isi resep dan harga bahanmu kecuali kamu meminta bantuan.',
  },
  {
    title: 'Penyimpanan dan penghapusan',
    body: 'Data disimpan di server Takaran, dilindungi koneksi terenkripsi, dan dicadangkan secara berkala. Kamu bisa mengunduh semua datamu dan menghapus akun beserta seluruh datanya kapan saja dari halaman Pengaturan. Data daftar tunggu dihapus setelah 12 bulan. Data pesanan disimpan selama diperlukan untuk pembukuan dan bantuan pembayaran. Mayar menyimpan data transaksi sesuai kebijakannya.',
  },
  {
    title: 'Cookie',
    body: 'Kami memakai satu cookie sesi agar kamu tetap masuk. Kami tidak memakai cookie pelacak iklan.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-[min(720px,calc(100%-32px))] pb-24 pt-12">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center underline underline-offset-4"
      >
        ← Kembali ke Takaran
      </Link>
      <h1 className="my-8 text-[44px] leading-[46px] sm:text-[64px] sm:leading-[64px]">
        Kebijakan privasi
      </h1>
      <p className="leading-7">
        Halaman ini menjelaskan data yang kami pakai saat kamu memakai Takaran,
        membeli Takaran Pro, atau mendaftar untuk kabar terbaru.
      </p>
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-2 mt-8 text-[28px] leading-8">{section.title}</h2>
          <p className="leading-7">{section.body}</p>
        </section>
      ))}
    </main>
  );
}
