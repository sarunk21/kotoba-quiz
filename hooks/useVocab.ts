'use client'

import { useEffect, useState, useMemo } from 'react'
import { loadLocalVocab, saveLocalVocab } from '@/lib/vocab-store'
import type { VocabItem } from '@/lib/vocab.types'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

export function useVocab() {
  const [vocabList, setVocabList] = useState<VocabItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250)
  const [selectedCat, setSelectedCat] = useState<string>('All')
  const [selectedChapter, setSelectedChapter] = useState<string>('All')
  const [visibleCount, setVisibleCount] = useState(30)

  useEffect(() => {
    setVocabList(loadLocalVocab())
  }, [])

  const uniqueChapters = useMemo(() => {
    const chapters = new Set<string>()
    vocabList.forEach(item => {
      if (item.chapter) chapters.add(item.chapter)
      else chapters.add('Tanpa Bab')
    })
    return Array.from(chapters).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  }, [vocabList])

  const filteredVocab = useMemo(() => {
    return vocabList.filter(item => {
      const matchesSearch =
        item.hiragana.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        item.kanji.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        item.arti.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      const matchesCategory = selectedCat === 'All' || item.category === selectedCat
      const itemChapter = item.chapter || 'Tanpa Bab'
      const matchesChapter = selectedChapter === 'All' || itemChapter === selectedChapter
      return matchesSearch && matchesCategory && matchesChapter
    })
  }, [vocabList, debouncedSearchQuery, selectedCat, selectedChapter])

  const paginatedVocab = useMemo(() => filteredVocab.slice(0, visibleCount), [filteredVocab, visibleCount])

  useEffect(() => { setVisibleCount(30) }, [debouncedSearchQuery, selectedCat, selectedChapter])

  const save = (list: VocabItem[]) => {
    setVocabList(list)
    saveLocalVocab(list)
  }

  return {
    vocabList,
    setVocabList: save,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    selectedCat,
    setSelectedCat,
    selectedChapter,
    setSelectedChapter,
    uniqueChapters,
    filteredVocab,
    paginatedVocab,
    visibleCount,
    setVisibleCount,
  }
}
