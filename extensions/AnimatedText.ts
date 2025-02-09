import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const AnimatedText = Extension.create({
  name: 'animatedText',

  addProseMirrorPlugins() {
    let decos = DecorationSet.empty
    let lastUpdate = 0

    return [
      new Plugin({
        key: new PluginKey('animatedText'),
        props: {
          decorations(state) {
            return decos
          }
        },
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some(tr => tr.docChanged)) return null
          
          const now = Date.now()
          if (now - lastUpdate < 50) return null // Debounce animations
          lastUpdate = now

          const decorations: Decoration[] = []
          const pos = newState.selection.$head.pos

          // Add animation to the last character
          decorations.push(
            Decoration.inline(pos - 1, pos, {
              class: 'animate-char',
              style: 'display: inline-block;'
            })
          )

          decos = DecorationSet.create(newState.doc, decorations)
          return null
        }
      })
    ]
  }
})
