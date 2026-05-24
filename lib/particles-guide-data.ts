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
    title: 'Penanda Topik (Topic Marker)',
    summary: 'Menandai topik pembicaraan utama dalam kalimat.',
    description: 'Partikel は (ditulis sebagai "ha" tetapi dibaca "wa") digunakan untuk menunjukkan topik utama dari kalimat. Topik adalah sesuatu yang sudah diketahui oleh pembicara dan pendengar, atau sesuatu yang ingin diangkat sebagai pokok bahasan utama.',
    usages: [
      {
        title: 'Menyatakan Identitas / Status',
        exampleJp: '私は学生です。',
        exampleRomaji: 'Watashi wa gakusei desu.',
        exampleId: 'Saya adalah siswa.',
        note: 'Menjadikan "saya" (私) sebagai topik utama dan memberikan informasi bahwa topik tersebut adalah siswa.'
      },
      {
        title: 'Menyatakan Topik yang Kontras (Perbandingan)',
        exampleJp: 'お酒は飲みますが, ビールは飲みません。',
        exampleRomaji: 'Osake wa nomimasu ga, biiru wa nomimasen.',
        exampleId: 'Kalau sake saya minum, tetapi kalau bir saya tidak minum.',
        note: 'Partikel "wa" di sini menekankan perbandingan yang kontras antara sake dan bir.'
      }
    ]
  },
  {
    id: 'ga',
    particle: 'が',
    romaji: 'ga',
    title: 'Penanda Subjek (Subject Marker)',
    summary: 'Menandai subjek aktif pelaku tindakan atau keberadaan.',
    description: 'Partikel が (ga) digunakan untuk menandai subjek dalam kalimat. Berbeda dengan は yang fokus pada informasi di belakangnya, が menekankan pada subjek itu sendiri sebagai pelaku dari kata kerja atau kata sifat, atau untuk menyampaikan informasi yang baru pertama kali didengar.',
    usages: [
      {
        title: 'Keberadaan Benda / Makhluk Hidup',
        exampleJp: 'あそこに猫がいます。',
        exampleRomaji: 'Asoko ni neko ga imasu.',
        exampleId: 'Di sana ada kucing.',
        note: 'Menandai "kucing" (猫) sebagai subjek yang ada (います).'
      },
      {
        title: 'Menekankan Pelaku Spesifik (Fokus Subjek)',
        exampleJp: '私がやります。',
        exampleRomaji: 'Watashi ga yarimasu.',
        exampleId: 'Sayalah yang akan melakukannya.',
        note: 'Menekankan bahwa "saya" (bukan orang lain) yang akan melakukan tindakan tersebut.'
      },
      {
        title: 'Menyatakan Keadaan Alam / Sensoris',
        exampleJp: '雨が降っています。',
        exampleRomaji: 'Ame ga futte imasu.',
        exampleId: 'Hujan sedang turun.',
        note: 'Menyatakan fenomena alam yang sedang terjadi secara objektif.'
      }
    ]
  },
  {
    id: 'o',
    particle: 'を',
    romaji: 'o',
    title: 'Penanda Objek Langsung (Direct Object Marker)',
    summary: 'Menandai objek langsung yang menerima tindakan kata kerja.',
    description: 'Partikel を (ditulis "wo" tetapi dibaca "o") digunakan untuk menandai objek langsung dari suatu tindakan (kata kerja transitif). Objek langsung adalah benda atau orang yang dikenai pekerjaan secara langsung.',
    usages: [
      {
        title: 'Menandai Objek Tindakan',
        exampleJp: 'リンゴを食べます。',
        exampleRomaji: 'Ringo o tabemasu.',
        exampleId: 'Makan apel.',
        note: 'Apel (リンゴ) adalah objek langsung yang dimakan.'
      },
      {
        title: 'Titik Keberangkatan / Keluar dari Suatu Tempat',
        exampleJp: '毎朝７時に家を出ます。',
        exampleRomaji: 'Maiasa shichi-ji ni ie o demasu.',
        exampleId: 'Setiap pagi meninggalkan rumah jam 7.',
        note: 'Menggunakan を untuk menunjukkan titik keluar dari suatu tempat (家 - rumah).'
      }
    ]
  },
  {
    id: 'ni',
    particle: 'に',
    romaji: 'ni',
    title: 'Penanda Waktu, Tempat, dan Arah',
    summary: 'Menunjukkan waktu spesifik, tempat keberadaan, penerima, atau tujuan.',
    description: 'Partikel に (ni) adalah salah satu partikel dengan fungsi terbanyak. Paling umum digunakan untuk menunjukkan waktu yang spesifik, letak keberadaan suatu benda, arah tujuan pergerakan, atau penerima suatu tindakan.',
    usages: [
      {
        title: 'Menunjukkan Waktu Spesifik (Jam/Hari/Tanggal)',
        exampleJp: '朝６時に起きます。',
        exampleRomaji: 'Asa roku-ji ni okimasu.',
        exampleId: 'Bangun tidur pada jam 6 pagi.',
        note: 'Jam 6 (６時) adalah waktu spesifik sehingga diberi partikel ni.'
      },
      {
        title: 'Keberadaan Benda Mati / Hidup (Lokasi Keberadaan)',
        exampleJp: '本は机の上にあります。',
        exampleRomaji: 'Hon wa tsukue no ue ni arimasu.',
        exampleId: 'Buku ada di atas meja.',
        note: 'Menunjukkan letak keberadaan buku di atas meja (机の上).'
      },
      {
        title: 'Penerima Aksi / Sasaran Tindakan',
        exampleJp: '友達に手紙を書きます。',
        exampleRomaji: 'Tomodachi ni tegami o kakimasu.',
        exampleId: 'Menulis surat kepada teman.',
        note: 'Teman (友達) adalah penerima surat atau sasaran dari tindakan menulis.'
      }
    ]
  },
  {
    id: 'de',
    particle: 'で',
    romaji: 'de',
    title: 'Tempat Aksi, Alat, dan Metode',
    summary: 'Menunjukkan tempat terjadinya aksi, alat yang digunakan, atau sebab.',
    description: 'Partikel で (de) digunakan untuk menunjukkan tempat berlangsungnya suatu kegiatan aktif (bukan sekadar keberadaan), alat atau kendaraan yang digunakan untuk melakukan sesuatu, serta bahan pembuatan atau penyebab terjadinya suatu hal.',
    usages: [
      {
        title: 'Tempat Berlangsungnya Aktivitas Aktif',
        exampleJp: '図書館で勉強します。',
        exampleRomaji: 'Toshokan de benkyou shimasu.',
        exampleId: 'Belajar di perpustakaan.',
        note: 'Belajar adalah aktivitas aktif, maka perpustakaan (図書館) ditandai dengan で (bukan に).'
      },
      {
        title: 'Alat / Metode / Sarana Transportasi',
        exampleJp: 'タクシーで駅へ行きます。',
        exampleRomaji: 'Takushii de eki he ikimasu.',
        exampleId: 'Pergi ke stasiun menggunakan taksi.',
        note: 'Taksi (タクシー) adalah sarana transportasi/metode yang digunakan.'
      },
      {
        title: 'Bahasa / Medium Komunikasi',
        exampleJp: '日本語で話してください。',
        exampleRomaji: 'Nihongo de hanashite kudasai.',
        exampleId: 'Tolong berbicara menggunakan bahasa Jepang.',
        note: 'Bahasa Jepang (日本語) adalah alat/medium komunikasi yang diminta.'
      }
    ]
  },
  {
    id: 'he',
    particle: 'へ',
    romaji: 'e',
    title: 'Penanda Arah Tujuan (Direction Marker)',
    summary: 'Menunjukkan arah atau tujuan pergerakan.',
    description: 'Partikel へ (ditulis "he" tetapi dibaca "e") digunakan untuk menunjukkan arah atau tujuan pergerakan fisik. Partikel ini sangat mirip dengan に untuk pergerakan, namun へ lebih menekankan pada "arah perjalanannya", sementara に lebih menekankan pada "titik tujuannya".',
    usages: [
      {
        title: 'Arah Tujuan Perjalanan',
        exampleJp: '日本へ行きたいです。',
        exampleRomaji: 'Nihon he ikitai desu.',
        exampleId: 'Saya ingin pergi ke Jepang.',
        note: 'Menunjukkan arah pergerakan menuju Jepang (日本).'
      }
    ]
  },
  {
    id: 'to',
    particle: 'と',
    romaji: 'to',
    title: 'Penanda Penggabung (dan) & Kebersamaan (bersama)',
    summary: 'Menghubungkan kata benda secara lengkap, atau berarti "dengan/bersama".',
    description: 'Partikel と (to) memiliki dua fungsi utama: menghubungkan dua atau lebih kata benda secara lengkap (artinya "dan"), atau untuk menunjukkan orang/hewan yang diajak melakukan suatu aktivitas bersama (artinya "bersama/dengan").',
    usages: [
      {
        title: 'Menghubungkan Kata Benda secara Lengkap (Dan)',
        exampleJp: 'パンと牛乳を買いました。',
        exampleRomaji: 'Pan to gyuunyuu o kaimashita.',
        exampleId: 'Saya membeli roti dan susu.',
        note: 'Roti dan susu disebutkan secara lengkap sebagai barang yang dibeli.'
      },
      {
        title: 'Melakukan Aktivitas Bersama Orang Lain',
        exampleJp: '友達と映画を見ました。',
        exampleRomaji: 'Tomodachi to eiga o mimashitah.',
        exampleId: 'Saya menonton film bersama teman.',
        note: 'Menonton film dilakukan bersama/dengan teman (友達).'
      }
    ]
  },
  {
    id: 'mo',
    particle: 'も',
    romaji: 'mo',
    title: 'Penanda Kesamaan (Juga / Pun)',
    summary: 'Menunjukkan kesamaan atau berarti "juga".',
    description: 'Partikel も (mo) digunakan untuk menggantikan partikel は, が, atau を ketika subjek atau objek memiliki kesamaan informasi dengan kalimat sebelumnya. Partikel ini berarti "juga" atau "pun".',
    usages: [
      {
        title: 'Menyatakan Kesamaan (Juga)',
        exampleJp: '田中さんも留学生です。',
        exampleRomaji: 'Tanaka-san mo ryuugakusei desu.',
        exampleId: 'Tanaka-san juga mahasiswa asing.',
        note: 'Menunjukkan bahwa status Tanaka-san sama dengan orang lain yang sebelumnya dibicarakan.'
      }
    ]
  },
  {
    id: 'kara',
    particle: 'から',
    romaji: 'kara',
    title: 'Penanda Titik Awal (Dari / Mulai)',
    summary: 'Menunjukkan waktu awal, lokasi asal, atau sebab/alasan.',
    description: 'Partikel から (kara) berarti "dari" atau "mulai". Paling sering digunakan untuk menunjukkan titik awal waktu atau tempat dari suatu aktivitas. Sering berpasangan dengan まで (made).',
    usages: [
      {
        title: 'Titik Awal Waktu / Tempat',
        exampleJp: '会議は９時から始まります。',
        exampleRomaji: 'Kaigi wa kyuu-ji kara hajimarimasu.',
        exampleId: 'Rapat dimulai dari jam 9.',
        note: 'Menunjukkan waktu dimulainya rapat yaitu jam 9.'
      },
      {
        title: 'Asal Negara / Daerah',
        exampleJp: 'インドネシアから来ました。',
        exampleRomaji: 'Indoneshia kara kimashita.',
        exampleId: 'Saya datang dari Indonesia.',
        note: 'Menyatakan asal negara pembicara.'
      }
    ]
  },
  {
    id: 'made',
    particle: 'まで',
    romaji: 'made',
    title: 'Penanda Titik Akhir (Sampai / Hingga)',
    summary: 'Menunjukkan batas waktu akhir atau batas tempat tujuan.',
    description: 'Partikel まで (made) berarti "sampai" atau "hingga". Digunakan untuk menandai batas akhir waktu atau jarak dari suatu pergerakan/proses.',
    usages: [
      {
        title: 'Batas Waktu Akhir',
        exampleJp: '午後５時まで働きます。',
        exampleRomaji: 'Gogo go-ji made hatarakimasu.',
        exampleId: 'Bekerja sampai jam 5 sore.',
        note: 'Jam 5 sore adalah batas akhir waktu bekerja.'
      },
      {
        title: 'Batas Lokasi Akhir',
        exampleJp: '家から学校まで歩きます。',
        exampleRomaji: 'Ie kara gakkou made arukimasu.',
        exampleId: 'Berjalan kaki dari rumah sampai sekolah.',
        note: 'Sekolah (学校) adalah batas akhir lokasi perjalanan kaki.'
      }
    ]
  },
  {
    id: 'no',
    particle: 'の',
    romaji: 'no',
    title: 'Penanda Kepunyaan & Penghubung Kata Benda',
    summary: 'Menunjukkan kepemilikan atau memodifikasi kata benda.',
    description: 'Partikel の (no) digunakan untuk menyatakan kepunyaan (kepemilikan) atau menghubungkan dua buah kata benda di mana kata benda pertama menerangkan kata benda kedua (misal: asal perusahaan, bahan, jenis, dsb).',
    usages: [
      {
        title: 'Menyatakan Kepunyaan (Kepemilikan)',
        exampleJp: 'これは私の傘です。',
        exampleRomaji: 'Kore wa watashi no kasa desu.',
        exampleId: 'Ini adalah payung milik saya.',
        note: 'Menghubungkan "saya" (私) dengan "payung" (傘) untuk menyatakan bahwa payung itu milik saya.'
      },
      {
        title: 'Menjelaskan Hubungan Posisi / Asal',
        exampleJp: '日本語の先生。',
        exampleRomaji: 'Nihongo no sensei.',
        exampleId: 'Guru bahasa Jepang.',
        note: 'Menghubungkan kata benda "Bahasa Jepang" dengan "Guru" untuk menjelaskan bidang yang diajarkan sang guru.'
      }
    ]
  }
]
