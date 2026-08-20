/**
 * Shared, deterministic routing model used by the Host and GAL client.
 * It intentionally exposes the scoring summary, not private model reasoning.
 */

export const OBJECTIVE_WEIGHTS = Object.freeze({
  simple: Object.freeze({ quality: 0.35, cost: 0.45, latency: 0.15, risk: 0.05 }),
  balanced: Object.freeze({ quality: 0.52, cost: 0.28, latency: 0.12, risk: 0.08 }),
  complex: Object.freeze({ quality: 0.65, cost: 0.18, latency: 0.07, risk: 0.10 }),
})

// USD per million tokens. Values are an initial catalog and can be replaced by
// a provider's live pricing without changing the scoring code.
export const MODEL_CATALOG = Object.freeze([
  { id: 'claude-fable-5', aliases: ['claude-fable-5', 'claude fable 5'], quality: 0.99, latency: 0.34, costIn: 10, costOut: 50, specialties: ['reasoning', 'writing', 'research'], risk: 0.06 },
  { id: 'claude-opus-4-8', aliases: ['claude-opus-4-8', 'claude opus 4.8'], quality: 0.97, latency: 0.39, costIn: 5, costOut: 25, specialties: ['reasoning', 'writing', 'code'], risk: 0.07 },
  { id: 'gpt-5.6-sol', aliases: ['gpt-5.6-sol', 'gpt 5.6 sol'], quality: 0.98, latency: 0.40, costIn: 5, costOut: 30, specialties: ['reasoning', 'code', 'math', 'vision'], risk: 0.06 },
  { id: 'gpt-5.5', aliases: ['gpt-5.5', 'gpt 5.5'], quality: 0.95, latency: 0.44, costIn: 5, costOut: 30, specialties: ['reasoning', 'code', 'math'], risk: 0.08 },
  { id: 'deepseek-v4-pro', aliases: ['deepseek-v4-pro', 'deepseek v4 pro'], quality: 0.93, latency: 0.52, costIn: 1.74, costOut: 3.48, specialties: ['code', 'math', 'reasoning'], risk: 0.10 },
  { id: 'deepseek-v4-flash', aliases: ['deepseek-v4-flash', 'deepseek v4 flash'], quality: 0.82, latency: 0.82, costIn: 0.14, costOut: 0.28, specialties: ['code', 'summarization', 'classification'], risk: 0.14 },
  { id: 'kimi-k3', aliases: ['kimi-k3', 'kimi k3'], quality: 0.91, latency: 0.56, costIn: 3, costOut: 15, specialties: ['reasoning', 'long-context', 'code'], risk: 0.10 },
  { id: 'qwen3.7-max', aliases: ['qwen3.7-max', 'qwen 3.7 max'], quality: 0.94, latency: 0.50, costIn: 2.5, costOut: 7.5, specialties: ['reasoning', 'math', 'code'], risk: 0.08 },
  { id: 'qwen3.7-plus', aliases: ['qwen3.7-plus', 'qwen 3.7 plus'], quality: 0.87, latency: 0.72, costIn: 0.4, costOut: 1.6, specialties: ['code', 'math', 'writing'], risk: 0.12 },
  { id: 'glm-5.2', aliases: ['glm-5.2', 'glm 5.2'], quality: 0.89, latency: 0.64, costIn: 1.4, costOut: 4.4, specialties: ['reasoning', 'writing', 'math'], risk: 0.11 },
  { id: 'gpt-5.6-luna', aliases: ['gpt-5.6-luna', 'gpt 5.6 luna'], quality: 0.84, latency: 0.86, costIn: 0.2, costOut: 1.2, specialties: ['classification', 'summarization', 'code'], risk: 0.14 },
  { id: 'gpt-5.6-terra', aliases: ['gpt-5.6-terra', 'gpt 5.6 terra'], quality: 0.91, latency: 0.66, costIn: 2, costOut: 12, specialties: ['code', 'writing', 'reasoning'], risk: 0.10 },
  { id: 'minimax-m3', aliases: ['minimax-m3', 'minimax m3'], quality: 0.86, latency: 0.69, costIn: 0.3, costOut: 1.2, specialties: ['writing', 'code', 'summarization'], risk: 0.13 },
  { id: 'gemini-3-flash', aliases: ['gemini 3 flash', 'gemini-3-flash'], quality: 0.88, latency: 0.73, costIn: 0.5, costOut: 3, specialties: ['vision', 'research', 'summarization'], risk: 0.12 },
  { id: 'big-pickle', aliases: ['big pickle'], quality: 0.70, latency: 0.88, costIn: 0, costOut: 0, specialties: ['classification', 'summarization'], risk: 0.24 },
])

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const normalize = value => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')

