# CSV Import Guide for Tally Contact Management

## Overview
This guide explains how to format CSV files for importing contacts into the Tally system. You can import contacts using Excel (.xlsx), Excel 97-2003 (.xls), or CSV (.csv) files.

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
   - Go to Upload page in Tally
   - Select your file
   - Click "Upload and Preview"

3. **Map Fields**
   - System will automatically detect common fields
   - Review and adjust field mappings as needed
   - Map custom fields to appropriate columns

4. **Import Data**
   - Review the preview
   - Click "Import Contacts"
   - Monitor import progress

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

## Categories

To assign contacts to specific categories:
1. Include a "Category" column in your CSV
2. Use existing category names from your system
3. New categories will be created automatically if they don't exist
4. Leave blank for uncategorized contacts

## Support

For additional help with CSV imports:
- Check the system logs for detailed error messages
- Contact your system administrator
- Refer to the user guide for step-by-step instructions