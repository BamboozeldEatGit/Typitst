import { Extension } from '@tiptap/core'
import '@tiptap/extension-text-style'

export const FontStyle = Extension.create({
  name: 'fontStyle',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          class: {
            default: null,
            parseHTML: element => element.className,
            renderHTML: attributes => {
              if (!attributes.class) {
                return {}
              }
              return {
                class: attributes.class
              }
            }
          }
        }
      }
    ]
  }
})
