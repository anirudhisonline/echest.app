import { v } from 'convex/values'
import {
  query,
  action,
  mutation,
  QueryCtx,
  MutationCtx,
} from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'
import { Id } from './_generated/dataModel'

async function getLoggedInUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    throw new Error('User not authenticated')
  }
  const user = await ctx.db.get(userId)
  if (!user) {
    throw new Error('User not found')
  }
  return user
}

async function getUserPermission(
  ctx: QueryCtx | MutationCtx,
  chestId: Id<'chests'>,
  userId: Id<'users'>,
) {
  const chest = await ctx.db.get(chestId)
  if (chest?.ownerId === userId) {
    return 'owner'
  }

  const permission = await ctx.db
    .query('chestPermissions')
    .withIndex('by_chest_and_user', (q) =>
      q.eq('chestId', chestId).eq('userId', userId),
    )
    .first()

  return permission?.role || null
}

export const fetchLinkPreview = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(args.url)
      const html = await response.text()

      // Extract meta tags
      const getMetaContent = (property: string) => {
        const regex = new RegExp(
          `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
          'i',
        )
        const match = html.match(regex)
        return match ? match[1] : null
      }

      const getTitle = () => {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        return titleMatch ? titleMatch[1] : null
      }

      return {
        title:
          getMetaContent('og:title') ||
          getMetaContent('twitter:title') ||
          getTitle(),
        description:
          getMetaContent('og:description') ||
          getMetaContent('twitter:description') ||
          getMetaContent('description'),
        image: getMetaContent('og:image') || getMetaContent('twitter:image'),
        siteName: getMetaContent('og:site_name'),
      }
    } catch (error) {
      console.error('Failed to fetch link preview:', error)
      return null
    }
  },
})

export const getChestItems = query({
  args: { chestId: v.id('chests') },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx)
    const permission = await getUserPermission(ctx, args.chestId, user._id)

    if (!permission) {
      throw new Error('Access denied')
    }

    const items = await ctx.db
      .query('items')
      .withIndex('by_chest', (q) => q.eq('chestId', args.chestId))
      .order('desc')
      .collect()

    // Get file URLs for images and files
    const itemsWithUrls = await Promise.all(
      items.map(async (item) => {
        if (item.storageId) {
          const url = await ctx.storage.getUrl(item.storageId)
          return { ...item, url }
        }
        return item
      }),
    )

    return itemsWithUrls
  },
})

export const addItem = mutation({
  args: {
    chestId: v.id('chests'),
    type: v.union(
      v.literal('link'),
      v.literal('note'),
      v.literal('todo'),
      v.literal('image'),
      v.literal('file'),
    ),

    // New fields
    dateTime: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),

    // Link fields
    url: v.optional(v.string()),
    title: v.optional(v.string()),

    // Note fields
    content: v.optional(v.string()),

    // Todo fields
    label: v.optional(v.string()),

    // File fields
    storageId: v.optional(v.id('_storage')),
    filename: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx)
    const permission = await getUserPermission(ctx, args.chestId, user._id)

    if (!permission || permission === 'viewer') {
      throw new Error('Access denied')
    }

    const itemData: any = {
      chestId: args.chestId,
      type: args.type,
      stackSize: 1,
      createdBy: user._id,
      dateTime: args.dateTime,
      tags: args.tags,
    }

    // Add type-specific fields
    if (args.type === 'link') {
      itemData.url = args.url
      itemData.title = args.title || args.url
    } else if (args.type === 'note') {
      itemData.content = args.content || ''
    } else if (args.type === 'todo') {
      itemData.label = args.label || ''
      itemData.completed = false
    } else if (args.type === 'image' || args.type === 'file') {
      itemData.storageId = args.storageId
      itemData.filename = args.filename
      itemData.mimeType = args.mimeType
      itemData.fileSize = args.fileSize
    }

    const itemId = await ctx.db.insert('items', itemData)
    return itemId
  },
})

export const updateItem = mutation({
  args: {
    itemId: v.id('items'),

    // New fields
    dateTime: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),

    // Link fields
    url: v.optional(v.string()),
    title: v.optional(v.string()),

    // Note fields
    content: v.optional(v.string()),

    // Todo fields
    label: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx)
    const item = await ctx.db.get(args.itemId)

    if (!item) {
      throw new Error('Item not found')
    }

    const permission = await getUserPermission(ctx, item.chestId, user._id)

    if (!permission || permission === 'viewer') {
      throw new Error('Access denied')
    }

    const { itemId, ...updates } = args

    await ctx.db.patch(args.itemId, updates)
  },
})

export const deleteItem = mutation({
  args: { itemId: v.id('items') },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx)
    const item = await ctx.db.get(args.itemId)

    if (!item) {
      throw new Error('Item not found')
    }

    const permission = await getUserPermission(ctx, item.chestId, user._id)

    if (!permission || permission === 'viewer') {
      throw new Error('Access denied')
    }

    await ctx.db.delete(args.itemId)
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getLoggedInUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})
