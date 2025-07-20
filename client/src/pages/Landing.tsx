import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrand } from "@/contexts/BrandContext";
import { Database, Upload, BarChart3, Users, Shield, Palette } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const { getEffectiveLogo, getEffectiveOrganizationName } = useBrand();

  const features = [
    {
      icon: Database,
      title: "Smart Data Management",
      description: "Import Excel and CSV files with intelligent field mapping and automatic data synchronization."
    },
    {
      icon: Upload,
      title: "Easy File Upload",
      description: "Drag and drop your files or browse to upload. Support for Excel (.xlsx, .xls) and CSV formats."
    },
    {
      icon: BarChart3,
      title: "Visual Analytics",
      description: "Beautiful dashboards with charts and reports to understand your contact data at a glance."
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Granular permissions with Admin, Uploader, and User roles for secure collaboration."
    },
    {
      icon: Shield,
      title: "Division Management",
      description: "Organize contacts by divisions with separate permissions and custom branding per division."
    },
    {
      icon: Palette,
      title: "White Label Ready",
      description: "Fully customizable branding including logos, colors, and organization name."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              {getEffectiveLogo() ? (
                <img
                  src={getEffectiveLogo()!}
                  alt={getEffectiveOrganizationName()}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                  <Database className="w-8 h-8 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Hero Content */}
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
              {getEffectiveOrganizationName()}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              A fully white-labelable, secure contact management system with custom branding 
              and division-specific themes. Import, manage, and analyze your contact data with ease.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button 
                  size="lg" 
                  className="px-8 py-3 text-lg"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-3 text-lg"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything you need for contact management
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for teams of all sizes, from small businesses to enterprise organizations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/50 py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of organizations already using our platform to manage their contact data efficiently.
          </p>
          <Button 
            size="lg" 
            className="px-8 py-3 text-lg"
            onClick={() => window.location.href = "/api/login"}
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
