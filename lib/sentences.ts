export interface SentenceItem {
  id: string
  japanese: string      // Full sentence in Japanese
  meaning: string       // Translation in Indonesian
  words: string[]       // The word blocks to be arranged
  correctOrder: string[] // Correct sequence of blocks
  requiredWords: string[] // Kanji/hiragana forms of vocab needed to unlock
}

export const SENTENCE_DB: SentenceItem[] = [
  {
    id: 's1',
    japanese: '私は日本人です。',
    meaning: 'Saya adalah orang Jepang.',
    words: ['私', 'は', '日本人', 'です'],
    correctOrder: ['私', 'は', '日本人', 'です'],
    requiredWords: ['私', '日本人']
  },
  {
    id: 's2',
    japanese: 'あなたは学生ですか。',
    meaning: 'Apakah Anda seorang mahasiswa?',
    words: ['あなた', 'は', '学生', 'ですか'],
    correctOrder: ['あなた', 'は', '学生', 'ですか'],
    requiredWords: ['あなた', '学生']
  },
  {
    id: 's3',
    japanese: '本を読みます。',
    meaning: 'Membaca buku.',
    words: ['本', 'を', '読みます'],
    correctOrder: ['本', 'を', '読みます'],
    requiredWords: ['本', '読みます']
  },
  {
    id: 's4',
    japanese: '美味しいお茶を飲みます。',
    meaning: 'Minum teh yang enak.',
    words: ['美味しい', 'お茶', 'を', '飲みます'],
    correctOrder: ['美味しい', 'お茶', 'を', '飲みます'],
    requiredWords: ['美味しい', 'お茶', '飲みます']
  },
  {
    id: 's5',
    japanese: '私はご飯を食べます。',
    meaning: 'Saya makan nasi.',
    words: ['私', 'は', 'ご飯', 'を', '食べます'],
    correctOrder: ['私', 'は', 'ご飯', 'を', '食べます'],
    requiredWords: ['私', 'ご飯', '食べます']
  },
  {
    id: 's6',
    japanese: 'これは日本の車です。',
    meaning: 'Ini adalah mobil Jepang.',
    words: ['これ', 'は', '日本', 'の', '車', 'です'],
    correctOrder: ['これ', 'は', '日本', 'の', '車', 'です'],
    requiredWords: ['これ', '日本', '車']
  },
  {
    id: 's7',
    japanese: '私の先生は日本人です。',
    meaning: 'Guru saya adalah orang Jepang.',
    words: ['私', 'の', '先生', 'は', '日本人', 'です'],
    correctOrder: ['私', 'の', '先生', 'は', '日本人', 'です'],
    requiredWords: ['私', '先生', '日本人']
  },
  {
    id: 's8',
    japanese: 'あれは誰の本ですか。',
    meaning: 'Itu (jauh) buku siapa?',
    words: ['あれ', 'は', '誰', 'の', '本', 'ですか'],
    correctOrder: ['あれ', 'は', '誰', 'の', '本', 'ですか'],
    requiredWords: ['あれ', '誰', '本']
  },
  {
    id: 's9',
    japanese: '友達と学校へ行きます。',
    meaning: 'Pergi ke sekolah bersama teman.',
    words: ['友達', 'と', '学校', 'へ', '行きます'],
    correctOrder: ['友達', 'と', '学校', 'へ', '行きます'],
    requiredWords: ['友達', '学校', '行きます']
  },
  {
    id: 's10',
    japanese: '日本語は面白いです。',
    meaning: 'Bahasa Jepang menarik.',
    words: ['日本語', 'は', '面白い', 'です'],
    correctOrder: ['日本語', 'は', '面白い', 'です'],
    requiredWords: ['日本語', '面白い']
  },
  {
    id: 's11',
    japanese: 'このカメラは高いです。',
    meaning: 'Kamera ini mahal.',
    words: ['この', 'カメラ', 'は', '高い', 'です'],
    correctOrder: ['この', 'カメラ', 'は', '高い', 'です'],
    requiredWords: ['この', 'カメラ', '高い']
  },
  {
    id: 's12',
    japanese: '私は水が欲しいです。',
    meaning: 'Saya ingin air.',
    words: ['私', 'は', '水', 'が', '欲しい', 'です'],
    correctOrder: ['私', 'は', '水', 'が', '欲しい', 'です'],
    requiredWords: ['私', '水', '欲しい']
  },
  {
    id: 's13',
    japanese: '昨日、映画を見ました。',
    meaning: 'Kemarin saya menonton film.',
    words: ['昨日', '、', '映画', 'を', '見ました'],
    correctOrder: ['昨日', '、', '映画', 'を', '見ました'],
    requiredWords: ['昨日', '映画', '見ました']
  },
  {
    id: 's14',
    japanese: '明日、日本へ来ます。',
    meaning: 'Besok datang ke Jepang.',
    words: ['明日', '、', '日本', 'へ', '来ます'],
    correctOrder: ['明日', '、', '日本', 'へ', '来ます'],
    requiredWords: ['明日', '日本', '来ます']
  },
  {
    id: 's15',
    japanese: 'パンを買いました。',
    meaning: 'Telah membeli roti.',
    words: ['パン', 'を', '買いました'],
    correctOrder: ['パン', 'を', '買いました'],
    requiredWords: ['パン', '買いました']
  },
  {
    id: 's16',
    japanese: 'あの部屋は静かです。',
    meaning: 'Kamar itu (jauh) sunyi/tenang.',
    words: ['あの', '部屋', 'は', '静か', 'です'],
    correctOrder: ['あの', '部屋', 'は', '静か', 'です'],
    requiredWords: ['あの', '部屋', '静か']
  },
  {
    id: 's17',
    japanese: '英語は難しいですか。',
    meaning: 'Apakah bahasa Inggris sulit?',
    words: ['英語', 'は', '難しい', 'ですか'],
    correctOrder: ['英語', 'は', '難しい', 'ですか'],
    requiredWords: ['英語', '難しい']
  },
  {
    id: 's18',
    japanese: 'お腹が痛いです。',
    meaning: 'Perut sakit.',
    words: ['お腹', 'が', '痛いです'],
    correctOrder: ['お腹', 'が', '痛いです'],
    requiredWords: ['お腹', '痛い']
  },
  {
    id: 's19',
    japanese: '毎日、日本語を勉強します。',
    meaning: 'Setiap hari belajar bahasa Jepang.',
    words: ['毎日', '、', '日本語', 'を', '勉強します'],
    correctOrder: ['毎日', '、', '日本語', 'を', '勉強します'],
    requiredWords: ['毎日', '日本語', '勉強します']
  },
  {
    id: 's20',
    japanese: 'ここに座ってください。',
    meaning: 'Tolong duduk di sini.',
    words: ['ここ', 'に', '座って', 'ください'],
    correctOrder: ['ここ', 'に', '座って', 'ください'],
    requiredWords: ['ここ', '座って']
  },
  {
    id: 's21',
    japanese: '時計を買いたいです。',
    meaning: 'Ingin membeli jam tangan.',
    words: ['時計', 'を', '買いたいです'],
    correctOrder: ['時計', 'を', '買いたいです'],
    requiredWords: ['時計', '買いたい']
  },
  {
    id: 's22',
    japanese: '昨日、手紙を書きました。',
    meaning: 'Kemarin saya menulis surat.',
    words: ['昨日', '、', '手紙', 'を', '書きました'],
    correctOrder: ['昨日', '、', '手紙', 'を', '書きました'],
    requiredWords: ['昨日', '手紙', '書きました']
  },
  {
    id: 's23',
    japanese: '写真を撮りましょう。',
    meaning: 'Mari mengambil foto.',
    words: ['写真', 'を', '撮りましょう'],
    correctOrder: ['写真', 'を', '撮りましょう'],
    requiredWords: ['写真', '撮りましょう']
  },
  {
    id: 's24',
    japanese: '私の猫は白くて可愛いです。',
    meaning: 'Kucing saya putih dan lucu.',
    words: ['私', 'の', '猫', 'は', '白くて', '可愛いです'],
    correctOrder: ['私', 'の', '猫', 'は', '白くて', '可愛いです'],
    requiredWords: ['私', '猫', '白い', '可愛い']
  },
  {
    id: 's25',
    japanese: '今日は天気がとてもいいですね。',
    meaning: 'Hari ini cuacanya sangat bagus ya.',
    words: ['今日', 'は', '天気', 'が', 'とても', 'いいですね'],
    correctOrder: ['今日', 'は', '天気', 'が', 'とても', 'いいですね'],
    requiredWords: ['今日', '天気', 'いい']
  }
]
