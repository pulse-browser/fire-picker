//@ts-check
/// <reference types="web-ext-types"/>

const EMOJI_PICKER = browser.menus.create({
    title: '😎 Emoji Picker',
})


browser.menus.onClicked.addListener(function (info, tab) {
  switch (info.menuItemId) {
    case EMOJI_PICKER:
      browser.tabs.sendMessage(tab.id, info.targetElementId)
    break
  }
})
