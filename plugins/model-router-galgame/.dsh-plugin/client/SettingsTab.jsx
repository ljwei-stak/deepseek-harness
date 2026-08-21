/** GAL 视窗设置与桌面发行版更新入口。 */

import React from 'react'

function messageFromError(error) {
  return error instanceof Error ? error.message : String(error)
}

function versionText(item, fallback) {
  if (item === undefined) return fallback
  return `${item.currentVersion} / 最新 ${item.latestVersion}`
}

function availabilityText(item) {
  if (item === undefined) return '点击“检查更新”获取 GitHub Release 状态。'
  if (item.available && item.installable) return `发现 ${item.latestVersion}，可以更新。`
  if (item.available) return item.reason || '发现新版本，但当前环境不能直接安装。'
  return item.reason || '已是最新版。'
}

export function GalViewSettingsTab({ useEnabled, setEnabled, updateApi }) {
  const enabled = useEnabled(value => value)
  const [assessment, setAssessment] = React.useState(null)
  const [busy, setBusy] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [progress, setProgress] = React.useState(null)

  React.useEffect(() => {
    if (typeof updateApi?.subscribe !== 'function') return undefined
    const unsubscribe = updateApi.subscribe(next => {
      setProgress(next)
      if (next?.message) setNotice(next.message)
    })
    return typeof unsubscribe === 'function' ? unsubscribe : undefined
  }, [updateApi])

  const checkUpdates = async () => {
    if (typeof updateApi?.check !== 'function') {
      setNotice('网页端不能写入本机程序，已为你打开项目 Release。')
      await updateApi?.openReleases?.()
      return null
    }
    setBusy('check')
    setNotice('正在检查 GitHub Release...')
    try {
      const next = await updateApi.check()
      setAssessment(next)
      const available = [next.plugin.available ? '插件' : '', next.desktop.available ? '完整客户端' : ''].filter(Boolean)
      setNotice(available.length > 0 ? `发现可更新内容：${available.join('、')}。` : '插件与完整客户端均已是最新版。')
      return next
    } catch (error) {
      setNotice(`检查更新失败：${messageFromError(error)}`)
      return null
    } finally {
      setBusy('')
    }
  }

  const install = async kind => {
    const method = kind === 'plugin' ? updateApi?.installPlugin : updateApi?.installDesktop
    if (typeof method !== 'function') {
      setNotice('网页端不能直接更新本机文件，已为你打开项目 Release。')
      await updateApi?.openReleases?.()
      return
    }
    setBusy(kind)
    setProgress({ kind, phase: 'start', percent: 0 })
    setNotice(kind === 'plugin' ? '正在准备插件更新...' : '正在准备完整客户端更新...')
    try {
      const result = await method()
      if (result?.cancelled) {
        setNotice('已取消更新。')
        return
      }
      setNotice(result?.message || '更新已准备完成。')
      if (kind === 'plugin' && !result?.restartScheduled) await checkUpdates()
    } catch (error) {
      setNotice(`${kind === 'plugin' ? '插件' : '客户端'}更新失败：${messageFromError(error)}`)
    } finally {
      setBusy('')
    }
  }

  const progressValue = busy !== '' && progress?.kind === busy && Number.isFinite(Number(progress.percent))
    ? Math.max(0, Math.min(100, Number(progress.percent)))
    : null

  return (
    <div className="gvsv-tab">
      <div className="gvsv-head">
        <span className="gvsv-title">GAL 视窗</span>
        <span className="gvsv-desc">会话标签页中的 Galgame 风格对话视图（对话 / GAL视窗 / 轨迹）。</span>
      </div>
      <label className="gvsv-row">
        <span className="gvsv-label">启用 GAL 视窗</span>
        <span className="gvsv-hint">关闭后隐藏会话页的「GAL视窗」标签；场景与设置保留，重新开启即恢复。</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => setEnabled(e.target.checked)}
          aria-label="启用 GAL 视窗"
        />
      </label>

      <section className="gvsv-update" aria-labelledby="gvsv-update-title">
        <div className="gvsv-update-head">
          <div>
            <h3 id="gvsv-update-title">项目更新</h3>
            <p>更新固定来自 ljwei-stak/deepseek-harness 的稳定 Release，不会使用上游仓库或第三方下载地址。</p>
          </div>
          <button type="button" className="gvsv-link" onClick={() => updateApi?.openProject?.()}>项目主页</button>
        </div>

        <div className="gvsv-version-list">
          <div className="gvsv-version-row">
            <div>
              <strong>Model Router + GALGame 插件</strong>
              <span>{versionText(assessment?.plugin, updateApi?.pluginVersion ?? '未知')}</span>
              <small>{availabilityText(assessment?.plugin)}</small>
            </div>
            <button type="button" disabled={busy !== ''} onClick={() => install('plugin')}>更新插件</button>
          </div>
          <div className="gvsv-version-row">
            <div>
              <strong>DeepSeek Harness 完整客户端</strong>
              <span>{versionText(assessment?.desktop, '检查后显示')}</span>
              <small>{availabilityText(assessment?.desktop)}</small>
            </div>
            <button type="button" disabled={busy !== ''} onClick={() => install('desktop')}>更新完整客户端</button>
          </div>
        </div>

        {progressValue !== null && (
          <div className="gvsv-progress" role="progressbar" aria-label="更新进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressValue}>
            <span style={{ width: `${progressValue}%` }} />
          </div>
        )}
        {notice !== '' && <p className="gvsv-notice" role="status">{notice}</p>}
        <div className="gvsv-actions">
          <button type="button" disabled={busy !== ''} onClick={checkUpdates}>{busy === 'check' ? '检查中...' : '检查更新'}</button>
          <button type="button" className="gvsv-secondary" onClick={() => updateApi?.openReleases?.()}>查看 Releases</button>
        </div>
        <p className="gvsv-footnote">
          {updateApi?.isDesktop
            ? '插件更新会保留当前版本作为回退；完整客户端安装不会删除用户目录中的 API、模型配置和历史任务。'
            : '当前是网页环境，只能查看 Release；安装桌面客户端后可直接更新本机插件和完整客户端。'}
        </p>
      </section>
    </div>
  )
}
