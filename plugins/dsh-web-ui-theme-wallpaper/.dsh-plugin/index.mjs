/**
 * Host half for the independent theme and wallpaper center.
 * Visual work runs in the browser half; keeping this entry inert makes the
 * plugin safe in headless and desktop Harness profiles as well.
 */
export const name = 'dsh-web-ui-theme-wallpaper'
export const inject = []

export function apply(ctx) {
  ctx.logger?.debug?.('dsh-web-ui-theme-wallpaper: host half loaded')
}
