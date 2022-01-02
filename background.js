//@ts-check
/// <reference types="web-ext-types"/>

console.log('Emoji Picker hello world')

console.log(
  browser.menus.create({
    title: 'Emoji Picker',
  })
)

browser.menus.onClicked.addListener(function (info, tab) {
  switch (info.menuItemId) {
    case 'log-selection':
      console.log(info.selectionText)
      break
  }
})
