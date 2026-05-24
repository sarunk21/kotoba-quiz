export interface ParticleQuestion {
  id: string
  sentence: string
  translation: string
  correct: string
  options: string[]
  explanation: string
}

export const PARTICLE_QUESTIONS: ParticleQuestion[] = [
  {
    id: 'p1',
    sentence: '私は毎日テレビ ___ 見ます。',
    translation: 'Saya menonton TV setiap hari.',
    correct: 'を',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Partikel 'を' (o) digunakan untuk menandai objek langsung dari kata kerja transitif '見ます' (menonton)."
  },
  {
    id: 'p2',
    sentence: '月曜日 ___ 金曜日 ___ 働きます。',
    translation: 'Saya bekerja dari hari Senin sampai hari Jumat.',
    correct: 'から / まで',
    options: ['に / へ', 'から / まで', 'と / と', 'で / に'],
    explanation: "Partikel 'から' (kara) berarti 'dari' dan 'まで' (made) berarti 'sampai/hingga'. Digunakan untuk menyatakan rentang waktu atau tempat."
  },
  {
    id: 'p3',
    sentence: 'あそこに猫 ___ います。',
    translation: 'Di sana ada kucing.',
    correct: 'が',
    options: ['は', 'を', 'が', 'も'],
    explanation: "Untuk menyatakan keberadaan benda hidup menggunakan 'います', subjek penanda keberadaannya ditandai dengan partikel 'が' (ga)."
  },
  {
    id: 'p4',
    sentence: '日曜日に図書館 ___ 行きます。',
    translation: 'Saya pergi ke perpustakaan pada hari Minggu.',
    correct: 'へ',
    options: ['を', 'へ', 'で', 'が'],
    explanation: "Partikel 'へ' (he, dibaca 'e') menunjukkan arah tujuan pergerakan (pergi, datang, pulang)."
  },
  {
    id: 'p5',
    sentence: '私は箸 ___ ラーメンを食べています。',
    translation: 'Saya makan ramen menggunakan sumpit.',
    correct: 'で',
    options: ['に', 'と', 'を', 'で'],
    explanation: "Partikel 'で' (de) di sini menunjukkan alat atau metode yang digunakan untuk melakukan suatu aktivitas."
  },
  {
    id: 'p6',
    sentence: '木村さん ___ 日本語を勉強します。',
    translation: 'Saya belajar bahasa Jepang bersama Kimura-san.',
    correct: 'と',
    options: ['と', 'に', 'で', 'は'],
    explanation: "Partikel 'と' (to) digunakan untuk menyatakan melakukan aktivitas bersama dengan orang lain (bersama/dengan)."
  },
  {
    id: 'p7',
    sentence: 'これは私 ___ 傘です。',
    translation: 'Ini adalah payung milik saya.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' (no) menunjukkan kepemilikan atau menghubungkan dua buah kata benda."
  },
  {
    id: 'p8',
    sentence: '机の上 ___ 写真があります。',
    translation: 'Di atas meja ada foto.',
    correct: 'に',
    options: ['で', 'に', 'は', 'を'],
    explanation: "Partikel 'に' (ni) digunakan untuk menunjukkan letak atau keberadaan suatu benda mati ('があります')."
  },
  {
    id: 'p9',
    sentence: '田中さんは昨日学校 ___ 来ませんでした。',
    translation: 'Tanaka-san kemarin tidak datang ke sekolah.',
    correct: 'に',
    options: ['で', 'を', 'に', 'が'],
    explanation: "Partikel 'に' (ni) dapat digunakan untuk menunjukkan titik tujuan pergerakan dengan kata kerja seperti '来ます' (datang)."
  },
  {
    id: 'p10',
    sentence: '昨日デパート ___ 買い物 ___ しました。',
    translation: 'Kemarin saya berbelanja di departement store.',
    correct: 'で / を',
    options: ['で / を', 'に / を', 'へ / に', 'で / が'],
    explanation: "Partikel 'で' menunjukkan tempat berlangsungnya suatu aktivitas, sedangkan 'を' menandai objek aktivitas belanja ('買い物')."
  },
  {
    id: 'p11',
    sentence: '私も木村さん ___ 留学生です。',
    translation: 'Saya dan Kimura-san juga mahasiswa asing.',
    correct: 'も',
    options: ['は', 'も', 'が', 'の'],
    explanation: "Partikel 'も' (mo) berarti 'juga'. Digunakan untuk menggantikan partikel 'は' ketika informasi subjek memiliki kesamaan."
  },
  {
    id: 'p12',
    sentence: '私の部屋 ___ ベッド ___ 机があります。',
    translation: 'Di kamar saya ada ranjang dan meja.',
    correct: 'に / と',
    options: ['で / と', 'に / と', 'に / や', 'で / を'],
    explanation: "Partikel 'に' menyatakan keberadaan di kamar, sedangkan 'と' digunakan untuk menggabungkan dua benda secara lengkap (dan)."
  },
  {
    id: 'p13',
    sentence: '一緒に京都 ___ 行きませんか。',
    translation: 'Mau pergi ke Kyoto bersama-sama?',
    correct: 'へ',
    options: ['で', 'へ', 'を', 'が'],
    explanation: "Partikel 'へ' menunjukkan arah tujuan dari ajakan pergi ('行きませんか')."
  },
  {
    id: 'p14',
    sentence: '来週の月曜日 ___ テストがあります。',
    translation: 'Ada ujian pada hari Senin minggu depan.',
    correct: 'に',
    options: ['は', 'に', 'で', 'を'],
    explanation: "Partikel 'ni' digunakan untuk menandai waktu spesifik terjadinya suatu peristiwa atau aktivitas."
  },
  {
    id: 'p15',
    sentence: 'このペン ___ 書いてください。',
    translation: 'Tolong tulis menggunakan pulpen ini.',
    correct: 'で',
    options: ['で', 'に', 'を', 'と'],
    explanation: "Partikel 'で' menyatakan alat yang digunakan untuk menulis (pulpen)."
  },
  {
    id: 'p16',
    sentence: '日本語 ___ レポートを書きました。',
    translation: 'Saya menulis laporan dalam bahasa Jepang.',
    correct: 'で',
    options: ['に', 'で', 'を', 'と'],
    explanation: "Partikel 'で' digunakan untuk menyatakan medium bahasa yang digunakan untuk menghasilkan suatu karya/laporan."
  },
  {
    id: 'p17',
    sentence: 'パン ___ 牛乳を買いました。',
    translation: 'Saya membeli roti dan susu.',
    correct: 'と',
    options: ['と', 'や', 'の', 'で'],
    explanation: "Partikel 'と' menyatakan hubungan setara antara roti dan susu yang dibeli secara menyeluruh."
  },
  {
    id: 'p18',
    sentence: '家 ___ 学校まで自転車で２０分です。',
    translation: 'Dari rumah sampai sekolah membutuhkan waktu 20 menit menggunakan sepeda.',
    correct: 'から',
    options: ['に', 'へ', 'から', 'で'],
    explanation: "Pasangan partikel 'から' (dari) dan 'まで' (sampai) digunakan untuk mendefinisikan batas ruang asal dan tujuan."
  },
  {
    id: 'p19',
    sentence: 'スーパー ___ 果物を買いました。',
    translation: 'Saya membeli buah-buahan di supermarket.',
    correct: 'で',
    options: ['に', 'で', 'へ', 'を'],
    explanation: "Pembelian buah-buahan adalah suatu aksi/aktivitas aktif, maka tempat terjadinya aksi ditandai dengan partikel 'で'."
  },
  {
    id: 'p20',
    sentence: '私の趣味 ___ 音楽を聴くことです。',
    translation: 'Hobi saya adalah mendengarkan musik.',
    correct: 'は',
    options: ['は', 'が', 'の', 'を'],
    explanation: "Partikel 'は' (wa) menandai topik utama pembicaraan, yaitu '私の趣味' (hobi saya)."
  }
]
