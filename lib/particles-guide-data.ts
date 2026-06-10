export interface ParticleGuideItem {
  id: string
  particle: string
  romaji: string
  title: string
  summary: string
  description: string
  usages: {
    title: string
    exampleJp: string
    exampleRomaji: string
    exampleId: string
    note: string
  }[]
}

export const PARTICLE_GUIDE_DATA: ParticleGuideItem[] = [
  {
    id: 'wa',
    particle: 'は',
    romaji: 'wa',
    title: 'Sorotan Lampu Panggung (Topik)',
    summary: 'Menandai topik utama pembicaraan.',
    description: '💡 ANALOGI: Spotlight (Lampu Panggung). Bayangkan panggung gelap, lalu lampu menyorot ke satu orang. Orang itu adalah topik utama yang dibahas. Apa pun penjelasan setelah は adalah info/cerita tentang topik tersebut.',
    usages: [
      {
        title: 'Menyatakan Identitas / Status',
        exampleJp: '私は学生です。',
        exampleRomaji: 'Watashi wa gakusei desu.',
        exampleId: 'Saya adalah siswa.',
        note: 'Menyorot "saya" (私) di panggung, lalu memberi info bahwa saya adalah siswa (学生).'
      },
      {
        title: 'Menyatakan Perbandingan (Kontras)',
        exampleJp: 'お酒は飲みませんが、ビールは飲みません。',
        exampleRomaji: 'Osake wa nomimasu ga, biiru wa nomimasen.',
        exampleId: 'Sake saya minum, tapi kalau bir saya tidak minum.',
        note: 'Membandingkan dua hal: Sake disorot (diminum), Bir disorot (tidak diminum).'
      }
    ]
  },
  {
    id: 'ga',
    particle: 'が',
    romaji: 'ga',
    title: 'Telunjuk Menunjuk Hidung (Subjek)',
    summary: 'Menunjuk pelaku spesifik atau keberadaan benda.',
    description: '💡 ANALOGI: Tunjuk Jari. Berbeda dengan は yang santai menjelaskan topik, が seperti telunjuk yang langsung menunjuk pelaku secara spesifik ("SAYALAH orangnya, bukan orang lain!"). Juga digunakan saat melihat benda atau keadaan alam secara spontan.',
    usages: [
      {
        title: 'Menyatakan Keberadaan Benda / Makhluk Hidup',
        exampleJp: 'あそこに猫がいます。',
        exampleRomaji: 'Asoko ni neko ga imasu.',
        exampleId: 'Di sana ada kucing.',
        note: 'Menunjuk "kucing" (猫) sebagai subjek yang eksis atau terlihat di sana.'
      },
      {
        title: 'Menunjuk Pelaku Spesifik (Fokus Subjek)',
        exampleJp: '私がやります。',
        exampleRomaji: 'Watashi ga yarimasu.',
        exampleId: 'Sayalah yang akan melakukannya.',
        note: 'Menunjuk hidung sendiri: "Saya (bukan orang lain) yang akan mengerjakan!"'
      },
      {
        title: 'Menyatakan Keadaan Alam / Kondisi Tubuh',
        exampleJp: '雨が降っています。',
        exampleRomaji: 'Ame ga futte imasu.',
        exampleId: 'Hujan sedang turun.',
        note: 'Menyatakan fenomena alam yang ditangkap mata secara langsung.'
      }
    ]
  },
  {
    id: 'o',
    particle: 'を',
    romaji: 'o',
    title: 'Sasaran Tembak (Objek)',
    summary: 'Menandai benda yang terkena tindakan.',
    description: '💡 ANALOGI: Papan Sasaran (Bullseye). Bayangkan kata kerja (makan, minum, baca) adalah anak panah yang dilesatkan. Benda di depan partikel を adalah papan target bundar yang terkena anak panah tersebut.',
    usages: [
      {
        title: 'Benda yang Dikenai Tindakan',
        exampleJp: 'リンゴを食べます。',
        exampleRomaji: 'Ringo o tabemasu.',
        exampleId: 'Makan apel.',
        note: 'Apel (リンゴ) adalah papan target yang terkena tindakan makan (食べます).'
      },
      {
        title: 'Tempat yang Ditinggalkan (Keluar)',
        exampleJp: '毎朝７時に家を出ます。',
        exampleRomaji: 'Maiasa shichi-ji ni ie o demasu.',
        exampleId: 'Meninggalkan rumah jam 7 setiap pagi.',
        note: 'Rumah (家) adalah tempat asal yang kita tinggalkan/lewati keluar.'
      }
    ]
  },
  {
    id: 'ni',
    particle: 'に',
    romaji: 'ni',
    title: 'Paku Payung Kalender & Peta (Tujuan/Waktu)',
    summary: 'Menunjukkan titik waktu, lokasi diam, atau penerima.',
    description: '💡 ANALOGI: Paku Payung (Pin). Berfungsi seperti menancapkan paku payung merah di peta lokasi atau di lembar kalender. Menunjukkan titik koordinat spesifik (jam/hari, letak benda diam, atau orang target pemberian).',
    usages: [
      {
        title: 'Waktu Spesifik (Memakai Angka/Nama Hari)',
        exampleJp: '朝６時に起きます。',
        exampleRomaji: 'Asa roku-ji ni okimasu.',
        exampleId: 'Bangun jam 6 pagi.',
        note: 'Tancap paku payung tepat di angka jam 6 (６時).'
      },
      {
        title: 'Tempat Keberadaan (Benda Diam/Menetap)',
        exampleJp: '本は机の上にあります。',
        exampleRomaji: 'Hon wa tsukue no ue ni arimasu.',
        exampleId: 'Buku ada di atas meja.',
        note: 'Paku payung ditancapkan di lokasi atas meja (机の上) tempat diamnya buku.'
      },
      {
        title: 'Penerima Aksi / Sasaran Kirim',
        exampleJp: '友達に手紙を書きます。',
        exampleRomaji: 'Tomodachi ni tegami o kakimasu.',
        exampleId: 'Menulis surat kepada teman.',
        note: 'Teman (友達) adalah target paku payung tujuan surat dikirim.'
      }
    ]
  },
  {
    id: 'de',
    particle: 'で',
    romaji: 'de',
    title: 'Latar Panggung Aksi & Alat Bantu',
    summary: 'Tempat beraktivitas, atau alat/kendaraan yang digunakan.',
    description: '💡 ANALOGI: Panggung Aksi (Action Background) & Alat (Tool). Partikel で menunjukkan latar panggung tempat kamu melakukan kegiatan aktif (berbeda dengan に yang diam). Fungsi keduanya adalah alat, sarana, atau kendaraan pembantu tindakanmu.',
    usages: [
      {
        title: 'Tempat Melakukan Kegiatan Aktif',
        exampleJp: '図書館で勉強します。',
        exampleRomaji: 'Toshokan de benkyou shimasu.',
        exampleId: 'Belajar di perpustakaan.',
        note: 'Perpustakaan adalah tempat terjadinya kegiatan aktif belajar.'
      },
      {
        title: 'Alat / Sarana Transportasi / Metode',
        exampleJp: 'タクシーで駅へ行きます。',
        exampleRomaji: 'Takushii de eki he ikimasu.',
        exampleId: 'Pergi ke stasiun naik taksi.',
        note: 'Taksi adalah alat/kendaraan pembantu untuk pergi.'
      },
      {
        title: 'Bahasa / Bahan Pembuatan',
        exampleJp: '日本語で話してください。',
        exampleRomaji: 'Nihongo de hanashite kudasai.',
        exampleId: 'Tolong bicara memakai bahasa Jepang.',
        note: 'Bahasa Jepang adalah medium/alat bantu yang dipakai untuk bicara.'
      }
    ]
  },
  {
    id: 'he',
    particle: 'へ',
    romaji: 'e',
    title: 'Jarum Kompas (Arah Tujuan)',
    summary: 'Menunjukkan arah perjalanan.',
    description: '💡 ANALOGI: Arah Kompas. Partikel へ (dibaca "e") adalah jarum kompas yang mengarah ke suatu tujuan perjalanan. Berbeda dengan に yang fokus pada titik mendarat, へ lebih fokus pada proses "arah perjalanannya".',
    usages: [
      {
        title: 'Arah Pergerakan / Perjalanan',
        exampleJp: '日本へ行きたいです。',
        exampleRomaji: 'Nihon he ikitai desu.',
        exampleId: 'Saya ingin pergi ke Jepang.',
        note: 'Arahkan kompas perjalanan menuju negara Jepang (日本).'
      }
    ]
  },
  {
    id: 'to',
    particle: 'と',
    romaji: 'to',
    title: 'Rantai Pengikat (Dan / Bersama)',
    summary: 'Menghubungkan benda secara lengkap, atau berarti "bersama".',
    description: '💡 ANALOGI: Rantai Besi. Partikel と merantai dua benda secara setara (A dan B), atau merantai dirimu dengan orang lain untuk melakukan aktivitas bersama (bersama/dengan).',
    usages: [
      {
        title: 'Menghubungkan Kata Benda secara Lengkap (Dan)',
        exampleJp: 'パンと牛乳を買いました。',
        exampleRomaji: 'Pan to gyuunyuu o kaimashita.',
        exampleId: 'Membeli roti dan susu.',
        note: 'Merantai roti dan susu sebagai barang belanjaan.'
      },
      {
        title: 'Melakukan Kegiatan Bersama Orang Lain',
        exampleJp: '友達と映画を見ました。',
        exampleRomaji: 'Tomodachi to eiga o mimashita.',
        exampleId: 'Menonton film bersama teman.',
        note: 'Aktivitas menonton dirantai bersama dengan teman (友達).'
      }
    ]
  },
  {
    id: 'mo',
    particle: 'も',
    romaji: 'mo',
    title: 'Stiker Copy-Paste (Juga / Pun)',
    summary: 'Menyatakan kesamaan informasi (juga).',
    description: '💡 ANALOGI: Stiker Salin-Tempel (Copy-Paste). Digunakan ketika informasi suatu subjek/benda persis sama dengan yang sebelumnya dibahas. Kamu tinggal meng-copy stiker info itu dan menempelkannya ke subjek baru.',
    usages: [
      {
        title: 'Menyatakan Kesamaan Status',
        exampleJp: '田中さんも留学生です。',
        exampleRomaji: 'Tanaka-san mo ryuugakusei desu.',
        exampleId: 'Tanaka-san juga mahasiswa asing.',
        note: 'Menempelkan stiker "mahasiswa asing" ke Tanaka-san karena statusnya sama dengan subjek sebelumnya.'
      }
    ]
  },
  {
    id: 'kara',
    particle: 'から',
    romaji: 'kara',
    title: 'Garis Start (Dari / Mulai)',
    summary: 'Menunjukkan batas waktu awal atau lokasi asal.',
    description: '💡 ANALOGI: Garis Start. Partikel から menandai garis start dari mana waktu mulai dihitung, atau dari titik mana perjalanan fisik dimulai.',
    usages: [
      {
        title: 'Batas Awal Waktu / Jam Mulai',
        exampleJp: '会議は９時から始まります。',
        exampleRomaji: 'Kaigi wa kyuu-ji kara hajimarimasu.',
        exampleId: 'Rapat dimulai dari jam 9.',
        note: 'Garis start rapat dimulai tepat pada jam 9.'
      },
      {
        title: 'Asal Negara / Tempat Keberangkatan',
        exampleJp: 'インドネシアから来ました。',
        exampleRomaji: 'Indoneshia kara kimashita.',
        exampleId: 'Datang dari Indonesia.',
        note: 'Garis start perjalanan saya dimulai dari negara Indonesia.'
      }
    ]
  },
  {
    id: 'made',
    particle: 'まで',
    romaji: 'made',
    title: 'Bendera Finish (Sampai / Hingga)',
    summary: 'Menunjukkan batas waktu akhir atau lokasi tujuan akhir.',
    description: '💡 ANALOGI: Bendera Finish. Pasangan dari から. Partikel まで menandai titik finish akhir waktu atau lokasi pemberhentian terakhir dari suatu aktivitas.',
    usages: [
      {
        title: 'Batas Akhir Waktu / Jam Selesai',
        exampleJp: '午後５時まで働きます。',
        exampleRomaji: 'Gogo go-ji made hatarakimasu.',
        exampleId: 'Bekerja sampai jam 5 sore.',
        note: 'Bendera finish bekerja ditancapkan di jam 5 sore.'
      },
      {
        title: 'Batas Lokasi Pemberhentian Akhir',
        exampleJp: '家から学校まで歩きます。',
        exampleRomaji: 'Ie kara gakkou made arukimasu.',
        exampleId: 'Berjalan kaki dari rumah sampai sekolah.',
        note: 'Sekolah adalah bendera finish akhir langkah kaki.'
      }
    ]
  },
  {
    id: 'no',
    particle: 'の',
    romaji: 'no',
    title: 'Lem Kertas (Kepemilikan & Penggabung)',
    summary: 'Menunjukkan kepunyaan atau menyatukan dua kata benda.',
    description: '💡 ANALOGI: Lem Kertas (Glue). Partikel の berfungsi merekatkan dua kata benda agar menjadi satu kesatuan. Bisa merekatkan pemilik dengan barangnya (kepunyaan), atau merekatkan kategori penjelasan dengan benda utamanya.',
    usages: [
      {
        title: 'Menyatakan Kepemilikan (Kepunyaan)',
        exampleJp: 'これは私の傘です。',
        exampleRomaji: 'Kore wa watashi no kasa desu.',
        exampleId: 'Ini payung saya.',
        note: 'Merekatkan "saya" (私) dengan "payung" (傘) menggunakan lem の untuk menandai kepemilikan.'
      },
      {
        title: 'Menerangkan Sifat / Kategori Benda',
        exampleJp: '日本語の先生。',
        exampleRomaji: 'Nihongo no sensei.',
        exampleId: 'Guru bahasa Jepang.',
        note: 'Merekatkan kategori "bahasa Jepang" (日本語) dengan "guru" (先生).'
      }
    ]
  }
]
