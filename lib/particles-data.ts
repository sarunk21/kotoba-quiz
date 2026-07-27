export interface ParticleQuestion {
  id: string
  sentence: string
  translation: string
  correct: string
  options: string[]
  explanation: string
}

export const PARTICLE_QUESTIONS: ParticleQuestion[] = [
  // --- PARTIKEL は (wa) ---
  {
    id: 'p1',
    sentence: '私 ___ 日本語の学生です。',
    translation: 'Saya adalah siswa bahasa Jepang.',
    correct: 'は',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Partikel 'は' (wa) menandai '私' (saya) sebagai topik utama pembicaraan."
  },
  {
    id: 'p20',
    sentence: '私の趣味 ___ 音楽を聴くことです。',
    translation: 'Hobi saya adalah mendengarkan musik.',
    correct: 'は',
    options: ['は', 'gあ', 'の', 'を'],
    explanation: "Partikel 'は' (wa) menandai topik utama pembicaraan, yaitu '私の趣味' (hobi saya)."
  },
  {
    id: 'p21',
    sentence: '鈴木さん ___ 日本の先生です。',
    translation: 'Suzuki-san adalah guru bahasa Jepang.',
    correct: 'は',
    options: ['は', 'が', 'を', 'の'],
    explanation: "Partikel 'は' menandai 'Suzuki-san' sebagai topik utama kalimat."
  },
  {
    id: 'p36',
    sentence: '私の妹 ___ 大学生です。',
    translation: 'Adik perempuan saya adalah mahasiswa.',
    correct: 'は',
    options: ['は', 'が', 'を', 'の'],
    explanation: "Partikel 'は' menetapkan '妹' (adik perempuan saya) sebagai topik utama."
  },
  {
    id: 'p44',
    sentence: 'この部屋 ___ 静かですね。',
    translation: 'Kamar ini sunyi/tenang ya.',
    correct: 'は',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Partikel 'は' menandai kamar ini ('この部屋') sebagai topik utama yang dijelaskan."
  },
  {
    id: 'p51',
    sentence: '田中さん ___ 明日休みです。',
    translation: 'Tanaka-san besok libur.',
    correct: 'は',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Partikel 'は' menyorot Tanaka-san sebagai topik utama."
  },
  {
    id: 'p52',
    sentence: '肉は食べますが、魚 ___ 食べません。',
    translation: 'Daging saya makan, tapi kalau ikan tidak saya makan.',
    correct: 'は',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Partikel 'は' digunakan di sini untuk menyatakan perbandingan/kontras."
  },
  {
    id: 'p53',
    sentence: '富士山 ___ 日本で一番高い山です。',
    translation: 'Gunung Fuji adalah gunung tertinggi di Jepang.',
    correct: 'は',
    options: ['は', 'が', 'を', 'で'],
    explanation: "Partikel 'は' menyorot Gunung Fuji sebagai topik yang dibahas."
  },
  {
    id: 'p54',
    sentence: '今日 ___ 天気がとてもいいです。',
    translation: 'Hari ini cuacanya sangat bagus.',
    correct: 'は',
    options: ['は', 'が', 'を', 'で'],
    explanation: "Partikel 'は' menyorot waktu '今日' (hari ini) sebagai batas topik pembicaraan."
  },
  {
    id: 'p55',
    sentence: 'お酒 ___ 飲みませんが、お茶は飲みます。',
    translation: 'Sake tidak saya minum, tapi teh saya minum.',
    correct: 'は',
    options: ['は', 'を', 'が', 'に'],
    explanation: "Partikel 'は' berfungsi menyatakan kontras antara sake dan teh."
  },
  {
    id: 'p56',
    sentence: 'この本 ___ 面白いです。',
    translation: 'Buku ini menarik.',
    correct: 'は',
    options: ['は', 'が', 'を', 'の'],
    explanation: "Partikel 'は' menyorot 'buku ini' sebagai topik utama."
  },
  {
    id: 'p57',
    sentence: '父 ___ 医者です。母は教師です。',
    translation: 'Ayah adalah dokter. Ibu adalah guru.',
    correct: 'は',
    options: ['は', 'が', 'の', 'を'],
    explanation: "Partikel 'は' menyorot 'Ayah' sebagai topik pertama yang dibandingkan dengan 'Ibu'."
  },
  {
    id: 'p58',
    sentence: '東京 ___ 日本の首都です。',
    translation: 'Tokyo adalah ibu kota Jepang.',
    correct: 'は',
    options: ['は', 'が', 'で', 'に'],
    explanation: "Partikel 'は' menandai Tokyo sebagai topik pembicaraan."
  },
  {
    id: 'p59',
    sentence: '私 ___ インドネシア人です。',
    translation: 'Saya adalah orang Indonesia.',
    correct: 'は',
    options: ['は', 'が', 'を', 'の'],
    explanation: "Partikel 'は' menyorot 'saya' sebagai topik utama identitas."
  },
  {
    id: 'p60',
    sentence: '漢字 ___ 難しいですが、面白いです。',
    translation: 'Kanji itu susah, tetapi menarik.',
    correct: 'は',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Partikel 'は' menyorot 'Kanji' sebagai topik utama."
  },

  // --- PARTIKEL が (ga) ---
  {
    id: 'p3',
    sentence: 'あそこに猫 ___ います。',
    translation: 'Di sana ada kucing.',
    correct: 'が',
    options: ['は', 'を', 'が', 'も'],
    explanation: "Untuk menyatakan keberadaan benda hidup dengan 'います', subjeknya ditandai dengan 'が'."
  },
  {
    id: 'p22',
    sentence: '今日はとても天気 ___ いいですね。',
    translation: 'Hari ini cuacanya sangat bagus ya.',
    correct: 'が',
    options: ['は', 'gあ', 'を', 'に'],
    explanation: "Kata sifat 'いい' (bagus) menerangkan subjek '天気' (cuaca), memakai partikel 'が'."
  },
  {
    id: 'p23',
    sentence: 'のど ___ 渇きました。お茶を飲みたいです。',
    translation: 'Tenggorokan saya kering (haus). Saya ingin minum teh.',
    correct: 'が',
    options: ['を', 'が', 'は', 'に'],
    explanation: "Frasa 'のどが渇く' (haus) adalah sensasi tubuh yang selalu memakai partikel 'が'."
  },
  {
    id: 'p24',
    sentence: 'お腹 ___ 空きましたね。ラーメンを食べましょう。',
    translation: 'Perut saya kosong (lapar) ya. Mari makan ramen.',
    correct: 'が',
    options: ['を', 'が', 'は', 'で'],
    explanation: "Frasa 'お腹が空く' (lapar) selalu menggunakan partikel subjek 'が'."
  },
  {
    id: 'p25',
    sentence: 'あなたは日本語 ___ 上手ですね！',
    translation: 'Kamu pandai bahasa Jepang ya!',
    correct: 'が',
    options: ['を', 'が', 'は', 'に'],
    explanation: "Keahlian/kemampuan seperti '上手' (pandai) memerlukan partikel 'が' untuk objek kemampuannya."
  },
  {
    id: 'p37',
    sentence: '頭 ___ 痛いです。風邪をひきました。',
    translation: 'Kepala saya sakit. Saya masuk angin.',
    correct: 'が',
    options: ['を', 'が', 'は', 'に'],
    explanation: "Sensasi rasa sakit pada tubuh ('頭が痛い') ditandai dengan partikel subjek 'が'."
  },
  {
    id: 'p45',
    sentence: '桜の花 ___ とても綺麗です。',
    translation: 'Bunga sakura sangat indah.',
    correct: 'が',
    options: ['を', 'が', 'に', 'で'],
    explanation: "Subjek deskripsi kata sifat '綺麗' ditandai dengan partikel 'が'."
  },
  {
    id: 'p61',
    sentence: '雨 ___ 降っていますから、傘を持っていきます。',
    translation: 'Karena hujan sedang turun, saya membawa payung.',
    correct: 'が',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Fenomena alam seperti hujan turun ('雨が降る') ditandai dengan partikel 'が'."
  },
  {
    id: 'p62',
    sentence: '誰 ___ 来ましたか。',
    translation: 'Siapa yang datang?',
    correct: 'が',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Kata tanya sebagai subjek ('誰') selalu diikuti partikel 'が', tidak pernah 'は'."
  },
  {
    id: 'p63',
    sentence: '私 ___ やりますから、心配しないでください。',
    translation: 'Sayalah yang akan melakukannya, jangan khawatir.',
    correct: 'が',
    options: ['は', 'が', 'を', 'で'],
    explanation: "Menunjuk pelaku spesifik ('Sayalah orangnya') menggunakan partikel 'が'."
  },
  {
    id: 'p64',
    sentence: '私は歌 ___ 下手です。',
    translation: 'Saya tidak pandai bernyanyi.',
    correct: 'が',
    options: ['を', 'が', 'は', 'に'],
    explanation: "Ketidakmampuan/kelemahan ('下手') ditandai dengan partikel 'が'."
  },
  {
    id: 'p65',
    sentence: '机の上にパソコン ___ あります。',
    translation: 'Di atas meja ada komputer.',
    correct: 'が',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Keberadaan benda mati dengan 'あります' ditandai dengan partikel subjek 'が'."
  },
  {
    id: 'p66',
    sentence: 'いい匂い ___ しますね。何を作っていますか。',
    translation: 'Baunya harum ya. Sedang membuat apa?',
    correct: 'が',
    options: ['を', 'が', 'は', 'に'],
    explanation: "Sensasi bau/rasa/suara ('匂いがする') ditandai dengan partikel 'が'."
  },
  {
    id: 'p67',
    sentence: 'お金 ___ ありませんから、買いません。',
    translation: 'Karena tidak ada uang, saya tidak membeli.',
    correct: 'が',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Keberadaan/ketiadaan kepemilikan ('お金がない') ditandai dengan 'が'."
  },
  {
    id: 'p68',
    sentence: '車 ___ ほしいです。',
    translation: 'Saya ingin mobil.',
    correct: 'が',
    options: ['を', 'が', 'は', 'に'],
    explanation: "Keinginan akan benda ('ほしい') ditandai dengan partikel 'が'."
  },

  // --- PARTIKEL を (o) ---
  {
    id: 'p2',
    sentence: '私は毎日テレビ ___ 見ます。',
    translation: 'Saya menonton TV setiap hari.',
    correct: 'を',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Partikel 'を' (o) menandai objek langsung dari kata kerja '見ます' (menonton)."
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
    id: 'p69',
    sentence: '朝ご飯 ___ 食べましたか。',
    translation: 'Apakah sudah makan sarapan pagi?',
    correct: 'を',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Sarapan pagi ('朝ご飯') adalah objek dari kata kerja makan ('食べました')."
  },
  {
    id: 'p70',
    sentence: '毎朝７時に家 ___ 出ます。',
    translation: 'Setiap pagi keluar/meninggalkan rumah jam 7.',
    correct: 'を',
    options: ['に', 'で', 'を', 'から'],
    explanation: "Tempat yang ditinggalkan atau dikeluari ('家を出る') ditandai dengan partikel 'を'."
  },
  {
    id: 'p71',
    sentence: '公園 ___ 散歩します。',
    translation: 'Berjalan-jalan melewati/di taman.',
    correct: 'を',
    options: ['で', 'に', 'を', 'へ'],
    explanation: "Area/ruang yang dilalui saat pergerakan ('散歩する') ditandai dengan partikel 'を'."
  },
  {
    id: 'p72',
    sentence: '音楽 ___ 聴きながら勉強します。',
    translation: 'Belajar sambil mendengarkan musik.',
    correct: 'を',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Musik adalah objek langsung dari kata kerja '聴く' (mendengarkan)."
  },
  {
    id: 'p73',
    sentence: '薬 ___ 飲んで、早く寝てください。',
    translation: 'Minumlah obat dan tidurlah lebih cepat.',
    correct: 'を',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Obat ('薬') adalah objek langsung dari kata kerja minum obat ('飲んで')."
  },
  {
    id: 'p74',
    sentence: '写真をたくさん ___ 撮りました。',
    translation: 'Saya mengambil banyak foto.',
    correct: 'を',
    options: ['は', 'が', 'を', 'で'],
    explanation: "Foto adalah objek langsung dari kata kerja '撮る' (mengambil foto)."
  },
  {
    id: 'p75',
    sentence: '橋 ___ 渡ると、右側に銀行があります。',
    translation: 'Kalau menyeberangi jembatan, di sebelah kanan ada bank.',
    correct: 'を',
    options: ['に', 'で', 'を', 'へ'],
    explanation: "Jembatan ('橋') adalah tempat yang diseberangi/dilalui, menggunakan partikel 'を'."
  },
  {
    id: 'p76',
    sentence: '宿題 ___ 忘れました。',
    translation: 'Saya lupa PR.',
    correct: 'を',
    options: ['は', 'が', 'を', 'に'],
    explanation: "PR ('宿題') adalah objek langsung dari kata kerja '忘れる' (lupa)."
  },
  {
    id: 'p77',
    sentence: 'ドア ___ 開けてください。',
    translation: 'Tolong bukakan pintu.',
    correct: 'を',
    options: ['は', 'が', 'を', 'に'],
    explanation: "Pintu ('ドア') adalah objek dari kata kerja '開ける' (membuka)."
  },
  {
    id: 'p78',
    sentence: '靴 ___ 脱いで、中に入ってください。',
    translation: 'Tolong lepas sepatu dan masuklah ke dalam.',
    correct: 'を',
    options: ['は', 'が', 'を', 'で'],
    explanation: "Sepatu adalah objek dari kata kerja '脱ぐ' (melepas pakaian/sepatu)."
  },

  // --- PARTIKEL に (ni) ---
  {
    id: 'p8',
    sentence: '机の上 ___ 写真があります。',
    translation: 'Di atas meja ada foto.',
    correct: 'に',
    options: ['で', 'に', 'は', 'を'],
    explanation: "Partikel 'に' (ni) digunakan untuk menunjukkan letak atau keberadaan benda mati ('があります')."
  },
  {
    id: 'p9',
    sentence: '田中さんは昨日学校 ___ 来ませんでした。',
    translation: 'Tanaka-san kemarin tidak datang ke sekolah.',
    correct: 'に',
    options: ['で', 'を', 'に', 'が'],
    explanation: "Partikel 'に' menunjukkan titik tujuan pergerakan dengan kata kerja seperti '来ます' (datang)."
  },
  {
    id: 'p14',
    sentence: '来週の月曜日 ___ テストがあります。',
    translation: 'Ada ujian pada hari Senin minggu depan.',
    correct: 'に',
    options: ['は', 'に', 'で', 'を'],
    explanation: "Partikel 'に' digunakan untuk menandai waktu spesifik terjadinya suatu peristiwa."
  },
  {
    id: 'p29',
    sentence: '私はいつも夜１１時 ___ 寝ます。',
    translation: 'Saya selalu tidur jam 11 malam.',
    correct: 'に',
    options: ['で', 'に', 'は', 'を'],
    explanation: "Partikel 'に' menandai titik waktu spesifik (jam 11 malam)."
  },
  {
    id: 'p31',
    sentence: '部屋 ___ 誰もいません。',
    translation: 'Di kamar tidak ada siapa-siapa.',
    correct: 'に',
    options: ['で', 'に', 'へ', 'は'],
    explanation: "Partikel 'に' menunjukkan lokasi keberadaan orang ('いません')."
  },
  {
    id: 'p41',
    sentence: 'テストは３時 ___ 終わります。',
    translation: 'Ujian selesai pada jam 3.',
    correct: 'に',
    options: ['で', 'に', 'は', 'を'],
    explanation: "Partikel 'に' menandai titik waktu spesifik berakhirnya ujian."
  },
  {
    id: 'p42',
    sentence: '友達 ___ プレゼントをあげました。',
    translation: 'Saya memberi hadiah kepada teman.',
    correct: 'に',
    options: ['を', 'に', 'で', 'と'],
    explanation: "Teman ('友達') adalah penerima hadiah, ditandai dengan partikel penerima 'に'."
  },
  {
    id: 'p43',
    sentence: '先生 ___ 本を借りました。',
    translation: 'Saya meminjam buku dari guru.',
    correct: 'に',
    options: ['に', 'を', 'で', 'と'],
    explanation: "Partikel 'に' menandai sumber asal dari aksi meminjam ('借りました')."
  },
  {
    id: 'p79',
    sentence: '電車 ___ 乗って、新宿へ行きます。',
    translation: 'Naik kereta, lalu pergi ke Shinjuku.',
    correct: 'に',
    options: ['を', 'で', 'に', 'へ'],
    explanation: "Sasaran yang dinaiki ('乗る') ditandai dengan partikel 'に'."
  },
  {
    id: 'p80',
    sentence: '明日、友達 ___ 会う約束があります。',
    translation: 'Besok ada janji bertemu dengan teman.',
    correct: 'に',
    options: ['と', 'に', 'を', 'で'],
    explanation: "Target orang yang ditemui ('会う') ditandai dengan partikel 'に'."
  },
  {
    id: 'p81',
    sentence: '日本 ___ 住んでいます。',
    translation: 'Saya tinggal di Jepang.',
    correct: 'に',
    options: ['で', 'に', 'へ', 'を'],
    explanation: "Lokasi tempat tinggal menetap ('住む') ditandai dengan partikel 'に'."
  },
  {
    id: 'p82',
    sentence: '壁 ___ カレンダーをかけました。',
    translation: 'Saya menggantungkan kalender di dinding.',
    correct: 'に',
    options: ['で', 'に', 'を', 'へ'],
    explanation: "Lokasi penempatan/penempelan benda ('かける') ditandai dengan 'に'."
  },
  {
    id: 'p83',
    sentence: 'ノート ___ 名前を書きました。',
    translation: 'Saya menulis nama di buku catatan.',
    correct: 'に',
    options: ['で', 'に', 'を', 'へ'],
    explanation: "Media tempat tulisan ditempelkan/ditorehkan ditandai dengan 'に'."
  },

  // --- PARTIKEL で (de) ---
  {
    id: 'p5',
    sentence: '私は箸 ___ ラーメンを食べています。',
    translation: 'Saya makan ramen menggunakan sumpit.',
    correct: 'で',
    options: ['に', 'と', 'を', 'で'],
    explanation: "Partikel 'で' (de) menunjukkan alat atau metode yang digunakan."
  },
  {
    id: 'p10',
    sentence: '昨日デパート ___ 買い物をする。',
    translation: 'Kemarin berbelanja di departement store.',
    correct: 'で',
    options: ['で', 'に', 'へ', 'が'],
    explanation: "Partikel 'で' menunjukkan tempat berlangsungnya aktivitas belanja."
  },
  {
    id: 'p15',
    sentence: 'このペン ___ 書いてください。',
    translation: 'Tolong tulis menggunakan pulpen ini.',
    correct: 'で',
    options: ['で', 'に', 'を', 'と'],
    explanation: "Partikel 'で' menyatakan alat yang digunakan untuk menulis."
  },
  {
    id: 'p16',
    sentence: '日本語 ___ レポートを書きました。',
    translation: 'Saya menulis laporan dalam bahasa Jepang.',
    correct: 'で',
    options: ['に', 'で', 'を', 'と'],
    explanation: "Partikel 'で' menyatakan medium bahasa yang digunakan."
  },
  {
    id: 'p19',
    sentence: 'スーパー ___ 果物を買いました。',
    translation: 'Saya membeli buah-buahan di supermarket.',
    correct: 'で',
    options: ['に', 'で', 'へ', 'を'],
    explanation: "Tempat berlangsungnya aksi aktif (membeli) ditandai dengan partikel 'で'."
  },
  {
    id: 'p32',
    sentence: '毎日スプーン ___ ご飯を食べます。',
    translation: 'Setiap hari makan nasi memakai sendok.',
    correct: 'で',
    options: ['を', 'に', 'で', 'と'],
    explanation: "Sendok adalah alat bantu untuk makan, ditandai dengan 'で'."
  },
  {
    id: 'p33',
    sentence: 'カメラ ___ 写真を撮ります。',
    translation: 'Mengambil foto menggunakan kamera.',
    correct: 'で',
    options: ['に', 'を', 'と', 'で'],
    explanation: "Kamera adalah alat/sarana mengambil foto, ditandai dengan 'で'."
  },
  {
    id: 'p38',
    sentence: '毎週土曜日、公園 ___ サッカーをします。',
    translation: 'Setiap hari Sabtu, bermain sepak bola di taman.',
    correct: 'で',
    options: ['に', 'で', 'へ', 'を'],
    explanation: "Taman adalah lokasi tempat berlangsungnya aktivitas aktif bermain sepak bola."
  },
  {
    id: 'p39',
    sentence: '鈴木さんは英語 ___ レポートを書きました。',
    translation: 'Suzuki-san menulis laporan dalam bahasa Inggris.',
    correct: 'で',
    options: ['に', 'で', 'を', 'の'],
    explanation: "Bahasa Inggris adalah sarana/medium bahasa penulisan laporan."
  },
  {
    id: 'p84',
    sentence: 'バス ___ 会社へ行きます。',
    translation: 'Pergi ke kantor naik bus.',
    correct: 'で',
    options: ['に', 'で', 'へ', 'を'],
    explanation: "Bus adalah sarana transportasi yang dipakai, ditandai dengan 'で'."
  },
  {
    id: 'p85',
    sentence: '風邪 ___ 学校を休みました。',
    translation: 'Absen/tidak masuk sekolah karena masuk angin.',
    correct: 'で',
    options: ['に', 'で', 'から', 'を'],
    explanation: "Partikel 'で' dapat menyatakan alasan/penyebab kejadian ('karena masuk angin')."
  },
  {
    id: 'p86',
    sentence: '世界 ___ 一番高い山は富士山ではありません。',
    translation: 'Gunung tertinggi di dunia bukanlah Gunung Fuji.',
    correct: 'で',
    options: ['に', 'で', 'の', 'は'],
    explanation: "Partikel 'で' menandai cakupan/wilayah batasan ('di dunia')."
  },
  {
    id: 'p87',
    sentence: '一人 ___ 行きますから、大丈夫です。',
    translation: 'Saya akan pergi sendirian, jadi tidak apa-apa.',
    correct: 'で',
    options: ['に', 'で', 'と', 'は'],
    explanation: "Frasa '一人で' (sendirian) menggunakan partikel 'で' untuk menandai kondisi jumlah orang."
  },

  // --- PARTIKEL の (no) ---
  {
    id: 'p7',
    sentence: 'これは私 ___ 傘です。',
    translation: 'Ini adalah payung milik saya.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' (no) menunjukkan kepemilikan atau merekatkan dua kata benda."
  },
  {
    id: 'p27',
    sentence: '私は日本 ___ 音楽が好きです。',
    translation: 'Saya suka musik Jepang.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' merekatkan dua kata benda untuk menerangkan kategori musiknya."
  },
  {
    id: 'p28',
    sentence: 'これは日本語 ___ 本ですか。',
    translation: 'Apakah ini buku bahasa Jepang?',
    correct: 'の',
    options: ['は', 'が', 'の', 'で'],
    explanation: "Partikel 'の' merekatkan kata benda '日本語' dengan '本'."
  },
  {
    id: 'p50',
    sentence: '私は日本 ___ アニメが好きです。',
    translation: 'Saya suka anime Jepang.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' merekatkan '日本' dengan 'アニメ' untuk menunjukkan hubungan asal-usul."
  },
  {
    id: 'p88',
    sentence: '会社の前に私 ___ 車があります。',
    translation: 'Di depan kantor ada mobil saya.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' menandai hubungan kepemilikan ('mobil saya')."
  },
  {
    id: 'p89',
    sentence: '大学 ___ 先生に相談しました。',
    translation: 'Saya berkonsultasi dengan dosen universitas.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' menerangkan afiliasi/kategori ('dosen universitas')."
  },
  {
    id: 'p90',
    sentence: '机 ___ 下に猫がいます。',
    translation: 'Di bawah meja ada kucing.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' merekatkan lokasi '机' (meja) dengan posisi '下' (bawah)."
  },
  {
    id: 'p91',
    sentence: '父 ___ 時計はとても古いですが、大切です。',
    translation: 'Jam tangan ayah sangat tua, tetapi berharga.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' menunjukkan kepemilikan jam tangan milik ayah."
  },
  {
    id: 'p92',
    sentence: '来週 ___ 予定を教えてください。',
    translation: 'Tolong beritahu jadwal minggu depan.',
    correct: 'の',
    options: ['は', 'の', 'が', 'に'],
    explanation: "Partikel 'の' merekatkan kurun waktu '来週' dengan kata benda '予定' (jadwal)."
  },

  // --- PARTIKEL LAINNYA (へ, と, も, から, まで) ---
  {
    id: 'p4',
    sentence: '日曜日に図書館 ___ 行きます。',
    translation: 'Saya pergi ke perpustakaan pada hari Minggu.',
    correct: 'へ',
    options: ['を', 'へ', 'で', 'が'],
    explanation: "Partikel 'へ' (e) menunjukkan arah tujuan pergerakan fisik (pergi, datang, pulang)."
  },
  {
    id: 'p6',
    sentence: '木村さん ___ 日本語を勉強します。',
    translation: 'Saya belajar bahasa Jepang bersama Kimura-san.',
    correct: 'と',
    options: ['と', 'に', 'で', 'は'],
    explanation: "Partikel 'と' (to) menyatakan melakukan aktivitas bersama dengan orang lain."
  },
  {
    id: 'p11',
    sentence: '私も木村さん ___ 留学生です。',
    translation: 'Saya dan Kimura-san juga mahasiswa asing.',
    correct: 'も',
    options: ['は', 'も', 'が', 'の'],
    explanation: "Partikel 'も' (mo) berarti 'juga'."
  },
  {
    id: 'p13',
    sentence: '一緒に京都 ___ 行きませんか。',
    translation: 'Mau pergi ke Kyoto bersama-sama?',
    correct: 'へ',
    options: ['で', 'へ', 'を', 'が'],
    explanation: "Partikel 'へ' menunjukkan arah tujuan dari ajakan pergi."
  },
  {
    id: 'p17',
    sentence: 'パン ___ 牛乳を買いました。',
    translation: 'Saya membeli roti dan susu.',
    correct: 'と',
    options: ['と', 'や', 'の', 'で'],
    explanation: "Partikel 'と' menyatakan hubungan setara antara dua kata benda (dan)."
  },
  {
    id: 'p18',
    sentence: '家 ___ 学校まで自転車で２０分です。',
    translation: 'Dari rumah sampai sekolah membutuhkan waktu 20 menit naik sepeda.',
    correct: 'から',
    options: ['に', 'へ', 'から', 'で'],
    explanation: "Pasangan 'から' (dari) dan 'まで' (sampai) mendefinisikan batas asal dan tujuan."
  },
  {
    id: 'p30',
    sentence: '来月、友達 ___ 一緒に旅行します。',
    translation: 'Bulan depan, saya akan berwisata bersama teman.',
    correct: 'と',
    options: ['と', 'に', 'で', 'は'],
    explanation: "Partikel 'と' menyatakan kebersamaan ('bersama teman')."
  },
  {
    id: 'p34',
    sentence: '明日、東京 ___ 行きます。',
    translation: 'Besok, saya pergi ke Tokyo.',
    correct: 'へ',
    options: ['を', 'へ', 'で', 'が'],
    explanation: "Partikel 'へ' menandai arah tujuan pergerakan."
  },
  {
    id: 'p35',
    sentence: 'お父さん ___ お母さんは元気ですか。',
    translation: 'Apakah ayah dan ibu sehat?',
    correct: 'と',
    options: ['と', 'や', 'の', 'で'],
    explanation: "Partikel 'と' menghubungkan dua kata benda setara (Ayah dan Ibu)."
  },
  {
    id: 'p40',
    sentence: '学校 ___ 郵便局まで歩いて行きます。',
    translation: 'Berjalan kaki dari sekolah sampai kantor pos.',
    correct: 'から',
    options: ['に', 'から', 'で', 'へ'],
    explanation: "Partikel 'から' menandai titik awal lokasi perjalanan."
  },
  {
    id: 'p46',
    sentence: '犬 ___ 猫が好きです。',
    translation: 'Saya suka anjing dan kucing.',
    correct: 'と',
    options: ['と', 'や', 'の', 'で'],
    explanation: "Partikel 'と' menghubungkan dua kata benda secara lengkap (dan)."
  },
  {
    id: 'p47',
    sentence: '昨日は１０時 ___ １２時まで勉強しました。',
    translation: 'Kemarin belajar dari jam 10 sampai jam 12.',
    correct: 'から',
    options: ['に', 'から', 'で', 'へ'],
    explanation: "Partikel 'から' menandai waktu dimulainya aktivitas."
  },
  {
    id: 'p48',
    sentence: 'パン ___ バナナを買いました。',
    translation: 'Saya membeli roti dan pisang.',
    correct: 'と',
    options: ['と', 'や', 'の', 'で'],
    explanation: "Partikel 'と' menggabungkan dua benda setara."
  },
  {
    id: 'p49',
    sentence: '毎週日曜日、海 ___ 行きます。',
    translation: 'Setiap hari Minggu, pergi ke laut.',
    correct: 'へ',
    options: ['を', 'へ', 'で', 'が'],
    explanation: "Partikel 'へ' menandai arah tujuan pergerakan."
  },
  {
    id: 'p93',
    sentence: '田中さんも山田さん ___ 会議に出席しました。',
    translation: 'Tanaka-san dan Yamada-san juga menghadiri rapat.',
    correct: 'も',
    options: ['は', 'も', 'が', 'に'],
    explanation: "Partikel 'も' digunakan untuk menyatakan kesamaan kesertaan."
  },
  {
    id: 'p94',
    sentence: '９時 ___ ５時まで働きます。',
    translation: 'Bekerja dari jam 9 sampai jam 5.',
    correct: 'から',
    options: ['に', 'から', 'で', 'へ'],
    explanation: "Partikel 'から' (dari) menandai batas waktu awal aktivitas."
  },
  {
    id: 'p95',
    sentence: '駅 ___ バスに乗って行きます。',
    translation: 'Dari stasiun pergi naik bus.',
    correct: 'から',
    options: ['に', 'から', 'で', 'へ'],
    explanation: "Partikel 'から' menandai titik awal keberangkatan."
  },
  {
    id: 'p96',
    sentence: '月曜日 ___ 金曜日まで学校があります。',
    translation: 'Ada sekolah dari hari Senin sampai hari Jumat.',
    correct: 'から',
    options: ['に', 'から', 'で', 'へ'],
    explanation: "Partikel 'から' menandai hari awal rentang waktu."
  },
  {
    id: 'p97',
    sentence: '明日 ___ 雨が降るかもしれません。',
    translation: 'Besok pun mungkin akan turun hujan.',
    correct: 'も',
    options: ['は', 'も', 'が', 'に'],
    explanation: "Partikel 'も' menekankan kemungkinan atau kesamaan kondisi."
  },
  {
    id: 'p98',
    sentence: '故郷 ___ 手紙が届きました。',
    translation: 'Surat telah sampai dari kampung halaman.',
    correct: 'から',
    options: ['に', 'から', 'で', 'へ'],
    explanation: "Partikel 'から' menandai tempat asal terikrimnya surat."
  },
  {
    id: 'p99',
    sentence: '国 ___ 家族に電話をかけました。',
    translation: 'Saya menelepon keluarga dari tanah air.',
    correct: 'から',
    options: ['に', 'から', 'で', 'へ'],
    explanation: "Partikel 'から' menandai lokasi awal panggilan telepon."
  },
  {
    id: 'p100',
    sentence: '日本 ___ 行ったことがありますか。',
    translation: 'Apakah pernah pergi ke Jepang?',
    correct: 'へ',
    options: ['を', 'へ', 'で', 'が'],
    explanation: "Partikel 'へ' menandai arah tujuan negara Jepang."
  }
]
