# CSV Import Guide for Tally Contact Management

## Overview
This guide explains how to format CSV files for importing contacts into the Tally system. Our system features intelligent auto-mapping, division-based organization, and supports South African business formats. You can import contacts using Excel (.xlsx), Excel 97-2003 (.xls), or CSV (.csv) files.

## Available Fields

### Required Fields
- **First Name** - Contact's first name
- **Last Name** - Contact's last name

### Standard Contact Fields
- **Email** - Email address (will be validated)
- **Phone** - Phone number (any format accepted)
- **Company** - Company or organization name
- **Job Title** - Position or role
- **Address** - Full street address
- **City** - City name
- **Province** - Province or state
- **Postal Code** - Postal/ZIP code
- **Country** - Country name
- **Notes** - Additional information or comments

### Extended Fields (Optional)
You can also include these additional fields for more comprehensive contact information:
- **LinkedIn** - LinkedIn profile URL
- **Website** - Company or personal website
- **Department** - Department within company
- **Industry** - Industry classification
- **Annual Revenue** - Company annual revenue
- **Employee Count** - Number of employees
- **Preferred Contact Method** - Email, Phone, etc.
- **Birthday** - Date of birth (YYYY-MM-DD format)
- **Last Contacted** - Last contact date (YYYY-MM-DD format)
- **Spouse Name** - Spouse or partner name

## File Format Requirements

### CSV Format
- Use commas (,) as field separators
- Enclose fields containing commas in double quotes
- First row must contain column headers
- Save with UTF-8 encoding for special characters

### Excel Format
- Use .xlsx or .xls files
- First row must contain column headers
- Each contact should be on a separate row

## Column Header Examples

### Basic Headers (Copy these exactly)
```
First Name,Last Name,Email,Phone,Company,Job Title,Address,City,Province,Postal Code,Country,Notes
```

### Extended Headers
```
First Name,Last Name,Email,Phone,Company,Job Title,Address,City,Province,Postal Code,Country,Notes,LinkedIn,Website,Department,Industry,Annual Revenue,Employee Count,Preferred Contact Method,Birthday,Last Contacted,Spouse Name
```

## Data Format Guidelines

### Phone Numbers
Accepted formats:
- +27 11 123 4567 (recommended South African format)
- +27-11-123-4567
- 011 123 4567
- 0711234567
- +27711234567

### Email Addresses
- Must be valid email format
- Example: user@domain.com

### Dates
- Use YYYY-MM-DD format
- Examples: 2024-01-15, 1985-03-20

### Addresses
- Full street addresses work best
- Use quotes if address contains commas: "123 Main St, Suite 100"

### Text Fields with Commas
Always use double quotes around text containing commas:
- "ABC Corporation, Inc."
- "Notes about client, including special requirements"

## Sample Files Provided

1. **simple-contacts-template.csv** - Basic template with essential fields
2. **example-contacts-import.csv** - Sample data with standard fields
3. **comprehensive-contacts-example.csv** - Full example with all available fields

## Import Process

1. **Prepare Your File**
   - Ensure first row contains headers
   - Verify data formats match guidelines
   - Save as CSV, XLSX, or XLS

2. **Upload File**
   - Go to Upload page in Tally (under Data Management)
   - **Select target division** from dropdown (required)
   - Select your file and upload
   - Automatic redirect to field mapping

3. **Map Fields (Intelligent Auto-Mapping)**
   - System automatically detects and suggests common field mappings
   - Review suggested mappings for accuracy
   - Adjust field mappings using dropdown selectors
   - Division is pre-selected from upload step
   - Map custom fields to appropriate columns

4. **Import Data**
   - Review the mappings
   - Click "Process" to import contacts
   - Monitor import progress with animated indicators

## Tips for Success

### Data Quality
- Remove duplicate entries before import
- Standardize company names
- Clean up phone number formats
- Verify email addresses

### Performance
- For large files (>1000 contacts), consider splitting into smaller batches
- Ensure stable internet connection during upload
- Allow time for processing large imports

### Troubleshooting
- Check for special characters that might cause issues
- Ensure file is not password protected
- Verify file size is under 10MB limit
- Contact support if you encounter persistent errors

## Custom Fields

If your organization uses custom fields:
1. Create custom field definitions in Field Mapping section first
2. Include custom field columns in your CSV
3. Map them during the import process
4. Custom field data will be stored as additional contact information

## Divisions

Contacts are organized by divisions (not categories):
1. Select target division during file upload step
2. All contacts in the file will be assigned to the selected division
3. Divisions represent organizational units with custom branding
4. Contact list displays division assignments with color coding

## Contact Management (Post-Import)

After importing contacts, you can:
1. **View**: Browse contacts in "Contacts" section showing division assignments
2. **Search**: Use real-time search across names, emails, phones, companies
3. **Delete** (Admin/Uploader roles only):
   - Individual deletion using trash icon next to each contact
   - Bulk operations using "Select" button and checkboxes
   - Confirmation dialogs prevent accidental deletions
   - Soft deletion preserves data integrity

## Support

For additional help with CSV imports:
- Check the system logs for detailed error messages
- Contact your system administrator
- Refer to the user guide for step-by-step instructions