"use client"

import * as React from "react"
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

export function CommandPalette({ isOpen, onClose, onFormatText, selectedText }: CommandPaletteProps) {
  const [customSize, setCustomSize] = React.useState('')

  const handleFontSizeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customSize) {
      onFormatText(`text-[${customSize}px]`)
      onClose()
    }
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput 
        placeholder={selectedText 
          ? `How would you like to modify "${selectedText}"?` 
          : "Type a command or search..."
        } 
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading={selectedText ? "Formatting Options" : "Available Commands"}>
          {formatOptions.map((option) => (
            <CommandItem
              key={option.id}
              onSelect={() => {
                onFormatText(option.format)
                onClose()
              }}
            >
              <span className="mr-2 text-muted-foreground">{option.icon}</span>
              <span>{option.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Font Family">
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
        <CommandGroup heading="Font Size">
          {sizeOptions.map((option) => (
            <CommandItem
              key={option.id}
              onSelect={() => {
                onFormatText(option.format)
                onClose()
              }}
            >
              <span className={`mr-2 ${option.format}`}>A</span>
              <span>{option.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Custom Font Size">
          <form onSubmit={handleFontSizeSubmit} className="flex gap-2 p-2">
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
      </CommandList>
    </CommandDialog>
  )
}
