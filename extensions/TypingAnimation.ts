import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'

export const TypingAnimation = Extension.create({
  name: 'typingAnimation',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('typingAnimation'),
        props: {
          handleTextInput: (view, from, to, text) => {
            setTimeout(() => {
              const textNodes = view.dom.querySelectorAll('.ProseMirror p, .ProseMirror h1, .ProseMirror h2');
              const lastNode = textNodes[textNodes.length - 1];
              
              if (lastNode) {
                const chars = lastNode.textContent?.split('') || [];
                lastNode.innerHTML = chars
                  .map(char => `<span class="animated-char">${char}</span>`)
                  .join('');
              }
            }, 0);
            return false;
          },
        },
      }),
    ]
  },
})
