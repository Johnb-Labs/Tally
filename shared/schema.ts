import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
  pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["admin", "uploader", "user"]);

// Users table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Divisions table
export const divisions = pgTable("divisions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }), // hex color
  secondaryColor: varchar("secondary_color", { length: 7 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User division permissions
export const userDivisions = pgTable("user_divisions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  divisionId: integer("division_id").notNull().references(() => divisions.id),
  canManage: boolean("can_manage").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Global branding settings
export const brandingSettings = pgTable("branding_settings", {
  id: serial("id").primaryKey(),
  organizationName: varchar("organization_name", { length: 255 }),
  logoUrl: varchar("logo_url"),
  faviconUrl: varchar("favicon_url"),
  primaryColor: varchar("primary_color", { length: 7 }),
  secondaryColor: varchar("secondary_color", { length: 7 }),
  accentColor: varchar("accent_color", { length: 7 }),
  fontFamily: varchar("font_family"),
  customCss: text("custom_css"),
  showPoweredBy: boolean("show_powered_by").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contact categories
export const contactCategories = pgTable("contact_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // hex color
  divisionId: integer("division_id").references(() => divisions.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Upload status enum
export const uploadStatusEnum = pgEnum("upload_status", ["pending", "processing", "completed", "failed"]);

// File uploads
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  status: uploadStatusEnum("status").default("pending"),
  recordsTotal: integer("records_total"),
  recordsImported: integer("records_imported"),
  recordsSkipped: integer("records_skipped"),
  errorMessage: text("error_message"),
  fieldMapping: jsonb("field_mapping"), // maps CSV fields to contact fields
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  divisionId: integer("division_id").references(() => divisions.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("job_title", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  notes: text("notes"),
  customFields: jsonb("custom_fields"), // flexible additional fields
  categoryId: integer("category_id").references(() => contactCategories.id),
  divisionId: integer("division_id").references(() => divisions.id),
  uploadId: integer("upload_id").references(() => uploads.id),
  isActive: boolean("is_active").default(true),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit log for tracking user actions
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(), // e.g., "contact_created", "user_updated"
  entityType: varchar("entity_type", { length: 100 }), // e.g., "contact", "user", "division"
  entityId: varchar("entity_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  divisionId: integer("division_id").references(() => divisions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userDivisions: many(userDivisions),
  uploads: many(uploads),
  auditLogs: many(auditLogs),
}));

export const divisionsRelations = relations(divisions, ({ many }) => ({
  userDivisions: many(userDivisions),
  contactCategories: many(contactCategories),
  uploads: many(uploads),
  contacts: many(contacts),
  auditLogs: many(auditLogs),
}));

export const userDivisionsRelations = relations(userDivisions, ({ one }) => ({
  user: one(users, {
    fields: [userDivisions.userId],
    references: [users.id],
  }),
  division: one(divisions, {
    fields: [userDivisions.divisionId],
    references: [divisions.id],
  }),
}));

export const contactCategoriesRelations = relations(contactCategories, ({ one, many }) => ({
  division: one(divisions, {
    fields: [contactCategories.divisionId],
    references: [divisions.id],
  }),
  contacts: many(contacts),
}));

export const uploadsRelations = relations(uploads, ({ one, many }) => ({
  uploadedByUser: one(users, {
    fields: [uploads.uploadedBy],
    references: [users.id],
  }),
  division: one(divisions, {
    fields: [uploads.divisionId],
    references: [divisions.id],
  }),
  contacts: many(contacts),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  category: one(contactCategories, {
    fields: [contacts.categoryId],
    references: [contactCategories.id],
  }),
  division: one(divisions, {
    fields: [contacts.divisionId],
    references: [divisions.id],
  }),
  upload: one(uploads, {
    fields: [contacts.uploadId],
    references: [uploads.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  division: one(divisions, {
    fields: [auditLogs.divisionId],
    references: [divisions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertDivisionSchema = createInsertSchema(divisions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserDivisionSchema = createInsertSchema(userDivisions).omit({
  id: true,
  createdAt: true,
});

export const insertBrandingSettingsSchema = createInsertSchema(brandingSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertContactCategorySchema = createInsertSchema(contactCategories).omit({
  id: true,
  createdAt: true,
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Division = typeof divisions.$inferSelect;
export type InsertDivision = z.infer<typeof insertDivisionSchema>;
export type UserDivision = typeof userDivisions.$inferSelect;
export type InsertUserDivision = z.infer<typeof insertUserDivisionSchema>;
export type BrandingSettings = typeof brandingSettings.$inferSelect;
export type InsertBrandingSettings = z.infer<typeof insertBrandingSettingsSchema>;
export type ContactCategory = typeof contactCategories.$inferSelect;
export type InsertContactCategory = z.infer<typeof insertContactCategorySchema>;
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
