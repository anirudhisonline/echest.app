import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  chests: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    description: v.optional(v.string()),
  })
    .index("by_owner", ["ownerId"]),

  chestPermissions: defineTable({
    chestId: v.id("chests"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  })
    .index("by_chest", ["chestId"])
    .index("by_user", ["userId"])
    .index("by_chest_and_user", ["chestId", "userId"]),

  chestInvites: defineTable({
    chestId: v.id("chests"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
    invitedBy: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_chest", ["chestId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  items: defineTable({
    chestId: v.id("chests"),
    type: v.union(
      v.literal("link"),
      v.literal("note"),
      v.literal("todo"),
      v.literal("image"),
      v.literal("file")
    ),
    stackSize: v.number(),
    createdBy: v.id("users"),
    
    // New fields
    dateTime: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),

    // Link fields
    url: v.optional(v.string()),
    title: v.optional(v.string()),
    favicon: v.optional(v.string()),
    preview: v.optional(v.string()),
    
    // Note fields
    content: v.optional(v.string()),
    
    // Todo fields
    label: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    
    // File/Image fields
    storageId: v.optional(v.id("_storage")),
    filename: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  })
    .index("by_chest", ["chestId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
