//@ts-check
/// <reference types="web-ext-types"/>

const EMOJI_PICKER = browser.menus.create({
  title: 'Emoji Picker',
  contexts: ['editable'],
})

browser.menus.onClicked.addListener(function (info, tab) {
  switch (info.menuItemId) {
    case EMOJI_PICKER:
      browser.tabs.sendMessage(tab.id, info.targetElementId)
      break
  }
})

// =============================================================================
// Theme Consumer Parent

/**
 * @param {browser.runtime.Port} port
 */
function connectionManager(port) {
  switch (port.name) {
    case 'theme-child':
      themeConnection(port)
      break
    default:
      throw new Error(`Unknown port ${port.name}`)
  }
}

/**
 * @param {browser.runtime.Port} port
 */
function themeConnection(port) {
  port.onMessage.addListener(async (_msg) => {
    const theme = await browser.theme.getCurrent()
    port.postMessage(theme)
  })
}

browser.runtime.onConnect.addListener(connectionManager)
