import {
  users,
  divisions,
  userDivisions,
  brandingSettings,
  contactCategories,
  uploads,
  contacts,
  auditLogs,
  type User,
  type UpsertUser,
  type Division,
  type InsertDivision,
  type UserDivision,
  type InsertUserDivision,
  type BrandingSettings,
  type InsertBrandingSettings,
  type ContactCategory,
  type InsertContactCategory,
  type Upload,
  type InsertUpload,
  type Contact,
  type InsertContact,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, like, ilike, inArray, or, isNotNull, ne } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User management
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Division operations
  getAllDivisions(): Promise<Division[]>;
  getDivision(id: number): Promise<Division | undefined>;
  createDivision(division: InsertDivision): Promise<Division>;
  updateDivision(id: number, updates: Partial<Division>): Promise<Division>;
  
  // User-Division permissions
  getUserDivisions(userId: string): Promise<(UserDivision & { division: Division })[]>;
  assignUserToDivision(assignment: InsertUserDivision): Promise<UserDivision>;
  removeUserFromDivision(userId: string, divisionId: number): Promise<void>;
  
  // Branding settings
  getBrandingSettings(): Promise<BrandingSettings | undefined>;
  updateBrandingSettings(settings: InsertBrandingSettings): Promise<BrandingSettings>;
  
  // Contact categories
  getContactCategories(divisionId?: number): Promise<ContactCategory[]>;
  createContactCategory(category: InsertContactCategory): Promise<ContactCategory>;
  updateContactCategory(id: number, updates: Partial<ContactCategory>): Promise<ContactCategory>;
  
  // Upload operations
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUpload(id: number): Promise<Upload | undefined>;
  updateUpload(id: number, updates: Partial<Upload>): Promise<Upload>;
  getRecentUploads(divisionId?: number, limit?: number): Promise<Upload[]>;
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, updates: Partial<Contact>): Promise<Contact>;
  getContacts(divisionId?: number, limit?: number, offset?: number): Promise<Contact[]>;
  searchContacts(query: string, divisionId?: number): Promise<Contact[]>;
  getContactStats(divisionId?: number): Promise<{
    total: number;
    withEmail: number;
    withPhone: number;
    byCategory: { categoryId: number; categoryName: string; count: number }[];
  }>;
  
  // Audit logging
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(divisionId?: number, limit?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Division operations
  async getAllDivisions(): Promise<Division[]> {
    return await db.select().from(divisions).where(eq(divisions.isActive, true));
  }

  async getDivision(id: number): Promise<Division | undefined> {
    const [division] = await db.select().from(divisions).where(eq(divisions.id, id));
    return division;
  }

  async createDivision(division: InsertDivision): Promise<Division> {
    const [newDivision] = await db.insert(divisions).values(division).returning();
    return newDivision;
  }

  async updateDivision(id: number, updates: Partial<Division>): Promise<Division> {
    const [division] = await db
      .update(divisions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(divisions.id, id))
      .returning();
    return division;
  }

  // User-Division permissions
  async getUserDivisions(userId: string): Promise<(UserDivision & { division: Division })[]> {
    const results = await db
      .select({
        id: userDivisions.id,
        createdAt: userDivisions.createdAt,
        userId: userDivisions.userId,
        divisionId: userDivisions.divisionId,
        canManage: userDivisions.canManage,
        division: {
          id: divisions.id,
          name: divisions.name,
          description: divisions.description,
          logoUrl: divisions.logoUrl,
          primaryColor: divisions.primaryColor,
          secondaryColor: divisions.secondaryColor,
          isActive: divisions.isActive,
          createdAt: divisions.createdAt,
          updatedAt: divisions.updatedAt,
        }
      })
      .from(userDivisions)
      .innerJoin(divisions, eq(userDivisions.divisionId, divisions.id))
      .where(and(eq(userDivisions.userId, userId), eq(divisions.isActive, true)));
    
    return results;
  }

  async assignUserToDivision(assignment: InsertUserDivision): Promise<UserDivision> {
    const [userDivision] = await db.insert(userDivisions).values(assignment).returning();
    return userDivision;
  }

  async removeUserFromDivision(userId: string, divisionId: number): Promise<void> {
    await db
      .delete(userDivisions)
      .where(and(eq(userDivisions.userId, userId), eq(userDivisions.divisionId, divisionId)));
  }

  // Branding settings
  async getBrandingSettings(): Promise<BrandingSettings | undefined> {
    const [settings] = await db.select().from(brandingSettings).limit(1);
    return settings;
  }

  async updateBrandingSettings(settings: InsertBrandingSettings): Promise<BrandingSettings> {
    const existing = await this.getBrandingSettings();
    if (existing) {
      const [updated] = await db
        .update(brandingSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(brandingSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(brandingSettings).values(settings).returning();
      return created;
    }
  }

  // Contact categories
  async getContactCategories(divisionId?: number): Promise<ContactCategory[]> {
    const whereConditions = [eq(contactCategories.isActive, true)];
    
    if (divisionId) {
      whereConditions.push(eq(contactCategories.divisionId, divisionId));
    }
    
    return await db
      .select()
      .from(contactCategories)
      .where(and(...whereConditions))
      .orderBy(contactCategories.name);
  }

  async createContactCategory(category: InsertContactCategory): Promise<ContactCategory> {
    const [newCategory] = await db.insert(contactCategories).values(category).returning();
    return newCategory;
  }

  async updateContactCategory(id: number, updates: Partial<ContactCategory>): Promise<ContactCategory> {
    const [category] = await db
      .update(contactCategories)
      .set(updates)
      .where(eq(contactCategories.id, id))
      .returning();
    return category;
  }

  // Upload operations
  async createUpload(upload: InsertUpload): Promise<Upload> {
    const [newUpload] = await db.insert(uploads).values(upload).returning();
    return newUpload;
  }

  async getUpload(id: number): Promise<Upload | undefined> {
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id));
    return upload;
  }

  async updateUpload(id: number, updates: Partial<Upload>): Promise<Upload> {
    const [upload] = await db
      .update(uploads)
      .set(updates)
      .where(eq(uploads.id, id))
      .returning();
    return upload;
  }

  async getRecentUploads(divisionId?: number, limit: number = 10): Promise<Upload[]> {
    const whereConditions = [];
    
    if (divisionId) {
      whereConditions.push(eq(uploads.divisionId, divisionId));
    }
    
    return await db
      .select()
      .from(uploads)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(uploads.createdAt))
      .limit(limit);
  }

  // Contact operations
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, updates: Partial<Contact>): Promise<Contact> {
    const [contact] = await db
      .update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  async getContacts(divisionId?: number, limit: number = 50, offset: number = 0): Promise<Contact[]> {
    const whereConditions = [eq(contacts.isActive, true)];
    
    if (divisionId) {
      whereConditions.push(eq(contacts.divisionId, divisionId));
    }
    
    return await db
      .select()
      .from(contacts)
      .where(and(...whereConditions))
      .orderBy(desc(contacts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async searchContacts(query: string, divisionId?: number): Promise<Contact[]> {
    const searchTerm = `%${query}%`;
    let baseQuery = db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.isActive, true),
          divisionId ? eq(contacts.divisionId, divisionId) : undefined,
          // Search in multiple fields
          or(
            ilike(contacts.firstName, searchTerm),
            ilike(contacts.lastName, searchTerm),
            ilike(contacts.email, searchTerm),
            ilike(contacts.phone, searchTerm),
            ilike(contacts.company, searchTerm)
          )
        )
      );
    
    return await baseQuery.orderBy(contacts.firstName).limit(100);
  }

  async getContactStats(divisionId?: number): Promise<{
    total: number;
    withEmail: number;
    withPhone: number;
    byCategory: { categoryId: number; categoryName: string; count: number }[];
  }> {
    const baseCondition = and(
      eq(contacts.isActive, true),
      divisionId ? eq(contacts.divisionId, divisionId) : undefined
    );

    // Total contacts
    const [totalResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(baseCondition);

    // Contacts with email
    const [emailResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(baseCondition, isNotNull(contacts.email), ne(contacts.email, "")));

    // Contacts with phone
    const [phoneResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(baseCondition, isNotNull(contacts.phone), ne(contacts.phone, "")));

    // By category
    const categoryStats = await db
      .select({
        categoryId: contacts.categoryId,
        categoryName: contactCategories.name,
        count: count(),
      })
      .from(contacts)
      .leftJoin(contactCategories, eq(contacts.categoryId, contactCategories.id))
      .where(baseCondition)
      .groupBy(contacts.categoryId, contactCategories.name);

    return {
      total: totalResult.count,
      withEmail: emailResult.count,
      withPhone: phoneResult.count,
      byCategory: categoryStats.map(stat => ({
        categoryId: stat.categoryId || 0,
        categoryName: stat.categoryName || "Uncategorized",
        count: stat.count,
      })),
    };
  }

  // Audit logging
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(log).returning();
    return auditLog;
  }

  async getAuditLogs(divisionId?: number, limit: number = 100): Promise<AuditLog[]> {
    const whereConditions = [];
    
    if (divisionId) {
      whereConditions.push(eq(auditLogs.divisionId, divisionId));
    }
    
    return await db
      .select()
      .from(auditLogs)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
