# Tally by JBLabs - User Guide

## Getting Started

### Initial Setup
1. **Access the Application**
   - Navigate to your Tally application URL
   - You'll see the landing page with video background

2. **Admin Setup Required**
   - Registration is disabled for security
   - System administrators must create user accounts
   - Contact your admin to get your account credentials

3. **First Login**
   - Click "Sign In" on the landing page
   - Enter your provided email and password
   - Click "Login" to access the dashboard

---

## Admin Account Instructions

Admins have full access to all features and can manage the entire system.

### 1. User Management
**Purpose**: Create and manage user accounts, assign roles and divisions

**Steps**:
1. Click "User Management" in the sidebar under Administration
2. **To create a new user**:
   - Click "Add User" button
   - Fill in user details (email, password, first name, last name)
   - Select role: Admin, Uploader, or User
   - Click "Create User"
3. **To edit user roles**:
   - Find the user in the list
   - Click the role dropdown next to their name
   - Select new role (Admin/Uploader/User)
   - Changes save automatically
4. **To assign users to divisions**:
   - Click "Manage Divisions" next to a user
   - Select divisions they should have access to
   - Check "Can Manage" if they should manage that division
   - Click "Save"

### 2. Division Management
**Purpose**: Create and manage organizational divisions with custom branding

**Steps**:
1. Click "Divisions" in the sidebar under Administration
2. **To create a division**:
   - Click "Create Division"
   - Enter division name and description
   - Upload logo (optional)
   - Choose primary and secondary colors
   - Click "Create"
3. **To edit a division**:
   - Click "Edit" next to any division
   - Update details as needed
   - Click "Save Changes"

### 3. Branding Customization
**Purpose**: Set organization-wide branding and themes

**Steps**:
1. Click "Branding" in the sidebar under Administration
2. **Organization Settings**:
   - Enter your organization name
   - Upload your logo
   - Choose primary and secondary colors
3. **Theme Settings**:
   - Select light/dark mode preference
   - Customize button styles
   - Preview changes in real-time
4. Click "Save Branding" to apply changes

### 4. Contact Management & Deletion
**Purpose**: View, search, and manage imported contacts

**Steps**:
1. Click "Contacts" in the sidebar under Data Management
2. **View Contacts**:
   - Browse all contacts in your accessible divisions
   - Each contact shows name, email, phone, company, and division
   - Contacts display their assigned division with color coding
3. **Search & Filter**:
   - Use the search bar to find specific contacts
   - Search works across names, emails, phones, and companies
   - Results update in real-time as you type
4. **Delete Contacts** (Admin/Uploader only):
   - **Individual Deletion**: Click trash icon next to any contact
   - **Bulk Operations**: 
     - Click "Select" button to enter bulk mode
     - Use master checkbox to select/deselect all
     - Check individual contacts for selective deletion
     - Click "Delete X Contacts" for bulk deletion
     - Confirm in dialog prompt (shows count for verification)
   - **Security**: Only admin and uploader roles can delete contacts
   - **Data Safety**: Deletion is soft delete (preserves data integrity)

### 5. Audit Log Monitoring
**Purpose**: Track all system activities and changes

**Steps**:
1. Click "Audit Log" in the sidebar under Administration
2. **Review Activities**:
   - See all user actions with timestamps
   - Filter by date range or user
   - Monitor file uploads and data changes
3. **Export Logs**:
   - Click "Export" to download audit reports
   - Choose date range for export

---

## Uploader Account Instructions

Uploaders can import data and manage contacts but cannot access administrative functions.

### 1. Accessing Your Dashboard
**Steps**:
1. Login to see your dashboard
2. View contact statistics and recent uploads
3. Switch between divisions (if assigned to multiple)

### 2. Importing Contact Data
**Purpose**: Upload Excel or CSV files with contact information

**Steps**:
1. Click "Upload" in the sidebar under Data Management
2. **Prepare Your File**:
   - Ensure your Excel/CSV has clear column headers
   - Common columns: First Name, Last Name, Email, Phone, Company, Position
   - Use South African address format: Address, City, Province, Postal Code
   - Remove any duplicate or test data
3. **Upload Process**:
   - Select target division from dropdown (required)
   - Drag and drop your file or click "Choose Files"
   - File uploads automatically and redirects to field mapping
   - Status shows processing animation until complete

