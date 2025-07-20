import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createUserSchema, type CreateUserData } from "@shared/schema";
import { z } from "zod";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "user" as const,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Registration is disabled - users must be created by admin

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Registration disabled - redirect to login
    setLocation("/login");
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Registration Disabled</CardTitle>
          <CardDescription>
            User accounts must be created by an administrator. Please contact your system administrator for access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Public registration is not available for this application. 
              New user accounts can only be created by system administrators.
            </p>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">To request access:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Contact your system administrator</li>
                <li>• Provide your business email address</li>
                <li>• Specify which divisions you need access to</li>
              </ul>
            </div>

            <div className="pt-4">
              <Link href="/login">
                <Button className="w-full">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}