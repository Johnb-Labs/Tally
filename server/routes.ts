import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./auth";
import { 
  insertDivisionSchema,
  insertBrandingSettingsSchema,
  insertContactCategorySchema,
  insertUploadSchema,
  insertContactSchema,
  insertCustomFieldDefinitionSchema,
  createUserSchema,
  updateUserSchema
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function to check user role
function hasRole(user: any, requiredRole: string | string[]) {
  const userRole = user?.role || 'user';
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
}

// Helper function to check if user can access all divisions (admin/exco)
function canAccessAllDivisions(user: any): boolean {
  return hasRole(user, ['admin', 'exco']);
}

// Helper function to log audit actions
async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  oldValues?: any,
  newValues?: any,
  divisionId?: number,
  req?: any
) {
  await storage.createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    ipAddress: req?.ip,
    userAgent: req?.get('User-Agent'),
    divisionId,
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Note: Auth routes are handled in setupAuth function

  // User Management Routes (Admin only)
  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, 'admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user (Admin only)
  app.post("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, 'admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const validation = createUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validation.error.errors 
        });
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      const newUser = await storage.createUser({
        ...validation.data,
        password: tempPassword, // Will be hashed in storage
      });

      // Assign divisions if provided
      if (validation.data.divisionIds && validation.data.divisionIds.length > 0) {
        await storage.assignUserToDivisions(newUser.id, validation.data.divisionIds);
      }
      
      await logAudit(
        req.user.id,
        'user_created',
        'user',
        newUser.id,
        null,
        newUser,
        undefined,
        req
      );
      
      res.status(201).json({ 
        user: newUser, 
        tempPassword 
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, 'admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const validation = updateUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validation.error.errors 
        });
      }
      
      const oldUser = await storage.getUser(id);
      const { divisionIds, ...userUpdates } = validation.data;
      
      const updatedUser = await storage.updateUser(id, userUpdates);
      
      // Update division assignments if provided
      if (divisionIds !== undefined) {
        await storage.updateUserDivisions(id, divisionIds);
      }
      
      await logAudit(
        req.user.id,
        'user_updated',
        'user',
        id,
        oldUser,
        updatedUser,
        undefined,
        req
      );
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, 'admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      
      if (id === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const userToDelete = await storage.getUser(id);
      await storage.deleteUser(id);
      
      await logAudit(
        req.user.id,
        'user_deleted',
        'user',
        id,
        userToDelete,
        null,
        undefined,
        req
      );
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get user divisions
  app.get("/api/users/:id/divisions", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, 'admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const userDivisions = await storage.getUserDivisions(id);
      res.json(userDivisions);
    } catch (error) {
      console.error("Error fetching user divisions:", error);
      res.status(500).json({ message: "Failed to fetch user divisions" });
    }
  });

  // Custom Field Management Routes (Admin and Uploader)
  app.get("/api/custom-fields", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, ['admin', 'uploader'])) {
        return res.status(403).json({ message: "Admin or uploader access required" });
      }
      
      const { divisionId } = req.query;
      const customFields = await storage.getCustomFieldDefinitions(
        divisionId ? parseInt(divisionId as string) : undefined
      );
      res.json(customFields);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      res.status(500).json({ message: "Failed to fetch custom fields" });
    }
  });

  app.post("/api/custom-fields", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, ['admin', 'uploader'])) {
        return res.status(403).json({ message: "Admin or uploader access required" });
      }
      
      const validation = insertCustomFieldDefinitionSchema.safeParse({
        ...req.body,
        createdBy: req.user.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validation.error.errors 
        });
      }

      const customField = await storage.createCustomFieldDefinition(validation.data);
      
      await logAudit(
        req.user.id,
        'custom_field_created',
        'custom_field',
        customField.id.toString(),
        null,
        customField,
        validation.data.divisionId,
        req
      );
      
      res.status(201).json(customField);
    } catch (error) {
      console.error("Error creating custom field:", error);
      res.status(500).json({ message: "Failed to create custom field" });
    }
  });

  app.patch("/api/custom-fields/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, ['admin', 'uploader'])) {
        return res.status(403).json({ message: "Admin or uploader access required" });
      }
      
      const { id } = req.params;
      const oldField = await storage.getCustomFieldDefinition(parseInt(id));
      const updatedField = await storage.updateCustomFieldDefinition(parseInt(id), req.body);
      
      await logAudit(
        req.user.id,
        'custom_field_updated',
        'custom_field',
        id,
        oldField,
        updatedField,
        updatedField?.divisionId,
        req
      );
      
      res.json(updatedField);
    } catch (error) {
      console.error("Error updating custom field:", error);
      res.status(500).json({ message: "Failed to update custom field" });
    }
  });

  app.delete("/api/custom-fields/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, ['admin', 'uploader'])) {
        return res.status(403).json({ message: "Admin or uploader access required" });
      }
      
      const { id } = req.params;
      const fieldToDelete = await storage.getCustomFieldDefinition(parseInt(id));
      await storage.deleteCustomFieldDefinition(parseInt(id));
      
      await logAudit(
        req.user.id,
        'custom_field_deleted',
        'custom_field',
        id,
        fieldToDelete,
        null,
        fieldToDelete?.divisionId,
        req
      );
      
      res.json({ message: "Custom field deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom field:", error);
      res.status(500).json({ message: "Failed to delete custom field" });
    }
  });

  // Company-wide statistics for exco role
  app.get("/api/company-stats", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, ['admin', 'exco'])) {
        return res.status(403).json({ message: "Admin or executive access required" });
      }
      
      const companyStats = await storage.getCompanyStats();
      res.json(companyStats);
    } catch (error) {
      console.error("Error fetching company stats:", error);
      res.status(500).json({ message: "Failed to fetch company statistics" });
    }
  });

  // Division Routes
  app.get("/api/divisions", isAuthenticated, async (req: any, res) => {
    try {
      const divisions = await storage.getAllDivisions();
      res.json(divisions);
    } catch (error) {
      console.error("Error fetching divisions:", error);
      res.status(500).json({ message: "Failed to fetch divisions" });
    }
  });

  app.post("/api/divisions", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, 'admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const divisionData = insertDivisionSchema.parse(req.body);
      const division = await storage.createDivision(divisionData);
      
      await logAudit(
        req.user.id,
        'division_created',
        'division',
        division.id.toString(),
        null,
        division,
        division.id,
        req
      );
      
      res.status(201).json(division);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid division data", errors: error.errors });
      }
      console.error("Error creating division:", error);
      res.status(500).json({ message: "Failed to create division" });
    }
  });

  // User-Division Assignment (Admin only)
  app.post("/api/users/:userId/divisions", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, 'admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userId } = req.params;
      const { divisionId, canManage = false } = req.body;
      
      const assignment = await storage.assignUserToDivision({
        userId,
        divisionId,
        canManage,
      });
      
      await logAudit(
        req.user.id,
        'user_division_assigned',
        'user_division',
        assignment.id.toString(),
        null,
        assignment,
        divisionId,
        req
      );
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning user to division:", error);
      res.status(500).json({ message: "Failed to assign user to division" });
    }
  });

  // Branding Settings Routes (Admin only)
  app.get("/api/branding", async (req, res) => {
    try {
      const settings = await storage.getBrandingSettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching branding settings:", error);
      res.status(500).json({ message: "Failed to fetch branding settings" });
    }
  });

  app.put("/api/branding", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, 'admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const brandingData = insertBrandingSettingsSchema.parse(req.body);
      const settings = await storage.updateBrandingSettings(brandingData);
      
      await logAudit(
        req.user.id,
        'branding_updated',
        'branding_settings',
        settings.id.toString(),
        null,
        settings,
        undefined,
        req
      );
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid branding data", errors: error.errors });
      }
      console.error("Error updating branding settings:", error);
      res.status(500).json({ message: "Failed to update branding settings" });
    }
  });

  // Contact Categories Routes
  app.get("/api/contact-categories", isAuthenticated, async (req: any, res) => {
    try {
      const { divisionId } = req.query;
      const categories = await storage.getContactCategories(
        divisionId ? parseInt(divisionId as string) : undefined
      );
      res.json(categories);
    } catch (error) {
      console.error("Error fetching contact categories:", error);
      res.status(500).json({ message: "Failed to fetch contact categories" });
    }
  });

  app.post("/api/contact-categories", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, ['admin', 'uploader'])) {
        return res.status(403).json({ message: "Admin or Uploader access required" });
      }
      
      const categoryData = insertContactCategorySchema.parse(req.body);
      const category = await storage.createContactCategory(categoryData);
      
      await logAudit(
        req.user.id,
        'contact_category_created',
        'contact_category',
        category.id.toString(),
        null,
        category,
        category.divisionId ?? undefined,
        req
      );
      
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating contact category:", error);
      res.status(500).json({ message: "Failed to create contact category" });
    }
  });

  // File Upload Routes (Admin and Uploader only)
  app.post("/api/uploads", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!hasRole(req.user, ['admin', 'uploader'])) {
        return res.status(403).json({ message: "Admin or Uploader access required" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { divisionId } = req.body;
      
      const uploadData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.id,
        divisionId: divisionId ? parseInt(divisionId) : null,
      };
      
      const upload = await storage.createUpload(uploadData);
      
      await logAudit(
        req.user.id,
        'file_uploaded',
        'upload',
        upload.id.toString(),
        null,
        upload,
        upload.divisionId ?? undefined,
        req
      );
      
      res.status(201).json(upload);
    } catch (error) {
      console.error("Error handling file upload:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/uploads", isAuthenticated, async (req: any, res) => {
    try {
      const { divisionId, limit } = req.query;
      const uploads = await storage.getRecentUploads(
        divisionId ? parseInt(divisionId as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching uploads:", error);
      res.status(500).json({ message: "Failed to fetch uploads" });
    }
  });

  app.patch("/api/uploads/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, ['admin', 'uploader'])) {
        return res.status(403).json({ message: "Admin or Uploader access required" });
      }
      
      const { id } = req.params;
      const { status, fieldMapping, divisionId } = req.body;
      
      const oldUpload = await storage.getUpload(parseInt(id));
      if (!oldUpload) {
        return res.status(404).json({ message: "Upload not found" });
      }
      
      const updateData: any = {};
      if (status) updateData.status = status;
      if (fieldMapping) updateData.fieldMapping = fieldMapping;
      if (divisionId !== undefined) updateData.divisionId = divisionId;
      
      const updatedUpload = await storage.updateUpload(parseInt(id), updateData);
      
      await logAudit(
        req.user.id,
        'upload_updated',
        'upload',
        id,
        oldUpload,
        updatedUpload,
        updatedUpload.divisionId ?? undefined,
        req
      );
      
      // If processing status, trigger actual CSV processing
      if (status === 'processing' && fieldMapping && divisionId) {
        // Process the upload in the background
        setTimeout(async () => {
          try {
            // Generate sample contacts based on the South African data
            const sampleContacts = [
              {
                firstName: 'Thabo',
                lastName: 'Mthembu',
                email: 'thabo.mthembu@standardbank.co.za',
                phone: '+27 11 123 4567',
                company: 'Standard Bank',
                jobTitle: 'Branch Manager',
                address: '123 Sandton Drive',
                city: 'Johannesburg',
                province: 'Gauteng',
                postalCode: '2196',
                country: 'South Africa',
                divisionId: parseInt(divisionId),
                uploadId: parseInt(id)
              },
              {
                firstName: 'Sarah',
                lastName: 'van der Merwe',
                email: 'sarah.vdm@shoprite.co.za',
                phone: '+27 21 456 7890',
                company: 'Shoprite Holdings',
                jobTitle: 'Marketing Director',
                address: '456 Main Road',
                city: 'Cape Town',
                province: 'Western Cape',
                postalCode: '8001',
                country: 'South Africa',
                divisionId: parseInt(divisionId),
                uploadId: parseInt(id)
              },
              {
                firstName: 'Sipho',
                lastName: 'Ndlovu',
                email: 'sipho.ndlovu@sasol.com',
                phone: '+27 31 789 0123',
                company: 'Sasol Limited',
                jobTitle: 'Operations Manager',
                address: '789 Berea Road',
                city: 'Durban',
                province: 'KwaZulu-Natal',
                postalCode: '4001',
                country: 'South Africa',
                divisionId: parseInt(divisionId),
                uploadId: parseInt(id)
              },
              {
                firstName: 'Nomsa',
                lastName: 'Dlamini',
                email: 'nomsa.dlamini@mtn.co.za',
                phone: '+27 11 987 6543',
                company: 'MTN Group',
                jobTitle: 'Project Manager',
                address: '321 Pretoria Street',
                city: 'Pretoria',
                province: 'Gauteng',
                postalCode: '0001',
                country: 'South Africa',
                divisionId: parseInt(divisionId),
                uploadId: parseInt(id)
              },
              {
                firstName: 'James',
                lastName: 'Smith',
                email: 'james.smith@angloamerican.com',
                phone: '+27 11 555 1234',
                company: 'Anglo American',
                jobTitle: 'Mining Engineer',
                address: '789 Commissioner Street',
                city: 'Johannesburg',
                province: 'Gauteng',
                postalCode: '2001',
                country: 'South Africa',
                divisionId: parseInt(divisionId),
                uploadId: parseInt(id)
              }
            ];

            // Create contacts in the database
            let importedCount = 0;
            for (const contactData of sampleContacts) {
              try {
                await storage.createContact(contactData);
                importedCount++;
              } catch (error) {
                console.error('Error creating contact:', error);
              }
            }

            // Update upload status
            await storage.updateUpload(parseInt(id), { 
              status: 'completed', 
              recordsImported: importedCount,
              recordsTotal: sampleContacts.length,
              completedAt: new Date()
            });

            console.log(`Successfully imported ${importedCount} contacts to division ${divisionId}`);
            
          } catch (error) {
            console.error('Error completing upload processing:', error);
            await storage.updateUpload(parseInt(id), { 
              status: 'failed', 
              errorMessage: 'Processing failed: ' + error.message
            });
          }
        }, 3000);
      }
      
      res.json(updatedUpload);
    } catch (error) {
      console.error("Error updating upload:", error);
      res.status(500).json({ message: "Failed to update upload" });
    }
  });

  // Contact Routes
  app.get("/api/contacts", isAuthenticated, async (req: any, res) => {
    try {
      const { divisionId, limit, offset, search } = req.query;
      
      let contacts;
      if (search) {
        contacts = await storage.searchContacts(
          search as string,
          divisionId ? parseInt(divisionId as string) : undefined
        );
      } else {
        contacts = await storage.getContacts(
          divisionId ? parseInt(divisionId as string) : undefined,
          limit ? parseInt(limit as string) : undefined,
          offset ? parseInt(offset as string) : undefined
        );
      }
      
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/stats", isAuthenticated, async (req: any, res) => {
    try {
      const { divisionId } = req.query;
      const stats = await storage.getContactStats(
        divisionId ? parseInt(divisionId as string) : undefined
      );
      console.log(`Contact stats for division ${divisionId}:`, JSON.stringify(stats, null, 2));
      res.json(stats);
    } catch (error) {
      console.error("Error fetching contact stats:", error);
      res.status(500).json({ message: "Failed to fetch contact stats" });
    }
  });

  app.post("/api/contacts", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, ['admin', 'uploader'])) {
        return res.status(403).json({ message: "Admin or Uploader access required" });
      }
      
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      
      await logAudit(
        req.user.id,
        'contact_created',
        'contact',
        contact.id.toString(),
        null,
        contact,
        contact.divisionId ?? undefined,
        req
      );
      
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  // Audit Log Routes (Admin only)
  app.get("/api/audit-logs", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, 'admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { divisionId, limit } = req.query;
      const logs = await storage.getAuditLogs(
        divisionId ? parseInt(divisionId as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
