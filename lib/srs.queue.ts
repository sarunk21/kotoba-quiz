'use client'

import { getLocalDateString } from './dateUtils'
import type { SRSStore } from './srs.types'
import { MASTERED_LEVEL, MAX_LEVEL } from './srs.types'

function todayStr() { return getLocalDateString() }

export function buildQueue(
  vocabIds: string[],
  store: SRSStore,
  maxCards = 10
): { dueIds: string[]; newIds: string[]; refreshIds: string[] } {
  const today = todayStr()

  const dueBelumHafal: string[] = []
  const newWords: string[] = []
  const futureBelumHafal: string[] = []
  const dueLevel5: string[] = []
  const futureLevel5: string[] = []
  const dueLevel6: string[] = []
  const futureLevel6: string[] = []

  for (const id of vocabIds) {
    const wp = store[id]
    if (!wp || wp.level === 0) {
      newWords.push(id)
    } else if (wp.level < MASTERED_LEVEL) {
      if (wp.nextReview <= today) {
        dueBelumHafal.push(id)
      } else {
        futureBelumHafal.push(id)
      }
    } else if (wp.level < MAX_LEVEL) {
      if (wp.nextReview <= today) {
        dueLevel5.push(id)
      } else {
        futureLevel5.push(id)
      }
    } else {
      if (wp.nextReview <= today) {
        dueLevel6.push(id)
      } else {
        futureLevel6.push(id)
      }
    }
  }

  const shuffle = <T>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)
  const dueBelumHafalSh = shuffle(dueBelumHafal)
  const newSh = shuffle(newWords)
  const futureBelumHafalSh = shuffle(futureBelumHafal)
  const dueLevel5Sh = shuffle(dueLevel5)
  const futureLevel5Sh = shuffle(futureLevel5)
  const dueLevel6Sh = shuffle(dueLevel6)
  const futureLevel6Sh = shuffle(futureLevel6)

  const refreshIds = [
    ...futureBelumHafalSh,
    ...futureLevel5Sh,
    ...dueLevel6Sh,
    ...futureLevel6Sh
  ]

  return {
    dueIds: [...dueBelumHafalSh, ...dueLevel5Sh],
    newIds: newSh,
    refreshIds: refreshIds,
  }
}
