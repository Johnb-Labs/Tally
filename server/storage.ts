import {
  users,
  divisions,
  userDivisions,
  brandingSettings,
  contactCategories,
  customFieldDefinitions,
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
  type CustomFieldDefinition,
  type InsertCustomFieldDefinition,
  type Upload,
  type InsertUpload,
  type Contact,
  type InsertContact,
  type AuditLog,
  type InsertAuditLog,
  type CreateUserData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, like, ilike, inArray, or, isNotNull, ne, sql } from "drizzle-orm";

export interface IStorage {
  // User operations for internal authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: CreateUserData & { password: string }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // User management
  getAllUsers(): Promise<User[]>;
  assignUserToDivisions(userId: string, divisionIds: number[]): Promise<void>;
  updateUserDivisions(userId: string, divisionIds: number[]): Promise<void>;
  
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
  
  // Custom field definitions
  getCustomFieldDefinitions(divisionId?: number): Promise<CustomFieldDefinition[]>;
  getCustomFieldDefinition(id: number): Promise<CustomFieldDefinition | undefined>;
  createCustomFieldDefinition(field: InsertCustomFieldDefinition): Promise<CustomFieldDefinition>;
  updateCustomFieldDefinition(id: number, updates: Partial<CustomFieldDefinition>): Promise<CustomFieldDefinition>;
  deleteCustomFieldDefinition(id: number): Promise<void>;
  
  // Upload operations
  createUpload(upload: InsertUpload): Promise<Upload>;
  getUpload(id: number): Promise<Upload | undefined>;
  updateUpload(id: number, updates: Partial<Upload>): Promise<Upload>;
  getRecentUploads(divisionId?: number, limit?: number): Promise<Upload[]>;
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  getContact(id: number): Promise<Contact | undefined>;
  updateContact(id: number, updates: Partial<Contact>): Promise<Contact>;
  deleteContact(id: number): Promise<void>;
  bulkDeleteContacts(ids: number[]): Promise<number>;
  getContacts(divisionId?: number, limit?: number, offset?: number): Promise<Contact[]>;
  searchContacts(query: string, divisionId?: number): Promise<Contact[]>;
  getContactStats(divisionId?: number): Promise<{
    total: number;
    withEmail: number;
    withPhone: number;
    withAddress: number;
    withCompany: number;
    withCustomFields: number;
    byCategory: { categoryId: number; categoryName: string; count: number }[];
  }>;
  
