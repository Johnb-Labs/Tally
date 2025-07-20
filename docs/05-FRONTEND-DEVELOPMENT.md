# Frontend Development Guide

## React + TypeScript Architecture

The frontend is built with React 18 and TypeScript, using modern patterns and best practices for maintainable code.

## Component Structure

### Page Components
Located in `client/src/pages/`, these are top-level route components:

```typescript
// Example: pages/Dashboard.tsx
export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { currentDivision } = useBrand();

  // Authentication guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login
    }
  }, [isAuthenticated, isLoading]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader title="Dashboard" description="Overview of your contacts" />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Page content */}
        </main>
      </div>
    </div>
  );
}
```

### Reusable Components
Located in `client/src/components/`:

```typescript
// Example: components/ContactCard.tsx
interface ContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (id: number) => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  return (
    <Card>
      <CardContent>
        {/* Contact display */}
      </CardContent>
    </Card>
  );
}
```

## State Management

### TanStack Query for Server State
```typescript
// Fetching data
const { data: contacts, isLoading, error } = useQuery({
  queryKey: ["/api/contacts", { divisionId: currentDivision?.id }],
  enabled: !!user,
  retry: false,
});

// Mutations
const createContactMutation = useMutation({
  mutationFn: async (contactData: InsertContact) => {
    return await apiRequest('POST', '/api/contacts', contactData);
  },
  onSuccess: () => {
    toast({ title: "Contact created successfully" });
    queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
  },
  onError: (error) => {
    if (isUnauthorizedError(error)) {
      // Handle auth errors
      window.location.href = "/login";
      return;
    }
    toast({ 
      title: "Failed to create contact", 
      description: error.message,
      variant: "destructive" 
    });
  },
});
```

### React Context for Global State
```typescript
// contexts/BrandContext.tsx
interface BrandContextType {
  currentDivision: Division | null;
  setCurrentDivision: (division: Division | null) => void;
  getEffectiveLogo: () => string | null;
  getEffectiveOrganizationName: () => string;
  getEffectiveColors: () => ColorScheme;
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [currentDivision, setCurrentDivision] = useState<Division | null>(null);
  
  // Theme and branding logic
  const updateCSSVariables = useCallback((colors: ColorScheme) => {
    document.documentElement.style.setProperty('--primary', colors.primaryColor);
    document.documentElement.style.setProperty('--secondary', colors.secondaryColor);
  }, []);

  return (
    <BrandContext.Provider value={{ /* context values */ }}>
      {children}
    </BrandContext.Provider>
  );
}
```

## Form Handling

### React Hook Form + Zod Validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from '@shared/schema';

export function ContactForm({ contact, onSubmit }: ContactFormProps) {
  const form = useForm<InsertContact>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      position: '',
    }
  });

  const handleSubmit = (data: InsertContact) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save Contact"}
        </Button>
      </form>
    </Form>
  );
}
```

## Styling with Tailwind CSS

### Component Styling
```typescript
// Using Tailwind classes with conditional styling
export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge 
      className={cn(
        "capitalize",
        status === 'completed' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        status === 'pending' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        status === 'failed' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      )}
    >
      {status}
    </Badge>
  );
}
```

### Dark Mode Implementation
```css
/* index.css - CSS custom properties */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
}
```

```typescript
// hooks/useTheme.ts
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme, toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light') };
}
```

## Routing with Wouter

### Route Configuration
```typescript
// App.tsx
import { Switch, Route } from 'wouter';

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/upload" component={Upload} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/reports" component={Reports} />
          <Route path="/users" component={UserManagement} />
          <Route path="/divisions" component={Divisions} />
          <Route path="/branding" component={Branding} />
          <Route path="/audit" component={AuditLog} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}
```

### Navigation
```typescript
// Using Link component
import { Link } from 'wouter';

<Link href="/contacts">
  <Button variant="ghost" className="w-full justify-start">
    <Users className="w-4 h-4 mr-3" />
    Contacts
  </Button>
</Link>

// Programmatic navigation
import { useLocation } from 'wouter';

const [location, setLocation] = useLocation();

const handleSubmit = async () => {
  await submitForm();
  setLocation('/dashboard');
};
```

## File Upload Implementation

### File Upload Component
```typescript
// components/FileUploader.tsx
export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('divisionId', currentDivision?.id.toString() || '');
      
      return await apiRequest('POST', '/api/uploads', formData);
    },
    onSuccess: () => {
      toast({ title: "File uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
    },
    onError: (error) => {
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      toast({ 
        title: "File too large", 
        description: "Maximum file size is 10MB",
        variant: "destructive" 
      });
      return;
    }

    if (!['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Only Excel and CSV files are supported",
        variant: "destructive" 
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
      <p className="text-lg font-medium mb-2">
        Drag and drop your files here
      </p>
      <p className="text-muted-foreground mb-4">
        or{" "}
        <Button 
          variant="link" 
          onClick={() => fileInputRef.current?.click()}
          className="p-0 h-auto"
        >
          browse files
        </Button>
      </p>
      <p className="text-sm text-muted-foreground">
        Supports Excel (.xlsx, .xls) and CSV files up to 10MB
      </p>
    </div>
  );
}
```

## Error Handling

### API Error Handling
```typescript
// lib/authUtils.ts
export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

// Usage in components
const handleApiError = (error: Error) => {
  if (isUnauthorizedError(error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/login";
    }, 500);
    return;
  }
  
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive",
  });
};
```

### Loading States
```typescript
// Loading component
export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  return (
    <div className={cn(
      "animate-spin rounded-full border-b-2 border-primary",
      size === "sm" && "w-4 h-4",
      size === "default" && "w-8 h-8", 
      size === "lg" && "w-12 h-12"
    )} />
  );
}

// Usage in pages
if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy loading pages
import { lazy, Suspense } from 'react';

const UserManagement = lazy(() => import('./pages/UserManagement'));
const Reports = lazy(() => import('./pages/Reports'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <UserManagement />
</Suspense>
```

### Memoization
```typescript
// Memoizing expensive calculations
const sortedContacts = useMemo(() => {
  if (!contacts) return [];
  return [...contacts].sort((a, b) => 
    (a.lastName || '').localeCompare(b.lastName || '')
  );
}, [contacts]);

// Memoizing callbacks
const handleContactSelect = useCallback((contact: Contact) => {
  setSelectedContact(contact);
}, []);
```

### Virtual Scrolling for Large Lists
```typescript
// For large contact lists
import { FixedSizeList as List } from 'react-window';

export function ContactList({ contacts }: { contacts: Contact[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ContactCard contact={contacts[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={contacts.length}
      itemSize={120}
      className="w-full"
    >
      {Row}
    </List>
  );
}
```