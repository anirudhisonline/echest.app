// src/components/ChatInput.tsx
import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  Link2,
  Loader2,
} from 'lucide-react'

interface ChatInputProps {
  chestId: Id<'chests'>
}

export function ChatInput({ chestId }: ChatInputProps) {
  const addItem = useMutation(api.items.addItem)
  const generateUploadUrl = useMutation(api.items.generateUploadUrl)

  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [detectedTags, setDetectedTags] = useState<string[]>([])
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse input for tags (#tag) and URLs
  const parseInput = (text: string) => {
    // Extract hashtags
    const tagRegex = /#(\w+)/g
    const tags = Array.from(text.matchAll(tagRegex)).map((match) => match[1])
    setDetectedTags([...new Set(tags)])

    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = text.match(urlRegex)
    setDetectedUrl(urls ? urls[0] : null)
  }

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    parseInput(value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!input.trim() && selectedFiles.length === 0) return

    setIsSubmitting(true)
    try {
      // Remove hashtags from the content
      const cleanContent = input.replace(/#\w+/g, '').trim()

      // If there's a URL, create a link item
      if (detectedUrl && !selectedFiles.length) {
        await addItem({
          chestId,
          type: 'link',
          url: detectedUrl,
          title: cleanContent || detectedUrl,
          tags: detectedTags.length > 0 ? detectedTags : undefined,
        })
        toast.success('Link added!')
      }
      // If there are files, upload them
      else if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const uploadUrl = await generateUploadUrl()
          const result = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': file.type },
            body: file,
          })

          if (!result.ok) throw new Error('Upload failed')

          const { storageId } = await result.json()
          const itemType = file.type.startsWith('image/') ? 'image' : 'file'

          await addItem({
            chestId,
            type: itemType,
            storageId,
            filename: file.name,
            mimeType: file.type,
            fileSize: file.size,
            tags: detectedTags.length > 0 ? detectedTags : undefined,
            content: cleanContent || undefined,
          })
        }
        toast.success(
          `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} uploaded!`,
        )
      }
      // Otherwise, create a note
      else if (cleanContent) {
        await addItem({
          chestId,
          type: 'note',
          content: cleanContent,
          tags: detectedTags.length > 0 ? detectedTags : undefined,
        })
        toast.success('Note added!')
      }

      // Reset form
      setInput('')
      setSelectedFiles([])
      setDetectedTags([])
      setDetectedUrl(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="">
      {/* File Attachments Preview */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3">
          {selectedFiles.map((file, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="gap-2 pr-1 max-w-xs"
            >
              {file.type.startsWith('image/') ? (
                <ImageIcon className="h-3 w-3" />
              ) : (
                <Paperclip className="h-3 w-3" />
              )}
              <span className="truncate text-xs">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="hover:text-destructive"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Detected Tags and URL Preview */}
      {(detectedTags.length > 0 || detectedUrl) && (
        <div className="flex flex-wrap gap-2 text-xs px-3">
          {detectedTags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
          {detectedUrl && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Link2 className="h-3 w-3" />
              Link detected
            </Badge>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="relative border rounded-xl bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... Use #tags for organization, paste links, or attach files"
          disabled={isSubmitting}
          className="resize-none min-h-[56px] max-h-[200px] border-0 focus-visible:ring-0 shadow-none pl-4 pr-24 py-4 text-sm"
          rows={1}
        />

        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting || (!input.trim() && selectedFiles.length === 0)
            }
            size="icon"
            className="h-8 w-8 rounded-lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
