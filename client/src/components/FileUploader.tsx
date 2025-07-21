import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Cloud
} from "lucide-react";

interface FileUploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  uploadId?: number;
}

export default function FileUploader() {
  const { user } = useAuth();
  const { currentDivision } = useBrand();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>(
    currentDivision?.id.toString() || ""
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (uploadData: { file: File; divisionId?: number }) => {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      if (uploadData.divisionId) {
        formData.append('divisionId', uploadData.divisionId.toString());
      }

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const fileId = generateFileId(variables.file);
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'success', progress: 100, uploadId: data.id }
          : f
      ));
      
      toast({
        title: "Upload successful",
        description: `${variables.file.name} has been uploaded successfully.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/uploads"] });
    },
    onError: (error, variables) => {
      const fileId = generateFileId(variables.file);
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
      
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateFileId = (file: File) => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv',
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.csv');
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileUploadItem[] = [];
    
    Array.from(selectedFiles).forEach(file => {
      if (!isValidFileType(file)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid Excel or CSV file.`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB size limit.`,
          variant: "destructive",
        });
        return;
      }

      const fileId = generateFileId(file);
      if (files.some(f => f.id === fileId)) {
        toast({
          title: "Duplicate file",
          description: `${file.name} has already been added.`,
          variant: "destructive",
        });
        return;
      }

      newFiles.push({
        id: fileId,
        file,
        status: 'pending',
        progress: 0,
      });
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    pendingFiles.forEach(fileItem => {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileItem.id && f.status === 'uploading' && f.progress < 90) {
            return { ...f, progress: f.progress + 10 };
          }
          return f;
        }));
      }, 200);

      uploadMutation.mutate({
        file: fileItem.file,
        divisionId: selectedDivisionId ? parseInt(selectedDivisionId) : undefined,
      });

      // Clean up progress interval after 5 seconds
      setTimeout(() => clearInterval(progressInterval), 5000);
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('csv') || file.name.endsWith('.csv')) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    }
    return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const userDivisions = user?.divisions || [];
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Drag and drop your Excel (.xlsx, .xls) or CSV files here, or click to browse.
            Maximum file size: 10MB per file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Division Selector */}
            {userDivisions.length > 1 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Division (optional)
                </label>
                <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a division or leave blank for global" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Division (Global)</SelectItem>
                    {userDivisions.map((division) => (
                      <SelectItem key={division.id} value={division.id.toString()}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Drop Zone */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              
              <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports Excel (.xlsx, .xls) and CSV files up to 10MB each
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Files to Upload</CardTitle>
              <CardDescription>
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </CardDescription>
            </div>
            {pendingCount > 0 && (
              <Button 
                onClick={uploadFiles}
                disabled={uploadingCount > 0}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((fileItem) => (
                <div 
                  key={fileItem.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  {getFileIcon(fileItem.file)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fileItem.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {fileItem.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={fileItem.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {fileItem.progress}% uploaded
                        </p>
                      </div>
                    )}
                    
                    {fileItem.error && (
                      <p className="text-sm text-red-500 mt-1">{fileItem.error}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(fileItem.status)}
                    
                    <Badge variant={
                      fileItem.status === 'success' ? 'default' :
                      fileItem.status === 'error' ? 'destructive' :
                      fileItem.status === 'uploading' ? 'secondary' : 'outline'
                    }>
                      {fileItem.status}
                    </Badge>

                    {fileItem.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileItem.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
