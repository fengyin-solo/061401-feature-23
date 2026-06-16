import { ref, computed } from 'vue'
import type { GameState, LogEntry, RandomEvent, ActionType, ActionEffect, KeyMoment, GameSummary, HighScoreRecord, CauseOfDeath, ResourceSnapshot } from '@/types/game'
import { randomEvents } from '@/data/events'

const STORAGE_KEY_HIGH_SCORE = 'survival_game_high_score'
const MAX_STAT = 100
const MAX_KEY_MOMENTS = 8

const actionEffects: Record<ActionType, ActionEffect> = {
  gatherWood: {
    health: -5, hunger: 5, thirst: 3, wood: 10, stone: 0 },
  gatherStone: {
    health: -8, hunger: 6, thirst: 4, wood: 0, stone: 8 },
  hunt: {
    health: 15, hunger: -20, thirst: 5, wood: -5, stone: 0 },
  drink: {
    health: 0, hunger: 2, thirst: -25, wood: -3, stone: 0 },
}

const actionNames: Record<ActionType, string> = {
  gatherWood: '采集木头',
  gatherStone: '采集石头',
  hunt: '打猎',
  drink: '喝水',
}

export function useGame() {
  const state = ref<GameState>({
    health: 80,
    hunger: 30,
    thirst: 30,
    wood: 10,
    stone: 5,
    turn: 0,
    isGameOver: false,
    logs: [],
    resourceHistory: [],
    keyMoments: [],
  })

  const highScoreRecord = ref<HighScoreRecord | null>(null)
  const currentGameSummary = ref<GameSummary | null>(null)
  let logIdCounter = 0
  let keyMomentIdCounter = 0

  const canAct = computed(() => !state.value.isGameOver)
  const highScore = computed(() => highScoreRecord.value?.turn ?? 0)

  function loadHighScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGH_SCORE)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && 'turn' in parsed && 'summary' in parsed) {
          highScoreRecord.value = parsed as HighScoreRecord
        } else {
          const legacyScore = parseInt(saved, 10) || 0
          if (legacyScore > 0) {
            highScoreRecord.value = {
              turn: legacyScore,
              summary: createLegacySummary(legacyScore),
            }
          }
        }
      }
    } catch (e) {
      highScoreRecord.value = null
    }
  }

  function saveHighScore() {
    if (!highScoreRecord.value || state.value.turn > highScoreRecord.value.turn) {
      const summary = generateGameSummary()
      currentGameSummary.value = summary
      highScoreRecord.value = {
        turn: state.value.turn,
        summary,
      }
      try {
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, JSON.stringify(highScoreRecord.value))
      } catch (e) {
        // ignore
      }
    } else {
      currentGameSummary.value = generateGameSummary()
    }
  }

  function createLegacySummary(turn: number): GameSummary {
    return {
      finalTurn: turn,
      causeOfDeath: 'health_zero',
      causeOfDeathText: '旧版记录 - 详细数据未保存',
      keyMoments: [],
      resourceHistory: [],
      createdAt: Date.now(),
    }
  }

  function addLog(text: string, type: LogEntry['type'] = 'action') {
    state.value.logs.unshift({
      id: ++logIdCounter,
      text,
      type,
      turn: state.value.turn,
    })
    if (state.value.logs.length > 50) {
      state.value.logs.pop()
    }
  }

  function addKeyMoment(type: KeyMoment['type'], text: string, icon: string) {
    state.value.keyMoments.push({
      id: ++keyMomentIdCounter,
      turn: state.value.turn,
      type,
      text,
      icon,
    })
    if (state.value.keyMoments.length > MAX_KEY_MOMENTS) {
      state.value.keyMoments.shift()
    }
  }

  function recordResourceSnapshot() {
    const snapshot: ResourceSnapshot = {
      turn: state.value.turn,
      health: state.value.health,
      hunger: state.value.hunger,
      thirst: state.value.thirst,
      wood: state.value.wood,
      stone: state.value.stone,
    }
    state.value.resourceHistory.push(snapshot)
  }

  function detectKeyMoments(event: RandomEvent) {
    const healthPercent = state.value.health / MAX_STAT
    const hungerPercent = state.value.hunger / MAX_STAT
    const thirstPercent = state.value.thirst / MAX_STAT

    if (healthPercent <= 0.2 && healthPercent > 0) {
      addKeyMoment('critical_health', `生命值危急，仅剩 ${Math.round(state.value.health)}`, '⚠️')
    }
    if (hungerPercent >= 0.8 && hungerPercent < 1) {
      addKeyMoment('critical_hunger', `饥饿值告急，已达 ${Math.round(state.value.hunger)}`, '🍖')
    }
    if (thirstPercent >= 0.8 && thirstPercent < 1) {
      addKeyMoment('critical_thirst', `口渴值告急，已达 ${Math.round(state.value.thirst)}`, '💧')
    }

    if (state.value.wood === 0 || state.value.stone === 0) {
      const depleted = state.value.wood === 0 ? '木材' : '石头'
      addKeyMoment('resource_depleted', `${depleted}已耗尽！`, '📦')
    }

    const totalEffect = Math.abs(event.effects.health || 0) + Math.abs(event.effects.hunger || 0) + Math.abs(event.effects.thirst || 0)
    if (totalEffect >= 15) {
      if (event.type === 'good') {
        addKeyMoment('major_good_event', event.text, '🎁')
      } else if (event.type === 'bad') {
        addKeyMoment('major_bad_event', event.text, '💥')
      }
    }

    if (state.value.turn % 10 === 0 && state.value.turn > 0) {
      addKeyMoment('turn_milestone', `已生存 ${state.value.turn} 回合！`, '🏆')
    }
  }

  function determineCauseOfDeath(): { cause: CauseOfDeath; text: string } {
    if (state.value.health <= 0) {
      const lastBadEvents = state.value.logs.filter(l => l.type === 'bad').slice(0, 3)
      const lastEventText = lastBadEvents.length > 0 ? lastBadEvents[0].text : '未知伤害'
      return { cause: 'health_zero', text: `生命值耗尽 - ${lastEventText}` }
    }
    if (state.value.hunger >= MAX_STAT) {
      return { cause: 'hunger_max', text: '饥饿过度 - 太久没有吃东西了' }
    }
    if (state.value.thirst >= MAX_STAT) {
      return { cause: 'thirst_max', text: '脱水而亡 - 太久没有喝水了' }
    }
    return { cause: 'health_zero', text: '未知原因' }
  }

  function generateGameSummary(): GameSummary {
    const { cause, text } = determineCauseOfDeath()
    return {
      finalTurn: state.value.turn,
      causeOfDeath: cause,
      causeOfDeathText: text,
      keyMoments: [...state.value.keyMoments],
      resourceHistory: [...state.value.resourceHistory],
      createdAt: Date.now(),
    }
  }

  function clampStat(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  function applyEffects(effects: ActionEffect) {
    if (effects.health !== undefined) {
      state.value.health = clampStat(state.value.health + effects.health, 0, MAX_STAT)
    }
    if (effects.hunger !== undefined) {
      state.value.hunger = clampStat(state.value.hunger + effects.hunger, 0, MAX_STAT)
    }
    if (effects.thirst !== undefined) {
      state.value.thirst = clampStat(state.value.thirst + effects.thirst, 0, MAX_STAT)
    }
    if (effects.wood !== undefined) {
      state.value.wood = Math.max(0, state.value.wood + effects.wood)
    }
    if (effects.stone !== undefined) {
      state.value.stone = Math.max(0, state.value.stone + effects.stone)
    }
  }

  function getRandomEvent(): RandomEvent {
    const index = Math.floor(Math.random() * randomEvents.length)
    return randomEvents[index]
  }

  function checkGameOver() {
    if (state.value.health <= 0 || state.value.hunger >= MAX_STAT || state.value.thirst >= MAX_STAT) {
      state.value.isGameOver = true
      saveHighScore()
      addLog('你没能在荒野中生存下来...', 'system')
    }
  }

  function canPerformAction(action: ActionType): boolean {
    if (state.value.isGameOver) return false
    const effects = actionEffects[action]
    if (effects.wood !== undefined && state.value.wood + effects.wood < 0) {
      return false
    }
    if (effects.stone !== undefined && state.value.stone + effects.stone < 0) {
      return false
    }
    return true
  }

  function performAction(action: ActionType) {
    if (!canPerformAction(action)) return

    const effects = actionEffects[action]
    applyEffects(effects)
    state.value.turn++

    addLog(`第 ${state.value.turn} 回合：${actionNames[action]}`, 'action')

    const event = getRandomEvent()
    applyEffects(event.effects)

    const eventLogType = event.type === 'good' ? 'good' : event.type === 'bad' ? 'bad' : 'event'
    addLog(event.text, eventLogType)

    recordResourceSnapshot()
    detectKeyMoments(event)

    checkGameOver()
  }

  function gatherWood() {
    performAction('gatherWood')
  }

  function gatherStone() {
    performAction('gatherStone')
  }

  function hunt() {
    performAction('hunt')
  }

  function drink() {
    performAction('drink')
  }

  function restart() {
    state.value = {
      health: 80,
      hunger: 30,
      thirst: 30,
      wood: 10,
      stone: 5,
      turn: 0,
      isGameOver: false,
      logs: [],
      resourceHistory: [],
      keyMoments: [],
    }
    logIdCounter = 0
    keyMomentIdCounter = 0
    currentGameSummary.value = null
    addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')
  }

  loadHighScore()
  addLog('你醒来发现自己身处荒野中，需要想办法生存下去...', 'system')

  return {
    state,
    highScore,
    highScoreRecord,
    currentGameSummary,
    canAct,
    canPerformAction,
    gatherWood,
    gatherStone,
    hunt,
    drink,
    restart,
  }
}
