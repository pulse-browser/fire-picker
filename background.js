//@ts-check
/// <reference types="web-ext-types"/>



browser.contextMenus.create({
    id: "emoji-picker",
    title: browser.i18n.getMessage("contextMenuItemSelectionLogger"),
    contexts: ["selection"]
  }, onCreated);
  

browser.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
        case "log-selection":
        console.log(info.selectionText);
        break;
    }
})
