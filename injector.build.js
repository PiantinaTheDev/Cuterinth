'use strict'

const { spawn, execSync } = require('child_process')
const fs = require('fs')
const http = require('http')
const path = require('path')
const WebSocket = require('ws')

const code = "(function () {\r\n    let data = localStorage.getItem('modded');\r\n\r\n    if (!data) { // saving everything inside localStorage cause why not\r\n        data = {\r\n            customTheme: null,\r\n            customThemes: [\r\n                {\r\n                    name: 'default',\r\n                    author: 'Modrinth App',\r\n                    vars: defaultThemeVars()\r\n                }\r\n            ],\r\n        };\r\n        localStorage.setItem('modded', JSON.stringify(data));\r\n    } else {\r\n        data = JSON.parse(data);\r\n        if (data.customTheme === 'default') data.customTheme = null;\r\n    }\r\n\r\n    let inlinedProps = [];\r\n\r\n    function applyVars(vars) {\r\n        inlinedProps = Object.keys(vars);\r\n        for (const [prop, val] of Object.entries(vars)) {\r\n            document.documentElement.style.setProperty(prop, val);\r\n        }\r\n    }\r\n\r\n    function clearInlinedVars() {\r\n        for (const prop of inlinedProps) {\r\n            document.documentElement.style.removeProperty(prop);\r\n        }\r\n        inlinedProps = [];\r\n    }\r\n\r\n    if (data.customTheme) {\r\n        const activeTheme = data.customThemes.find(t => t.name === data.customTheme);\r\n        if (activeTheme) applyVars(activeTheme.vars);\r\n        else data.customTheme = null;\r\n    }\r\n\r\n    const svgRadioSelected =\r\n        `<svg data-v-ad9dd354=\"\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" class=\"radio shrink-0\">` +\r\n        `<path fill=\"currentColor\" d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8\"></path>` +\r\n        `<circle cx=\"12\" cy=\"12\" r=\"5\" fill=\"currentColor\"></circle></svg>`;\r\n    const svgRadioEmpty =\r\n        `<svg data-v-ad9dd354=\"\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" class=\"radio shrink-0\">` +\r\n        `<path fill=\"currentColor\" d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8\"></path></svg>`;\r\n\r\n    function resolveVar(vars, key) {\r\n        let v = vars[key];\r\n        if (!v) return null;\r\n        const m = v.match(/^var\\((--[\\w-]+)\\)$/);\r\n        if (m && vars[m[1]]) v = vars[m[1]];\r\n        return v;\r\n    }\r\n\r\n    function updateRadios(container) {\r\n        container.querySelectorAll('.modded-btn').forEach(btn => {\r\n            const label = btn.querySelector('.label');\r\n            if (!label) return;\r\n            const radio = label.querySelector('svg.radio');\r\n            if (radio) radio.outerHTML = btn.classList.contains('selected') ? svgRadioSelected : svgRadioEmpty;\r\n        });\r\n    }\r\n\r\n    function createCustomButton(theme) {\r\n        const isSelected = data.customTheme === theme.name;\r\n        const v = theme.vars;\r\n\r\n        const bgSurface1  = resolveVar(v, '--surface-1')           || '#16181c';\r\n        const bgSurface3  = resolveVar(v, '--surface-3')           || '#27292e';\r\n        const btnBg       = resolveVar(v, '--color-button-bg')\r\n                         || resolveVar(v, '--surface-4')           || '#34363c';\r\n        const textDefault = resolveVar(v, '--color-text-default')  || '#b0bac5';\r\n        const textTert    = resolveVar(v, '--color-text-tertiary') || '#96a2b0';\r\n\r\n        const btn = document.createElement('button');\r\n        btn.setAttribute('data-v-ad9dd354', '');\r\n        btn.className = 'preview-radio button-base modded-btn' + (isSelected ? ' selected' : '');\r\n        btn.dataset.moddedName = theme.name;\r\n\r\n        btn.style.position = 'relative';\r\n\r\n        btn.innerHTML =\r\n            `<div data-v-ad9dd354=\"\" class=\"preview\" ` +\r\n                `style=\"background-color:${bgSurface3};` +\r\n                       `--color-button-bg:${btnBg};` +\r\n                       `--color-base:${textDefault};` +\r\n                       `--color-secondary:${textTert}\">` +\r\n                `<div data-v-ad9dd354=\"\" class=\"example-card card card\" style=\"background-color:${bgSurface1}\">` +\r\n                    `<div data-v-ad9dd354=\"\" class=\"example-icon\"></div>` +\r\n                    `<div data-v-ad9dd354=\"\" class=\"example-text-1\"></div>` +\r\n                    `<div data-v-ad9dd354=\"\" class=\"example-text-2\"></div>` +\r\n                `</div>` +\r\n            `</div>` +\r\n            `<div data-v-ad9dd354=\"\" class=\"label\">` +\r\n                (isSelected ? svgRadioSelected : svgRadioEmpty) +\r\n                ` ${theme.name}` +\r\n            `</div>`;\r\n\r\n        const deleteBtn = document.createElement('button');\r\n        deleteBtn.title = 'Delete theme';\r\n        deleteBtn.innerHTML =\r\n            `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\">` +\r\n            `<polyline points=\"3 6 5 6 21 6\"/><path d=\"M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6\"/><path d=\"M10 11v6\"/><path d=\"M14 11v6\"/><path d=\"M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2\"/></svg>`;\r\n        deleteBtn.style.cssText =\r\n            'position:absolute;top:6px;right:6px;' +\r\n            'width:26px;height:26px;border-radius:6px;border:none;cursor:pointer;' +\r\n            'display:flex;align-items:center;justify-content:center;' +\r\n            'background:var(--color-red-bg,#ff496e33);color:var(--color-red,#ff496e);' +\r\n            'opacity:0;transition:opacity .15s;pointer-events:none;z-index:1';\r\n\r\n        btn.addEventListener('mouseenter', () => { deleteBtn.style.opacity = '1'; deleteBtn.style.pointerEvents = 'auto'; });\r\n        btn.addEventListener('mouseleave', () => { deleteBtn.style.opacity = '0'; deleteBtn.style.pointerEvents = 'none'; });\r\n\r\n        deleteBtn.addEventListener('click', (e) => {\r\n            e.stopPropagation();\r\n            data.customThemes = data.customThemes.filter(t => t.name !== theme.name);\r\n            if (data.customTheme === theme.name) {\r\n                data.customTheme = null;\r\n                clearInlinedVars();\r\n            }\r\n            localStorage.setItem('modded', JSON.stringify(data));\r\n            injectCustomThemes();\r\n        });\r\n\r\n        btn.appendChild(deleteBtn);\r\n\r\n        btn.addEventListener('click', () => {\r\n            const container = btn.closest('.theme-options');\r\n            container.querySelectorAll('.preview-radio').forEach(b => b.classList.remove('selected'));\r\n            btn.classList.add('selected');\r\n            updateRadios(container);\r\n            data.customTheme = theme.name;\r\n            localStorage.setItem('modded', JSON.stringify(data));\r\n            applyVars(theme.vars);\r\n        });\r\n\r\n        return btn;\r\n    }\r\n\r\n    function handleThemeUpload(file) {\r\n        const reader = new FileReader();\r\n        reader.onload = (e) => {\r\n            let theme;\r\n            try {\r\n                theme = JSON.parse(e.target.result);\r\n            } catch {\r\n                return;\r\n            }\r\n\r\n            if (!theme.name || typeof theme.name !== 'string') {\r\n                return;\r\n            }\r\n            if (!theme.vars || typeof theme.vars !== 'object') {\r\n                return;\r\n            }\r\n\r\n            const existingIndex = data.customThemes.findIndex(t => t.name === theme.name);\r\n            if (existingIndex !== -1) {\r\n                data.customThemes[existingIndex] = theme;\r\n            } else {\r\n                data.customThemes.push(theme);\r\n            }\r\n\r\n            data.customTheme = theme.name;\r\n            localStorage.setItem('modded', JSON.stringify(data));\r\n            applyVars(theme.vars);\r\n\r\n            lastContainer = null;\r\n            injectCustomThemes();\r\n        };\r\n        reader.readAsText(file);\r\n    }\r\n\r\n    function createUploadButton() {\r\n        const input = document.createElement('input');\r\n        input.type = 'file';\r\n        input.accept = '.json';\r\n        input.style.display = 'none';\r\n        input.addEventListener('change', () => {\r\n            if (input.files[0]) handleThemeUpload(input.files[0]);\r\n            input.value = '';\r\n        });\r\n        document.body.appendChild(input);\r\n\r\n        const btn = document.createElement('button');\r\n        btn.setAttribute('data-v-ad9dd354', '');\r\n        btn.className = 'preview-radio button-base modded-btn modded-upload-wrap';\r\n\r\n        const uploadIcon =\r\n            `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"margin-right:.4rem;flex-shrink:0\">` +\r\n            `<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"17 8 12 3 7 8\"/><line x1=\"12\" y1=\"3\" x2=\"12\" y2=\"15\"/></svg>`;\r\n\r\n        btn.innerHTML =\r\n            `<div data-v-ad9dd354=\"\" class=\"label\" style=\"justify-content:center;opacity:.7\">` +\r\n                uploadIcon +\r\n                `<b>Upload Theme` +\r\n            `</div>`;\r\n\r\n        btn.addEventListener('click', () => input.click());\r\n        return btn;\r\n    }\r\n\r\n    let observerRoot = null;\r\n\r\n    const observer = new MutationObserver(() => {\r\n        const container = document.querySelector('.theme-options');\r\n        if (container && !container.querySelector('.modded-btn')) {\r\n            injectCustomThemes();\r\n        }\r\n\r\n        removeAds();\r\n        patchAppVersion();\r\n    });\r\n\r\n    function injectCustomThemes() {\r\n        const container = document.querySelector('.theme-options');\r\n        if (!container) return;\r\n\r\n        observer.disconnect();\r\n\r\n        container.querySelectorAll('.modded-btn').forEach(el => el.remove());\r\n\r\n        if (data.customTheme) {\r\n            container.querySelectorAll('.preview-radio:not(.modded-btn)')\r\n                .forEach(b => b.classList.remove('selected'));\r\n        }\r\n\r\n        container.querySelectorAll('.preview-radio:not(.modded-btn)').forEach(btn => {\r\n            if (btn.dataset.moddedPatched) return;\r\n            btn.dataset.moddedPatched = '1';\r\n            btn.addEventListener('click', () => {\r\n                data.customTheme = null;\r\n                localStorage.setItem('modded', JSON.stringify(data));\r\n                clearInlinedVars();\r\n                container.querySelectorAll('.modded-btn')\r\n                    .forEach(b => b.classList.remove('selected'));\r\n            });\r\n        });\r\n\r\n        for (const theme of data.customThemes) {\r\n            container.appendChild(createCustomButton(theme));\r\n        }\r\n\r\n        container.appendChild(createUploadButton());\r\n\r\n        if (observerRoot) observer.observe(observerRoot, { childList: true, subtree: true });\r\n    }\r\n\r\n    function patchAppVersion() {\r\n        const el = [...document.querySelectorAll(\"p.m-0\")]\r\n            .find(p => p.textContent.startsWith(\"Modrinth App\"));\r\n\r\n        if (!el) return;\r\n\r\n        const match = el.textContent.match(/Modrinth App (.+)/);\r\n        if (!match) return;\r\n\r\n        const version = match[1];\r\n        el.textContent = `Cuterinth App ${version}`;\r\n    }\r\n\r\n    function removeAds() { // rip ads\r\n        const selectors = [\r\n            '#app > div.app-contents.experimental-styles-within.sidebar-enabled > div.app-sidebar.mt-px.shrink-0.flex.flex-col.border-0.border-l-\\\\[1px\\\\].border-\\\\[--brand-gradient-border\\\\].border-solid.overflow-auto > div.ad-parent.relative.flex.w-full.justify-center.cursor-pointer.bg-bg',\r\n            '#app > div.app-contents.experimental-styles-within.sidebar-enabled > div.app-sidebar.mt-px.shrink-0.flex.flex-col.border-0.border-l-\\\\[1px\\\\].border-\\\\[--brand-gradient-border\\\\].border-solid.overflow-auto > a'\r\n        ];\r\n\r\n        for (const selector of selectors) {\r\n            const el = document.querySelector(selector);\r\n            if (el) el.remove();\r\n        }\r\n\r\n        if (!document.getElementById('modded-ad-fix')) {\r\n            const style = document.createElement('style');\r\n            style.id = 'modded-ad-fix';\r\n            style.textContent = '.app-sidebar::after { display: none !important; }';\r\n            document.head.appendChild(style);\r\n        }\r\n    }\r\n\r\n    function start() {\r\n        observerRoot = document.getElementById('app') || document.body;\r\n        observer.observe(observerRoot, { childList: true, subtree: true });\r\n        \r\n        injectCustomThemes();\r\n        patchAppVersion();\r\n        removeAds();\r\n    }\r\n\r\n    if (document.readyState === 'loading') {\r\n        document.addEventListener('DOMContentLoaded', start);\r\n    } else {\r\n        start();\r\n    }\r\n\r\n})();"

