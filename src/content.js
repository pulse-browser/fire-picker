//@ts-check
/// <reference types="web-ext-types" />
/// <reference types="./content" />

const appCssIdent = 'fep'
const ident = (id) => `${appCssIdent}-${id}`

const categoryEmoji = {
  'Smileys & Emotion': '😀',
  'People & Body': '🤦‍♀️',
  'Animals & Nature': '🐶',
  'Food & Drink': '🍔',
  'Travel & Places': '🚗',
  Objects: '📦',
  Activities: '🎮',
  Symbols: '🔥',
  Flags: '🇺🇸',
}

let mouseLoc = { x: 0, y: 0 }
let emojiTarget

// Get mouse position (There needs to be a better way that is optimized for performance)
document.addEventListener('mousemove', function (e) {
  mouseLoc.x = e.clientX
  mouseLoc.y = e.clientY
})

class Tab {
  title
  content

  constructor(title, content) {
    this.title = title
    this.content = content
  }
}

class TabManager {
  activeTab = null
  tabs = new Map()
  parent

  tabsEl
  container

  constructor(parent, x, y) {
    this.parent = parent

    const tabsContainerId = ident('tabs-container')

    const popup = html` <div
      class="fep-container"
      id="fep-container"
      style="position: absolute; top: ${y}px; left: ${x}px; z-index: 99999999;"
    >
      <div class="${tabsContainerId}" id="${tabsContainerId}"></div>
      <hr class="feb-seperator" />
    </div>`

    this.container = popup
    this.parent.append(popup)
    this.tabsEl = document.getElementById(tabsContainerId)
  }

  /**
   * @param {string} id
   * @param {Tab} tab
   */
  addTab(id, tab, isDefault = false, isContent = true) {
    this.tabs.set(id, tab)

    const tabClass = ident('tab')
    const tabEl = html`<button class="${tabClass}" id="${ident(id)}">
      ${tab.title}
    </button>`

    const tabContClass = ident('tab-cont')
    tab.content.classList.add(tabContClass)

    if (isContent) {
      const tabItems = ident('items')

      tab.content.classList.add(tabItems)
    }

    tab.content.setAttribute('id', ident(`content-${id}`))
    tab.content.setAttribute('style', 'display:none;')

    this.tabsEl.append(tabEl)
    this.container.append(tab.content)

    tabEl.addEventListener('click', () => this.setTab(id))
    if (isDefault && !this.activeTab) {
      this.setTab(id)
    }
  }

  setTab(tabId) {
    this.activeTab = tabId

    const allTabContents = document.querySelectorAll(`.${ident('tab-cont')}`)
    // @ts-ignore
    allTabContents.forEach((el) => (el.style.display = 'none'))
    document.getElementById(ident(`content-${this.activeTab}`)).style.display =
      ''

    // @ts-ignore
    const allTabIdents = document.querySelectorAll(`.${ident('tab')}`)
    allTabIdents.forEach((el) => {
      el.classList.remove('feb-active')
    })
    document.getElementById(ident(this.activeTab)).classList.add('feb-active')
  }
}

// =============================================================================
// Main function

