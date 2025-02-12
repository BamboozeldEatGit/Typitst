# Typitst

Typitst is a rich text editor built with Tiptap and React. It includes features like formatting, smart suggestions, and satisfying typing animations.

## Features

- **Rich Text Formatting**: Bold, Italic, Headings, Links, Lists, and more.
- **Smart Suggestions**: Provides word suggestions as you type.
- **Typing Animations**: Satisfying animations for a better typing experience.
- **Command Palette**: Quickly apply formatting and other commands.
- **Dark Mode**: Toggle between light and dark themes.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/BamboozeldEatGit/Typitst.git
    cd Typitst
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Start the development server:
    ```sh
    npm run dev
    ```

## Usage

### TextEditor Component

The `TextEditor` component is the main editor component. It includes features like formatting, suggestions, and animations.

```tsx
import { TextEditor } from "@/components/TextEditor";

export default function Home() {
  return (
    <main className="container mx-auto">
      <TextEditor />
    </main>
  );
}
```

### CommandPalette Component

The `CommandPalette` component allows you to quickly apply formatting and other commands.

```tsx
import { CommandPalette } from "@/components/CommandPalette";

export function App() {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  return (
    <CommandPalette
      isOpen={isCommandOpen}
      onClose={() => setIsCommandOpen(false)}
      onFormatText={(format) => console.log(format)}
      onExport={() => console.log("Export")}
    />
  );
}
```

### ThemeToggle Component

The `ThemeToggle` component allows you to toggle between light and dark themes.

```tsx
import { ThemeToggle } from "@/components/ThemeToggle";

export function App() {
  return (
    <div>
      <ThemeToggle />
    </div>
  );
}
```

## Customization

### Adding New Formats

To add new formats to the `CommandPalette`, update the `formatOptions` array in `CommandPalette.tsx`.

```tsx
const formatOptions = [
  { id: 'bold', label: 'Bold', icon: 'B', format: '**{text}**' },
  { id: 'italic', label: 'Italic', icon: 'I', format: '_{text}_' },
  // Add new formats here
];
```

### Adding New Fonts

To add new fonts to the `CommandPalette`, update the `fontFamilies` array in `CommandPalette.tsx`.

```tsx
const fontFamilies = [
  { value: 'font-mono', label: 'Monospace' },
  { value: 'font-sans', label: 'Sans Serif' },
  // Add new fonts here
];
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.