/** OpenCode routes whose catalog entries carry their own protocol endpoint. */
export const OPENCODE_CATALOG_PROVIDERS = Object.freeze([
  'opencode',
  'opencode-go',
  // Some OpenCode-compatible configuration examples use the product name as
  // the route id. Treat those aliases as catalog routes too; the pi-ai catalog
  // still owns the actual model endpoints.
  'opencode-zen',
  'opencode-go-zen',
])

/** Normalize the route ids used by OpenCode-compatible settings. */
function normalizeOpenCodeProvider(provider) {
  const route = String(provider ?? '').trim().toLowerCase()
  return route.replace(/-zen$/, '')
}

/**
 * The pi-ai catalog stores different endpoints for OpenCode's wire families:
 * Anthropic models use /zen while OpenAI-compatible models use /zen/v1 (and
 * the Go route has the corresponding /zen/go variants). A provider-level URL
 * for the public website would overwrite those model endpoints and produce a
 * 404 HTML page. Only the official host is repaired; custom gateways remain
 * fully user-controlled.
 */
export function isOfficialOpenCodeEndpoint(provider, baseURL) {
  const route = String(provider ?? '').trim().toLowerCase()
  if (!['opencode', 'opencode-go'].includes(normalizeOpenCodeProvider(route))) return false
  if (typeof baseURL !== 'string' || baseURL.trim().length === 0) return false
  try {
    const parsed = new URL(baseURL.trim())
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    return host === 'opencode.ai' || host === 'www.opencode.ai'
  } catch {
    return false
  }
}

/** Return settings mutations that restore the official catalog endpoints. */
export function collectOpenCodeEndpointRepairs(user) {
  if (user === null || typeof user !== 'object' || Array.isArray(user)) return []
  const providers = user.providers
  if (providers === null || typeof providers !== 'object' || Array.isArray(providers)) return []
  const ops = []
  for (const [provider, profile] of Object.entries(providers)) {
    if (profile === null || typeof profile !== 'object' || Array.isArray(profile)) continue
    if (isOfficialOpenCodeEndpoint(provider, profile.baseURL)) {
      ops.push({ op: 'unset', path: ['providers', provider, 'baseURL'] })
    }
  }
  return ops
}

export function textFromMessages(messages) {
  if (!Array.isArray(messages)) return ''
  return messages.map(message => {
    if (!message || !Array.isArray(message.content)) return ''
    return message.content.map(block => typeof block?.text === 'string' ? block.text : '').join('\n')
  }).join('\n').trim()
}

export function classifyTask(text) {
  const value = String(text ?? '')
  const lower = value.toLowerCase()
  const has = pattern => pattern.test(lower)
  if (value.length < 80 && has(/翻译|解释|translate|explain/)) return 'general'
  if (has(/图片|图像|照片|视觉|image|vision|截图|识图/)) return 'vision'
  if (has(/数学|证明|定理|公式|方程|math|proof|theorem/)) return 'math'
  if (has(/代码|编程|工程|项目|架构|接口|api|debug|实现|部署|测试|code/)) return 'code'
  if (has(/研究|论文|文献|联网|检索|research|source|引用/)) return 'research'
  if (has(/总结|摘要|提炼|分类|翻译|summar|classif|extract/)) return 'summarization'
  if (has(/写作|润色|小说|文案|报告|writing|draft/)) return 'writing'
  return 'general'
}

export function assessComplexity(text) {
  const value = String(text ?? '')
  const lengthScore = clamp(value.length / 2200)
  const requirementScore = clamp((value.match(/(?:^|\n)\s*(?:[-*]|\d+[.)]|[一二三四五六七八九十]+[、.])/g) ?? []).length / 8)
  const codeScore = /(代码|工程|架构|接口|实现|部署|测试|code|api|debug)/i.test(value) ? 0.22 : 0
  const highReasoningScore = /(数学|证明|定理|研究|论文|复杂|多步骤|约束|比较|评估|架构|模块|部署|math|proof|research)/i.test(value) ? 0.20 : 0
  const visionScore = /(图片|图像|照片|截图|视觉|image|vision)/i.test(value) ? 0.12 : 0
  const domainMarkers = (value.match(/代码|工程|架构|接口|实现|部署|测试|模块|拆分|约束|评估|证明|定理|研究|论文|图片|图像|照片|视觉|code|api|debug|proof|research|vision/gi) ?? []).length
  const domainComplexity = clamp(domainMarkers / 5) * 0.28
  const raw = clamp(0.10 + lengthScore * 0.30 + requirementScore * 0.18 + domainComplexity + codeScore + highReasoningScore + visionScore)
  const band = raw < 0.34 ? 'simple' : raw < 0.66 ? 'balanced' : 'complex'
  return { value: raw, band }
}

