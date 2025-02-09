import { TextEditor } from "@/components/TextEditor"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
      <TextEditor />
    </main>
  )
}
