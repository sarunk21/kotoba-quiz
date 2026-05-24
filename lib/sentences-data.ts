export interface SentenceQuestion {
  id: string
  indonesian: string
  japanese: string
  blocks: string[]
  explanation: string
}

export const SENTENCE_QUESTIONS: SentenceQuestion[] = [
  {
    id: 's1',
    indonesian: 'Saya pergi ke sekolah.',
    japanese: '私は学校に行きます。',
    blocks: ['私は', '学校に', '行きます。'],
    explanation: 'Struktur dasar kalimat Jepang: Subjek (私は) + Keterangan Tempat (学校に) + Kata Kerja (行きます).'
  },
  {
    id: 's2',
    indonesian: 'Kemarin saya makan ramen di restoran.',
    japanese: '昨日はレストランでラーメンを食べました。',
    blocks: ['昨日は', 'レストランで', 'ラーメンを', '食べました。'],
    explanation: 'Struktur: Keterangan Waktu (昨日は) + Tempat Aksi (レストランで) + Objek (ラーメンを) + Kata Kerja Lampau (食べました).'
  },
  {
    id: 's3',
    indonesian: 'Ini adalah payung milik saya.',
    japanese: 'これは私の傘です。',
    blocks: ['これは', '私の', '傘です。'],
    explanation: 'Pola kepemilikan menggunakan partikel の: Subjek (これは) + Pemilik (私の) + Benda (傘です).'
  },
  {
    id: 's4',
    indonesian: 'Hobi saya adalah mendengarkan musik.',
    japanese: '私の趣味は音楽を聴くことです。',
    blocks: ['私の趣味は', '音楽を', '聴くことです。'],
    explanation: 'Pola membuat kata kerja menjadi kata benda (nominalisasi): Hobi saya (私の趣味は) + musik (音楽を) + hal mendengarkan (聴くことです).'
  },
  {
    id: 's5',
    indonesian: 'Tolong tulis menggunakan pulpen ini.',
    japanese: 'このペンで書いてください。',
    blocks: ['このペンで', '書いて', 'ください。'],
    explanation: 'Pola permohonan santun てください: Alat (このペンで) + Tulis (書いて) + Tolong (ください).'
  },
  {
    id: 's6',
    indonesian: 'Di atas meja ada foto.',
    japanese: '机の上に写真があります。',
    blocks: ['机の上に', '写真が', 'あります。'],
    explanation: 'Menyatakan keberadaan benda mati: Posisi (机の上に) + Benda (写真が) + Ada (あります).'
  },
  {
    id: 's7',
    indonesian: 'Saya tidur jam 10 setiap malam.',
    japanese: '毎晩１０時に寝ます。',
    blocks: ['毎晩', '１０時に', '寝ます。'],
    explanation: 'Keterangan waktu berulang (毎晩) + Waktu spesifik dengan に (１０時に) + Kata kerja (寝ます).'
  },
  {
    id: 's8',
    indonesian: 'Cuaca hari ini sangat bagus.',
    japanese: '今日の天気はとてもいいです。',
    blocks: ['今日の', '天気は', 'とても', 'いいです。'],
    explanation: 'Penggabungan Noun (今日の天気は) + Adverb intensitas (とても) + Adjektiva (いいです).'
  },
  {
    id: 's9',
    indonesian: 'Mau minum kopi bersama-sama?',
    japanese: '一緒にコーヒーを飲みませんか。',
    blocks: ['一緒に', 'コーヒーを', '飲みませんか。'],
    explanation: 'Pola ajakan sopan ませんか: Bersama-sama (一緒に) + Objek (コーヒーを) + Maukah minum (飲みませんか).'
  },
  {
    id: 's10',
    indonesian: 'Kemarin adalah hari libur yang menyenangkan.',
    japanese: '昨日は楽しい休みでした。',
    blocks: ['昨日は', '楽しい', '休みでした。'],
    explanation: 'Adjektiva -i langsung menerangkan kata benda: Kemarin (昨日は) + menyenangkan (楽しい) + hari libur lampau (休みでした).'
  },
  {
    id: 's11',
    indonesian: 'Kakak laki-laki saya tinggal di Tokyo.',
    japanese: '私の兄は東京に住んでいます。',
    blocks: ['私の兄は', '東京に', '住んでいます。'],
    explanation: 'Menyatakan tempat tinggal/domisili saat ini (住んでいます) yang selalu berpasangan dengan partikel に.'
  },
  {
    id: 's12',
    indonesian: 'Film ini tidak begitu menarik.',
    japanese: 'この映画はあまり面白くないです。',
    blocks: ['この映画は', 'あまり', '面白くないです。'],
    explanation: 'Kata negatif あまり (tidak begitu) berpasangan dengan bentuk negatif adjektiva (面白くないです).'
  },
  {
    id: 's13',
    indonesian: 'Saya ingin membeli mobil baru.',
    japanese: '新しい車を買いたいです。',
    blocks: ['新しい', '車を', '買いたいです。'],
    explanation: 'Pola keinginan たい: adjektiva (新しい) + objek (車を) + ingin membeli (買いたいです).'
  },
  {
    id: 's14',
    indonesian: 'Tolong jangan merokok di sini.',
    japanese: 'ここでタバコを吸わないでください。',
    blocks: ['ここで', 'タバコを', '吸わないで', 'ください。'],
    explanation: 'Pola larangan halus ないでください: Tempat (ここで) + Objek (タバコを) + Jangan merokok (吸わないでください).'
  },
  {
    id: 's15',
    indonesian: 'Bahasa Jepang susah tapi menarik.',
    japanese: '日本語は難しいですが面白いです。',
    blocks: ['日本語は', '難しいですが', '面白いです。'],
    explanation: 'Pola pertentangan menggunakan が (tetapi): Bahasa Jepang (日本語は) + susah tapi (難しいですが) + menarik (面白いです).'
  }
]
