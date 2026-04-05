/**
 * 阿里云语音识别引擎
 * 文档：https://help.aliyun.com/product/30413.html
 * 价格：¥0.003/分钟
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import type { ASREngine, TranscriptionResult } from './types'

const execAsync = promisify(exec)

export class AliyunASREngine implements ASREngine {
  name = 'aliyun'
  priority = 2  // 第二优先级（便宜但需要网络）

  private accessKeyId: string
  private accessKeySecret: string
  private appKey: string

  constructor() {
    this.accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID || ''
    this.accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET || ''
    this.appKey = process.env.ALIYUN_ASR_APP_KEY || ''
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.accessKeyId && this.accessKeySecret && this.appKey)
  }

  estimateCost(durationSeconds: number): number {
    // ¥0.003/分钟 = ¥0.00005/秒
    return (durationSeconds / 60) * 0.003
  }

  async transcribe(audioPath: string): Promise<TranscriptionResult> {
    if (!await this.isAvailable()) {
      throw new Error('阿里云配置不完整，请设置 ALIYUN_ACCESS_KEY_ID、ALIYUN_ACCESS_KEY_SECRET、ALIYUN_ASR_APP_KEY')
    }

    try {
      // 使用 curl 调用阿里云录音文件识别 API
      // 注意：这是简化实现，生产环境建议使用官方 SDK
      const result = await this.callAliyunAPI(audioPath)

      return {
        text: result.text,
        segments: result.sentences?.map((s: any) => ({
          start: s.begin_time / 1000,  // 毫秒转秒
          end: s.end_time / 1000,
          text: s.text,
        })),
        language: 'zh',
      }
    } catch (err) {
      throw new Error(`阿里云 ASR 失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  private async callAliyunAPI(audioPath: string): Promise<any> {
    // 1. 上传音频文件到阿里云 OSS（这里简化处理，实际需要 OSS SDK）
    // 2. 调用录音文件识别 API
    // 3. 轮询获取识别结果

    // TODO: 完整实现需要阿里云 SDK
    // 这里先抛出提示
    throw new Error('阿里云 ASR 引擎需要完整实现（需要 @alicloud/pop-core SDK）')

    // 示例代码（需要安装 SDK）：
    // const Core = require('@alicloud/pop-core')
    // const client = new Core({
    //   accessKeyId: this.accessKeyId,
    //   accessKeySecret: this.accessKeySecret,
    //   endpoint: 'https://nls-meta.cn-shanghai.aliyuncs.com',
    //   apiVersion: '2019-02-28'
    // })
    //
    // const params = {
    //   AppKey: this.appKey,
    //   FileLink: audioUrl,
    //   Format: 'mp3',
    //   SampleRate: 16000,
    // }
    //
    // const result = await client.request('SubmitTask', params, { method: 'POST' })
    // return result
  }
}
