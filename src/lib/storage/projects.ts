/**
 * 项目存储管理（localStorage）
 * 提供项目的 CRUD 操作和自动保存功能
 */

import { v4 as uuid } from 'uuid'
import type { Project, Frame, WorkspaceContext } from '@/types/workspace'
import { logger } from '@/lib/utils/logger'

const STORAGE_KEY = 'superVideo:projects'
const CURRENT_PROJECT_KEY = 'superVideo:currentProject'

export interface StoredProject extends Project {
  frames: Frame[]
}

/** 获取所有项目列表 */
export function getAllProjects(): StoredProject[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []

    const projects = JSON.parse(data)
    // 转换日期字符串回 Date 对象
    return projects.map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }))
  } catch (error) {
    logger.error('[Storage] Failed to load projects:', error)
    return []
  }
}

/** 获取单个项目 */
export function getProject(projectId: string): StoredProject | null {
  const projects = getAllProjects()
  return projects.find(p => p.id === projectId) || null
}

/** 创建新项目 */
export function createProject(options?: {
  title?: string
  frames?: Frame[]
}): StoredProject {
  const now = new Date()
  const frames = options?.frames || []

  const project: StoredProject = {
    id: uuid(),
    title: options?.title || `未命名项目 ${new Date().toLocaleDateString()}`,
    thumbnail: frames[0]?.imageUrl,
    createdAt: now,
    updatedAt: now,
    frameCount: frames.length,
    duration: frames.reduce((sum, f) => sum + f.duration, 0),
    status: frames.length > 0 ? 'draft' : 'draft',
    frames,
  }

  const projects = getAllProjects()
  projects.unshift(project) // 新项目放在最前面
  saveAllProjects(projects)
  setCurrentProjectId(project.id)

  return project
}

/** 更新项目 */
export function updateProject(
  projectId: string,
  updates: Partial<Omit<StoredProject, 'id' | 'createdAt'>>
): StoredProject | null {
  const projects = getAllProjects()
  const index = projects.findIndex(p => p.id === projectId)

  if (index === -1) return null

  const updatedProject = {
    ...projects[index],
    ...updates,
    updatedAt: new Date(),
    // 自动更新统计信息
    frameCount: updates.frames ? updates.frames.length : projects[index].frameCount,
    duration: updates.frames
      ? updates.frames.reduce((sum, f) => sum + f.duration, 0)
      : projects[index].duration,
    thumbnail: updates.frames
      ? updates.frames[0]?.imageUrl || projects[index].thumbnail
      : projects[index].thumbnail,
  }

  projects[index] = updatedProject
  saveAllProjects(projects)

  return updatedProject
}

/** 删除项目 */
export function deleteProject(projectId: string): boolean {
  const projects = getAllProjects()
  const filtered = projects.filter(p => p.id !== projectId)

  if (filtered.length === projects.length) return false

  saveAllProjects(filtered)

  // 如果删除的是当前项目，清空当前项目
  if (getCurrentProjectId() === projectId) {
    clearCurrentProject()
  }

  return true
}

/** 保存所有项目 */
function saveAllProjects(projects: StoredProject[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch (error) {
    logger.error('[Storage] Failed to save projects:', error)
  }
}

/** 获取当前项目ID */
export function getCurrentProjectId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CURRENT_PROJECT_KEY)
}

/** 设置当前项目ID */
export function setCurrentProjectId(projectId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CURRENT_PROJECT_KEY, projectId)
}

/** 清空当前项目 */
export function clearCurrentProject(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CURRENT_PROJECT_KEY)
}

/** 自动保存当前项目 */
export function autoSaveProject(projectId: string, frames: Frame[]): void {
  updateProject(projectId, { frames })
}

/** 清空所有数据（危险操作） */
export function clearAllData(): void {
  if (typeof window === 'undefined') return

  if (confirm('确定要清空所有项目数据吗？此操作无法撤销！')) {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CURRENT_PROJECT_KEY)
  }
}

/** 导出数据（备份） */
export function exportData(): string {
  const projects = getAllProjects()
  return JSON.stringify(projects, null, 2)
}

/** 导入数据（恢复备份） */
export function importData(jsonData: string): boolean {
  try {
    const projects = JSON.parse(jsonData)
    if (!Array.isArray(projects)) {
      throw new Error('Invalid data format')
    }

    saveAllProjects(projects)
    return true
  } catch (error) {
    logger.error('[Storage] Failed to import data:', error)
    return false
  }
}
