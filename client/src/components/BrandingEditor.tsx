import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Palette, 
  Upload, 
  Eye, 
  Save, 
  RotateCcw,
  Database,
  Globe,
  Image as ImageIcon
} from "lucide-react";

export default function BrandingEditor() {
  const { branding, getEffectiveColors, getEffectiveLogo, getEffectiveOrganizationName } = useBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    organizationName: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#1976D2',
    secondaryColor: '#424242',
    accentColor: '#FF9800',
    fontFamily: 'Inter',
    customCss: '',
    showPoweredBy: true,
  });

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (branding) {
      setFormData({
        organizationName: branding.organizationName || '',
        logoUrl: branding.logoUrl || '',
        faviconUrl: branding.faviconUrl || '',
        primaryColor: branding.primaryColor || '#1976D2',
        secondaryColor: branding.secondaryColor || '#424242',
        accentColor: branding.accentColor || '#FF9800',
        fontFamily: branding.fontFamily || 'Inter',
        customCss: branding.customCss || '',
        showPoweredBy: branding.showPoweredBy ?? true,
      });
    }
  }, [branding]);

  const updateBrandingMutation = useMutation({
    mutationFn: async (brandingData: any) => {
      return await apiRequest('PUT', '/api/branding', brandingData);
    },
    onSuccess: () => {
      toast({
        title: "Branding updated",
        description: "Your branding settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/branding"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    updateBrandingMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      organizationName: '',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#1976D2',
      secondaryColor: '#424242',
      accentColor: '#FF9800',
      fontFamily: 'Inter',
      customCss: '',
      showPoweredBy: true,
    });
  };

  const handleColorChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string) => {
    // TODO: Implement file upload functionality
    toast({
      title: "File upload",
      description: "File upload functionality will be implemented here.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Brand Configuration</span>
              </CardTitle>
              <CardDescription>
                Customize your application's appearance and branding
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={updateBrandingMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateBrandingMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>
                    Basic information about your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={formData.organizationName}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                      placeholder="Enter your organization name"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      This will replace "Tally by JBLabs" throughout the application
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <select
                      id="fontFamily"
                      className="w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
                      value={formData.fontFamily}
                      onChange={(e) => setFormData(prev => ({ ...prev, fontFamily: e.target.value }))}
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showPoweredBy"
                      checked={formData.showPoweredBy}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showPoweredBy: checked }))}
                    />
                    <Label htmlFor="showPoweredBy">Show "Powered by Tally" footer</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Color Scheme</CardTitle>
                  <CardDescription>
                    Customize the color palette for your application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="color"
                          id="primaryColor"
                          value={formData.primaryColor}
                          onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                          className="w-12 h-10 border border-input rounded-md cursor-pointer"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                          placeholder="#1976D2"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Main brand color for buttons and accents
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="color"
                          id="secondaryColor"
                          value={formData.secondaryColor}
                          onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                          className="w-12 h-10 border border-input rounded-md cursor-pointer"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                          placeholder="#424242"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Secondary color for text and backgrounds
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="color"
                          id="accentColor"
                          value={formData.accentColor}
                          onChange={(e) => handleColorChange('accentColor', e.target.value)}
                          className="w-12 h-10 border border-input rounded-md cursor-pointer"
                        />
                        <Input
                          value={formData.accentColor}
                          onChange={(e) => handleColorChange('accentColor', e.target.value)}
                          placeholder="#FF9800"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Accent color for highlights and warnings
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4 p-4 border rounded-lg bg-muted/50">
                    <div className="text-center">
                      <div 
                        className="w-12 h-12 rounded-lg mb-2 mx-auto"
                        style={{ backgroundColor: formData.primaryColor }}
                      ></div>
                      <p className="text-xs text-muted-foreground">Primary</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-12 h-12 rounded-lg mb-2 mx-auto"
                        style={{ backgroundColor: formData.secondaryColor }}
                      ></div>
                      <p className="text-xs text-muted-foreground">Secondary</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-12 h-12 rounded-lg mb-2 mx-auto"
                        style={{ backgroundColor: formData.accentColor }}
                      ></div>
                      <p className="text-xs text-muted-foreground">Accent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo & Assets</CardTitle>
                  <CardDescription>
                    Upload and manage your brand assets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="logoUrl">Organization Logo</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="logoUrl"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                      />
                      <Button variant="outline" onClick={() => handleFileUpload('logo')}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended size: 200x50px, PNG or SVG format
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="faviconUrl">Favicon</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="faviconUrl"
                        value={formData.faviconUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, faviconUrl: e.target.value }))}
                        placeholder="https://example.com/favicon.ico"
                      />
                      <Button variant="outline" onClick={() => handleFileUpload('favicon')}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      16x16px or 32x32px ICO file
                    </p>
                  </div>

                  {formData.logoUrl && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-2">Logo Preview</p>
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo preview" 
                        className="h-12 object-contain bg-white rounded border p-2"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Customization</CardTitle>
                  <CardDescription>
                    Custom CSS and advanced styling options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customCss">Custom CSS</Label>
                    <Textarea
                      id="customCss"
                      rows={10}
                      value={formData.customCss}
                      onChange={(e) => setFormData(prev => ({ ...prev, customCss: e.target.value }))}
                      placeholder="/* Add your custom CSS here */
.custom-button {
  background-color: var(--primary);
  color: white;
}"
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Use CSS variables like --primary, --secondary, --accent for dynamic theming
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Live Preview</span>
              </CardTitle>
              <CardDescription>
                See how your changes will look
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Header Preview */}
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center space-x-3 mb-3">
                  {formData.logoUrl ? (
                    <img 
                      src={formData.logoUrl} 
                      alt="Logo" 
                      className="h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      <Database className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">
                      {formData.organizationName || 'Tally by JBLabs'}
                    </h3>
                    <p className="text-xs text-muted-foreground">Sample Division</p>
                  </div>
                </div>
                <Separator className="my-3" />
                
                {/* Button Preview */}
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    className="w-full"
                    style={{ 
                      backgroundColor: formData.primaryColor,
                      borderColor: formData.primaryColor 
                    }}
                  >
                    Primary Button
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    style={{ 
                      borderColor: formData.secondaryColor,
                      color: formData.secondaryColor 
                    }}
                  >
                    Secondary Button
                  </Button>
                </div>
              </div>

              {/* Color Palette */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-3">Color Palette</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div 
                      className="w-full h-8 rounded mb-1"
                      style={{ backgroundColor: formData.primaryColor }}
                    ></div>
                    <p className="text-xs text-muted-foreground">Primary</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-full h-8 rounded mb-1"
                      style={{ backgroundColor: formData.secondaryColor }}
                    ></div>
                    <p className="text-xs text-muted-foreground">Secondary</p>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-full h-8 rounded mb-1"
                      style={{ backgroundColor: formData.accentColor }}
                    ></div>
                    <p className="text-xs text-muted-foreground">Accent</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm mb-2">Configuration Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Organization Name</span>
                    <Badge variant={formData.organizationName ? 'default' : 'secondary'}>
                      {formData.organizationName ? 'Set' : 'Default'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Logo</span>
                    <Badge variant={formData.logoUrl ? 'default' : 'secondary'}>
                      {formData.logoUrl ? 'Custom' : 'Default'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Colors</span>
                    <Badge variant="default">Custom</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
