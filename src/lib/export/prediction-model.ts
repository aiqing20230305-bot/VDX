/**
 * 导出预估 ML 模型
 * 使用简单线性回归 + 特征工程，无需 TensorFlow.js
 */
import { logger } from '@/lib/utils/logger'

import type { ExportFeatures, ExportRecord } from './prediction-data'
import { getExportRecords } from './prediction-data'

// 分辨率像素数映射
const RESOLUTION_PIXELS: Record<string, number> = {
  '720p': 1280 * 720,
  '1080p': 1920 * 1080,
  '2k': 2560 * 1440,
  '4k': 3840 * 2160
}

// 格式复杂度系数
const FORMAT_COMPLEXITY: Record<string, number> = {
  mp4: 1.0, // H.264 基准
  webm: 1.2, // VP9 编码更慢
  mov: 2.5 // ProRes 最慢
}

/**
 * 特征向量化
 * 将 ExportFeatures 转换为数值特征向量
 */
function vectorizeFeatures(features: ExportFeatures): number[] {
  return [
    features.frameCount,
    RESOLUTION_PIXELS[features.resolution],
    features.fps,
    features.videoDuration,
    features.sceneComplexity,
    features.transitionCount,
    features.hasAudio ? 1 : 0,
    features.hasSubtitles ? 1 : 0,
    features.hasWatermark ? 1 : 0,
    features.subtitleTrackCount,
    FORMAT_COMPLEXITY[features.format],
    features.quality / 100
  ]
}

/**
 * 简单线性回归模型
 * y = w1*x1 + w2*x2 + ... + wn*xn + b
 */
class LinearRegressionModel {
  private weights: number[] = []
  private bias: number = 0
  private trained: boolean = false

  /**
   * 训练模型（最小二乘法）
   */
  train(X: number[][], y: number[]): void {
    if (X.length === 0 || X.length !== y.length) {
      throw new Error('Invalid training data')
    }

    const n = X.length
    const m = X[0].length

    // 简化实现：使用特征均值作为权重（快速近似）
    // 生产环境可以用梯度下降或正规方程
    this.weights = new Array(m).fill(0)

    for (let j = 0; j < m; j++) {
      let sum = 0
      for (let i = 0; i < n; i++) {
        sum += X[i][j] * y[i]
      }
      this.weights[j] = sum / n / 1000 // 归一化
    }

    // 计算 bias（不调用 predict，直接计算）
    let sumY = 0
    let sumPred = 0
    for (let i = 0; i < n; i++) {
      sumY += y[i]
      // 手动计算预测值（不使用 this.predict，因为此时 trained 还是 false）
      let pred = 0
      for (let j = 0; j < m; j++) {
        pred += this.weights[j] * X[i][j]
      }
      sumPred += pred
    }
    this.bias = (sumY - sumPred) / n

    this.trained = true
  }

  /**
   * 预测
   */
  predict(x: number[]): number {
    if (!this.trained) {
      throw new Error('Model not trained')
    }

    let sum = this.bias
    for (let i = 0; i < x.length; i++) {
      sum += this.weights[i] * x[i]
    }

    return Math.max(sum, 0) // 确保非负
  }
}

// 全局模型实例
let renderTimeModel: LinearRegressionModel | null = null
let fileSizeModel: LinearRegressionModel | null = null

/**
 * 训练模型（基于历史数据）
 */
export function trainModels(): {
  success: boolean
  recordCount: number
  error?: string
} {
  try {
    const records = getExportRecords()

    if (records.length < 10) {
      return {
        success: false,
        recordCount: records.length,
        error: 'Not enough data (need at least 10 records)'
      }
    }

    // 准备训练数据
    const X = records.map(r => vectorizeFeatures(r.features))
    const yRenderTime = records.map(r => r.actuals.renderTime)
    const yFileSize = records.map(r => r.actuals.fileSize)

    // 训练渲染时间模型
    renderTimeModel = new LinearRegressionModel()
    renderTimeModel.train(X, yRenderTime)

    // 训练文件大小模型
    fileSizeModel = new LinearRegressionModel()
    fileSizeModel.train(X, yFileSize)

    logger.info('[PredictionModel] Models trained successfully', {
      recordCount: records.length
    })

    return {
      success: true,
      recordCount: records.length
    }
  } catch (error: any) {
    logger.error('[PredictionModel] Training failed:', error)
    return {
      success: false,
      recordCount: 0,
      error: error.message
    }
  }
}

/**
 * 预测渲染时间（秒）
 */
export function predictRenderTime(features: ExportFeatures): number | null {
  if (!renderTimeModel) {
    return null
  }

  try {
    const x = vectorizeFeatures(features)
    return renderTimeModel.predict(x)
  } catch (error) {
    logger.error('[PredictionModel] Render time prediction failed:', error)
    return null
  }
}

/**
 * 预测文件大小（字节）
 */
export function predictFileSize(features: ExportFeatures): number | null {
  if (!fileSizeModel) {
    return null
  }

  try {
    const x = vectorizeFeatures(features)
    return fileSizeModel.predict(x)
  } catch (error) {
    logger.error('[PredictionModel] File size prediction failed:', error)
    return null
  }
}

/**
 * 检查模型是否已训练
 */
export function isModelTrained(): boolean {
  return renderTimeModel !== null && fileSizeModel !== null
}

/**
 * 清空已训练的模型（用于测试）
 */
export function clearModels(): void {
  renderTimeModel = null
  fileSizeModel = null
}

/**
 * 自动训练（如果有足够数据）
 */
export function autoTrain(): void {
  const records = getExportRecords()
  if (records.length >= 10 && !isModelTrained()) {
    trainModels()
  }
}
