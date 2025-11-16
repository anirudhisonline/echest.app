// src/components/ItemModal.tsx
import { useState, useRef, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@@/convex/_generated/api'
import type { Id } from '@@/convex/_generated/dataModel'
import { toast } from 'sonner'

interface Item {
  _id: Id<'items'>
  type: 'link' | 'note' | 'todo' | 'image' | 'file'
  dateTime?: number
  tags?: string[]
  url?: string
  title?: string
  content?: string
  label?: string
}

interface ItemModalProps {
  chestId: Id<'chests'>
  item: Item | null
  onClose: () => void
}

export function ItemModal({ chestId, item, onClose }: ItemModalProps) {
  const addItem = useMutation(api.items.addItem)
  const updateItem = useMutation(api.items.updateItem)
  const generateUploadUrl = useMutation(api.items.generateUploadUrl)

  const [itemType, setItemType] = useState<
    'link' | 'note' | 'todo' | 'image' | 'file'
  >('note')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [label, setLabel] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [tags, setTags] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const isEditing = item !== null

  useEffect(() => {
    if (item) {
      setItemType(item.type)
      setUrl(item.url || '')
      setTitle(item.title || '')
      setContent(item.content || '')
      setLabel(item.label || '')
      setTags((item.tags || []).join(', '))
      if (item.dateTime) {
        const d = new Date(item.dateTime)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        setDateTime(d.toISOString().slice(0, 16))
      } else {
        setDateTime('')
      }
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const parsedDateTime = dateTime ? new Date(dateTime).getTime() : undefined

      if (isEditing) {
        const updates: any = {
          itemId: item._id,
          url,
          title,
          content,
          label,
          tags: parsedTags,
          dateTime: parsedDateTime,
        }
        await updateItem(updates)
        toast.success('Item updated successfully!')
      } else {
        let itemData: any = {
          chestId,
          type: itemType,
          tags: parsedTags,
          dateTime: parsedDateTime,
        }

        if (itemType === 'link') {
          if (!url.trim()) {
            toast.error('URL is required')
            setIsSubmitting(false)
            return
          }
          itemData.url = url.trim()
          itemData.title = title.trim() || url.trim()
        } else if (itemType === 'note') {
          itemData.content = content.trim()
        } else if (itemType === 'todo') {
          if (!label.trim()) {
            toast.error('Todo label is required')
            setIsSubmitting(false)
            return
          }
          itemData.label = label.trim()
        } else if (itemType === 'image' || itemType === 'file') {
          if (!selectedFile) {
            toast.error('File is required')
            setIsSubmitting(false)
            return
          }
          const uploadUrl = await generateUploadUrl()
          const result = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': selectedFile.type },
            body: selectedFile,
          })
          if (!result.ok) throw new Error('Upload failed')
          const { storageId } = await result.json()
          itemData.storageId = storageId
          itemData.filename = selectedFile.name
          itemData.mimeType = selectedFile.type
          itemData.fileSize = selectedFile.size
        }

        await addItem(itemData)
        toast.success('Item added successfully!')
      }
      onClose()
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error(`Failed to ${isEditing ? 'update' : 'add'} item`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (file.type.startsWith('image/')) setItemType('image')
      else setItemType('file')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isEditing ? 'Edit Item' : 'Add Item'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'note', icon: '📝', label: 'Note' },
                  { type: 'link', icon: '🔗', label: 'Link' },
                  { type: 'todo', icon: '☐', label: 'Todo' },
                  { type: 'image', icon: '🖼️', label: 'Image' },
                  { type: 'file', icon: '📄', label: 'File' },
                ].map(({ type, icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setItemType(type as any)}
                    className={`p-3 rounded-lg border-2 transition-colors ${itemType === type ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="text-lg mb-1">{icon}</div>
                    <div className="text-sm">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {itemType === 'link' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Link title"
                />
              </div>
            </>
          )}
          {itemType === 'note' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your note..."
                rows={4}
              />
            </div>
          )}
          {itemType === 'todo' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Todo Item *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="What needs to be done?"
                required
              />
            </div>
          )}
          {(itemType === 'image' || itemType === 'file') && !isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {itemType === 'image' ? 'Image File' : 'File'} *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                accept={itemType === 'image' ? 'image/*' : '*/*'}
                required
              />
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time (optional)
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (optional, comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. work, important, project-x"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Add Item'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
