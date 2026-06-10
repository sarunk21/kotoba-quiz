import type { VocabItem } from './vocab'

export const SPECIALIZED_DATA: Record<string, VocabItem[]> = {
  angka: [
    { id: 'special|angka|1', category: 'Angka', hiragana: 'いち', kanji: '一', arti: 'Satu', chapter: 'Dasar' },
    { id: 'special|angka|2', category: 'Angka', hiragana: 'に', kanji: '二', arti: 'Dua', chapter: 'Dasar' },
    { id: 'special|angka|3', category: 'Angka', hiragana: 'さん', kanji: '三', arti: 'Tiga', chapter: 'Dasar' },
    { id: 'special|angka|4', category: 'Angka', hiragana: 'よん', kanji: '四', arti: 'Empat (Yon / Shi)', chapter: 'Dasar' },
    { id: 'special|angka|5', category: 'Angka', hiragana: 'ご', kanji: '五', arti: 'Lima', chapter: 'Dasar' },
    { id: 'special|angka|6', category: 'Angka', hiragana: 'ろく', kanji: '六', arti: 'Enam', chapter: 'Dasar' },
    { id: 'special|angka|7', category: 'Angka', hiragana: 'なな', kanji: '七', arti: 'Tujuh (Nana / Shichi)', chapter: 'Dasar' },
    { id: 'special|angka|8', category: 'Angka', hiragana: 'はち', kanji: '八', arti: 'Delapan', chapter: 'Dasar' },
    { id: 'special|angka|9', category: 'Angka', hiragana: 'きゅう', kanji: '九', arti: 'Sembilan (Kyuu / Ku)', chapter: 'Dasar' },
    { id: 'special|angka|10', category: 'Angka', hiragana: 'じゅう', kanji: '十', arti: 'Sepuluh', chapter: 'Dasar' },
    { id: 'special|angka|100', category: 'Angka', hiragana: 'ひゃく', kanji: '百', arti: 'Seratus', chapter: 'Ratusan' },
    { id: 'special|angka|300', category: 'Angka', hiragana: 'さんびゃく', kanji: '三百', arti: 'Tiga Ratus (Sanbyaku - irregular)', chapter: 'Ratusan' },
    { id: 'special|angka|600', category: 'Angka', hiragana: 'ろっぴゃく', kanji: '六百', arti: 'Enam Ratus (Roppyaku - irregular)', chapter: 'Ratusan' },
    { id: 'special|angka|800', category: 'Angka', hiragana: 'はっぴゃく', kanji: '八百', arti: 'Delapan Ratus (Happyaku - irregular)', chapter: 'Ratusan' },
    { id: 'special|angka|1000', category: 'Angka', hiragana: 'せん', kanji: '千', arti: 'Seribu', chapter: 'Ribuan' },
    { id: 'special|angka|3000', category: 'Angka', hiragana: 'さんぜん', kanji: '三千', arti: 'Tiga Ribu (Sanzen - irregular)', chapter: 'Ribuan' },
    { id: 'special|angka|8000', category: 'Angka', hiragana: 'はっせん', kanji: '八千', arti: 'Delapan Ribu (Hassen - irregular)', chapter: 'Ribuan' },
    { id: 'special|angka|10000', category: 'Angka', hiragana: 'いちまん', kanji: '一万', arti: 'Sepuluh Ribu (Ichiman)', chapter: 'Ribuan' },
    { id: 'special|angka|hitotsu', category: 'Angka', hiragana: 'ひとつ', kanji: '一つ', arti: 'Satu buah (Hitotsu - benda umum)', chapter: 'Penghitung' },
    { id: 'special|angka|futatsu', category: 'Angka', hiragana: 'ふたつ', kanji: '二つ', arti: 'Dua buah (Futatsu - benda umum)', chapter: 'Penghitung' },
    { id: 'special|angka|mittsu', category: 'Angka', hiragana: 'みっつ', kanji: '三つ', arti: 'Tiga buah (Mittsu - benda umum)', chapter: 'Penghitung' },
    { id: 'special|angka|yottsu', category: 'Angka', hiragana: 'よっつ', kanji: '四つ', arti: 'Empat buah (Yottsu - benda umum)', chapter: 'Penghitung' },
    { id: 'special|angka|itsutsu', category: 'Angka', hiragana: 'いつつ', kanji: '五つ', arti: 'Lima buah (Itsutsu - benda umum)', chapter: 'Penghitung' },
    { id: 'special|angka|muttsu', category: 'Angka', hiragana: 'むっつ', kanji: '六つ', arti: 'Enam buah (Muttsu - benda umum)', chapter: 'Penghitung' },
    { id: 'special|angka|nanatsu', category: 'Angka', hiragana: 'ななつ', kanji: '七つ', arti: 'Tujuh buah (Nanatsu - benda umum)', chapter: 'Penghitung' },
    { id: 'special|angka|yattsu', category: 'Angka', hiragana: 'やっつ', kanji: '八つ', arti: 'Delapan buah (Yattsu - benda umum)', chapter: 'Penghitung' },
    { id: 'special|angka|kokonotsu', category: 'Angka', hiragana: '\u3053\u3053\u306e\u3064', kanji: '九つ', arti: 'Sembilan buah (Kokonotsu - benda umum)', chapter: 'Penghitung' },
    { id: 'special|angka|too', category: 'Angka', hiragana: 'とお', kanji: '十', arti: 'Sepuluh buah (Too - benda umum)', chapter: 'Penghitung' },
    { id: 'special|angka|hitori', category: 'Angka', hiragana: 'ひとり', kanji: '一人', arti: 'Satu orang (Hitori - irregular)', chapter: 'Orang' },
    { id: 'special|angka|futari', category: 'Angka', hiragana: 'ふたり', kanji: '二人', arti: 'Dua orang (Futari - irregular)', chapter: 'Orang' },
    { id: 'special|angka|sannin', category: 'Angka', hiragana: 'さんにん', kanji: '三人', arti: 'Tiga orang', chapter: 'Orang' },
    { id: 'special|angka|yonin', category: 'Angka', hiragana: 'よにん', kanji: '四人', arti: 'Empat orang (Yonin - irregular)', chapter: 'Orang' },
    { id: 'special|angka|ippon', category: 'Angka', hiragana: 'いっぽん', kanji: '一本', arti: 'Satu batang/botol (Ippon - benda panjang)', chapter: 'Batang' },
    { id: 'special|angka|nihon', category: 'Angka', hiragana: 'にほん', kanji: '二本', arti: 'Dua batang/botol', chapter: 'Batang' },
    { id: 'special|angka|sanbon', category: 'Angka', hiragana: 'さんぼん', kanji: '三本', arti: 'Tiga batang/botol (Sanbon - irregular)', chapter: 'Batang' },
    { id: 'special|angka|roppon', category: 'Angka', hiragana: 'ろっぽん', kanji: '六本', arti: 'Enam batang/botol (Roppon - irregular)', chapter: 'Batang' },
    { id: 'special|angka|happon', category: 'Angka', hiragana: 'はっぽん', kanji: '八本', arti: 'Delapan batang/botol (Happon - irregular)', chapter: 'Batang' },
    { id: 'special|angka|juppon', category: 'Angka', hiragana: 'じゅっぽん', kanji: '十本', arti: 'Sepuluh batang/botol (Juppon)', chapter: 'Batang' },
    { id: 'special|angka|ichimai', category: 'Angka', hiragana: 'いちまい', kanji: '一枚', arti: 'Satu lembar (Ichimai - kertas/baju)', chapter: 'Penghitung' },
    { id: 'special|angka|ikutsu', category: 'Angka', hiragana: 'いくつ', kanji: 'いくつ', arti: 'Berapa banyak buah/barang?', chapter: 'Tanya' }
  ],
  hari: [
    { id: 'special|hari|senin', category: 'Hari', hiragana: 'げつようび', kanji: '月曜日', arti: 'Hari Senin', chapter: 'Hari' },
    { id: 'special|hari|selasa', category: 'Hari', hiragana: 'かようび', kanji: '火曜日', arti: 'Hari Selasa', chapter: 'Hari' },
    { id: 'special|hari|rabu', category: 'Hari', hiragana: 'すいようび', kanji: '水曜日', arti: 'Hari Rabu', chapter: 'Hari' },
    { id: 'special|hari|kamis', category: 'Hari', hiragana: 'もくようび', kanji: '木曜日', arti: 'Hari Kamis', chapter: 'Hari' },
    { id: 'special|hari|jumat', category: 'Hari', hiragana: 'きんようび', kanji: '金曜日', arti: 'Hari Jumat', chapter: 'Hari' },
    { id: 'special|hari|sabtu', category: 'Hari', hiragana: 'どようび', kanji: '土曜日', arti: 'Hari Sabtu', chapter: 'Hari' },
    { id: 'special|hari|minggu', category: 'Hari', hiragana: 'にちようび', kanji: '日曜日', arti: 'Hari Minggu', chapter: 'Hari' },
    { id: 'special|hari|tgl1', category: 'Hari', hiragana: 'ついたち', kanji: '1日', arti: 'Tanggal 1 (Tsuitachi - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl2', category: 'Hari', hiragana: 'ふつか', kanji: '2日', arti: 'Tanggal 2 (Futsuka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl3', category: 'Hari', hiragana: 'みっか', kanji: '3日', arti: 'Tanggal 3 (Mikka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl4', category: 'Hari', hiragana: 'よっか', kanji: '4日', arti: 'Tanggal 4 (Yokka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl5', category: 'Hari', hiragana: 'いつか', kanji: '5日', arti: 'Tanggal 5 (Itsuka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl6', category: 'Hari', hiragana: 'むいか', kanji: '6日', arti: 'Tanggal 6 (Muika - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl7', category: 'Hari', hiragana: 'なのか', kanji: '7日', arti: 'Tanggal 7 (Nanoka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl8', category: 'Hari', hiragana: 'ようか', kanji: '8日', arti: 'Tanggal 8 (Youka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl9', category: 'Hari', hiragana: '\u3053\u3053\u306e\u304b', kanji: '9日', arti: 'Tanggal 9 (Kokonoka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl10', category: 'Hari', hiragana: 'とおか', kanji: '10日', arti: 'Tanggal 10 (Tooka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl14', category: 'Hari', hiragana: 'じゅうよっか', kanji: '14日', arti: 'Tanggal 14 (Juuyokka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl20', category: 'Hari', hiragana: 'はつか', kanji: '20日', arti: 'Tanggal 20 (Hatsuka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|tgl24', category: 'Hari', hiragana: 'にじゅうよっか', kanji: '24日', arti: 'Tanggal 24 (Nijuuyokka - irregular)', chapter: 'Tanggal' },
    { id: 'special|hari|jam4', category: 'Hari', hiragana: 'よじ', kanji: '4時', arti: 'Jam 4 (Yoji - irregular)', chapter: 'Waktu' },
    { id: 'special|hari|jam7', category: 'Hari', hiragana: 'しちじ', kanji: '7時', arti: 'Jam 7 (Shichiji - irregular)', chapter: 'Waktu' },
    { id: 'special|hari|jam9', category: 'Hari', hiragana: 'くじ', kanji: '9時', arti: 'Jam 9 (Kuji - irregular)', chapter: 'Waktu' },
    { id: 'special|hari|m1', category: 'Hari', hiragana: 'いっぷん', kanji: '1分', arti: '1 Menit (Ippun - irregular)', chapter: 'Menit' },
    { id: 'special|hari|m2', category: 'Hari', hiragana: 'にふん', kanji: '2分', arti: '2 Menit', chapter: 'Menit' },
    { id: 'special|hari|m3', category: 'Hari', hiragana: 'さんぷん', kanji: '3分', arti: '3 Menit (Sanpun - irregular)', chapter: 'Menit' },
    { id: 'special|hari|m4', category: 'Hari', hiragana: 'よんぷん', kanji: '4分', arti: '4 Menit (Yonpun - irregular)', chapter: 'Menit' },
    { id: 'special|hari|m5', category: 'Hari', hiragana: 'ごふん', kanji: '5分', arti: '5 Menit', chapter: 'Menit' },
    { id: 'special|hari|m6', category: 'Hari', hiragana: 'ろっぷん', kanji: '6分', arti: '6 Menit (Roppun - irregular)', chapter: 'Menit' },
    { id: 'special|hari|m8', category: 'Hari', hiragana: 'はっぷん', kanji: '8分', arti: '8 Menit (Happun - irregular)', chapter: 'Menit' },
    { id: 'special|hari|m10', category: 'Hari', hiragana: 'じゅっぷん', kanji: '10分', arti: '10 Menit (Juppun - irregular)', chapter: 'Menit' }
  ],
  uang: [
    { id: 'special|uang|100', category: 'Uang', hiragana: 'ひゃくえん', kanji: '百円', arti: '100 Yen (Hyaku-en)', chapter: 'Yen' },
    { id: 'special|uang|300', category: 'Uang', hiragana: 'さんびゃくえん', kanji: '三百円', arti: '300 Yen (Sanbyaku-en - irregular)', chapter: 'Yen' },
    { id: 'special|uang|600', category: 'Uang', hiragana: 'ろっぴゃくえん', kanji: '六百円', arti: '600 Yen (Roppyaku-en - irregular)', chapter: 'Yen' },
    { id: 'special|uang|800', category: 'Uang', hiragana: 'はっぴゃくえん', kanji: '八百円', arti: '800 Yen (Happyaku-en - irregular)', chapter: 'Yen' },
    { id: 'special|uang|1000', category: 'Uang', hiragana: 'せんえん', kanji: '千円', arti: '1.000 Yen (Sen-en)', chapter: 'Yen' },
    { id: 'special|uang|3000', category: 'Uang', hiragana: 'さんぜんえん', kanji: '三千円', arti: '3.000 Yen (Sanzen-en - irregular)', chapter: 'Yen' },
    { id: 'special|uang|8000', category: 'Uang', hiragana: 'はっせんえん', kanji: '八千円', arti: '8.000 Yen (Hassen-en - irregular)', chapter: 'Yen' },
    { id: 'special|uang|10000', category: 'Uang', hiragana: 'いちまんえん', kanji: '一万円', arti: '10.000 Yen (Ichiman-en)', chapter: 'Yen' },
    { id: 'special|uang|ikura', category: 'Uang', hiragana: 'いくらですか', kanji: 'いくらですか', arti: 'Berapa harganya?', chapter: 'Tanya' },
    { id: 'special|uang|nanen', category: 'Uang', hiragana: 'なんえん', kanji: '何円', arti: 'Berapa Yen? (Nan-en)', chapter: 'Tanya' }
  ]
}

