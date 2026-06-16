<script setup lang="ts">
import { computed } from 'vue'
import type { GameSummary, KeyMoment, ResourceSnapshot } from '@/types/game'

interface Props {
  summary: GameSummary | null | undefined
  title?: string
  compact?: boolean
  showEmpty?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '本局回顾',
  compact: false,
  showEmpty: true,
})

const causeOfDeathIcon = computed(() => {
  if (!props.summary) return '❓'
  switch (props.summary.causeOfDeath) {
    case 'health_zero': return '💔'
    case 'hunger_max': return '�'
    case 'thirst_max': return '💧'
    default: return '❓'
  }
})

const displayMoments = computed(() => {
  if (!props.summary?.keyMoments?.length) return []
  return [...props.summary.keyMoments].reverse().slice(0, props.compact ? 4 : 10)
})

const chartData = computed(() => {
  if (!props.summary?.resourceHistory || props.summary.resourceHistory.length < 2) {
    return null
  }
  const history = props.summary.resourceHistory
  const step = Math.max(1, Math.floor(history.length / 30))
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
    case 'critical_health': return 'text-red-400 bg-red-500/15 border-red-500/30'
    case 'critical_hunger': return 'text-orange-400 bg-orange-500/15 border-orange-500/30'
    case 'critical_thirst': return 'text-blue-400 bg-blue-500/15 border-blue-500/30'
    case 'major_good_event': return 'text-green-400 bg-green-500/15 border-green-500/30'
    case 'major_bad_event': return 'text-red-400 bg-red-500/15 border-red-500/30'
    case 'resource_depleted': return 'text-amber-400 bg-amber-500/15 border-amber-500/30'
    case 'turn_milestone': return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
    default: return 'text-gray-400 bg-gray-500/15 border-gray-500/30'
  }
}

function getMomentBadgeColor(type: KeyMoment['type']) {
  switch (type) {
    case 'critical_health': return 'bg-red-500/20 text-red-300'
    case 'critical_hunger': return 'bg-orange-500/20 text-orange-300'
    case 'critical_thirst': return 'bg-blue-500/20 text-blue-300'
    case 'major_good_event': return 'bg-green-500/20 text-green-300'
    case 'major_bad_event': return 'bg-red-500/20 text-red-300'
    case 'resource_depleted': return 'bg-amber-500/20 text-amber-300'
    case 'turn_milestone': return 'bg-yellow-500/20 text-yellow-300'
    default: return 'bg-gray-500/20 text-gray-300'
  }
}

function getMomentTypeLabel(type: KeyMoment['type']) {
  switch (type) {
    case 'critical_health': return '生命危急'
    case 'critical_hunger': return '饥饿告急'
    case 'critical_thirst': return '口渴告急'
    case 'major_good_event': return '好运降临'
    case 'major_bad_event': return '遭遇灾难'
    case 'resource_depleted': return '资源耗尽'
    case 'turn_milestone': return '里程碑'
    default: return '事件'
  }
}
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-base font-bold text-white flex items-center gap-2">
      <span>📋</span>
      <span>{{ title }}</span>
    </h3>

    <template v-if="summary">
      <div class="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center text-2xl flex-shrink-0">
            {{ causeOfDeathIcon }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-gray-500 mb-0.5">致命原因</p>
            <p class="text-white font-medium text-sm leading-tight">{{ summary.causeOfDeathText }}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-xs text-gray-500 mb-0.5">生存回合</p>
            <p class="text-2xl font-bold text-white tabular-nums">{{ summary.finalTurn }}</p>
          </div>
        </div>
      </div>

      <div class="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
        <p class="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
          <span>📈</span>
          <span>资源曲线</span>
        </p>
        <div v-if="chartData" class="relative">
          <svg :width="chartData.width" :height="chartData.height" class="w-full h-16" viewBox="0 0 100 50" preserveAspectRatio="none">
            <line x1="0" y1="25" x2="100" y2="25" stroke="#374151" stroke-width="0.5" stroke-dasharray="2,2" />
            <polyline :points="getPathPoints(chartData.points, 'health', 100)" fill="none" stroke="#ef4444" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
            <polyline :points="getPathPoints(chartData.points, 'hunger', 100)" fill="none" stroke="#f97316" stroke-width="1.2" stroke-dasharray="3,2" stroke-linecap="round" stroke-linejoin="round" />
            <polyline :points="getPathPoints(chartData.points, 'thirst', 100)" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-dasharray="1.5,1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="flex justify-center gap-4 mt-2 text-xs">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span class="text-gray-400">生命</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-orange-500"></span>
              <span class="text-gray-400">饥饿</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span class="text-gray-400">口渴</span>
            </span>
          </div>
        </div>
        <p v-else class="text-gray-500 text-xs text-center py-4">数据不足，无法生成曲线</p>
      </div>

      <div class="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
        <p class="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
          <span>🎯</span>
          <span>关键节点</span>
          <span class="ml-auto text-gray-500">{{ displayMoments.length }} 个</span>
        </p>
        <div v-if="displayMoments.length > 0" class="space-y-1.5">
          <div
            v-for="moment in displayMoments"
            :key="moment.id"
            class="flex items-center gap-2 text-xs"
          >
            <span class="text-gray-500 tabular-nums w-12 flex-shrink-0">第{{ moment.turn }}回合</span>
            <span class="text-base flex-shrink-0">{{ moment.icon }}</span>
            <span :class="['px-1.5 py-0.5 rounded text-xs flex-1 min-w-0 truncate border', getMomentColor(moment.type)]">
              {{ moment.text }}
            </span>
          </div>
        </div>
        <p v-else class="text-gray-500 text-xs text-center py-4">暂无关键节点记录</p>
      </div>
    </template>

    <div v-else-if="showEmpty" class="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30 border-dashed text-center">
      <div class="text-3xl mb-2">📊</div>
      <p class="text-gray-400 text-sm">暂无纪录数据</p>
      <p class="text-gray-500 text-xs mt-1">开始游戏后这里会显示回顾摘要</p>
    </div>
  </div>
</template>