const exe = path.join(process.env.LOCALAPPDATA, 'Modrinth App', 'Modrinth App.exe')
const debugPort = 9222

function httpGet(url) {
  return new Promise(function(resolve, reject) {
    const req = http.get(url, { family: 4 }, function(res) {
      let body = ''
      res.on('data', function(chunk) { body += chunk })
      res.on('end', function() {
        try { resolve(JSON.parse(body)) }
        catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
  })
}

async function main() {
  if (!fs.existsSync(exe)) {
    console.error('Modrinth App not found at:', exe)
    process.exit(1)
  }

  const env = Object.assign({}, process.env, {
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${debugPort}`
  })

  spawn(exe, [], {
    detached: true,
    stdio: 'ignore',
    env: env
  })

  async function waitForCDP(retries) {
    for (var i = 0; i < retries; i++) {
      try {
        const targets = await httpGet('http://127.0.0.1:' + debugPort + '/json')
        const target = targets.find(function(t) { return t.url && t.url.includes('tauri.localhost') })
        if (target) return target
      } catch (e) {}
      await new Promise(function(r) { return setTimeout(r, 3000) })
    }
    process.exit(1)
  }

  const target = await waitForCDP(20)
  const ws = new WebSocket(target.webSocketDebuggerUrl)

  ws.on('open', function() {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: { expression: code, awaitPromise: true, returnByValue: true }
    }))
  })

  ws.on('message', function(data) {
    const msg = JSON.parse(data)
    if (msg.id !== 1) return
    ws.close()
    process.exit(0)
  })

  ws.on('error', function(err) {
    console.error('Connection failed:', err.message)
    process.exit(1)
  })
}

main().catch(function(err) {
  console.error('Unhandled error in main:', err.message)
  process.exit(1)
})