async function popup(x, y) {
  console.log(
    '%cEmoji picker content script',
    'font-size: 20px; text-decoration: underline;'
  )

  const /** @type {import("./content").EmojiList} */ data = await (
      await fetch(browser.runtime.getURL('window/emoji.json'))
    ).json()

  const tabContainer = new TabManager(document.body, x, y)

  // ===========================================================================
  // Search tab
  {
    const searchBar = html`
      <slot>
        <input
          type="text"
          id="${ident('search-input')}"
          placeholder="🔍 Search for emojis by category or tag"
        />

        <div id="${ident('search-results')}" class="${ident('items')}"></div>
      </slot>
    `

    const searchTab = new Tab('🔍', searchBar)
    tabContainer.addTab('search', searchTab, true, false)

    document
      .getElementById(ident('search-input'))
      .addEventListener('input', (e) => {
        // @ts-ignore
        const /** @type {string} */ value = e.target.value
        const results = document.getElementById(ident('search-results'))

        results.innerHTML = ''
        results.append(...generateSearchResults(value, data))
      })

    document
      .getElementById(ident('search-results'))
      .append(...generateSearchResults('', data))
  }

  const catagories = data
    .map(({ category }) => category)
    .filter((v, i, a) => a.indexOf(v) === i)

  catagories.forEach((category) => {
    const id = categoryId(category)
    const title = categoryEmoji[category]

    const tab = new Tab(
      title,
      html`
        <slot>
          ${generateSearchResults(category, data)
            .map((item) => item.outerHTML)
            .join('')}
        </slot>
      `
    )

    tab.content.addEventListener('click', (e) => {
      // @ts-ignore
      if (e.target.classList.contains('fep-item')) {
        // @ts-ignore
        const emoji = e.target.innerText

        const splitPoint = emojiTarget.selectionStart

        const front = emojiTarget.value.slice(0, splitPoint)
        const end = emojiTarget.value.slice(splitPoint)

        emojiTarget.value = [front, end].join(emoji)

        document.getElementById('fep-container').remove()
      }
    })

    tabContainer.addTab(id, tab)
  })

  //Branding be like
  const branding = html`<div class="feb-branding">
    🔥 Fire-Picker by
    <strong
      ><a href="https://github.com/pulse-browser/browser">Pulse</a></strong
    >
  </div>`
  tabContainer.container.append(branding)
}

// @ts-ignore
browser.runtime.onMessage.addListener(async (targetEl) => {
  if (document.getElementById('fep-container')) {
    document.getElementById('fep-container').remove()
  } else {
    const css = await (
      await fetch(browser.runtime.getURL('window/style.css'))
    ).text()
    document.head.appendChild(
      html`<style>
        ${css}
      </style>`
    )
  }

  // Get the target element and store it in a global variable
  emojiTarget = browser.menus.getTargetElement(targetEl)

  setTimeout(() => popup(mouseLoc.x, mouseLoc.y), 100)
})

// =============================================================================
// Theme consumer

let themeConsumerPort = browser.runtime.connect({ name: 'theme-child' })
let root = document.documentElement

themeConsumerPort.onMessage.addListener(
  /**
   * @param {browser.theme.Theme} theme
   */
  // @ts-ignore
  async (theme) => {
    const defaultTheme = await (
      await fetch(browser.runtime.getURL('window/theme_default.json'))
    ).json()

    const defaultColors = defaultTheme.colors

    console.log(defaultTheme)

    const { colors } = theme

    console.log(defaultColors)

    // Handle colors
    Object.keys(defaultColors).forEach((color) => {
      let value = defaultColors[color]

      if (colors && colors[color]) {
        value = colors[color]
      }

      console.log(`--fep-color-${color}`, value)
      root.style.setProperty(
        `--fep-color-${color}`,
        value
        // colors[color] || defaultColors[color]
      )
    })

    themeConsumerPort.disconnect()
  }
)

themeConsumerPort.postMessage({})

// =============================================================================
// Utility functions

/**
 * @param {string} name
 */
function categoryId(name) {
  return name
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Generates search results for you
 * @param {string} query The query string you are searching for
 * @param {import("./content").EmojiList} emoji The emoji available
 *
 * @returns {Element[]}
 */
function generateSearchResults(query, emoji) {
  return emoji
    .filter(
      (emoji) =>
        emoji.description.includes(query) ||
        emoji.aliases.some((alias) => alias.includes(query)) ||
        emoji.tags.some((tag) => tag.includes(query)) ||
        emoji.category === query
    )
    .map(
      // @ts-ignore
      ({ emoji }) => html`<button class="fep-item">${emoji}</button>`
    )
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
