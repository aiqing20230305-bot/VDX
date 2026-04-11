import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock server-only module to allow imports in test environment
vi.mock('server-only', () => ({}))

// Mock Claude API to avoid actual API calls in tests
vi.mock('@/lib/ai/claude', () => ({
  streamText: vi.fn().mockImplementation(async function* () {
    yield '测试响应内容'
  }),
}))
