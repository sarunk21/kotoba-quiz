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
    title: 'Sorotan Lampu Panggung (Topik Utama)',
    summary: 'Menandai topik utama pembicaraan.',
    description: '💡 ANALOGI: Sorotan Lampu Panggung (Spotlight). Bayangkan panggung gelap, lalu lampu menyorot ke satu orang. Orang itu adalah topik utama pembicaraan. Apa pun penjelasan di belakang partikel は adalah cerita atau "gosip" tentang orang tersebut.',
    usages: [
      {
        title: 'Menyatakan Identitas / Status',
        exampleJp: '私は学生です。',
        exampleRomaji: 'Watashi wa gakusei desu.',
        exampleId: 'Saya adalah siswa.',
        note: 'Menyorot "saya" (私) di panggung, lalu memberi gosip bahwa saya adalah siswa (学生).'
      },
      {
        title: 'Menyatakan Hal yang Kontras (Perbandingan)',
        exampleJp: 'お酒は飲みますが、ビールは飲みません。',
        exampleRomaji: 'Osake wa nomimasu ga, biiru wa nomimasen.',
        exampleId: 'Sake saya minum, tapi kalau bir saya tidak minum.',
        note: 'Menyoroti kontras: sake disorot lampu (diminum), bir disorot lampu (tidak diminum).'
      }
    ]
  },
  {
    id: 'ga',
    particle: 'が',
    romaji: 'ga',
    title: 'Tunjuk Jari / Lampu Kilat (Subjek Fokus)',
    summary: 'Menunjuk pelaku spesifik atau keberadaan benda.',
    description: '💡 ANALOGI: Tunjuk Jari (Finger Pointing). Berbeda dengan spotlight は yang santai menjelaskan topik, partikel が seperti telunjuk yang mengarah langsung ke pelaku secara spesifik ("SAYALAH orangnya, bukan orang lain!"). Juga dipakai untuk benda yang tiba-tiba tertangkap mata (keberadaan/keadaan alam).',
    usages: [
      {
        title: 'Menyatakan Keberadaan Benda / Makhluk Hidup',
        exampleJp: 'あそこに猫がいます。',
        exampleRomaji: 'Asoko ni neko ga imasu.',
        exampleId: 'Di sana ada kucing.',
        note: 'Menunjuk "kucing" (猫) sebagai subjek yang eksis/ada di sana.'
      },
      {
        title: 'Menunjuk Pelaku Spesifik (Fokus Subjek)',
        exampleJp: '私が ya ります。',
        exampleRomaji: 'Watashi ga yarimasu.',
        exampleId: 'Sayalah yang akan melakukannya.',
        note: 'Menunjuk hidung sendiri: "Saya (bukan orang lain) yang akan mengerjakan!"'
      },
      {
        title: 'Menyatakan Keadaan Alam / Sensoris Tubuh',
        exampleJp: '雨が降っています。',
        exampleRomaji: 'Ame ga futte imasu.',
        exampleId: 'Hujan sedang turun.',
        note: 'Menyatakan fenomena alam yang tertangkap mata secara langsung.'
      }
    ]
  },
  {
    id: 'o',
    particle: 'を',
    romaji: 'o',
    title: 'Sasaran Tembak / Target Panah (Objek)',
    summary: 'Menandai benda yang terkena tindakan.',
    description: '💡 ANALOGI: Sasaran Tembak (Bullseye). Bayangkan kata kerja (makan, minum, baca) adalah anak panah yang dilesatkan. Benda di depan partikel を adalah papan target bundar yang tertusuk anak panah tersebut.',
    usages: [
      {
        title: 'Benda yang Dikenai Tindakan',
        exampleJp: 'リンゴを食べます。',
        exampleRomaji: 'Ringo o tabemasu.',
        exampleId: 'Makan apel.',
        note: 'Apel (リンゴ) adalah papan target yang terkena tindakan makan (食べます).'
      },
      {
        title: 'Titik Keluar / Meninggalkan Tempat',
        exampleJp: '毎朝７時に家を出ます。',
        exampleRomaji: 'Maiasa shichi-ji ni ie o demasu.',
        exampleId: 'Meninggalkan rumah jam 7 setiap pagi.',
        note: 'Rumah (家) menjadi target tempat yang kita lewati untuk keluar.'
      }
    ]
  },
  {
    id: 'ni',
    particle: 'に',
    romaji: 'ni',
    title: 'Jarum Kompas / Paku Payung (Koordinat/Tujuan)',
    summary: 'Menunjukkan titik waktu, lokasi diam, atau penerima.',
    description: '💡 ANALOGI: Paku Payung (Pinpoint). Partikel に berfungsi seperti menancapkan paku payung merah di peta lokasi atau di lembar kalender. Menunjukkan titik koordinat yang super spesifik (jam/hari, letak benda diam, atau orang target transfer).',
    usages: [
      {
        title: 'Waktu yang Spesifik (Ada Angka/Nama Hari)',
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
        note: 'Paku payung ditancapkan di lokasi atas meja (机の上) sebagai tempat diamnya buku.'
      },
      {
        title: 'Penerima Hadiah / Sasaran Aksi',
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
    description: '💡 ANALOGI: Latar Panggung (Background) & Alat Bantu (Tool). Partikel で menunjukkan latar panggung tempat kamu melakukan kegiatan aktif (berbeda dengan に yang diam). Fungsi keduanya adalah alat/sarana/kendaraan pembantu tindakanmu.',
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
    title: 'Panah Arah Kompas (Arah Tujuan)',
    summary: 'Menunjukkan arah perjalanan.',
    description: '💡 ANALOGI: Panah Arah Kompas. Partikel へ (dibaca "e") adalah jarum kompas yang mengarah ke suatu tujuan perjalanan. Berbeda dengan に yang fokus pada titik pendaratan akhir, へ lebih fokus pada proses "arah perjalanannya".',
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
    description: '💡 ANALOGI: Rantai Besi (Chain Link). Partikel と merantai dua benda secara lengkap (A dan B), atau merantai dirimu dengan orang lain untuk beraktivitas bersama (melakukan bersama/dengan).',
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
    description: '💡 ANALOGI: Stiker Copy-Paste. Digunakan ketika informasi suatu subjek/benda persis sama dengan yang sebelumnya dibahas. Kamu tinggal meng-copy stiker informasi itu dan menempelkannya ke subjek baru.',
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
    description: '💡 ANALOGI: Garis Start. Partikel から menandai garis start dari mana waktu mulai berjalan atau dari titik mana pergerakan fisik dimulai.',
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
        note: 'Garis start perjalanan saya dimulai dari Indonesia.'
      }
    ]
  },
  {
    id: 'made',
    particle: 'まで',
    romaji: 'made',
    title: 'Bendera Finish (Sampai / Hingga)',
    summary: 'Menunjukkan batas waktu akhir atau lokasi tujuan akhir.',
    description: '💡 ANALOGI: Bendera Finish. Pasangan sejati dari から. Partikel まで menandai titik finish akhir waktu atau lokasi pemberhentian terakhir dari suatu proses.',
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
    title: 'Lem Kertas (Kepemilikan & Penggabung Kategori)',
    summary: 'Menunjukkan kepunyaan atau menyatukan dua kata benda.',
    description: '💡 ANALOGI: Lem Kertas (Glue). Partikel の berfungsi merekatkan dua kata benda agar menjadi satu kesatuan. Bisa merekatkan pemilik dengan barangnya (punya), atau merekatkan kategori penjelasan dengan benda utamanya.',
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
