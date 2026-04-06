'use client'

import { motion } from 'framer-motion'
import { Check, Zap, Film, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

export interface StoryboardVariant {
  id: string
  name: string
  description: string
  cinematicStyle: string
  previewImageUrl?: string
  storyboard: {
    totalFrames: number
    frames: Array<{ duration: number }>
  }
}

interface Props {
  variants: StoryboardVariant[]
  onSelect: (variantId: string) => void
  selectedId?: string
}

export function StoryboardVariantSelector({ variants, onSelect, selectedId }: Props) {
  const getIcon = (name: string) => {
    if (name.includes('特写') || name.includes('情绪')) return Zap
    if (name.includes('全景') || name.includes('叙事')) return Film
    return TrendingUp
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Film className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-zinc-100">
          选择分镜风格
        </h3>
      </div>

      <p className="text-sm text-zinc-400">
        同一个脚本，3种不同的镜头语言和叙事节奏。选择你喜欢的版本继续生成完整分镜图。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {variants.map((variant, index) => {
          const Icon = getIcon(variant.name)
          const isSelected = selectedId === variant.id
          const avgDuration = variant.storyboard.frames.length > 0
            ? (variant.storyboard.frames.reduce((sum, f) => sum + f.duration, 0) / variant.storyboard.frames.length).toFixed(1)
            : '3.5'

          return (
            <motion.button
              key={variant.id}
              onClick={() => onSelect(variant.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all',
                'hover:scale-[1.02] active:scale-[0.98]',
                isSelected
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-white/10 bg-zinc-900/50 hover:border-cyan-400/50'
              )}
            >
              {/* 选中标记 */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-zinc-900" />
                </motion.div>
              )}

              {/* 预览图 */}
              {variant.previewImageUrl ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-800">
                  <Image
                    src={variant.previewImageUrl}
                    alt={variant.name}
                    fill
                    className="object-cover"
                  />
                  {/* 序号标记 */}
                  <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-sm font-bold text-cyan-400">
                    {index + 1}
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Icon className="w-12 h-12 text-zinc-600" />
                </div>
              )}

              {/* 标题和描述 */}
              <div className="flex items-start gap-2">
                <Icon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-zinc-100">{variant.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    {variant.description}
                  </p>
                </div>
              </div>

              {/* 技术指标 */}
              <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2 border-t border-white/5">
                <span>{variant.storyboard.totalFrames} 帧</span>
                <span>·</span>
                <span>平均 {avgDuration}秒/帧</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* 提示信息 */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <div className="w-1 h-4 bg-cyan-400 rounded-full flex-shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-400">
          <strong className="text-cyan-400">提示：</strong>
          选择后将使用该镜头语言生成完整的分镜图片。不同风格会影响画面构图、镜头运动和叙事节奏。
        </p>
      </div>
    </div>
  )
}
