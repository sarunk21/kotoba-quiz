'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ChapterStory } from '@/lib/stories'
import { speakJapanese } from '@/lib/sounds'
import { playTap } from '@/lib/sounds'
import { addFuriganaToSentence } from '@/lib/vocab'

interface StoryPlayerProps {
  story: ChapterStory
}

export function StoryPlayer({ story }: StoryPlayerProps) {
  const scenes = story.scenes!
  const [sceneIndex, setSceneIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [imgError, setImgError] = useState(false)
  const cancelRef = useRef(false)

  const scene = scenes[sceneIndex]
  const isFirst = sceneIndex === 0
  const isLast = sceneIndex === scenes.length - 1

  const goToScene = useCallback((idx: number) => {
    cancelRef.current = true
    speechSynthesis.cancel()
    setIsPlaying(false)
    setImgError(false)
    setShowTranslation(false)
    setSceneIndex(idx)
  }, [])

  const playCurrentScene = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    speechSynthesis.cancel()
    cancelRef.current = false
    setIsPlaying(true)

    const utter = new SpeechSynthesisUtterance(scene.sentenceJapanese)
    utter.lang = 'ja-JP'
    utter.rate = 0.88

    utter.onend = () => {
      if (cancelRef.current) return
      setIsPlaying(false)
      // Auto-advance to next scene after short pause
      if (sceneIndex < scenes.length - 1) {
        setTimeout(() => {
          if (!cancelRef.current) {
            setSceneIndex(i => i + 1)
          }
        }, 900)
      }
    }

    utter.onerror = () => {
      setIsPlaying(false)
    }

    speechSynthesis.speak(utter)
  }, [scene, sceneIndex, scenes.length])

  // Auto-play on scene change
  useEffect(() => {
    cancelRef.current = false
    playCurrentScene()
    return () => {
      cancelRef.current = true
      speechSynthesis.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIndex])

  const subtitleHtml = addFuriganaToSentence(scene.sentenceJapanese)

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Scene Image */}
      <div className="relative w-full aspect-video rounded-[24px] overflow-hidden bg-[var(--color-subtle)]">
        {!imgError && scene.imageUrl ? (
          <img
            src={`/${scene.imageUrl.replace(/^\//, '')}`}
            alt={`Scene ${scene.sceneOrder}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Placeholder when no image */
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-40">
            <span className="text-4xl">🌸</span>
            <span className="text-xs font-semibold text-[var(--color-text-3)]">Scene {scene.sceneOrder}</span>
          </div>
        )}

        {/* Scene dot nav overlay */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {scenes.map((_, i) => (
            <button
              key={i}
              onClick={() => { playTap(); goToScene(i) }}
              className={`rounded-full transition-all duration-200 cursor-pointer ${
                i === sceneIndex
                  ? 'w-4 h-2 bg-white shadow-sm'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Scene ${i + 1}`}
            />
          ))}
        </div>

        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 text-white rounded-full px-2 py-1">
            <span className="text-[9px] font-bold animate-pulse">🔊</span>
          </div>
        )}
      </div>

      {/* Subtitle Card */}
      <div className="rounded-[20px] p-4 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] shadow-sm">
        {/* Japanese sentence */}
        <p
          className="jp text-lg font-bold text-[var(--color-text-1)] text-center leading-relaxed mb-1"
          style={{ letterSpacing: '0.04em' }}
          dangerouslySetInnerHTML={{ __html: subtitleHtml }}
        />

        {/* Indonesian translation — toggle */}
        <div
          className={`overflow-hidden transition-all duration-300 ${showTranslation ? 'max-h-16' : 'max-h-0'}`}
        >
          <p className="text-xs font-semibold text-[var(--color-text-2)] text-center mt-1">
            {scene.sentenceIndonesian}
          </p>
        </div>

        {/* Scene counter */}
        <p className="text-[9px] font-bold text-[var(--color-text-3)] text-center mt-2 uppercase tracking-wider">
          {sceneIndex + 1} / {scenes.length}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Prev */}
        <button
          onClick={() => { playTap(); goToScene(sceneIndex - 1) }}
          disabled={isFirst}
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] text-[var(--color-text-2)] disabled:opacity-30 active:scale-90 transition-all cursor-pointer disabled:cursor-default"
        >
          ◀
        </button>

        {/* Replay */}
        <button
          onClick={() => { playTap(); playCurrentScene() }}
          disabled={isPlaying}
          className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 font-extrabold text-[11px] border active:scale-95 transition-all cursor-pointer disabled:opacity-60 ${
            isPlaying
              ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'bg-white dark:bg-[#1a1d24] border-[var(--color-border)] text-[var(--color-text-2)]'
          }`}
        >
          {isPlaying ? '🔊 Memutar...' : '🔊 Ulangi'}
        </button>

        {/* Toggle translation */}
        <button
          onClick={() => { playTap(); setShowTranslation(s => !s) }}
          className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-1 font-extrabold text-[11px] border active:scale-95 transition-all cursor-pointer ${
            showTranslation
              ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'bg-white dark:bg-[#1a1d24] border-[var(--color-border)] text-[var(--color-text-2)]'
          }`}
        >
          🇲🇨 {showTranslation ? 'Sembunyikan' : 'Arti'}
        </button>

        {/* Next */}
        <button
          onClick={() => { playTap(); goToScene(sceneIndex + 1) }}
          disabled={isLast}
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] text-[var(--color-text-2)] disabled:opacity-30 active:scale-90 transition-all cursor-pointer disabled:cursor-default"
        >
          ▶
        </button>
      </div>

      {/* Slow-mo TTS button */}
      <button
        onClick={() => { playTap(); speakJapanese(scene.sentenceJapanese, true) }}
        className="w-full py-2 rounded-xl text-[10px] font-bold text-[var(--color-text-3)] border border-dashed border-[var(--color-border)] hover:bg-[var(--color-subtle)] active:scale-95 transition-all cursor-pointer"
      >
        🐢 Pelafalan Lambat
      </button>
    </div>
  )
}
