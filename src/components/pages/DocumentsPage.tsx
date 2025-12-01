import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Upload, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2,
  CheckCircle2,
  Clock,
  Folder
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const DocumentsPage: React.FC = () => {
  const { language } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'صورة_البطاقة_الجامعية.jpg',
      type: 'image/jpeg',
      size: 245000,
      uploadDate: new Date('2025-01-10'),
      category: 'identity',
      status: 'approved'
    },
    {
      id: '2',
      name: 'شهادة_الثانوية.pdf',
      type: 'application/pdf',
      size: 1200000,
      uploadDate: new Date('2025-01-15'),
      category: 'certificates',
      status: 'approved'
    },
  ]);

  const categories = [
    { id: 'identity', nameAr: 'وثائق الهوية', nameEn: 'Identity Documents' },
    { id: 'certificates', nameAr: 'الشهادات', nameEn: 'Certificates' },
    { id: 'requests', nameAr: 'الطلبات', nameEn: 'Requests' },
    { id: 'other', nameAr: 'أخرى', nameEn: 'Other' },
  ];

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'ar' 
        ? 'حجم الملف كبير جداً (الحد الأقصى 5MB)' 
        : 'File size too large (max 5MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(language === 'ar' 
        ? 'نوع الملف غير مدعوم' 
        : 'File type not supported');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      const newFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date(),
        category: 'other',
        status: 'pending'
      };

      setUploadedFiles([newFile, ...uploadedFiles]);
      setUploading(false);
      setUploadProgress(0);
      
      toast.success(language === 'ar' 
        ? 'تم رفع الملف بنجاح' 
        : 'File uploaded successfully');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 2000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id));
    toast.success(language === 'ar' ? 'تم حذف الملف' : 'File deleted');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-600" />;
    if (type === 'application/pdf') return <FileText className="w-8 h-8 text-red-600" />;
    return <File className="w-8 h-8 text-gray-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-600 text-white gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {language === 'ar' ? 'معتمد' : 'Approved'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-600 text-white">
            {language === 'ar' ? 'مرفوض' : 'Rejected'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-600 text-white gap-1">
            <Clock className="w-3 h-3" />
            {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header with Background */}
      <div className="relative -mt-8 -mx-4 px-4 overflow-hidden rounded-b-3xl mb-8">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1588453251771-cd919b362ed4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hlZHVsZSUyMGNhbGVuZGFyJTIwcGxhbm5lcnxlbnwxfHx8fDE3NjI5NzU1NTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Documents"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/95 via-red-600/95 to-pink-600/95"></div>
        </div>

        <div className="relative z-10 text-center py-16 text-white">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-5 rounded-full animate-pulse">
              <Upload className="w-14 h-14" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
            {language === 'ar' ? 'إدارة المستندات' : 'Documents Management'}
          </h1>
          
          <p className="text-xl opacity-90">
            {language === 'ar' 
              ? 'رفع وإدارة جميع المستندات والملفات الخاصة بك' 
              : 'Upload and manage all your documents and files'}
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">
          {language === 'ar' ? 'رفع ملف جديد' : 'Upload New File'}
        </h2>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? 'border-kku-green bg-kku-green/10'
              : 'border-muted-foreground/25 hover:border-kku-green'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-kku-green' : 'text-muted-foreground'}`} />
          <p className="font-semibold mb-2">
            {language === 'ar' 
              ? 'اسحب وأفلت الملف هنا أو انقر لتحديد' 
              : 'Drag and drop file here or click to select'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {language === 'ar' 
              ? 'الملفات المدعومة: JPG, PNG, PDF (الحد الأقصى 5MB)' 
              : 'Supported files: JPG, PNG, PDF (Max 5MB)'}
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-kku-green hover:bg-kku-green/90 text-white"
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'اختر ملف' : 'Choose File'}
          </Button>
        </div>

        {uploading && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                {language === 'ar' ? 'جاري رفع الملف...' : 'Uploading file...'}
              </span>
              <span className="font-bold text-kku-green">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 border rounded-lg hover:border-kku-green cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Folder className="w-6 h-6 text-kku-green mb-2" />
              <p className="text-sm font-medium">
                {language === 'ar' ? cat.nameAr : cat.nameEn}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Files List */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          {language === 'ar' ? 'الملفات المرفوعة' : 'Uploaded Files'}
          <Badge className="bg-kku-green text-white">{uploadedFiles.length}</Badge>
        </h2>

        {uploadedFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {language === 'ar' 
              ? 'لم تقم برفع أي ملفات بعد' 
              : 'No files uploaded yet'}
          </div>
        ) : (
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:border-kku-green transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-muted p-3 rounded-lg">
                    {getFileIcon(file.type)}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold mb-1">{file.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.uploadDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                    </div>
                  </div>

                  {getStatusBadge(file.status)}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success(language === 'ar' ? 'جاري التحميل...' : 'Downloading...')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-4">
          {language === 'ar' ? 'إرشادات هامة' : 'Important Instructions'}
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-kku-green">•</span>
            {language === 'ar' 
              ? 'تأكد من وضوح المستندات قبل رفعها' 
              : 'Ensure documents are clear before uploading'}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-kku-green">•</span>
            {language === 'ar' 
              ? 'الحد الأقصى لحجم الملف: 5 ميجابايت' 
              : 'Maximum file size: 5MB'}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-kku-green">•</span>
            {language === 'ar' 
              ? 'الصيغ المدعومة: JPG, PNG, PDF' 
              : 'Supported formats: JPG, PNG, PDF'}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-kku-green">•</span>
            {language === 'ar' 
              ? 'سيتم مراجعة المستندات خلال 24-48 ساعة' 
              : 'Documents will be reviewed within 24-48 hours'}
          </li>
        </ul>
      </Card>
    </div>
  );
};