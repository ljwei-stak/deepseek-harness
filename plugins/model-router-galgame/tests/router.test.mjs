import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assessComplexity,
  buildPlan,
  classifyTask,
  collectOpenCodeEndpointRepairs,
  isOfficialOpenCodeEndpoint,
  modelMetadata,
} from '../.dsh-plugin/shared/router.mjs'

const routes = [
  { provider: 'zen', model: 'DeepSeek V4 Flash' },
  { provider: 'zen', model: 'GPT 5.6 Sol' },
  { provider: 'zen', model: 'Qwen3.7 Plus' },
]

test('classifies simple and specialized tasks', () => {
  assert.equal(classifyTask('请把这句话翻译成英文'), 'general')
  assert.equal(classifyTask('请证明这个数学定理并给出公式'), 'math')
  assert.equal(classifyTask('请实现一个带测试的 REST API'), 'code')
  assert.equal(assessComplexity('请简要解释什么是缓存').band, 'simple')
  assert.equal(assessComplexity('请设计系统架构，拆分模块并编写测试与部署方案').band, 'complex')
})

test('scores available routes and returns a cost estimate', () => {
  const plan = buildPlan({ text: '请设计系统架构，拆分模块并编写测试与部署方案', available: routes })
  assert.equal(plan.taskType, 'code')
  assert.equal(plan.complexity.band, 'complex')
  assert.equal(plan.candidates.length, 3)
  assert.ok(plan.selected)
  assert.ok(plan.estimatedCost > 0)
  assert.ok(plan.synthesizer)
  assert.equal(plan.subtasks.at(-1).purpose, 'synthesis')
  assert.equal(modelMetadata('GPT 5.6 Sol').id, 'gpt-5.6-sol')
})

test('recognizes an official OpenCode website override but preserves custom routes', () => {
  assert.equal(isOfficialOpenCodeEndpoint('opencode', 'https://opencode.ai'), true)
  assert.equal(isOfficialOpenCodeEndpoint('opencode', 'https://opencode.ai/zen/v1'), true)
  assert.equal(isOfficialOpenCodeEndpoint('opencode-go', 'https://www.opencode.ai/zen/go'), true)
  assert.equal(isOfficialOpenCodeEndpoint('opencode-zen', 'https://opencode.ai/zen'), true)
  assert.equal(isOfficialOpenCodeEndpoint('opencode-go-zen', 'https://opencode.ai/zen/go/v1'), true)
  assert.equal(isOfficialOpenCodeEndpoint('opencode', 'https://gateway.example/v1'), false)
  assert.equal(isOfficialOpenCodeEndpoint('openai', 'https://opencode.ai'), false)
  assert.equal(isOfficialOpenCodeEndpoint('opencode', 'https://opencode.ai'), true)
})

test('creates a path mutation only for user-owned catalog endpoint overrides', () => {
  assert.deepEqual(
    collectOpenCodeEndpointRepairs({
      providers: {
        opencode: { apiKeyEnv: 'OPENCODE_API_KEY', baseURL: 'https://opencode.ai/zen' },
        'opencode-zen': { baseURL: 'https://www.opencode.ai/zen/v1' },
        'opencode-go': { baseURL: 'https://gateway.example/v1' },
        openai: { baseURL: 'https://opencode.ai' },
      },
    }),
    [
      { op: 'unset', path: ['providers', 'opencode', 'baseURL'] },
      { op: 'unset', path: ['providers', 'opencode-zen', 'baseURL'] },
    ],
  )
  assert.deepEqual(
    collectOpenCodeEndpointRepairs({ providers: { opencode: { models: [{ id: 'catalog-model' }], baseURL: 'https://opencode.ai' } } }),
    [{ op: 'unset', path: ['providers', 'opencode', 'baseURL'] }],
  )
})
