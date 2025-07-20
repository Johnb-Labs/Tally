import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertDivisionSchema,
  insertBrandingSettingsSchema,
  insertContactCategorySchema,
  insertUploadSchema,
  insertContactSchema
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
  const userRole = user?.claims?.role || 'user';
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user divisions
      const userDivisions = await storage.getUserDivisions(userId);
      
      res.json({
        ...user,
        divisions: userDivisions.map(ud => ({
          ...ud.division,
          canManage: ud.canManage,
        })),
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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

  app.patch("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      if (!hasRole(req.user, 'admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const updates = req.body;
      
      const oldUser = await storage.getUser(id);
      const updatedUser = await storage.updateUser(id, updates);
      
      await logAudit(
        req.user.claims.sub,
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
        req.user.claims.sub,
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
        req.user.claims.sub,
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
        req.user.claims.sub,
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
        req.user.claims.sub,
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
        uploadedBy: req.user.claims.sub,
        divisionId: divisionId ? parseInt(divisionId) : null,
      };
      
      const upload = await storage.createUpload(uploadData);
      
      await logAudit(
        req.user.claims.sub,
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
        req.user.claims.sub,
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
