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
    options: ['に / へ', 'from / to', 'と / と', 'から / まで'],
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
  },
  // --- New Particle Questions ---
  {
    id: 'p21',
    sentence: '鈴木さん ___ 日本の先生です。',
    translation: 'Suzuki-san adalah guru bahasa Jepang.',
    correct: 'は',
    options: ['は', 'が', 'を', 'の'],
    explanation: "Partikel 'は' menandai 'Suzuki-san' sebagai topik utama kalimat."
  },
  {
    id: 'p22',
    sentence: '今日はとても天気 ___ いいですね。',
    translation: 'Hari ini cuacanya sangat bagus ya.',
    correct: 'が',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Kata sifat 'いい' (bagus) menerangkan subjek '天気' (cuaca), sehingga subjeknya ditandai dengan 'が'."
  },
  {
    id: 'p23',
    sentence: 'のど ___ 渇きました。お茶を飲みたいです。',
    translation: 'Tenggorokan saya kering (haus). Saya ingin minum teh.',
    correct: 'が',
    options: ['を', 'が', 'は', 'に'],
    explanation: "Frasa 'のどが渇く' (haus/tenggorokan kering) adalah ekspresi sensoris tubuh yang selalu memakai partikel 'が'."
  },
  {
    id: 'p24',
    sentence: 'お腹 ___ 空きましたね。ラーメンを食べましょう。',
    translation: 'Perut saya kosong (lapar) ya. Mari makan ramen.',
    correct: 'が',
    options: ['を', 'が', 'は', 'で'],
    explanation: "Frasa 'お腹が空く' (lapar) adalah ekspresi sensoris tubuh yang secara mutlak memakai partikel 'が'."
  },
  {
    id: 'p25',
    sentence: 'あなたは日本語 ___ 上手ですね！',
    translation: 'Kamu pandai bahasa Jepang ya!',
    correct: 'が',
    options: ['を', 'が', 'は', 'に'],
    explanation: "Kemampuan atau keahlian (seperti '上手' - pandai) memerlukan partikel 'が' untuk menandai objek kemampuannya."
  },
  {
    id: 'p26',
    sentence: '毎朝コーヒー ___ 飲みます。',
    translation: 'Setiap pagi minum kopi.',
    correct: 'を',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Kopi ('コーヒー') adalah objek langsung dari kata kerja transitif '飲みます' (minum)."
  },
  {
    id: 'p27',
    sentence: '私は日本 ___ 音楽が好きです。',
    translation: 'Saya suka musik Jepang.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' menghubungkan dua kata benda ('日本' dan '音楽') untuk menerangkan asal/jenis musiknya."
  },
  {
    id: 'p28',
    sentence: 'これは日本語 ___ 本ですか。',
    translation: 'Apakah ini buku bahasa Jepang?',
    correct: 'の',
    options: ['は', 'が', 'の', 'で'],
    explanation: "Partikel 'の' merekatkan kata benda '日本語' (bahasa Jepang) dengan '本' (buku) untuk menerangkan isinya."
  },
  {
    id: 'p29',
    sentence: '私はいつも夜１１時 ___ 寝ます。',
    translation: 'Saya selalu tidur jam 11 malam.',
    correct: 'に',
    options: ['で', 'に', 'は', 'を'],
    explanation: "Partikel 'に' digunakan untuk menandai titik waktu yang spesifik (jam 11 malam)."
  },
  {
    id: 'p30',
    sentence: '来月、友達 ___ 一緒に旅行します。',
    translation: 'Bulan depan, saya akan berwisata bersama teman.',
    correct: 'と',
    options: ['と', 'に', 'で', 'は'],
    explanation: "Partikel 'と' menyatakan kebersamaan dengan orang lain ('bersama teman')."
  },
  {
    id: 'p31',
    sentence: '部屋 ___ 誰もいません。',
    translation: 'Di kamar tidak ada siapa-siapa.',
    correct: 'に',
    options: ['で', 'に', 'へ', 'は'],
    explanation: "Partikel 'に' menunjukkan lokasi keberadaan orang ('いません' - tidak ada)."
  },
  {
    id: 'p32',
    sentence: '毎日スプーン ___ ご飯を食べます。',
    translation: 'Setiap hari makan nasi memakai sendok.',
    correct: 'で',
    options: ['を', 'に', 'で', 'と'],
    explanation: "Sendok ('スプーン') adalah alat bantu untuk melakukan aksi makan, sehingga menggunakan partikel 'で'."
  },
  {
    id: 'p33',
    sentence: 'カメラ ___ 写真を撮ります。',
    translation: 'Mengambil foto menggunakan kamera.',
    correct: 'で',
    options: ['に', 'を', 'と', 'で'],
    explanation: "Kamera ('カメラ') adalah alat/sarana yang digunakan untuk mengambil foto, maka ditandai dengan 'で'."
  },
  {
    id: 'p34',
    sentence: '明日、東京 ___ 行きます。',
    translation: 'Besok, saya pergi ke Tokyo.',
    correct: 'へ',
    options: ['を', 'へ', 'で', 'が'],
    explanation: "Partikel 'へ' menunjukkan arah tujuan dari kata kerja pergerakan '行きます' (pergi)."
  },
  {
    id: 'p35',
    sentence: 'お父さん ___ お母さんは元気ですか。',
    translation: 'Apakah ayah dan ibu sehat?',
    correct: 'と',
    options: ['と', 'や', 'の', 'で'],
    explanation: "Partikel 'と' menghubungkan dua kata benda setara secara lengkap (Ayah dan Ibu)."
  },
  {
    id: 'p36',
    sentence: '私の妹 ___ 大学生です。',
    translation: 'Adik perempuan saya adalah mahasiswa.',
    correct: 'は',
    options: ['は', 'が', 'を', 'の'],
    explanation: "Partikel 'は' menetapkan '妹' (adik perempuan saya) sebagai topik utama kalimat."
  },
  {
    id: 'p37',
    sentence: '頭 ___ 痛いです。風邪をひきました。',
    translation: 'Kepala saya sakit. Saya masuk angin.',
    correct: 'が',
    options: ['を', 'が', 'は', 'に'],
    explanation: "Frasa rasa sakit tubuh ('頭が痛い') ditandai dengan partikel subjek 'が'."
  },
  {
    id: 'p38',
    sentence: '毎週土曜日、公園 ___ サッカーをします。',
    translation: 'Setiap hari Sabtu, saya bermain sepak bola di taman.',
    correct: 'で',
    options: ['に', 'で', 'へ', 'を'],
    explanation: "Taman adalah lokasi tempat berlangsungnya aktivitas bermain sepak bola (aksi aktif), sehingga menggunakan 'で'."
  },
  {
    id: 'p39',
    sentence: '鈴木さんは英語 ___ レportを書きました。',
    translation: 'Suzuki-san menulis laporan dalam bahasa Inggris.',
    correct: 'で',
    options: ['に', 'で', 'を', 'の'],
    explanation: "Bahasa Inggris ('英語') adalah alat/medium penulisan laporan, ditandai dengan 'で'."
  },
  {
    id: 'p40',
    sentence: '学校 ___ 郵便局まで歩いて行きます。',
    translation: 'Berjalan kaki dari sekolah sampai kantor pos.',
    correct: 'から',
    options: ['に', 'から', 'で', 'へ'],
    explanation: "Partikel 'から' (dari) menandai titik awal lokasi perjalanan."
  },
  {
    id: 'p41',
    sentence: 'テストは３時 ___ 終わります。',
    translation: 'Ujian selesai pada jam 3.',
    correct: 'に',
    options: ['で', 'に', 'は', 'を'],
    explanation: "Partikel 'に' menandai titik waktu spesifik berakhirnya ujian (jam 3)."
  },
  {
    id: 'p42',
    sentence: '友達 ___ プレゼントをあげました。',
    translation: 'Saya memberi hadiah kepada teman.',
    correct: 'に',
    options: ['を', 'に', 'で', 'と'],
    explanation: "Teman ('友達') adalah penerima dari aksi pemberian hadiah, ditandai dengan partikel penerima 'に'."
  },
  {
    id: 'p43',
    sentence: '先生 ___ 本を借りました。',
    translation: 'Saya meminjam buku dari guru.',
    correct: 'に',
    options: ['に', 'を', 'で', 'と'],
    explanation: "Partikel 'に' (atau 'から') digunakan untuk menandai sumber asal dari aksi menerima/meminjam ('借りました')."
  },
  {
    id: 'p44',
    sentence: 'この部屋 ___ 静かですね。',
    translation: 'Kamar ini sunyi/tenang ya.',
    correct: 'は',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Partikel 'は' menandai kamar ini ('この部屋') sebagai topik utama yang dinilai."
  },
  {
    id: 'p45',
    sentence: '桜の花 ___ とても綺麗です。',
    translation: 'Bunga sakura sangat indah.',
    correct: 'が',
    options: ['を', 'が', 'に', 'で'],
    explanation: "Keindahan bunga sakura ('桜の花') dinyatakan sebagai subjek kata sifat '綺麗' dengan partikel 'が'."
  },
  {
    id: 'p46',
    sentence: '犬 ___ 猫が好きです。',
    translation: 'Saya suka anjing dan kucing.',
    correct: 'と',
    options: ['と', 'や', 'の', 'で'],
    explanation: "Partikel 'と' menghubungkan anjing dan kucing secara lengkap sebagai hal yang disukai."
  },
  {
    id: 'p47',
    sentence: '昨日は１０時 ___ １２時まで勉強しました。',
    translation: 'Kemarin belajar dari jam 10 sampai jam 12.',
    correct: 'から',
    options: ['に', 'から', 'で', 'へ'],
    explanation: "Partikel 'から' menandai waktu dimulainya aktivitas belajar."
  },
  {
    id: 'p48',
    sentence: 'パン ___ バナナを買いました。',
    translation: 'Saya membeli roti dan pisang.',
    correct: 'と',
    options: ['と', 'や', 'の', 'で'],
    explanation: "Partikel 'と' menggabungkan roti dan pisang secara setara sebagai objek belanjaan."
  },
  {
    id: 'p49',
    sentence: '毎週日曜日、海 ___ 行きます。',
    translation: 'Setiap hari Minggu, pergi ke laut.',
    correct: 'へ',
    options: ['を', 'へ', 'で', 'が'],
    explanation: "Partikel 'へ' menandai arah tujuan pergerakan fisik menuju laut ('海')."
  },
  {
    id: 'p50',
    sentence: '私は日本 ___ アニメが好きです。',
    translation: 'Saya suka anime Jepang.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' merekatkan kata benda '日本' dengan 'アニメ' untuk menunjukkan hubungan asal-usul."
  }
]
