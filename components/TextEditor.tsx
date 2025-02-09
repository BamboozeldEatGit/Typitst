"use client"
import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { CommandPalette } from "./CommandPalette"
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { TextStyle } from '@tiptap/extension-text-style'
import { AnimatedText } from '@/extensions/AnimatedText'
import { Extension } from '@tiptap/core'
import { Plugin } from 'prosemirror-state'
import { CompletionSuggestions } from './CompletionSuggestions'
import { getSmartSuggestions } from '@/utils/getSuggestions'

// Simple fade-in animation extension
const FadeInCharacters = Extension.create({
  name: 'fadeInCharacters',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        view: () => ({
          update: (view) => {
            // Get all text nodes and apply fade-in class
            const textNodes = view.dom.querySelectorAll('.ProseMirror p span')
            textNodes.forEach(node => {
              if (!node.classList.contains('has-animated')) {
                node.classList.add('fade-in')
                node.classList.add('has-animated')
                setTimeout(() => node.classList.remove('fade-in'), 500)
              }
            })
          }
        })
      })
    ]
  }
})

export function TextEditor() {
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestionPosition, setSuggestionPosition] = useState<{ x: number; y: number } | null>(null)
  const [currentWord, setCurrentWord] = useState<string>('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const getCurrentWordAndPosition = () => {
    if (!editor) return;

    const { view } = editor;
    const { state } = view;
    const { selection } = state;
    const { $from } = selection;
    
    // Get cursor position relative to the editor
    const editorDiv = document.querySelector('.ProseMirror');
    const coords = view.coordsAtPos($from.pos);
    const editorRect = editorDiv?.getBoundingClientRect();
    
    // Calculate position relative to the editor
    const x = coords.left - (editorRect?.left || 0);
    const y = coords.bottom - (editorRect?.top || 0);

    const lineStart = $from.start();
    const text = state.doc.textBetween(lineStart, $from.pos);
    const match = text.match(/\S+$/);
    const currentWord = match ? match[0] : '';
    
    return {
      word: currentWord,
      position: { x, y }
    };
  };

  const handleSuggestionSelect = (word: string) => {
    if (!editor) return;

    const { state } = editor;
    const { $from } = state.selection;
    
    // Get the current word boundaries
    const lineStart = $from.start();
    const text = state.doc.textBetween(lineStart, $from.pos);
    const match = text.match(/\S+$/);
    
    if (match) {
      const wordStart = lineStart + text.lastIndexOf(match[0]);
      
      // Replace the current word with the suggestion
      editor
        .chain()
        .focus()
        .setTextSelection({ from: wordStart, to: $from.pos })
        .insertContent(word + ' ')
        .run();
    }

    setSuggestions([]);
    setSuggestionPosition(null);
    setSelectedIndex(0);
  };

  const fetchSuggestions = async (word: string) => {
    if (word.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const smartSuggestions = await getSmartSuggestions(word);
      setSuggestions(smartSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleFormat = (format: string) => {
    if (!editor) return

    const { from, to } = editor.state.selection

    // Handle font changes
    if (format.startsWith('font-')) {
      const fontFamily = getFontFamily(format)
      editor.chain().focus()
        .setTextSelection({ from, to })
        .setMark('textStyle', { style: `font-family: ${fontFamily}` })
        .run()
      return
    }

    // Handle custom font size
    if (format.startsWith('text-[')) {
      const size = format.match(/\d+/)?.[0]
      if (size) {
        editor.chain().focus()
          .setTextSelection({ from, to })
          .setMark('textStyle', { style: `font-size: ${size}px` })
          .run()
      }
      return
    }

    switch (format) {
      case '**{text}**':
        editor.chain().focus()
          .setTextSelection({ from, to })
          .toggleBold()
          .setTextSelection(to)
          .unsetMark('bold')
          .run()
        break
      case '_{text}_':
        editor.chain().focus()
          .setTextSelection({ from, to })
          .toggleItalic()
          .setTextSelection(to)
          .unsetMark('italic')
          .run()
        break
      case '# {text}':
        editor.chain().focus()
          .setTextSelection({ from, to })
          .clearNodes()
          .setHeading({ level: 1 })
          .setTextSelection(to)
          .insertContent('\n')
          .run()
        break
      case '## {text}':
        editor.chain().focus()
          .setTextSelection({ from, to })
          .clearNodes()
          .setHeading({ level: 2 })
          .setTextSelection(to)
          .insertContent('\n')
          .run()
        break
      case '```\n{text}\n```':
        editor.chain().focus()
          .setTextSelection({ from, to })
          .toggleCodeBlock()
          .insertContent('\n')
          .setParagraph()
          .run()
        break
      case '> {text}':
        editor.chain().focus()
          .setTextSelection({ from, to })
          .setBlockquote()
          .run()
        break
      case '- {text}':
        editor.chain().focus()
          .setTextSelection({ from, to })
          .toggleBulletList()
          .run()
        break
      case '- [ ] {text}':
        editor.chain().focus()
          .setTextSelection({ from, to })
          .toggleTaskList()
          .run()
        break
      case '~~{text}~~':
        editor.chain().focus()
          .setTextSelection({ from, to })
          .toggleStrike()
          .setTextSelection(to)
          .unsetMark('strike')
          .run()
        break
      case '[{text}]()':
        const url = window.prompt('Enter URL:')
        if (url) {
          editor.chain().focus()
            .setTextSelection({ from, to })
            .setLink({ href: url, target: '_blank' })
            .setTextSelection(to)
            .unsetMark('link')
            .run()
        }
        break
    }
  }

  // Helper function to map font classes to actual font families
  const getFontFamily = (fontClass: string) => {
    const fonts = {
      'font-mono': '"JetBrains Mono", monospace',
      'font-sans': '-apple-system, system-ui, sans-serif',
      'font-serif': '"Times New Roman", serif',
      'font-inter': 'Inter, sans-serif',
      'font-roboto': 'Roboto, sans-serif'
    }
    return fonts[fontClass as keyof typeof fonts] || 'inherit'
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable code block
        blockquote: false, // Disable blockquote
        text: {
          HTMLAttributes: {
            class: 'character'
          }
        }
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-700 underline'
        }
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2',
        },
      }),
      TextStyle.configure({  // Configure TextStyle extension
        HTMLAttributes: {
          class: '',
        },
      }),
      FadeInCharacters, // Add the fade-in animation extension
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[calc(297mm-2rem)] p-12'
      },
      handleKeyDown: (view, event) => {
        // Handle suggestions first
        if (suggestions.length > 0) {
          if (event.key === 'Tab' || event.key === 'Enter') {
            event.preventDefault();
            handleSuggestionSelect(suggestions[selectedIndex].word);
            return true;
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((prev) => 
              event.key === 'ArrowDown'
                ? (prev < suggestions.length - 1 ? prev + 1 : prev)
                : (prev > 0 ? prev - 1 : prev)
            );
            return true;
          }
          if (event.key === 'Escape') {
            setSuggestions([]);
            setSuggestionPosition(null);
            return true;
          }
        }

        // For normal character input
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          editor?.chain().focus().insertContent(event.key).run();

          // Update suggestions for the new word
          setTimeout(() => {
            const current = getCurrentWordAndPosition();
            if (current) {
              setCurrentWord(current.word);
              setSuggestionPosition(current.position);
              fetchSuggestions(current.word);
            }
          }, 0);

          return true;
        }

        // Handle command palette shortcut
        if ((event.ctrlKey && event.shiftKey && event.key === '?') || 
            (event.ctrlKey && event.key === '/')) {
          event.preventDefault();
          const selection = editor?.state.selection;
          if (selection) {
            setSelectedText(view.state.doc.textBetween(selection.from, selection.to));
            setIsCommandOpen(true);
          }
          return true;
        }

        return false;
      },
      parseOptions: {
        preserveWhitespace: true,
      }
    },
    onCreate: ({ editor }) => {
      editor.commands.setNode('paragraph')
      editor.commands.unsetAllMarks()
    },
    onSelectionUpdate: ({ editor }) => {
      const { empty } = editor.state.selection
      if (empty) {
        editor.commands.unsetAllMarks()
        if (!editor.isActive('heading') && 
            !editor.isActive('codeBlock') && 
            !editor.isActive('blockquote') && 
            !editor.isActive('bulletList') &&
            !editor.isActive('taskList')) {
          editor.commands.setNode('paragraph')
        }
      }
    },
    onUpdate: ({ transaction }) => {
      // Add animation class to new characters
      if (transaction.docChanged) {
        const lastChar = document.querySelector('.ProseMirror > *:last-child > *:last-child')
        if (lastChar) {
          lastChar.classList.add('animate-typing')
          setTimeout(() => lastChar.classList.remove('animate-typing'), 300)
        }
      }
    }
  })

  const handleRightClick = (e: React.MouseEvent) => {
    // Only open palette if Ctrl (or Cmd on Mac) is pressed during right click
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const selection = editor?.state.selection;
      if (selection) {
        setSelectedText(editor.state.doc.textBetween(selection.from, selection.to));
        setIsCommandOpen(true);
      }
    }
  };

  return (
    <>
      <Card className="mx-auto mt-8" style={{ width: '210mm', height: '297mm' }}>
        <CardContent 
          className="h-full p-4 relative group"
          onContextMenu={handleRightClick}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity text-xs text-muted-foreground">
            Press Ctrl + Right Click or Ctrl + / to format
          </div>
          <EditorContent editor={editor} />
          <CompletionSuggestions
            suggestions={suggestions}
            position={suggestionPosition}
            onSelect={handleSuggestionSelect}
            selectedIndex={selectedIndex}
          />
        </CardContent>
      </Card>
      <CommandPalette 
        isOpen={isCommandOpen}
        onClose={() => {
          setIsCommandOpen(false)
          setSelectedText("")
        }}
        onFormatText={handleFormat}
        selectedText={selectedText}
      />
    </>
  )
}
