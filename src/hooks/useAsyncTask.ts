/**
 * 异步任务管理 Hook
 * 支持任务创建、状态查询、进度订阅
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TaskProgress, TaskStatus } from '@/lib/queue/queue-manager'
import { logger } from '@/lib/utils/logger'

export interface AsyncTaskState {
  taskId: string | null
  queueName: string | null
  status: TaskStatus | null
  progress: TaskProgress | null
  result: any | null
  error: string | null
  isLoading: boolean
}

export interface CreateTaskOptions {
  type: 'video' | 'image' | 'storyboard'
  data: any
  priority?: number
  delay?: number
}

export function useAsyncTask() {
  const [state, setState] = useState<AsyncTaskState>({
    taskId: null,
    queueName: null,
    status: null,
    progress: null,
    result: null,
    error: null,
    isLoading: false,
  })

  const eventSourceRef = useRef<EventSource | null>(null)

  /**
   * 创建任务
   */
  const createTask = useCallback(async (options: CreateTaskOptions) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      const { taskId, queueName } = await response.json()

      setState(prev => ({
        ...prev,
        taskId,
        queueName,
        status: 'waiting' as TaskStatus,
        isLoading: false,
      }))

      // 自动订阅进度
      subscribeProgress(taskId, queueName)

      return { taskId, queueName }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }))
      throw error
    }
  }, [])

  /**
   * 订阅任务进度（SSE）
   */
  const subscribeProgress = useCallback((taskId: string, queueName: string) => {
    // 关闭之前的连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(
      `/api/tasks/progress?taskId=${taskId}&queueName=${queueName}`
    )

    eventSource.addEventListener('progress', (event) => {
      const progress: TaskProgress = JSON.parse(event.data)
      setState(prev => ({
        ...prev,
        progress,
        status: 'active' as TaskStatus,
      }))
    })

    eventSource.addEventListener('completed', (event) => {
      const result = JSON.parse(event.data)
      setState(prev => ({
        ...prev,
        status: 'completed' as TaskStatus,
        result,
        progress: {
          progress: 100,
          stage: 'completed',
          message: '任务完成',
        },
      }))
      eventSource.close()
    })

    eventSource.addEventListener('failed', (event) => {
      const { error } = JSON.parse(event.data)
      setState(prev => ({
        ...prev,
        status: 'failed' as TaskStatus,
        error,
      }))
      eventSource.close()
    })

    eventSource.onerror = () => {
      logger.error('[useAsyncTask] SSE connection error')
      eventSource.close()
    }

    eventSourceRef.current = eventSource
  }, [])

  /**
   * 查询任务状态
   */
  const queryStatus = useCallback(async (taskId: string, queueName: string) => {
    try {
      const response = await fetch(
        `/api/tasks/status?taskId=${taskId}&queueName=${queueName}`
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to query status')
      }

      const status = await response.json()
      setState(prev => ({ ...prev, ...status }))

      return status
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
      }))
      throw error
    }
  }, [])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    setState({
      taskId: null,
      queueName: null,
      status: null,
      progress: null,
      result: null,
      error: null,
      isLoading: false,
    })
  }, [])

  // 组件卸载时关闭 SSE 连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return {
    ...state,
    createTask,
    subscribeProgress,
    queryStatus,
    reset,
  }
}
