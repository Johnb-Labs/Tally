import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AppLayout from "@/components/AppLayout";
import TopHeader from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Database, PlayCircle, Upload, CheckCircle, XCircle } from "lucide-react";

type Division = {
  id: number;
  name: string;
};

type ContactCategory = {
  id: number;
  name: string;
};

const contactFields = [
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Company" },
  { value: "jobTitle", label: "Job Title" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "province", label: "Province" },
  { value: "postalCode", label: "Postal Code" },
  { value: "country", label: "Country" },
  { value: "notes", label: "Notes" },
];

export default function SQLImport() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Connection state
  const [dbType, setDbType] = useState<string>("mysql");
  const [host, setHost] = useState<string>("");
  const [port, setPort] = useState<string>("");
  const [database, setDatabase] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [ssl, setSsl] = useState<boolean>(false);

  // Query state
  const [query, setQuery] = useState<string>("SELECT * FROM contacts");
  const [tables, setTables] = useState<string[]>([]);

  // Preview state
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);

  // Import state
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

  // UI state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Connect, 2: Query, 3: Map, 4: Import

  // Fetch divisions
  const { data: divisions } = useQuery<Division[]>({
    queryKey: ["/api/divisions"],
  });

  // Fetch categories for selected division
  const { data: categories } = useQuery<ContactCategory[]>({
    queryKey: ["/api/contact-categories", { divisionId: selectedDivision }],
    enabled: !!selectedDivision,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Check permissions
  useEffect(() => {
    if (user && !authLoading) {
      const canImport = (user as any)?.role === 'admin' || (user as any)?.role === 'uploader';
      if (!canImport) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to import data.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
        return;
      }
    }
  }, [user, authLoading, toast]);

  const testConnection = async () => {
    if (!host || !database || !username || !password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required connection fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/sql-import/test-connection", { 
        dbType, host, port, database, username, password, ssl 
      });
      const response = await res.json();

      if (response.success) {
        setIsConnected(true);
        setTables(response.tables || []);
        setCurrentStep(2);
        toast({
          title: "Connection Successful",
          description: `Connected to ${database}. Found ${response.tables?.length || 0} tables.`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: response.message || "Could not connect to database",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runPreview = async () => {
    if (!query) {
      toast({
        title: "Missing Query",
        description: "Please enter a SQL query.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/sql-import/preview", { 
        dbType, host, port, database, username, password, ssl, query 
      });
      const response = await res.json();

      if (response.success) {
        setPreviewData(response.data || []);
        setPreviewColumns(response.columns || []);
        setCurrentStep(3);
        
        // Auto-map fields based on column names
        const autoMapping: Record<string, string> = {};
        response.columns?.forEach((col: string) => {
          const colLower = col.toLowerCase();
          contactFields.forEach(field => {
            const fieldLower = field.value.toLowerCase();
            if (colLower === fieldLower || 
                colLower.includes(fieldLower) || 
                fieldLower.includes(colLower) ||
                (colLower === 'first_name' && fieldLower === 'firstname') ||
                (colLower === 'last_name' && fieldLower === 'lastname') ||
                (colLower === 'job_title' && fieldLower === 'jobtitle') ||
                (colLower === 'postal_code' && fieldLower === 'postalcode')
            ) {
              autoMapping[field.value] = col;
            }
          });
        });
        setFieldMapping(autoMapping);

        toast({
          title: "Preview Loaded",
          description: `Showing ${response.count || 0} rows from query result.`,
        });
      } else {
        toast({
          title: "Query Failed",
          description: response.message || "Could not execute query",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Preview Error",
        description: error.message || "Failed to preview data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const executeImport = async () => {
    if (!selectedDivision) {
      toast({
        title: "Missing Division",
        description: "Please select a division for the import.",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(fieldMapping).length === 0) {
      toast({
        title: "Missing Field Mapping",
        description: "Please map at least one field.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/sql-import/execute", { 
        dbType, 
        host, 
        port, 
        database, 
        username, 
        password, 
        ssl, 
        query,
        divisionId: selectedDivision,
        categoryId: selectedCategory || null,
        fieldMapping 
      });
      const response = await res.json();

      if (response.success) {
        setCurrentStep(4);
        queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
        toast({
          title: "Import Successful",
          description: response.message || `Imported ${response.imported} contacts`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: response.message || "Could not import data",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message || "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setIsConnected(false);
    setCurrentStep(1);
    setPreviewData([]);
    setPreviewColumns([]);
    setFieldMapping({});
    setTables([]);
    setQuery("SELECT * FROM contacts");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </AppLayout>
  );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const canImport = (user as any)?.role === 'admin' || (user as any)?.role === 'uploader';
  if (!canImport) {
    return null;
  }

  return (
    <AppLayout>
      
      
      
        <TopHeader 
          title="SQL Database Import"
          description="Import contacts directly from an external SQL database (MySQL, PostgreSQL, MS SQL)."
        />
        
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <StepIndicator step={1} currentStep={currentStep} label="Connect" />
              <div className="h-px w-12 bg-border" />
              <StepIndicator step={2} currentStep={currentStep} label="Query" />
              <div className="h-px w-12 bg-border" />
              <StepIndicator step={3} currentStep={currentStep} label="Map Fields" />
              <div className="h-px w-12 bg-border" />
              <StepIndicator step={4} currentStep={currentStep} label="Import" />
            </AppLayout>

            {/* Step 1: Database Connection */}
            {currentStep === 1 && (
              <Card data-testid="card-connection">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Connection
                  </CardTitle>
                  <CardDescription>
                    Connect to your external SQL database. This connection is read-only and will not modify your database.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="db-type">Database Type</Label>
                      <Select value={dbType} onValueChange={setDbType}>
                        <SelectTrigger id="db-type" data-testid="select-db-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mysql">MySQL</SelectItem>
                          <SelectItem value="postgres">PostgreSQL</SelectItem>
                          <SelectItem value="mssql">MS SQL Server</SelectItem>
                        </SelectContent>
                      </Select>
                    </AppLayout>

                    <div className="space-y-2">
                      <Label htmlFor="host">Host</Label>
                      <Input 
                        id="host" 
                        data-testid="input-host"
                        placeholder="localhost or db.example.com" 
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                      />
                    </AppLayout>

                    <div className="space-y-2">
                      <Label htmlFor="port">Port (Optional)</Label>
                      <Input 
                        id="port" 
                        data-testid="input-port"
                        placeholder="3306 (MySQL) / 5432 (PostgreSQL) / 1433 (MS SQL)" 
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                      />
                    </AppLayout>

                    <div className="space-y-2">
                      <Label htmlFor="database">Database Name</Label>
                      <Input 
                        id="database" 
                        data-testid="input-database"
                        placeholder="contacts_db" 
                        value={database}
                        onChange={(e) => setDatabase(e.target.value)}
                      />
                    </AppLayout>

                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        data-testid="input-username"
                        placeholder="readonly_user" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </AppLayout>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        data-testid="input-password"
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </AppLayout>
                  </AppLayout>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="ssl" 
                      data-testid="switch-ssl"
                      checked={ssl}
                      onCheckedChange={setSsl}
                    />
                    <Label htmlFor="ssl">Use SSL/TLS Connection</Label>
                  </AppLayout>

                  <Button 
                    onClick={testConnection} 
                    disabled={isLoading}
                    data-testid="button-test-connection"
                    className="w-full"
                  >
                    {isLoading ? "Testing Connection..." : "Test Connection"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Query Builder */}
            {currentStep === 2 && (
              <Card data-testid="card-query">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5" />
                    SQL Query
                  </CardTitle>
                  <CardDescription>
                    Write a SELECT query to fetch data from your database. Only read-only queries are allowed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tables.length > 0 && (
                    <div className="space-y-2">
                      <Label>Available Tables</Label>
                      <div className="flex flex-wrap gap-2">
                        {tables.map((table) => (
                          <Badge key={table} variant="outline" className="text-white dark:text-white">
                            {table}
                          </Badge>
                        ))}
                      </AppLayout>
                    </AppLayout>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="query">SQL Query</Label>
                    <Textarea 
                      id="query" 
                      data-testid="textarea-query"
                      placeholder="SELECT * FROM contacts WHERE active = 1" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </AppLayout>

                  <div className="flex gap-2">
                    <Button 
                      onClick={runPreview} 
                      disabled={isLoading}
                      data-testid="button-preview"
                      className="flex-1"
                    >
                      {isLoading ? "Loading Preview..." : "Preview Data"}
                    </Button>
                    <Button 
                      onClick={resetImport} 
                      variant="outline"
                      data-testid="button-back-connection"
                    >
                      Back
                    </Button>
                  </AppLayout>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Field Mapping */}
            {currentStep === 3 && (
              <>
                <Card data-testid="card-mapping">
                  <CardHeader>
                    <CardTitle>Field Mapping</CardTitle>
                    <CardDescription>
                      Map SQL columns to contact fields. Preview shows first {previewData.length} rows.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="division">Target Division *</Label>
                        <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                          <SelectTrigger id="division" data-testid="select-division">
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                          <SelectContent>
                            {divisions?.map((div) => (
                              <SelectItem key={div.id} value={div.id.toString()}>
                                {div.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </AppLayout>

                      <div className="space-y-2">
                        <Label htmlFor="category">Contact Category (Optional)</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger id="category" data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </AppLayout>
                    </AppLayout>

                    <div className="space-y-3 border rounded-lg p-4">
                      <Label>Field Mapping</Label>
                      {contactFields.map((field) => (
                        <div key={field.value} className="flex items-center gap-4">
                          <div className="w-1/3 text-sm font-medium">{field.label}</div>
                          <div className="flex-1">
                            <Select 
                              value={fieldMapping[field.value] || ""} 
                              onValueChange={(value) => setFieldMapping(prev => ({ ...prev, [field.value]: value }))}
                            >
                              <SelectTrigger data-testid={`select-field-${field.value}`}>
                                <SelectValue placeholder="Select SQL column" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {previewColumns.map((col) => (
                                  <SelectItem key={col} value={col}>
                                    {col}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </AppLayout>
                        </AppLayout>
                      ))}
                    </AppLayout>

                    <div className="flex gap-2">
                      <Button 
                        onClick={executeImport} 
                        disabled={isLoading || !selectedDivision}
                        data-testid="button-execute-import"
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isLoading ? "Importing..." : "Import Contacts"}
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(2)} 
                        variant="outline"
                        data-testid="button-back-query"
                      >
                        Back
                      </Button>
                    </AppLayout>
                  </CardContent>
                </Card>

                {/* Preview Table */}
                {previewData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {previewColumns.map((col) => (
                                <TableHead key={col}>{col}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.slice(0, 10).map((row, idx) => (
                              <TableRow key={idx}>
                                {previewColumns.map((col) => (
                                  <TableCell key={col}>{String(row[col] || '')}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AppLayout>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Step 4: Import Complete */}
            {currentStep === 4 && (
              <Card data-testid="card-complete">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    Import Complete
                  </CardTitle>
                  <CardDescription>
                    Your contacts have been successfully imported from the SQL database.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={resetImport}
                    data-testid="button-new-import"
                    className="w-full"
                  >
                    Start New Import
                  </Button>
                </CardContent>
              </Card>
            )}
          </AppLayout>
        </AppLayout>
      </AppLayout>
  );
}

function StepIndicator({ step, currentStep, label }: { step: number; currentStep: number; label: string }) {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          isCompleted 
            ? 'bg-green-600 text-white dark:bg-green-500' 
            : isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isCompleted ? <CheckCircle className="w-5 h-5" /> : step}
      </div>
      <span className={`text-sm ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}