### 3. Field Mapping (Automatic Navigation)
**Purpose**: Tell the system which columns contain which data

**Steps**:
1. After upload, you're automatically redirected to field mapping
2. **Auto-Mapping Active**:
   - System intelligently suggests field mappings
   - Common patterns are automatically detected
   - Review suggested mappings for accuracy
3. **Map Columns**:
   - Left side shows your Excel/CSV columns
   - Right side shows database fields
   - Match each column to the correct field:
     - "First Name" column → "First Name" field
     - "Email Address" column → "Email" field
     - "Company Name" column → "Company" field
     - "Province" column → "Province" field (South African format)
     - "Postal Code" column → "Postal Code" field
   - Leave unmapped if column isn't needed
4. **Process Data**:
   - Division is pre-selected from upload step
   - Review your mappings
   - Click "Process" to import contacts
   - Status changes to "Processing" then "Completed"

### 4. Managing Contacts
**Purpose**: View and search through imported contacts

**Steps**:
1. Click "Contacts" in the sidebar
2. **Search Contacts**:
   - Use the search box to find specific contacts
   - Search works across names, emails, and companies
3. **View Details**:
   - Click on any contact to see full details
   - See which upload/file they came from
   - Note any categories assigned

### 5. Generating Reports
**Purpose**: Create reports on your contact data

**Steps**:
1. Click "Reports" in the sidebar
2. **View Analytics**:
   - See contact growth charts
   - Review distribution by categories
   - Check upload statistics
3. **Export Data**:
   - Click "Export Report"
   - Choose format: PDF, Excel, or CSV
   - Reports include current division's data only

---

## User Account Instructions

Users have read-only access to contacts and basic reporting features.

### 1. Viewing Your Dashboard
**Steps**:
1. Login to access your dashboard
2. **Dashboard Overview**:
   - See total contacts in your accessible divisions
   - View recent activity summary
   - Check contact distribution charts

### 2. Browsing Contacts
**Purpose**: Search and view contact information

**Steps**:
1. Click "Contacts" in the sidebar
2. **Search Contacts**:
   - Type in the search box to find contacts
   - Search by name, email, or company
   - Results update as you type
3. **View Contact Details**:
   - Click on any contact name
   - See all available information
   - Note which category they belong to

### 3. Using Reports
**Purpose**: View analytics and trends

**Steps**:
1. Click "Reports" in the sidebar
2. **Available Reports**:
   - Contact growth over time
   - Distribution by categories
   - Division-specific statistics
3. **Filtering Data**:
   - Use date range selector
   - Filter by contact categories
   - Switch between different report types

### 4. Division Access
**Purpose**: Switch between accessible divisions (if assigned to multiple)

**Steps**:
1. **Division Selector**:
   - Located in the top header of each page
   - Shows current division name
   - Click dropdown to switch divisions
2. **What Changes**:
   - All data (contacts, reports, statistics) updates
   - Only shows data for selected division
   - Branding may change based on division settings

---

## General Features (All Users)

### Theme Toggle
- **Light/Dark Mode**: Click the sun/moon icon in the top-right corner
- **Automatic Saving**: Your preference is remembered for future visits

### Navigation
- **Sidebar Menu**: Access all available features based on your role
- **Breadcrumbs**: See your current location in the application
- **Quick Actions**: Use keyboard shortcuts where available

### Profile Management
- **View Profile**: Your name and role appear in the sidebar
- **Logout**: Click your profile area and select logout

### Getting Help
- **Contact Support**: Reach out to your administrator for additional help
- **System Status**: Check the audit log (admins) for any system issues

---

## Troubleshooting

### File Upload Issues
- **File Too Large**: Maximum file size is 10MB
- **Unsupported Format**: Only .xlsx, .xls, and .csv files accepted
- **Processing Stuck**: Contact your administrator

### Login Problems
- **Forgot Password**: Contact your administrator to reset
- **Account Locked**: Contact your administrator
- **Access Denied**: Your role may not have permission for that feature

### Data Questions
- **Missing Contacts**: Check if correct division is selected
- **Wrong Data**: Contact uploader who imported the file
- **Export Issues**: Try different export format or contact administrator

### Browser Issues
- **Clear Cache**: Refresh the page or clear browser cache
- **JavaScript Required**: Ensure JavaScript is enabled
- **Modern Browser**: Use Chrome, Firefox, Safari, or Edge