import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

async function getLoggedInUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("User not authenticated");
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

async function getUserPermission(ctx: QueryCtx | MutationCtx, chestId: Id<"chests">, userId: Id<"users">) {
  // Check if user is owner
  const chest = await ctx.db.get(chestId);
  if (chest?.ownerId === userId) {
    return "owner";
  }
  
  // Check permissions table
  const permission = await ctx.db
    .query("chestPermissions")
    .withIndex("by_chest_and_user", (q) => q.eq("chestId", chestId).eq("userId", userId))
    .first();
  
  return permission?.role || null;
}

export const createChest = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx);
    
    const chestId = await ctx.db.insert("chests", {
      name: args.name,
      ownerId: user._id,
      description: args.description,
    });
    
    return chestId;
  },
});

export const listMyChests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getLoggedInUser(ctx);
    
    // Get owned chests
    const ownedChests = await ctx.db
      .query("chests")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
    
    // Get shared chests
    const permissions = await ctx.db
      .query("chestPermissions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    const sharedChests = await Promise.all(
      permissions.map(async (perm) => {
        const chest = await ctx.db.get(perm.chestId);
        return chest ? { ...chest, role: perm.role } : null;
      })
    );
    
    return {
      owned: ownedChests.map(chest => ({ ...chest, role: "owner" })),
      shared: sharedChests.filter(Boolean),
    };
  },
});

export const getChest = query({
  args: { chestId: v.id("chests") },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx);
    const permission = await getUserPermission(ctx, args.chestId, user._id);
    
    if (!permission) {
      throw new Error("Access denied");
    }
    
    const chest = await ctx.db.get(args.chestId);
    if (!chest) {
      throw new Error("Chest not found");
    }
    
    return { ...chest, userRole: permission };
  },
});

export const updateChest = mutation({
  args: {
    chestId: v.id("chests"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx);
    const permission = await getUserPermission(ctx, args.chestId, user._id);
    
    if (!permission || (permission !== "owner" && permission !== "admin")) {
      throw new Error("Access denied");
    }
    
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    
    await ctx.db.patch(args.chestId, updates);
  },
});

export const deleteChest = mutation({
  args: { chestId: v.id("chests") },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx);
    const chest = await ctx.db.get(args.chestId);
    
    if (!chest || chest.ownerId !== user._id) {
      throw new Error("Access denied");
    }
    
    // Delete all related data
    const permissions = await ctx.db
      .query("chestPermissions")
      .withIndex("by_chest", (q) => q.eq("chestId", args.chestId))
      .collect();
    
    const invites = await ctx.db
      .query("chestInvites")
      .withIndex("by_chest", (q) => q.eq("chestId", args.chestId))
      .collect();
    
    const items = await ctx.db
      .query("items")
      .withIndex("by_chest", (q) => q.eq("chestId", args.chestId))
      .collect();
    
    // Delete all related records
    await Promise.all([
      ...permissions.map(p => ctx.db.delete(p._id)),
      ...invites.map(i => ctx.db.delete(i._id)),
      ...items.map(i => ctx.db.delete(i._id)),
    ]);
    
    await ctx.db.delete(args.chestId);
  },
});

export const inviteUser = mutation({
  args: {
    chestId: v.id("chests"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx);
    const permission = await getUserPermission(ctx, args.chestId, user._id);
    
    if (!permission || (permission !== "owner" && permission !== "admin")) {
      throw new Error("Access denied");
    }
    
    // Check if user is already invited or has access
    const existingInvite = await ctx.db
      .query("chestInvites")
      .withIndex("by_chest", (q) => q.eq("chestId", args.chestId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    
    if (existingInvite) {
      throw new Error("User already invited");
    }
    
    const token = Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    
    await ctx.db.insert("chestInvites", {
      chestId: args.chestId,
      email: args.email,
      role: args.role,
      invitedBy: user._id,
      token,
      expiresAt,
    });
    
    return token;
  },
});

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx);
    
    const invite = await ctx.db
      .query("chestInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    
    if (!invite) {
      throw new Error("Invalid invite token");
    }
    
    if (invite.expiresAt < Date.now()) {
      throw new Error("Invite expired");
    }
    
    if (invite.email !== user.email) {
      throw new Error("Invite not for this user");
    }
    
    // Check if user already has permission
    const existingPermission = await ctx.db
      .query("chestPermissions")
      .withIndex("by_chest_and_user", (q) => 
        q.eq("chestId", invite.chestId).eq("userId", user._id)
      )
      .first();
    
    if (existingPermission) {
      throw new Error("User already has access");
    }
    
    // Add permission
    await ctx.db.insert("chestPermissions", {
      chestId: invite.chestId,
      userId: user._id,
      role: invite.role,
    });
    
    // Delete invite
    await ctx.db.delete(invite._id);
    
    return invite.chestId;
  },
});

export const getCollaborators = query({
  args: { chestId: v.id("chests") },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx);
    const permission = await getUserPermission(ctx, args.chestId, user._id);
    
    if (!permission) {
      throw new Error("Access denied");
    }
    
    const chest = await ctx.db.get(args.chestId);
    if (!chest) {
      throw new Error("Chest not found");
    }
    
    const owner = await ctx.db.get(chest.ownerId);
    const permissions = await ctx.db
      .query("chestPermissions")
      .withIndex("by_chest", (q) => q.eq("chestId", args.chestId))
      .collect();
    
    const collaborators = await Promise.all(
      permissions.map(async (perm) => {
        const collaborator = await ctx.db.get(perm.userId);
        return collaborator ? {
          _id: collaborator._id,
          email: collaborator.email,
          name: collaborator.name,
          role: perm.role,
        } : null;
      })
    );
    
    return {
      owner: {
        _id: owner?._id,
        email: owner?.email,
        name: owner?.name,
        role: "owner" as const,
      },
      collaborators: collaborators.filter(Boolean),
    };
  },
});

export const removeCollaborator = mutation({
  args: {
    chestId: v.id("chests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getLoggedInUser(ctx);
    const permission = await getUserPermission(ctx, args.chestId, user._id);
    
    if (!permission || (permission !== "owner" && permission !== "admin")) {
      throw new Error("Access denied");
    }
    
    const targetPermission = await ctx.db
      .query("chestPermissions")
      .withIndex("by_chest_and_user", (q) => 
        q.eq("chestId", args.chestId).eq("userId", args.userId)
      )
      .first();
    
    if (targetPermission) {
      await ctx.db.delete(targetPermission._id);
    }
  },
});