export const SPECIAL_CHAPTER_SEQUENCES: Record<string, string[]> = {
  angka: ['Dasar', 'Ratusan', 'Ribuan', 'Penghitung', 'Orang', 'Batang'],
  hari: ['Hari', 'Tanggal', 'Waktu', 'Menit'],
  uang: ['Yen', 'Tanya']
}

export const CHAPTER_METADATA: Record<string, Record<string, { label: string; icon: string }>> = {
  angka: {
    Dasar: { label: 'Angka Dasar (1-10)', icon: '🔢' },
    Ratusan: { label: 'Ratusan (100 - 800)', icon: '💯' },
    Ribuan: { label: 'Ribuan & Puluh Ribu', icon: '🏔️' },
    Penghitung: { label: 'Buah & Barang (~tsu)', icon: '📦' },
    Orang: { label: 'Penghitung Orang (~nin)', icon: '👥' },
    Batang: { label: 'Batang & Botol (~hon/pon/bon)', icon: '🥢' },
  },
  hari: {
    Hari: { label: 'Nama Hari (Senin - Minggu)', icon: '📅' },
    Tanggal: { label: 'Tanggal (1-10, 14, 20, 24)', icon: '📆' },
    Waktu: { label: 'Jam & Waktu (~ji)', icon: '⏰' },
    Menit: { label: 'Menit (~fun/pun)', icon: '⏱️' },
  },
  uang: {
    Yen: { label: 'Nominal Yen (100 - 10.000)', icon: '💴' },
    Tanya: { label: 'Kalimat Tanya Harga', icon: '💬' },
  }
}

