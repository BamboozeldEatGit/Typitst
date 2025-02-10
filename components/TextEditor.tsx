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
import { setCookie, getCookie, deleteCookie } from '@/utils/cookies'

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
  // Initialize all state first
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionPosition, setSuggestionPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastCopied, setLastCopied] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const matchCase = (suggestion: string, currentWord: string): string => {
    // If current word is all caps, make suggestion all caps
    if (currentWord === currentWord.toUpperCase()) {
      return suggestion.toUpperCase();
    }
    // If current word starts with capital, capitalize suggestion
    if (currentWord[0] === currentWord[0].toUpperCase()) {
      return suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
    }
    return suggestion;
  };

  const handleFormat = (format: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;

    // Handle block-level formats differently (don't reset these)
    if (format === '# {text}') {
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .clearNodes()
        .setHeading({ level: 1 })
        .run();
      return;
    }

    if (format === '## {text}') {
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .clearNodes()
        .setHeading({ level: 2 })
        .run();
      return;
    }

    // For inline formats, use the toggle pattern
    const chain = editor.chain().focus().setTextSelection({ from, to });
    
    switch (format) {
      case '**{text}**':
        chain.toggleBold()
          .setTextSelection(to)
          .insertContent(' ')
          .toggleBold()
          .run();
        break;
      case '_{text}_':
        chain.toggleItalic()
          .setTextSelection(to)
          .insertContent(' ')
          .toggleItalic()
          .run();
        break;
      case '~~{text}~~':
        chain.toggleStrike()
          .setTextSelection(to)
          .insertContent(' ')
          .toggleStrike()
          .run();
        break;
      case 'font-mono':
      case 'font-sans':
      case 'font-serif':
        chain.setMark('textStyle', { style: `font-family: ${getFontFamily(format)}` })
          .setTextSelection(to)
          .insertContent(' ')
          .unsetMark('textStyle')
          .run();
        break;
      // ...other cases...
    }
  };

  const handleKeyDown = (view: any, event: KeyboardEvent) => {
    // Close suggestions on backspace or when command palette opens
    if (event.key === 'Backspace' || event.key === '/' || event.key === '?') {
      setSuggestions([]);
      setSuggestionPosition(null);
      setSelectedIndex(0);
    }

    // Handle suggestions
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
      
      editor?.commands.first(({ commands }) => {
        // First clear any active formatting
        if (editor.isActive('bold')) commands.toggleBold();
        if (editor.isActive('italic')) commands.toggleItalic();
        if (editor.isActive('strike')) commands.toggleStrike();
        if (editor.isActive('textStyle')) commands.unsetMark('textStyle');
        
        // Then insert the character
        return commands.insertContent(event.key);
      });

      // Update suggestions for the new word
      setTimeout(() => {
        const current = getCurrentWordAndPosition();
        if (current) {
          setCurrentWord(current.word);
          setSuggestionPosition(current.position);
          if (current.word.length >= 2) {
            fetchSuggestions(current.word);
          }
        }
      }, 0);

      return true;
    }

    // Handle command palette (close suggestions when opened)
    if ((event.ctrlKey && event.shiftKey && event.key === '?') || 
        (event.ctrlKey && event.key === '/')) {
      setSuggestions([]);
      setSuggestionPosition(null);
      const selection = editor?.state.selection;
      if (selection) {
        setSelectedText(view.state.doc.textBetween(selection.from, selection.to));
        setIsCommandOpen(true);
      }
      return true;
    }

    return false;
  };

  // Also update the editor configuration
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
      handleKeyDown,
      parseOptions: {
        preserveWhitespace: true,
      }
    },
    onCreate: ({ editor }) => {
      editor.commands.setNode('paragraph')
      editor.commands.unsetAllMarks()
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      localStorage.setItem('editorContent', content);
      setHasUnsavedChanges(true);
      
      // Only set cookie if content has changed from last copied version
      const plainText = content
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n\n')
        .replace(/<h1>/g, '')
        .replace(/<\/h1>/g, '\n\n')
        .replace(/<h2>/g, '')
        .replace(/<\/h2>/g, '\n\n')
        .replace(/<br>/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .trim();

      if (plainText !== lastCopied) {
        setCookie('lastDocument', plainText);
      }
      
      // Existing animation code
      const lastChar = document.querySelector('.ProseMirror > *:last-child > *:last-child');
      if (lastChar) {
        lastChar.classList.add('animate-typing');
        setTimeout(() => lastChar.classList.remove('animate-typing'), 300);
      }
    }
  });

  // Helper functions that use editor
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
      const currentWord = match[0];
      
      // Match the case of the current word
      const matchedWord = matchCase(word, currentWord);
      
      editor
        .chain()
        .focus()
        .setTextSelection({ from: wordStart, to: $from.pos })
        .insertContent(matchedWord + ' ')
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

  // Add event listener for page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load content from localStorage on mount
  useEffect(() => {
    if (editor && editor.isEmpty) {
      const savedContent = localStorage.getItem('editorContent');
      if (savedContent) {
        editor.commands.setContent(savedContent);
      }
    }
  }, [editor]);

  // Load last document from cookie on mount and set initial content
  useEffect(() => {
    const savedDoc = getCookie('lastDocument');
    if (savedDoc && editor) {
      // Only load if editor is empty
      if (editor.isEmpty) {
        editor.commands.setContent(savedDoc);
      }
      setLastCopied(savedDoc);
    }
  }, [editor]);

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

  const handleCopyDocument = () => {
    if (!editor) return false;
    
    const content = editor.getHTML();
    const plainText = content
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n\n')
      .replace(/<h1>/g, '')
      .replace(/<\/h1>/g, '\n\n')
      .replace(/<h2>/g, '')
      .replace(/<\/h2>/g, '\n\n')
      .replace(/<br>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .trim();

    // Copy to clipboard
    navigator.clipboard.writeText(plainText);
    
    // Delete the cookie and local storage
    deleteCookie('lastDocument');
    localStorage.removeItem('editorContent');
    
    // Clear the editor content
    editor.commands.clearContent();
    
    // Reset states
    setLastCopied('');
    setHasUnsavedChanges(false);
    
    return true;
  };

  return (
    <>
      <Card className="mx-auto mt-8" style={{ width: '210mm', height: '297mm' }}>
        <CardContent className="h-full p-4 relative group" onContextMenu={handleRightClick}>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity text-xs text-muted-foreground">
            Press Ctrl + Right Click or Ctrl + / to format
          </div>
          <EditorContent editor={editor} />
          <CompletionSuggestions
            suggestions={suggestions}
            position={suggestionPosition}
            onSelect={handleSuggestionSelect}
            selectedIndex={selectedIndex}
            currentWord={currentWord} // Pass the current word
          />
        </CardContent>
      </Card>
      <CommandPalette 
        isOpen={isCommandOpen}
        onClose={() => {
          setIsCommandOpen(false);
          setSelectedText("");
        }}
        onFormatText={handleFormat}
        onExport={handleCopyDocument}
        selectedText={selectedText}
      />
    </>
  );
}