function specialtyMatch(model, taskType) {
  if (model.specialties.includes(taskType)) return 1
  if (taskType === 'general') return 0.58
  if (taskType === 'research' && model.specialties.includes('writing')) return 0.68
  if (taskType === 'writing' && model.specialties.includes('reasoning')) return 0.62
  return 0.38
}

function costScore(model, maxCost) {
  if (maxCost <= 0) return model.costIn === 0 && model.costOut === 0 ? 1 : 0.05
  return clamp(1 - ((model.costIn + model.costOut) / 2) / maxCost)
}

export function estimateCost(model, text, outputTokens = 900) {
  const inputTokens = Math.max(80, Math.ceil(String(text ?? '').length / 3.7))
  return ((inputTokens * model.costIn) + (outputTokens * model.costOut)) / 1_000_000
}

export function modelMetadata(name) {
  const key = normalize(name)
  return MODEL_CATALOG.find(model => model.aliases.some(alias => {
    const candidate = normalize(alias)
    return key === candidate || key.includes(candidate) || candidate.includes(key)
  })) ?? null
}

/**
 * Return the staged collaboration task for one agent-loop step.
 * Complex turns deliberately use the loop's real steps: each work report is
 * logged as an assistant message, then the synthesis step receives the full
 * durable history. This keeps the plan auditable without exposing private
 * chain-of-thought.
 */
export function collaborationStage(plan, step) {
  if (plan?.complexity?.band !== 'complex' || !Array.isArray(plan.subtasks)) return null
  const index = Math.max(1, Number(step) || 1) - 1
  const task = plan.subtasks[index]
  return task === undefined ? null : { ...task, index: index + 1, total: plan.subtasks.length }
}

/** Return the next staged task after a completed step, or null at synthesis end. */
export function nextCollaborationStage(plan, step) {
  return collaborationStage(plan, (Number(step) || 0) + 1)
}

/**
 * Build a visible, model-facing stage instruction. It asks for a concise work
 * report rather than hidden reasoning; the report is persisted and passed to
 * later stages by the normal session history.
 */
export function collaborationInstruction(plan, step) {
  const stage = collaborationStage(plan, step)
  if (stage === null) return ''
  const taskType = String(plan.taskType ?? 'general')
  if (stage.purpose === 'synthesis') {
    return [
      `[Model Router 协作阶段 ${stage.index}/${stage.total}：结果校验与整合]`,
      `你是最终汇总模型。请阅读主人原问题以及前序协作阶段的工作报告，完成${taskType}任务的交叉校验、冲突处理和最终回答。`,
      '只输出面向主人的最终答案，不要复述内部调度指令，不要编造不存在的证据。',
      '回答必须使用 Markdown；数学公式使用 KaTeX 兼容的 $...$ 或 $$...$$。',
    ].join('\n')
  }
  if (stage.purpose === 'analysis') {
    return [
      `[Model Router 协作阶段 ${stage.index}/${stage.total}：问题建模与约束提取]`,
      `请针对主人的 ${taskType} 问题完成问题建模：提取目标、约束、输入输出、验收标准和关键风险。`,
      '只提交结构化工作报告，供后续模型使用；不要直接替主人给最终答案，也不要输出隐私化的逐步思维链。',
    ].join('\n')
  }
  return [
    `[Model Router 协作阶段 ${stage.index}/${stage.total}：${stage.name}]`,
    `请阅读主人原问题和上一阶段报告，完成 ${taskType} 任务中负责的资料、代码、证据或方案处理。`,
    '只提交可核验的结构化工作报告，列出结论、依据、待确认项和可直接复用的产物；不要直接替主人输出最终答案。',
  ].join('\n')
}

function rowForRoute(rows, route) {
  if (route === undefined || route === null) return null
  return rows.find(row => row.provider === route.provider && row.model === route.model)
    ?? rows.find(row => row.model === route.model)
    ?? null
}

function assignmentFor(rows, task, fallback) {
  const row = rowForRoute(rows, task)
  if (row !== null) return row
  return fallback
}