  // Company-wide statistics for exco role
  getCompanyStats(): Promise<{
    totalContacts: number;
    totalDivisions: number;
    totalActiveUsers: number;
    totalUploads: number;
    divisionStats: {
      divisionId: number;
      divisionName: string;
      contactCount: number;
      activeUsers: number;
      recentUploads: number;
    }[];
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: CreateUserData & { password: string }): Promise<User> {
    const { password, ...userInfo } = userData;
    const hashedPassword = await this.hashPassword(password);
    
    const [user] = await db.insert(users).values({
      ...userInfo,
      password: hashedPassword,
    }).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return await bcrypt.hash(password, 12);
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

  async assignUserToDivisions(userId: string, divisionIds: number[]): Promise<void> {
    // Remove existing assignments
    await db.delete(userDivisions).where(eq(userDivisions.userId, userId));
    
    // Add new assignments
    if (divisionIds.length > 0) {
      const assignments = divisionIds.map(divisionId => ({
        userId,
        divisionId,
      }));
      await db.insert(userDivisions).values(assignments);
    }
  }

  async updateUserDivisions(userId: string, divisionIds: number[]): Promise<void> {
    await this.assignUserToDivisions(userId, divisionIds);
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

  async deleteUpload(id: number): Promise<void> {
    await db.delete(uploads).where(eq(uploads.id, id));
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

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.isActive, true)));
    return contact;
  }

  async deleteContact(id: number): Promise<void> {
    await db
      .update(contacts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(contacts.id, id));
  }

  async bulkDeleteContacts(ids: number[]): Promise<number> {
    const result = await db
      .update(contacts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(inArray(contacts.id, ids));
    return result.rowCount || 0;
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
    withAddress: number;
    withCompany: number;
    withCustomFields: number;
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

    // Contacts with address
    const [addressResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(baseCondition, isNotNull(contacts.address), ne(contacts.address, "")));

    // Contacts with company
    const [companyResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(baseCondition, isNotNull(contacts.company), ne(contacts.company, "")));

    // Contacts with custom fields
    const [customFieldsResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(baseCondition, isNotNull(contacts.customFields)));

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
      withAddress: addressResult.count,
      withCompany: companyResult.count,
      withCustomFields: customFieldsResult.count,
      byCategory: categoryStats.map(stat => ({
        categoryId: stat.categoryId || 0,
        categoryName: stat.categoryName || "Uncategorized",
        count: stat.count,
      })),
    };
  }

  // Custom field definitions
  async getCustomFieldDefinitions(divisionId?: number): Promise<CustomFieldDefinition[]> {
    const whereConditions = [eq(customFieldDefinitions.isActive, true)];
    
    if (divisionId) {
      whereConditions.push(
        or(
          eq(customFieldDefinitions.divisionId, divisionId),
          eq(customFieldDefinitions.isGlobal, true)
        )
      );
    }
    
    return await db
      .select()
      .from(customFieldDefinitions)
      .where(and(...whereConditions))
      .orderBy(customFieldDefinitions.displayOrder, customFieldDefinitions.name);
  }

  async getCustomFieldDefinition(id: number): Promise<CustomFieldDefinition | undefined> {
    const [field] = await db
      .select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.id, id));
    return field;
  }

  async createCustomFieldDefinition(field: InsertCustomFieldDefinition): Promise<CustomFieldDefinition> {
    const [customField] = await db
      .insert(customFieldDefinitions)
      .values(field)
      .returning();
    return customField;
  }

  async updateCustomFieldDefinition(id: number, updates: Partial<CustomFieldDefinition>): Promise<CustomFieldDefinition> {
    const [customField] = await db
      .update(customFieldDefinitions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customFieldDefinitions.id, id))
      .returning();
    return customField;
  }

  async deleteCustomFieldDefinition(id: number): Promise<void> {
    await db
      .update(customFieldDefinitions)
      .set({ isActive: false })
      .where(eq(customFieldDefinitions.id, id));
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

  // Company-wide statistics for exco role
  async getCompanyStats(): Promise<{
    totalContacts: number;
    totalDivisions: number;
    totalActiveUsers: number;
    totalUploads: number;
    totalEmails: number;
    totalPhones: number;
    totalAddresses: number;
    divisionStats: {
      divisionId: number;
      divisionName: string;
      description?: string;
      contactCount: number;
      activeUsers: number;
      recentUploads: number;
      emailCount: number;
      phoneCount: number;
      addressCount: number;
    }[];
  }> {
    // Get total counts
    const [contactsResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.isActive, true));

    const [divisionsResult] = await db
      .select({ count: count() })
      .from(divisions)
      .where(eq(divisions.isActive, true));

    const [usersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    const [uploadsResult] = await db
      .select({ count: count() })
      .from(uploads);

    // Get total emails and phones
    const [emailsResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(
        eq(contacts.isActive, true),
        isNotNull(contacts.email),
        ne(contacts.email, "")
      ));

    const [phonesResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(
        eq(contacts.isActive, true),
        isNotNull(contacts.phone),
        ne(contacts.phone, "")
      ));

    // Get total addresses
    const [addressesResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(
        eq(contacts.isActive, true),
        isNotNull(contacts.address),
        ne(contacts.address, "")
      ));

    // Get division stats with email and phone counts
    const divisionStats = await db
      .select({
        divisionId: divisions.id,
        divisionName: divisions.name,
        description: divisions.description,
        contactCount: count(contacts.id),
      })
      .from(divisions)
      .leftJoin(contacts, and(
        eq(contacts.divisionId, divisions.id),
        eq(contacts.isActive, true)
      ))
      .where(eq(divisions.isActive, true))
      .groupBy(divisions.id, divisions.name, divisions.description);

    // Get active users per division
    const userStats = await db
      .select({
        divisionId: userDivisions.divisionId,
        activeUsers: count(users.id),
      })
      .from(userDivisions)
      .leftJoin(users, and(
        eq(users.id, userDivisions.userId),
        eq(users.isActive, true)
      ))
      .groupBy(userDivisions.divisionId);

    // Get recent uploads per division
    const uploadStats = await db
      .select({
        divisionId: uploads.divisionId,
        recentUploads: count(uploads.id),
      })
      .from(uploads)
      .where(and(
        eq(uploads.status, 'completed'),
        // Last 30 days
        sql`${uploads.createdAt} > NOW() - INTERVAL '30 days'`
      ))
      .groupBy(uploads.divisionId);

    // Get email counts per division
    const emailStats = await db
      .select({
        divisionId: contacts.divisionId,
        emailCount: count(contacts.id),
      })
      .from(contacts)
      .where(and(
        eq(contacts.isActive, true),
        isNotNull(contacts.email),
        ne(contacts.email, "")
      ))
      .groupBy(contacts.divisionId);

    // Get phone counts per division
    const phoneStats = await db
      .select({
        divisionId: contacts.divisionId,
        phoneCount: count(contacts.id),
      })
      .from(contacts)
      .where(and(
        eq(contacts.isActive, true),
        isNotNull(contacts.phone),
        ne(contacts.phone, "")
      ))
      .groupBy(contacts.divisionId);

    // Get address counts per division
    const addressStats = await db
      .select({
        divisionId: contacts.divisionId,
        addressCount: count(contacts.id),
      })
      .from(contacts)
      .where(and(
        eq(contacts.isActive, true),
        isNotNull(contacts.address),
        ne(contacts.address, "")
      ))
      .groupBy(contacts.divisionId);

    // Combine stats
    const combinedStats = divisionStats.map(division => {
      const userStat = userStats.find(u => u.divisionId === division.divisionId);
      const uploadStat = uploadStats.find(u => u.divisionId === division.divisionId);
      const emailStat = emailStats.find(e => e.divisionId === division.divisionId);
      const phoneStat = phoneStats.find(p => p.divisionId === division.divisionId);
      const addressStat = addressStats.find(a => a.divisionId === division.divisionId);
      
      return {
        divisionId: division.divisionId,
        divisionName: division.divisionName,
        description: division.description,
        contactCount: division.contactCount,
        activeUsers: userStat?.activeUsers || 0,
        recentUploads: uploadStat?.recentUploads || 0,
        emailCount: emailStat?.emailCount || 0,
        phoneCount: phoneStat?.phoneCount || 0,
        addressCount: addressStat?.addressCount || 0,
      };
    });

    return {
      totalContacts: contactsResult.count,
      totalDivisions: divisionsResult.count,
      totalActiveUsers: usersResult.count,
      totalUploads: uploadsResult.count,
      totalEmails: emailsResult.count,
      totalPhones: phonesResult.count,
      totalAddresses: addressesResult.count,
      divisionStats: combinedStats,
    };
  }
}

export const storage = new DatabaseStorage();
