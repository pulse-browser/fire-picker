//@ts-check
/// <reference types="web-ext-types"/>

// =============================================================================
// User interaction collector

let mousePos = { x: 0, y: 0 }

document.addEventListener('mousemove', (e) => {
  mousePos.x = e.pageX
  mousePos.y = e.pageY
})

//toggleable tab control

// =============================================================================
// Main function

async function popup(x, y) {
  console.log(
    '%cEmoji picker content script',
    'font-size: 20px; text-decoration: underline;'
  )

  const data = await (
    await fetch(browser.runtime.getURL('window/emoji.json'))
  ).json()

  const catagories = data
    .map(({ category }) => category)
    .filter((v, i, a) => a.indexOf(v) === i)

  const tabs = catagories.map((category) => {
    const id = categoryId(category)

    const tabElId = `fep-tab-${id}`
    const tabContId = `fep-tab-cont-${id}`

    const tabEl = html`<button class="fep-tab" id="${tabElId}">${category}</button>`

    const tabCont = html`<div
      class="fep-tab-cont fep-items"
      id="${tabContId}"
      style="display: none;"
    >
      ${data
        .filter(({ category }) => category === category)
        .map(
          ({ emoji, name }) =>
            html`<button class="fep-item">${emoji.emoji}</button>`
        )
        .map((item) => item.outerHTML)
        .join('')}
    </div>`

    tabEl.addEventListener('click', () => {
      const allTabContents = document.querySelectorAll('.fep-tab-cont')
      // @ts-ignore
      allTabContents.forEach((el) => (el.style.display = 'none'))
      document.getElementById(tabContId).style.display = 'block'
    })

    return { tabEl, tabCont }
  })

  //Injection Lol
  const popup = html` <div
    class="fep-container"
    id="fep-container"
    style="position: absolute; top: ${y}; left: ${x}; z-index: 99999999;"
  >
    <input
      class="fep-input-search"
      placeholder="🔍 Search for emojis by category or tag"
    />

    <!-- The tabs used for controling stuff -->
    <div class="fep-tabs" id="fep-tabs">
    </div>

    <!-- <div class="fep-items" id="fep-items"></div> -->
  </div>`

  document.body.append(popup)

  document.getElementById('fep-tabs').append(...tabs.map(({ tabEl }) => tabEl))
  document.getElementById('fep-container').append(...tabs.map(({ tabCont }) => tabCont))

  // @ts-ignore
  document.getElementById('fep-items').children[0].click()



  const css = await (
    await fetch(browser.runtime.getURL('window/style.css'))
  ).text()
  document.head.appendChild(
    html`<style>
      ${css}
    </style>`
  )

  // data.forEach((emoji) => {
  //   const emojiButton = html`<button class="fep-item">${emoji.emoji}</button>`
  //   document.getElementById('fep-items').append(emojiButton)
  // })
}

popup(70, 70)

// =============================================================================
// Background script communication

let shown = false

window.addEventListener('message', async (e) => {
  const scriptTab = await browser.tabs.getCurrent()
  const { data } = e

  if (data.tabId == scriptTab.id && !shown) {
    // Time to show the popup
    await popup(mousePos.x, mousePos.y)
  }
})

// =============================================================================
// Utility functions

/**
 * @param {string} category
 */
function categoryId(name) {
  return name
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const html = (h, ...values) => {
  const wrapper = document.createElement('div')

  wrapper.innerHTML = h
    .reduce((result, s, i) => result + s + (values[i] ? values[i] : ''), '')
    .replace('\t', '')

  if (wrapper.childElementCount != 1)
    throw new Error("HTML can't have more or less than one root node.")

  return wrapper.children[0]
}

// $("#emoji-picker-items").append("<button class='emoji-picker-item'>"+obj.emoji+"</button>");

// $('.emoji-picker-item').click(function () {
//   console.log($(this).text())
//   $('#emoji-picker-text').val($(this).text())
// })
