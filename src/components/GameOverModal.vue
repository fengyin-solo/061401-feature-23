<script setup lang="ts">
import type { GameSummary } from '@/types/game'
import GameSummaryComp from '@/components/GameSummary.vue'

interface Props {
  show: boolean
  finalTurn: number
  highScore: number
  isNewRecord: boolean
  summary: GameSummary | null
}

defineProps<Props>()

const emit = defineEmits<{
  restart: []
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        <div class="relative bg-game-card rounded-3xl p-6 max-w-md w-full border border-game-border shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
          <div class="text-center mb-5">
            <div class="text-5xl mb-3">💀</div>
            <h2 class="text-2xl font-bold text-white mb-1">游戏结束</h2>
            <p class="text-gray-400 text-sm">你没能在荒野中生存下来...</p>
            <div v-if="isNewRecord" class="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
              <span class="text-xl">🏆</span>
              <span class="text-yellow-300 font-bold text-sm">新纪录！{{ finalTurn }} 回合</span>
            </div>
          </div>

          <div class="mb-5">
            <GameSummaryComp :summary="summary" title="本局回顾" :show-empty="false" />
          </div>

          <div class="flex items-center justify-between bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 mb-5">
            <div>
              <p class="text-gray-400 text-xs">最高纪录</p>
              <p class="text-xl font-bold" :class="isNewRecord ? 'text-yellow-400' : 'text-gray-300'">
                {{ highScore }} 回合
              </p>
            </div>
            <div class="text-right">
              <p class="text-gray-400 text-xs">本局得分</p>
              <p class="text-xl font-bold text-white">{{ finalTurn }} 回合</p>
            </div>
          </div>

          <button
            @click="emit('restart')"
            class="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-green-500/25"
          >
            🔄 重新开始
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.9);
}
</style>