export function buildPlan({ text = '', available = [], mode = 'collective' } = {}) {
  const complexity = assessComplexity(text)
  const taskType = classifyTask(text)
  const weights = OBJECTIVE_WEIGHTS[complexity.band]
  const discovered = Array.isArray(available)
    ? available.map(entry => ({ provider: String(entry.provider ?? ''), model: String(entry.model ?? '') }))
    : []
  const rows = []
  const maxCost = Math.max(1, ...MODEL_CATALOG.map(model => model.costIn + model.costOut))
  for (const route of discovered) {
    const metadata = modelMetadata(route.model) ?? {
      id: route.model, aliases: [route.model], quality: 0.66, latency: 0.55,
      costIn: 1, costOut: 4, specialties: [], risk: 0.24,
    }
    const specialty = specialtyMatch(metadata, taskType)
    // `latency` is catalogued as a normalized delay (0 = fastest, 1 = slowest),
    // so the objective term must reward its inverse rather than the raw delay.
    const latencyScore = 1 - clamp(metadata.latency)
    const utility = weights.quality * metadata.quality
      + weights.cost * costScore(metadata, maxCost)
      + weights.latency * latencyScore
      + (1 - weights.risk) * specialty * 0.12
      - weights.risk * metadata.risk
    rows.push({ provider: route.provider, model: route.model, metadata, specialty, score: clamp(utility), estimatedCost: estimateCost(metadata, text) })
  }
  rows.sort((a, b) => b.score - a.score)
  const selected = rows[0] ?? null
  const synthesizer = rows.find(row => /deepseek[- ]?v4[- ]?pro/i.test(row.model))
    ?? rows.find(row => /deepseek/i.test(row.model))
    ?? rows[0]
  const analysis = rows[0] ?? null
  // Prefer a genuinely different second worker. If only one route is live,
  // reusing it is explicit in the plan rather than silently pretending that
  // two providers executed independently.
  const execution = rows.find(row => row.provider !== analysis?.provider || row.model !== analysis?.model) ?? analysis
  const subtasks = complexity.band === 'complex'
    ? [
        {
          name: '问题建模与约束提取',
          type: taskType,
          recommended: analysis?.model ?? '待发现模型',
          recommendedProvider: analysis?.provider ?? '',
          purpose: 'analysis',
        },
        {
          name: '资料/代码/证据处理',
          type: taskType === 'math' ? 'research' : taskType,
          recommended: execution?.model ?? '待发现模型',
          recommendedProvider: execution?.provider ?? '',
          purpose: 'execution',
        },
        {
          name: '结果校验与整合',
          type: 'reasoning',
          recommended: synthesizer?.model ?? '待发现模型',
          recommendedProvider: synthesizer?.provider ?? '',
          purpose: 'synthesis',
        },
      ]
    : [{ name: '直接回答与必要校验', type: taskType, recommended: selected?.model ?? '待发现模型', recommendedProvider: selected?.provider ?? '' }]
  const workRows = complexity.band === 'complex'
    ? subtasks.slice(0, -1).map(task => assignmentFor(rows, { provider: task.recommendedProvider, model: task.recommended }, selected)).filter(Boolean)
    : []
  const totalEstimate = complexity.band === 'complex'
    ? workRows.reduce((sum, row) => sum + row.estimatedCost, 0) + (synthesizer?.estimatedCost ?? 0)
    : selected?.estimatedCost ?? 0
  const reason = selected === null
    ? '尚未发现可用模型，保留 Harness 原始模型选择。'
    : `${complexity.band === 'simple' ? '低复杂度优先成本与响应速度' : complexity.band === 'balanced' ? '在质量、成本、延迟与风险之间平衡' : '高复杂度优先质量与任务专长'}；任务类型为 ${taskType}，候选模型按综合效用分排序。`
  return {
    mode,
    complexity: { value: Number(complexity.value.toFixed(3)), band: complexity.band },
    taskType,
    objectiveWeights: weights,
    candidates: rows.slice(0, 8).map(row => ({ provider: row.provider, model: row.model, score: Number(row.score.toFixed(3)), specialty: Number(row.specialty.toFixed(3)), estimatedCost: Number(row.estimatedCost.toFixed(6)) })),
    selected: selected === null ? null : { provider: selected.provider, model: selected.model, estimatedCost: Number(selected.estimatedCost.toFixed(6)) },
    subtasks,
    synthesizer: synthesizer === undefined ? null : { provider: synthesizer.provider, model: synthesizer.model },
    estimatedCost: Number(totalEstimate.toFixed(6)),
    costBreakdown: complexity.band === 'complex'
      ? [
          ...subtasks.map((task, index) => {
            const row = rows.find(candidate => candidate.provider === task.recommendedProvider && candidate.model === task.recommended)
              ?? rows.find(candidate => candidate.model === task.recommended)
            return {
              stage: index + 1,
              purpose: task.purpose,
              model: task.recommended,
              provider: task.recommendedProvider,
              estimatedCost: Number((row?.estimatedCost ?? 0).toFixed(6)),
            }
          }),
        ]
      : selected === null ? [] : [{ stage: 1, purpose: 'answer', provider: selected.provider, model: selected.model, estimatedCost: Number(selected.estimatedCost.toFixed(6)) }],
    reason,
    generatedAt: new Date().toISOString(),
  }
}
