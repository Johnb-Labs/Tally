import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileSpreadsheet, CheckCircle, AlertTriangle, Zap, Trash2 } from "lucide-react";

interface FieldMapperProps {
  upload: any;
  onComplete: (fieldMapping: any) => void;
  onCancel: () => void;
  onDelete?: (uploadId: number) => void;
  isProcessing: boolean;
}

const DATABASE_FIELDS = [
  { key: 'firstName', label: 'First Name', required: false },
  { key: 'lastName', label: 'Last Name', required: false },
  { key: 'email', label: 'Email Address', required: true },
  { key: 'phone', label: 'Phone Number', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'jobTitle', label: 'Job Title', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'province', label: 'Province', required: false },
  { key: 'postalCode', label: 'Postal Code', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

// Common CSV header patterns for automatic mapping
const FIELD_PATTERNS = {
  firstName: ['first name', 'firstname', 'first_name', 'fname', 'given name'],
  lastName: ['last name', 'lastname', 'last_name', 'surname', 'family name', 'lname'],
  email: ['email', 'email address', 'email_address', 'e-mail', 'mail'],
  phone: ['phone', 'phone number', 'telephone', 'mobile', 'cell', 'contact number'],
  company: ['company', 'organization', 'organisation', 'business', 'company name'],
  jobTitle: ['job title', 'position', 'title', 'role', 'job_title', 'designation'],
  address: ['address', 'street address', 'address line 1', 'addr'],
  city: ['city', 'town'],
  province: ['province', 'state', 'region'],
  postalCode: ['postal code', 'zip code', 'zipcode', 'zip', 'postcode', 'postal_code'],
  country: ['country', 'nation'],
  notes: ['notes', 'comments', 'remarks', 'description', 'memo']
};

export default function FieldMapper({ upload, onComplete, onCancel, onDelete, isProcessing }: FieldMapperProps) {
  const { user } = useAuth();
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  // Fetch divisions
  const { data: divisions } = useQuery({
    queryKey: ["/api/divisions"],
    enabled: !!user,
  });

  // Auto-mapping function
  const autoMapFields = (headers: string[]) => {
    const mapping: Record<string, string> = {};
    
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Find matching database field
      for (const [dbField, patterns] of Object.entries(FIELD_PATTERNS)) {
        if (patterns.some(pattern => normalizedHeader.includes(pattern))) {
          // Only map if not already mapped to avoid conflicts
          if (!Object.values(mapping).includes(dbField)) {
            mapping[header] = dbField;
            break;
          }
        }
      }
    });
    
    return mapping;
  };

  // Mock sample data parsing - in real app, this would be done server-side
  useEffect(() => {
    // Simulate parsing first few rows of the file with South African data
    const mockHeaders = ['First Name', 'Last Name', 'Email Address', 'Phone', 'Company', 'Job Title', 'Address', 'City', 'Province', 'Postal Code', 'Country'];
    const mockData = [
      { 
        'First Name': 'Thabo', 
        'Last Name': 'Mthembu', 
        'Email Address': 'thabo.mthembu@example.co.za', 
        'Phone': '+27 11 123 4567', 
        'Company': 'Standard Bank', 
        'Job Title': 'Branch Manager',
        'Address': '123 Sandton Drive',
        'City': 'Johannesburg',
        'Province': 'Gauteng',
        'Postal Code': '2196',
        'Country': 'South Africa'
      },
      { 
        'First Name': 'Sarah', 
        'Last Name': 'van der Merwe', 
        'Email Address': 'sarah.vdm@example.co.za', 
        'Phone': '+27 21 456 7890', 
        'Company': 'Shoprite Holdings', 
        'Job Title': 'Marketing Director',
        'Address': '456 Main Road',
        'City': 'Cape Town',
        'Province': 'Western Cape',
        'Postal Code': '8001',
        'Country': 'South Africa'
      },
      { 
        'First Name': 'Sipho', 
        'Last Name': 'Ndlovu', 
        'Email Address': 'sipho.ndlovu@example.co.za', 
        'Phone': '+27 31 789 0123', 
        'Company': 'Sasol Limited', 
        'Job Title': 'Operations Manager',
        'Address': '789 Berea Road',
        'City': 'Durban',
        'Province': 'KwaZulu-Natal',
        'Postal Code': '4001',
        'Country': 'South Africa'
      },
    ];
    
    setCsvHeaders(mockHeaders);
    setSampleData(mockData);
    
    // Auto-map fields based on header patterns
    const autoMapping = autoMapFields(mockHeaders);
    setFieldMapping(autoMapping);
  }, [upload]);

  const handleFieldChange = (csvField: string, dbField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvField]: dbField === 'none' ? '' : dbField,
    }));
  };

  const validateMapping = () => {
    const newErrors: string[] = [];
    
    // Check if division is selected
    if (!selectedDivision) {
      newErrors.push('Please select a division to import contacts into.');
    }
    
    // Check if at least one required field is mapped
    const requiredFieldsMapped = DATABASE_FIELDS
      .filter(field => field.required)
      .some(field => Object.values(fieldMapping).includes(field.key));
    
    if (!requiredFieldsMapped) {
      newErrors.push('At least one required field (Email Address) must be mapped.');
    }

    // Check for duplicate mappings
    const mappedValues = Object.values(fieldMapping).filter(value => value !== '');
    const duplicates = mappedValues.filter((value, index) => mappedValues.indexOf(value) !== index);
    
    if (duplicates.length > 0) {
      newErrors.push('Multiple CSV fields cannot be mapped to the same database field.');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleComplete = () => {
    if (validateMapping()) {
      onComplete({
        fieldMapping,
        divisionId: parseInt(selectedDivision),
      });
    }
  };

  const getMappedDbField = (csvField: string) => {
    const dbFieldKey = fieldMapping[csvField];
    return DATABASE_FIELDS.find(field => field.key === dbFieldKey);
  };

  const getMappingStatus = () => {
    const mappedCount = Object.values(fieldMapping).filter(value => value !== '').length;
    const requiredMapped = DATABASE_FIELDS
      .filter(field => field.required)
      .some(field => Object.values(fieldMapping).includes(field.key));
    
    return { mappedCount, requiredMapped, total: csvHeaders.length };
  };

  const status = getMappingStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Field Mapping: {upload.originalName}</span>
                </CardTitle>
                <CardDescription>
                  Map your file columns to database fields and select target division
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {status.mappedCount} of {status.total} fields mapped
                </p>
                <p className="text-xs text-muted-foreground">
                  {status.requiredMapped ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Required fields mapped
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Missing required fields
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {onDelete && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(upload.id)}
                    disabled={isProcessing}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete File
                  </Button>
                )}
                <Button 
                  onClick={handleComplete}
                  disabled={!status.requiredMapped || !selectedDivision || isProcessing}
                  className="min-w-24"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  {isProcessing ? 'Processing...' : 'Process File'}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive mb-2">Mapping Issues</h4>
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Division Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Division Selection</CardTitle>
          <CardDescription>
            Choose which division these contacts should be imported into
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Select value={selectedDivision} onValueChange={setSelectedDivision}>
              <SelectTrigger>
                <SelectValue placeholder="Select a division..." />
              </SelectTrigger>
              <SelectContent>
                {divisions && Array.isArray(divisions) ? divisions.map((division: any) => (
                  <SelectItem key={division.id} value={division.id.toString()}>
                    {division.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Field Mapping */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Field Mapping Configuration</CardTitle>
              <CardDescription>
                Select which database field each CSV column should map to
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const autoMapping = autoMapFields(csvHeaders);
                setFieldMapping(autoMapping);
              }}
            >
              <Zap className="w-4 h-4 mr-2" />
              Auto Map
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {csvHeaders.map((csvField, index) => {
              const mappedField = getMappedDbField(csvField);
              return (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">{csvField}</Badge>
                      {mappedField?.required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sample: {sampleData[0]?.[csvField] || 'No data'}
                    </p>
                  </div>
                  
                  <div className="w-4 text-center text-muted-foreground">→</div>
                  
                  <div className="flex-1">
                    <Select
                      value={fieldMapping[csvField] || 'none'}
                      onValueChange={(value) => handleFieldChange(csvField, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select database field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Don't import this field</SelectItem>
                        <Separator />
                        {DATABASE_FIELDS.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            <div className="flex items-center justify-between w-full">
                              <span>{field.label}</span>
                              {field.required && (
                                <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>
            Preview how your data will be imported
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.entries(fieldMapping)
                    .filter(([_, dbField]) => dbField !== '')
                    .map(([csvField, dbField]) => (
                      <TableHead key={csvField}>
                        {DATABASE_FIELDS.find(f => f.key === dbField)?.label || dbField}
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.slice(0, 3).map((row, index) => (
                  <TableRow key={index}>
                    {Object.entries(fieldMapping)
                      .filter(([_, dbField]) => dbField !== '')
                      .map(([csvField, dbField]) => (
                        <TableCell key={csvField}>
                          {row[csvField] || '—'}
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {sampleData.length > 3 && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Showing first 3 rows of {sampleData.length} total rows
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
