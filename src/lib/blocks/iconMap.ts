/**
 * Block Icon Map
 * 仅导入实际使用的图标，避免全量导入 lucide-react (~ 250KB savings)
 */
import {
  ArrowRightLeft,
  Combine,
  Download,
  FileDown,
  FileText,
  Film,
  Image,
  ImagePlus,
  Package,
  ScanEye,
  Shield,
  Sparkles,
  Subtitles,
  Type,
  Box, // Fallback icon
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * 所有 Block 使用的图标映射表
 * Key: 图标名称（与 Block 定义中的 icon 字段匹配）
 * Value: Lucide Icon 组件
 */
export const BLOCK_ICON_MAP: Record<string, LucideIcon> = {
  ArrowRightLeft,
  Combine,
  Download,
  FileDown,
  FileText,
  Film,
  Image,
  ImagePlus,
  Package,
  ScanEye,
  Shield,
  Sparkles,
  Subtitles,
  Type,
}

/**
 * 默认/回退图标
 */
export const DEFAULT_BLOCK_ICON = Box
