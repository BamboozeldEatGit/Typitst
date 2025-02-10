"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onFormatText: (format: string) => void
  onExport: () => boolean
  selectedText?: string
}

const formatOptions = [
  { id: 'bold', label: 'Bold', icon: 'B', format: '**{text}**' },
  { id: 'italic', label: 'Italic', icon: 'I', format: '_{text}_' },
  { id: 'heading1', label: 'Heading 1', icon: 'H1', format: '# {text}' },
  { id: 'heading2', label: 'Heading 2', icon: 'H2', format: '## {text}' },
  { id: 'link', label: 'Link', icon: '🔗', format: '[{text}]()' },
  { id: 'list', label: 'List Item', icon: '•', format: '- {text}' },
  { id: 'checkbox', label: 'Checkbox', icon: '☐', format: '- [ ] {text}' },
  { id: 'strikethrough', label: 'Strikethrough', icon: '~', format: '~~{text}~~' },
]

const fontOptions = [
  { id: 'font-mono', label: 'Monospace', format: 'font-mono' },
  { id: 'font-sans', label: 'Sans Serif', format: 'font-sans' },
  { id: 'font-serif', label: 'Serif', format: 'font-serif' },
]

const sizeOptions = [
  { id: 'text-sm', label: 'Small', format: 'text-sm' },
  { id: 'text-base', label: 'Normal', format: 'text-base' },
  { id: 'text-lg', label: 'Large', format: 'text-lg' },
  { id: 'text-xl', label: 'Extra Large', format: 'text-xl' },
]

const fontFamilies = [
  { value: 'font-mono', label: 'Monospace' },
  { value: 'font-sans', label: 'Sans Serif' },
  { value: 'font-serif', label: 'Serif' },
  { value: 'font-inter', label: 'Inter' },
  { value: 'font-roboto', label: 'Roboto' },
]

export function CommandPalette({ isOpen, onClose, onFormatText, onExport, selectedText }: CommandPaletteProps) {
  const { theme, setTheme } = useTheme()
  const [customSize, setCustomSize] = React.useState('')

  const handleFontSizeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customSize) {
      onFormatText(`text-[${customSize}px]`)
      onClose()
    }
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose} className="p-4">
      <CommandInput 
        placeholder={selectedText 
          ? `How would you like to modify "${selectedText}"?` 
          : "Type a command or search..."
        }
        className="px-4 py-3"
      />
      <CommandList className="px-2 py-3">
        <CommandEmpty className="px-4 py-3">No results found.</CommandEmpty>
        
        {/* Formatting Options */}
        <CommandGroup heading={selectedText ? "Formatting Options" : "Available Commands"} className="p-1">
          {formatOptions.map((option) => (
            <CommandItem
              key={option.id}
              onSelect={() => {
                onFormatText(option.format)
                onClose()
              }}
              className="px-4 py-3"
            >
              <span className="mr-2 text-muted-foreground">{option.icon}</span>
              <span>{option.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Font Family */}
        <CommandGroup heading="Font Family" className="p-1">
          <Select onValueChange={(value) => {
            onFormatText(value)
            onClose()
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose font..." />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span className={font.value}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CommandGroup>

        {/* Font Size */}
        <CommandGroup heading="Font Size" className="p-1">
          {sizeOptions.map((option) => (
            <CommandItem
              key={option.id}
              onSelect={() => {
                onFormatText(option.format)
                onClose()
              }}
              className="px-4 py-3"
            >
              <span className={`mr-2 ${option.format}`}>A</span>
              <span>{option.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Custom Font Size */}
        <CommandGroup heading="Custom Font Size" className="p-1">
          <form onSubmit={handleFontSizeSubmit} className="px-4 py-3 flex gap-2">
            <Input
              type="number"
              placeholder="Size in px..."
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              className="w-24"
              min="8"
              max="100"
            />
            <button 
              type="submit"
              className="px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Apply
            </button>
          </form>
        </CommandGroup>

        {/* Bottom Sections */}
        <div className="border-t mt-6">
          {/* Actions Section */}
          <CommandGroup heading="Actions" className="p-1 mt-4">
            <CommandItem
              onSelect={() => {
                const success = onExport();
                if (success) onClose();
              }}
              className="px-4 py-3"
            >
              <span className="mr-2 text-muted-foreground">📋</span>
              <span>Copy Document to Clipboard</span>
              <kbd className="ml-auto text-xs text-muted-foreground">⌘C</kbd>
            </CommandItem>
          </CommandGroup>

          {/* Settings Section */}
          <CommandGroup heading="Settings" className="p-1">
            <CommandItem
              onSelect={() => {
                setTheme(theme === "dark" ? "light" : "dark");
              }}
              className="px-4 py-3"
            >
              <span className="mr-2 text-muted-foreground">
                {theme === "dark" ? "🌞" : "🌙"}
              </span>
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              <kbd className="ml-auto text-xs text-muted-foreground">⌘D</kbd>
            </CommandItem>
          </CommandGroup>
        </div>
      </CommandList>
    </CommandDialog>
  )
}
