'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  loadLocalVocab, 
  saveLocalVocab, 
  parseCSVToVocab, 
  type VocabItem, 
  type Category 
} from '@/lib/vocab'
import { syncToCloud } from '@/lib/cloud'
import BottomNav from '@/components/BottomNav'

const CATEGORIES: Category[] = [
  'Kata Benda',
  'Kata Kerja',
  'Kata Sifat',
  'Ungkapan',
  'Angka',
  'Hari',
  'Uang'
]

const DEFAULT_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9UYAD3iOYHLFUeMh-uHUi9cbk6ejo7oUcrKEMtNgg2AZL37fSxvNOxjItQtunRb3DyjsKTct8hfvW/pub?gid=1283721307&single=true&output=csv'

export default function VocabPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Core Data State
  const [vocabList, setVocabList] = useState<VocabItem[]>([])
  const [loadingSync, setLoadingSync] = useState(false)
  const [syncStatusMsg, setSyncStatusMsg] = useState('')

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('All')
  const [selectedChapter, setSelectedChapter] = useState<string>('All')

  // Modals State
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<VocabItem | null>(null) // null = Add mode
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState<VocabItem | null>(null)
  const [showCsvModal, setShowCsvModal] = useState(false)

  // Form Fields
  const [formCategory, setFormCategory] = useState<Category>('Kata Benda')
  const [formHiragana, setFormHiragana] = useState('')
  const [formKanji, setFormKanji] = useState('')
  const [formArti, setFormArti] = useState('')
  const [formChapter, setFormChapter] = useState('')
  const [formError, setFormError] = useState('')

  // CSV Import State
  const [csvInput, setCsvInput] = useState('')
  const [csvError, setCsvError] = useState('')
  const [importTab, setImportTab] = useState<'text' | 'link'>('text')
  const [sheetsUrlInput, setSheetsUrlInput] = useState('')
  const [loadingImportLink, setLoadingImportLink] = useState(false)

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkDelete, setIsBulkDelete] = useState(false)

  // Auth Protection
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Load Initial Vocab & Google Sheets URL
  useEffect(() => {
    const list = loadLocalVocab()
    setVocabList(list)

    const savedUrl = localStorage.getItem('kotoba_sheets_url') || DEFAULT_SHEETS_URL
    setSheetsUrlInput(savedUrl)
    // Silent background fetch to update words
    silentSyncFromSheets(savedUrl)
  }, [])

  const silentSyncFromSheets = async (url: string) => {
    try {
      const t = Date.now()
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(url.trim())}&t=${t}`)
      if (!res.ok) return
      const csvText = await res.text()
      const parsed = parseCSVToVocab(csvText)
      if (parsed.length === 0) return

      // Merge with existing vocab
      const localVocab = loadLocalVocab()
      const existingIds = new Set(localVocab.map(v => v.id))
      const newItems = parsed.filter(item => !existingIds.has(item.id))

      // Update chapter info for existing items if they changed in the sheet
      let hasChanges = false
      const updatedLocalVocab = localVocab.map(localItem => {
        const parsedItem = parsed.find(p => p.id === localItem.id)
        if (parsedItem && parsedItem.chapter !== localItem.chapter) {
          hasChanges = true
          return { ...localItem, chapter: parsedItem.chapter }
        }
        return localItem
      })

      if (newItems.length > 0 || hasChanges) {
        const updatedList = [...newItems, ...updatedLocalVocab]
        setVocabList(updatedList)
        saveLocalVocab(updatedList)
        localStorage.setItem('kotoba_vocab_updated_at', new Date().toISOString())
        
        if (session?.user?.email) {
          await syncToCloud() // sync to Firebase in background
        }
      }
    } catch (e) {
      console.error('[Silent Sheets Sync Error]', e)
    }
  }

  const handleSyncFromSavedLink = async () => {
    const savedUrl = localStorage.getItem('kotoba_sheets_url') || DEFAULT_SHEETS_URL
    
    setLoadingImportLink(true)
    setSyncStatusMsg('Menyinkronkan Sheet...')
    
    try {
      const t = Date.now()
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(savedUrl.trim())}&t=${t}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Error status: ${res.status}`)
      }
      
      const csvText = await res.text()
      const parsed = parseCSVToVocab(csvText)
      
      if (parsed.length === 0) {
        alert('Gagal mengambil data: Format Google Sheets salah.')
        return
      }
      
      const existingIds = new Set(vocabList.map(v => v.id))
      const newItems = parsed.filter(item => !existingIds.has(item.id))
      
      // Update chapter info for existing items if they changed in the sheet
      let hasChanges = false
      const updatedLocalVocab = vocabList.map(localItem => {
        const parsedItem = parsed.find(p => p.id === localItem.id)
        if (parsedItem && parsedItem.chapter !== localItem.chapter) {
          hasChanges = true
          return { ...localItem, chapter: parsedItem.chapter }
        }
        return localItem
      })
      
      if (newItems.length === 0 && !hasChanges) {
        setSyncStatusMsg('Sheet Sudah Sinkron ✓')
        setTimeout(() => setSyncStatusMsg(''), 3000)
        return
      }
      
      const updatedList = [...newItems, ...updatedLocalVocab]
      setVocabList(updatedList)
      await triggerSync(updatedList)
      
      const msg = newItems.length > 0 
        ? `Berhasil Impor ${newItems.length} Kata Baru ✓` 
        : 'Bab Kosakata Terupdate ✓'
      setSyncStatusMsg(msg)
      setTimeout(() => setSyncStatusMsg(''), 3000)
    } catch (e: any) {
      alert(`Gagal sinkronisasi Google Sheets: ${e.message || e}`)
      setSyncStatusMsg('Gagal Sinkron Sheet ✗')
      setTimeout(() => setSyncStatusMsg(''), 3000)
    } finally {
      setLoadingImportLink(false)
    }
  }

  // Auto-sync function
  const triggerSync = async (updatedList: VocabItem[]) => {
    saveLocalVocab(updatedList)
    localStorage.setItem('kotoba_vocab_updated_at', new Date().toISOString())
    
    if (session?.user?.email) {
      setLoadingSync(true)
      setSyncStatusMsg('Menyinkronkan...')
      const ok = await syncToCloud()
      if (ok) {
        setSyncStatusMsg('Tersinkronisasi ✓')
      } else {
        setSyncStatusMsg('Gagal Sinkronisasi ✗')
      }
      setTimeout(() => setSyncStatusMsg(''), 3000)
      setLoadingSync(false)
    }
  };

  // Get unique chapters for filters
  const uniqueChapters = useMemo(() => {
    const chapters = new Set<string>()
    vocabList.forEach(item => {
      if (item.chapter) {
        chapters.add(item.chapter)
      } else {
        chapters.add('Tanpa Bab')
      }
    })
    return Array.from(chapters).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  }, [vocabList])

  // Filtered list
  const filteredVocab = useMemo(() => {
    return vocabList.filter(item => {
      const matchesSearch = 
        item.hiragana.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.kanji.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.arti.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCat === 'All' || item.category === selectedCat
      
      const itemChapter = item.chapter || 'Tanpa Bab'
      const matchesChapter = selectedChapter === 'All' || itemChapter === selectedChapter

      return matchesSearch && matchesCategory && matchesChapter
    })
  }, [vocabList, searchQuery, selectedCat, selectedChapter])

  // Form handling (Add / Edit)
  const openAddModal = () => {
    setEditingItem(null)
    setFormCategory('Kata Benda')
    setFormHiragana('')
    setFormKanji('')
    setFormArti('')
    setFormChapter('')
    setFormError('')
    setShowAddEditModal(true)
  }

  const openEditModal = (item: VocabItem) => {
    setEditingItem(item)
    setFormCategory(item.category)
    setFormHiragana(item.hiragana)
    setFormKanji(item.kanji || '')
    setFormArti(item.arti)
    setFormChapter(item.chapter || '')
    setFormError('')
    setShowAddEditModal(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formHiragana.trim() || !formArti.trim()) {
      setFormError('Hiragana dan Arti wajib diisi!')
      return
    }

    const cleanedKanji = formKanji.trim() || formHiragana.trim()
    const cleanedChapter = formChapter.trim()

    let updatedList: VocabItem[] = []

    if (editingItem) {
      // Edit Mode - Keep the same ID but update content
      updatedList = vocabList.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            category: formCategory,
            hiragana: formHiragana.trim(),
            kanji: cleanedKanji,
            arti: formArti.trim(),
            chapter: cleanedChapter || undefined
          }
        }
        return item
      })
    } else {
      // Add Mode - Generate new ID
      const rawId = `${formCategory}|${formHiragana.trim()}|${cleanedKanji}|${formArti.trim()}`
      const newId = Array.from(rawId).reduce((h, c) => (h = (h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(36) + 
                    btoa(unescape(encodeURIComponent(rawId.substring(0, 10)))).substring(0, 8)

      // Avoid duplicates
      if (vocabList.some(v => v.id === newId)) {
        setFormError('Kata ini sudah ada di database!')
        return
      }

      const newItem: VocabItem = {
        id: newId,
        category: formCategory,
        hiragana: formHiragana.trim(),
        kanji: cleanedKanji,
        arti: formArti.trim(),
        chapter: cleanedChapter || undefined
      }
      updatedList = [newItem, ...vocabList]
    }

    setVocabList(updatedList)
    setShowAddEditModal(false)
    await triggerSync(updatedList)
  }

  // Delete Handling
  const askDelete = (item: VocabItem) => {
    setIsBulkDelete(false)
    setDeletingItem(item)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    let updatedList: VocabItem[] = []
    if (isBulkDelete) {
      updatedList = vocabList.filter(item => !selectedIds.has(item.id))
      setSelectedIds(new Set())
      setIsBulkDelete(false)
    } else {
      if (!deletingItem) return
      updatedList = vocabList.filter(item => item.id !== deletingItem.id)
      setSelectedIds(p => {
        const next = new Set(p)
        next.delete(deletingItem.id)
        return next
      })
      setDeletingItem(null)
    }
    setVocabList(updatedList)
    setShowDeleteModal(false)
    await triggerSync(updatedList)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeletingItem(null)
    setIsBulkDelete(false)
  }

  // CSV Import handling
  const handleImportCSV = async () => {
    if (!csvInput.trim()) {
      setCsvError('Teks CSV tidak boleh kosong!')
      return
    }

    try {
      const parsed = parseCSVToVocab(csvInput)
      if (parsed.length === 0) {
        setCsvError('Tidak ada data yang valid yang berhasil diimpor. Periksa format kolom!')
        return
      }

      // Merge dengan vocab yang sudah ada (menghindari duplikasi ID)
      const existingIds = new Set(vocabList.map(v => v.id))
      const newItems = parsed.filter(item => !existingIds.has(item.id))

      if (newItems.length === 0) {
        alert('Semua kosakata dalam CSV sudah ada di database!')
        setShowCsvModal(false)
        setCsvInput('')
        setCsvError('')
        return
      }

      const updatedList = [...newItems, ...vocabList]
      setVocabList(updatedList)
      setShowCsvModal(false)
      setCsvInput('')
      setCsvError('')
      await triggerSync(updatedList)
      alert(`Berhasil mengimpor ${newItems.length} kosakata baru!`)
    } catch (e: any) {
      setCsvError(`Gagal membaca CSV: ${e.message || e}`)
    }
  }

  // Google Sheets URL Import Handling
  const handleImportFromLink = async () => {
    if (!sheetsUrlInput.trim()) {
      setCsvError('Link Google Sheets tidak boleh kosong!')
      return
    }

    if (!sheetsUrlInput.includes('docs.google.com') && !sheetsUrlInput.includes('spreadsheets')) {
      setCsvError('Link harus berupa URL Google Sheets yang valid!')
      return
    }

    setLoadingImportLink(true)
    setCsvError('')
    
    try {
      const t = Date.now()
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(sheetsUrlInput.trim())}&t=${t}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Error status: ${res.status}`)
      }
      
      const csvText = await res.text()
      const parsed = parseCSVToVocab(csvText)
      
      if (parsed.length === 0) {
        setCsvError('Tidak ada data yang valid yang berhasil diimpor. Periksa format kolom Google Sheets Anda!')
        return
      }

      // Merge dengan vocab yang sudah ada
      const existingIds = new Set(vocabList.map(v => v.id))
      const newItems = parsed.filter(item => !existingIds.has(item.id))

      // Update chapter info for existing items if they changed in the sheet
      let hasChanges = false
      const updatedLocalVocab = vocabList.map(localItem => {
        const parsedItem = parsed.find(p => p.id === localItem.id)
        if (parsedItem && parsedItem.chapter !== localItem.chapter) {
          hasChanges = true
          return { ...localItem, chapter: parsedItem.chapter }
        }
        return localItem
      })

      if (newItems.length === 0 && !hasChanges) {
        alert('Semua kosakata dari link Sheets sudah ada di database dan sudah sinkron!')
        localStorage.setItem('kotoba_sheets_url', sheetsUrlInput.trim())
        setShowCsvModal(false)
        return
      }

      const updatedList = [...newItems, ...updatedLocalVocab]
      setVocabList(updatedList)
      localStorage.setItem('kotoba_sheets_url', sheetsUrlInput.trim())
      setShowCsvModal(false)
      await triggerSync(updatedList)
      
      const alertMsg = newItems.length > 0 
        ? `Berhasil mengimpor ${newItems.length} kosakata baru dari Google Sheets!` 
        : 'Berhasil mengupdate bab kosakata!'
      alert(alertMsg)
    } catch (e: any) {
      setCsvError(`Gagal mengambil data dari Google Sheets: ${e.message || e}`)
    } finally {
      setLoadingImportLink(false)
    }
  }

  // CSV Export handling
  const handleExportCSV = () => {
    // Generate CSV string: Kategori, Hiragana, Kanji, Arti, Bab
    const headers = 'Kategori,Hiragana,Kanji,Arti,Bab\n'
    const rows = vocabList.map(item => {
      const fields = [
        item.category,
        item.hiragana,
        item.kanji || '',
        item.arti,
        item.chapter || ''
      ]
      // Escape commas and quotes for CSV safety
      return fields.map(f => `"${f.replace(/"/g, '""')}"`).join(',')
    }).join('\n')

    const csvContent = headers + rows
    
    // Copy to clipboard
    navigator.clipboard.writeText(csvContent)
      .then(() => {
        alert('Data kosakata berhasil diekspor dan disalin ke Clipboard!')
      })
      .catch(err => {
        console.error('Gagal menyalin ke clipboard:', err)
        alert('Gagal menyalin data secara otomatis. Coba ekspor lewat file.')
      })
  }

  if (status === 'loading') return null

  return (
    <>
      <main className="min-height-100dvh pb-28 pt-6 px-4 max-w-sm mx-auto flex flex-col gap-5 anim-up">
        {/* Header */}
        <header className="flex flex-col gap-2 relative">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="text-xs font-bold text-[var(--color-text-2)] no-underline flex items-center gap-1 active:scale-95 transition-transform"
            >
              ← Kembali
            </Link>
            {syncStatusMsg && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] animate-pulse">
                {syncStatusMsg}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-1)]">Kelola Kosakata</h1>
              <p className="text-xs font-semibold text-[var(--color-text-2)] mt-0.5">Database kamus pribadi kamu</p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-[var(--color-subtle)] text-[var(--color-text-2)]">
              {vocabList.length} Kata
            </span>
          </div>
        </header>

        {/* CSV Actions & Stats Banner */}
        <section className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl p-4 shadow-card flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-3)]">Backup & Restore</span>
            <span className="text-xs font-bold text-[var(--color-text-1)]">Gunakan format CSV Google Sheets</span>
          </div>
          <div className="flex gap-2">
            {sheetsUrlInput && (
              <button 
                onClick={handleSyncFromSavedLink}
                className="text-xs font-extrabold px-3 py-2 rounded-xl bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 active:scale-95 transition-transform flex items-center gap-1"
                title="Tarik ulang dari Google Sheets"
                disabled={loadingImportLink}
              >
                {loadingImportLink ? '⏳' : '🔄'} Sync Sheet
              </button>
            )}
            <button 
              onClick={() => { setCsvError(''); setShowCsvModal(true) }}
              className="text-xs font-extrabold px-3 py-2 rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)] active:scale-95 transition-transform"
            >
              📥 Impor
            </button>
            <button 
              onClick={handleExportCSV}
              className="text-xs font-extrabold px-3 py-2 rounded-xl bg-[var(--color-subtle)] text-[var(--color-text-2)] active:scale-95 transition-transform"
              disabled={vocabList.length === 0}
            >
              📤 Ekspor
            </button>
          </div>
        </section>

        {/* Filters & Search */}
        <section className="flex flex-col gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari kata, cara baca, arti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)] transition-colors shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-3)] hover:text-[var(--color-text-2)]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Category Filter */}
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-3)] px-1">Kategori</span>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] focus:outline-none"
              >
                <option value="All">Semua Kategori</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Chapter Filter */}
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-3)] px-1">Bab</span>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] focus:outline-none"
              >
                <option value="All">Semua Bab</option>
                {uniqueChapters.map(ch => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Selection Control Bar */}
        {filteredVocab.length > 0 && (
          <section className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={filteredVocab.length > 0 && filteredVocab.every(item => selectedIds.has(item.id))}
                onChange={(e) => {
                  const newSelected = new Set(selectedIds)
                  if (e.target.checked) {
                    filteredVocab.forEach(item => newSelected.add(item.id))
                  } else {
                    filteredVocab.forEach(item => newSelected.delete(item.id))
                  }
                  setSelectedIds(newSelected)
                }}
                className="rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)] cursor-pointer h-4 w-4 border-[var(--color-border)]"
              />
              <span className="text-xs font-extrabold text-[var(--color-text-2)]">Pilih Semua ({filteredVocab.length})</span>
            </label>
            
            {selectedIds.size > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setSelectedIds(new Set())
                  }}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-[var(--color-subtle)] text-[var(--color-text-2)] active:scale-95 transition-transform"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    setIsBulkDelete(true)
                    setShowDeleteModal(true)
                  }}
                  className="text-xs font-black px-3 py-2 rounded-xl bg-[var(--color-red)] text-white shadow-red active:scale-95 transition-transform"
                >
                  🗑️ Hapus Terpilih ({selectedIds.size})
                </button>
              </div>
            )}
          </section>
        )}

        {/* Vocab Items List */}
        <section className="flex-1 flex flex-col gap-2.5">
          {filteredVocab.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--color-border)] bg-white/40 dark:bg-[#1a1d24]/20">
              <span className="text-3xl">📭</span>
              <p className="font-extrabold text-sm text-[var(--color-text-2)] mt-2">Tidak ada kosakata ditemukan</p>
              <p className="text-xs font-semibold text-[var(--color-text-3)] mt-1">Coba sesuaikan pencarian atau filter kamu</p>
            </div>
          ) : (
            filteredVocab.map((item) => {
              const hasKanji = item.kanji && item.kanji !== item.hiragana
              const isChecked = selectedIds.has(item.id)
              
              // Assign color badge based on category
              let catClass = 'bg-[var(--color-subtle)] text-[var(--color-text-2)]'
              if (item.category === 'Kata Benda') catClass = 'bg-[var(--color-cat-noun-bg)] text-[var(--color-cat-noun)]'
              else if (item.category === 'Kata Kerja') catClass = 'bg-[var(--color-cat-verb-bg)] text-[var(--color-cat-verb)]'
              else if (item.category === 'Kata Sifat') catClass = 'bg-[var(--color-cat-adj-bg)] text-[var(--color-cat-adj)]'
              else if (item.category === 'Ungkapan') catClass = 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'

              return (
                <div 
                  key={item.id} 
                  className={`bg-white dark:bg-[#1a1d24] border ${isChecked ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]/25 dark:bg-[var(--color-accent-dark)]/10 shadow-[0_0_8px_rgba(91,94,244,0.1)]' : 'border-[var(--color-border)]'} rounded-2xl p-4 shadow-card flex items-center justify-between gap-3 hover:border-[var(--color-accent)] transition-all`}
                >
                  {/* Checkbox */}
                  <input 
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      const newSelected = new Set(selectedIds)
                      if (isChecked) {
                        newSelected.delete(item.id)
                      } else {
                        newSelected.add(item.id)
                      }
                      setSelectedIds(newSelected)
                    }}
                    className="rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)] cursor-pointer h-4.5 w-4.5 border-[var(--color-border)] shrink-0"
                  />

                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${catClass}`}>
                        {item.category}
                      </span>
                      {item.chapter && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-subtle)] text-[var(--color-text-2)]">
                          {item.chapter}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="jp text-lg font-black text-[var(--color-text-1)] truncate">
                          {item.kanji}
                        </span>
                        {hasKanji && (
                          <span className="jp text-xs font-semibold text-[var(--color-text-3)] truncate">
                            ({item.hiragana})
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-[var(--color-text-2)] truncate">
                        {item.arti}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)] active:scale-90 transition-all text-sm"
                      title="Ubah"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => askDelete(item)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-red-light)] hover:text-[var(--color-red)] active:scale-90 transition-all text-sm"
                      title="Hapus"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </section>

        {/* Floating Action Button for Add Word */}
        <button 
          onClick={openAddModal}
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent-dark)] shadow-[0_6px_20px_rgba(91,94,244,0.4)] active:scale-90 transition-all flex items-center justify-center text-white text-2xl border-4 border-white dark:border-[#1a1d24]"
          title="Tambah Kosakata Baru"
        >
          ➕
        </button>

        {/* Bottom Navigation */}
        <BottomNav />
      </main>

      {/* ── MODAL: Add / Edit Word ── */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
            onClick={() => setShowAddEditModal(false)}
          />
          <div className="bg-white dark:bg-[#1a1d24] rounded-[28px] p-6 w-full max-w-sm relative shadow-2xl z-10 border border-[var(--color-border)] animate-pop">
            <h3 className="text-lg font-extrabold text-[var(--color-text-1)] mb-4">
              {editingItem ? 'Ubah Kosakata' : 'Tambah Kosakata Baru'}
            </h3>
            
            <form onSubmit={handleSaveForm} className="flex flex-col gap-3.5">
              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-2)] px-1">Kategori</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as Category)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] focus:outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Hiragana */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-2)] px-1">Hiragana / Katakana *</label>
                <input 
                  type="text" 
                  placeholder="Contoh: わたし, ねます"
                  value={formHiragana}
                  onChange={(e) => setFormHiragana(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] focus:outline-none"
                  required
                />
              </div>

              {/* Kanji */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-2)] px-1">Kanji (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: 私, 寝ます (kosongkan jika sama)"
                  value={formKanji}
                  onChange={(e) => setFormKanji(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] focus:outline-none"
                />
              </div>

              {/* Arti */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-2)] px-1">Arti Kosakata *</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Saya, Tidur"
                  value={formArti}
                  onChange={(e) => setFormArti(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] focus:outline-none"
                  required
                />
              </div>

              {/* Chapter */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-2)] px-1">Bab / Kelompok (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Bab 1, N5, dll."
                  value={formChapter}
                  onChange={(e) => setFormChapter(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] focus:outline-none"
                />
              </div>

              {formError && (
                <p className="text-[10px] font-bold text-[var(--color-red)] px-1">{formError}</p>
              )}

              {/* Buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="flex-1 text-xs font-black py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-2)] active:scale-95 transition-transform"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-black py-2.5 rounded-xl bg-[var(--color-accent)] text-white shadow-btn active:scale-95 transition-transform"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Confirmation ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
            onClick={cancelDelete}
          />
          <div className="bg-white dark:bg-[#1a1d24] rounded-[28px] p-6 w-full max-w-sm relative shadow-2xl z-10 border border-[var(--color-border)] animate-pop flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-[var(--color-text-1)]">
                {isBulkDelete ? `Hapus ${selectedIds.size} Kosakata?` : 'Hapus Kosakata?'}
              </h3>
              <p className="text-xs font-semibold text-[var(--color-text-2)] mt-1">
                {isBulkDelete 
                  ? `Apakah kamu yakin ingin menghapus ${selectedIds.size} kosakata terpilih? Semua progres belajar (SRS) untuk kata-kata ini akan dihapus secara permanen.`
                  : `Apakah kamu yakin ingin menghapus kata `
                }
                {!isBulkDelete && <strong className="text-[var(--color-text-1)] jp">{deletingItem?.kanji || deletingItem?.hiragana}</strong>}
                {!isBulkDelete && '? Tindakan ini akan menghapus progres SRS untuk kata ini.'}
              </p>
            </div>

            {isBulkDelete && (
              <div className="max-h-32 overflow-y-auto border border-[var(--color-border)] rounded-xl p-3 bg-[var(--color-bg)] flex flex-col gap-1.5">
                {vocabList.filter(item => selectedIds.has(item.id)).slice(0, 10).map(item => (
                  <div key={item.id} className="flex justify-between items-baseline gap-2 text-[10px] font-bold text-[var(--color-text-2)] truncate">
                    <span className="jp font-black text-[var(--color-text-1)]">{item.kanji || item.hiragana}</span>
                    <span className="truncate">{item.arti}</span>
                  </div>
                ))}
                {selectedIds.size > 10 && (
                  <p className="text-[10px] text-[var(--color-text-3)] font-bold italic text-center mt-1">
                    ...dan {selectedIds.size - 10} kosakata lainnya
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={cancelDelete}
                className="flex-1 text-xs font-black py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-2)] active:scale-95 transition-transform"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 text-xs font-black py-2.5 rounded-xl bg-[var(--color-red)] text-white shadow-red active:scale-95 transition-transform"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CSV Importer ── */}
      {showCsvModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
            onClick={() => {
              setShowCsvModal(false)
              setCsvError('')
            }}
          />
          <div className="bg-white dark:bg-[#1a1d24] rounded-[28px] p-6 w-full max-w-sm relative shadow-2xl z-10 border border-[var(--color-border)] animate-pop flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-[var(--color-text-1)]">Impor Kosakata</h3>
              <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5 leading-relaxed">
                Tambahkan data kosakata massal ke database Anda menggunakan metode di bawah ini.
              </p>
            </div>

            {/* Impor Tabs */}
            <div className="flex bg-[var(--color-bg)] p-1 rounded-xl gap-1">
              <button 
                onClick={() => { setImportTab('text'); setCsvError('') }}
                className={`flex-1 text-xs font-extrabold py-2 rounded-lg transition-all ${
                  importTab === 'text' 
                    ? 'bg-white dark:bg-[#1a1d24] text-[var(--color-accent)] shadow-sm' 
                    : 'text-[var(--color-text-2)] hover:text-[var(--color-text-1)]'
                }`}
              >
                📝 Tempel Teks CSV
              </button>
              <button 
                onClick={() => { setImportTab('link'); setCsvError('') }}
                className={`flex-1 text-xs font-extrabold py-2 rounded-lg transition-all ${
                  importTab === 'link' 
                    ? 'bg-white dark:bg-[#1a1d24] text-[var(--color-accent)] shadow-sm' 
                    : 'text-[var(--color-text-2)] hover:text-[var(--color-text-1)]'
                }`}
              >
                🔗 Link Google Sheets
              </button>
            </div>

            {importTab === 'text' ? (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <textarea 
                  placeholder='Format: Kategori, Hiragana, Kanji, Arti, Bab&#10;Contoh:&#10;Kata Benda,わたし,私,Saya,Bab 1&#10;Kata Kerja,ねます,寝ます,Tidur,Bab 1'
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  className="w-full h-44 text-xs font-mono p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
                {csvError && (
                  <p className="text-[10px] font-bold text-[var(--color-red)] px-1 leading-normal">{csvError}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-2)] px-1">Link Google Sheets (Published CSV)</label>
                  <input 
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                    value={sheetsUrlInput}
                    onChange={(e) => setSheetsUrlInput(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
                <div className="rounded-xl p-3 bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-2)] mb-1">💡 Cara Membuat Link CSV:</p>
                  <ol className="text-[9px] font-semibold text-[var(--color-text-3)] leading-relaxed list-decimal pl-4 space-y-0.5">
                    <li>Buka spreadsheet Anda di Google Sheets.</li>
                    <li>Pilih menu <strong>File &gt; Share &gt; Publish to web</strong>.</li>
                    <li>Ubah format publish dari "Web page" menjadi <strong>Comma-separated values (.csv)</strong>.</li>
                    <li>Klik <strong>Publish</strong> dan salin link CSV yang dihasilkan.</li>
                  </ol>
                </div>
                {csvError && (
                  <p className="text-[10px] font-bold text-[var(--color-red)] px-1 leading-normal">{csvError}</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCsvModal(false)
                  setCsvError('')
                }}
                className="flex-1 text-xs font-black py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-2)] active:scale-95 transition-transform"
                disabled={loadingImportLink}
              >
                Batal
              </button>
              {importTab === 'text' ? (
                <button
                  onClick={handleImportCSV}
                  className="flex-1 text-xs font-black py-2.5 rounded-xl bg-[var(--color-accent)] text-white shadow-btn active:scale-95 transition-transform"
                >
                  Impor Teks
                </button>
              ) : (
                <button
                  onClick={handleImportFromLink}
                  className="flex-1 text-xs font-black py-2.5 rounded-xl bg-[var(--color-accent)] text-white shadow-btn active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  disabled={loadingImportLink}
                >
                  {loadingImportLink ? '⏳ Mengunduh...' : 'Impor dari Link'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

