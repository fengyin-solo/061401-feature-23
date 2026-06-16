export interface GameState {
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
  turn: number
  isGameOver: boolean
  logs: LogEntry[]
  resourceHistory: ResourceSnapshot[]
  keyMoments: KeyMoment[]
}

export interface LogEntry {
  id: number
  text: string
  type: 'action' | 'event' | 'system' | 'good' | 'bad'
  turn: number
}

export interface RandomEvent {
  id: string
  text: string
  type: 'good' | 'bad' | 'neutral'
  effects: {
    health?: number
    hunger?: number
    thirst?: number
    wood?: number
    stone?: number
  }
}

export type ActionType = 'gatherWood' | 'gatherStone' | 'hunt' | 'drink'

export interface ActionEffect {
  health?: number
  hunger?: number
  thirst?: number
  wood?: number
  stone?: number
}

export interface ResourceSnapshot {
  turn: number
  health: number
  hunger: number
  thirst: number
  wood: number
  stone: number
}

export type KeyMomentType = 'critical_health' | 'critical_hunger' | 'critical_thirst' | 'major_good_event' | 'major_bad_event' | 'resource_depleted' | 'turn_milestone'

export interface KeyMoment {
  id: number
  turn: number
  type: KeyMomentType
  text: string
  icon: string
}

export type CauseOfDeath = 'health_zero' | 'hunger_max' | 'thirst_max'

export interface GameSummary {
  finalTurn: number
  causeOfDeath: CauseOfDeath
  causeOfDeathText: string
  keyMoments: KeyMoment[]
  resourceHistory: ResourceSnapshot[]
  createdAt: number
}

export interface HighScoreRecord {
  turn: number
  summary: GameSummary
}

