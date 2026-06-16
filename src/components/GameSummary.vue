<script setup lang="ts">
import { computed } from 'vue'
import type { GameSummary, KeyMoment, ResourceSnapshot } from '@/types/game'

interface Props {
  summary: GameSummary | null
  title?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '本局回顾',
  compact: false,
})

const causeOfDeathIcon = computed(() => {
  if (!props.summary) return '❓'
  switch (props.summary.causeOfDeath) {
    case 'health_zero': return '💔'
    case 'hunger_max': return '🍽️'
    case 'thirst_max': return '🏜️'
    default: return '❓'
  }
})

const displayMoments = computed(() => {
  if (!props.summary?.keyMoments) return []
  return [...props.summary.keyMoments].reverse().slice(0, props.compact ? 4 : 8)
})

const chartData = computed(() => {
  if (!props.summary?.resourceHistory || props.summary.resourceHistory.length < 2) {
    return null
  }
  const history = props.summary.resourceHistory
  const step = Math.max(1, Math.floor(history.length / 20))
  const sampled = history.filter((_, i) => i % step === 0 || i === history.length - 1)
  return {
    points: sampled,
    width: 100,
    height: 50,
  }
})

function getPathPoints(snapshots: ResourceSnapshot[], key: keyof ResourceSnapshot, max: number) {
  if (snapshots.length === 0) return ''
  const width = 100
  const height = 50
  const xStep = width / (snapshots.length - 1 || 1)
  return snapshots.map((s, i) => {
    const x = i * xStep
    const val = s[key] as number
    const y = height - (val / max) * height
    return `${x},${y}`
  }).join(' ')
}

function getMomentColor(type: KeyMoment['type']) {
  switch (type) {
    case 'critical_health': return 'text-red-400 bg-red-500/10'
    case 'critical_hunger': return 'text-orange-400 bg-orange-500/10'
    case 'critical_thirst': return 'text-blue-400 bg-blue-500/10'
    case 'major_good_event': return 'text-green-400 bg-green-500/10'
    case 'major_bad_event': return 'text-red-400 bg-red-500/10'
    case 'resource_depleted': return 'text-amber-400 bg-amber-500/10'
    case 'turn_milestone': return 'text-yellow-400 bg-yellow-500/10'
    default: return 'text-gray-400 bg-gray-500/10'
  }
}
</script>

<template>
  <div v-if="summary" class="space-y-4">
    <h3 class="text-lg font-bold text-white flex items-center gap-2">
      <span>📋</span>
      <span>{{ title }}</span>
    </h3>

    <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <div class="flex items-center gap-3">
        <span class="text-3xl">{{ causeOfDeathIcon }}</span>
        <div>
          <p class="text-sm text-gray-400">致命原因</p>
          <p class="text-white font-medium">{{ summary.causeOfDeathText }}</p>
        </div>
      </div>
    </div>

    <div v-if="chartData" class="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <p class="text-sm text-gray-400 mb-3 flex items-center gap-2">
        <span>📈</span>
        <span>资源曲线</span>
      </p>
      <div class="relative">
        <svg :width="chartData.width" :height="chartData.height" class="w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          <defs>
            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="hungerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#f97316" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#f97316" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="thirstGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
            </linearGradient>
          </defs>

          <polyline :points="getPathPoints(chartData.points, 'health', 100)" fill="none" stroke="#ef4444" stroke-width="1" />
          <polyline :points="getPathPoints(chartData.points, 'hunger', 100)" fill="none" stroke="#f97316" stroke-width="1" stroke-dasharray="2,1" />
          <polyline :points="getPathPoints(chartData.points, 'thirst', 100)" fill="none" stroke="#3b82f6" stroke-width="1" stroke-dasharray="1,1" />
        </svg>
        <div class="flex justify-center gap-4 mt-2 text-xs">
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span><span class="text-gray-400">生命</span></span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-orange-500"></span><span class="text-gray-400">饥饿</span></span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span><span class="text-gray-400">口渴</span></span>
        </div>
      </div>
    </div>

    <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <p class="text-sm text-gray-400 mb-3 flex items-center gap-2">
        <span>🎯</span>
        <span>关键节点</span>
      </p>
      <div v-if="displayMoments.length > 0" class="space-y-2">
        <div
          v-for="moment in displayMoments"
          :key="moment.id"
          class="flex items-start gap-2 text-sm"
        >
          <span class="text-base flex-shrink-0">{{ moment.icon }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-gray-500 text-xs">第{{ moment.turn }}回合</span>
              <span :class="['px-1.5 py-0.5 rounded text-xs', getMomentColor(moment.type)]">
                {{ moment.text }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="text-gray-500 text-sm">暂无关键节点记录</p>
    </div>
  </div>
</template>
