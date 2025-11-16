import React, { useState } from 'react';
import { Download, FileText, File as FileIcon, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from './ui/dropdown-menu';

interface DownloadButtonProps {
  onDownload: (format: 'pdf' | 'word' | 'excel') => Promise<void> | void;
  label?: string;
  labelAr?: string;
  language: 'ar' | 'en';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  formats?: ('pdf' | 'word' | 'excel')[];
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  onDownload,
  label,
  labelAr,
  language,
  variant = 'outline',
  size = 'default',
  className = '',
  formats = ['pdf', 'word', 'excel'],
  disabled = false,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<'pdf' | 'word' | 'excel' | null>(null);

  const handleDownload = async (format: 'pdf' | 'word' | 'excel') => {
    if (downloading) return;
    
    setDownloading(true);
    setCurrentFormat(format);
    
    try {
      await onDownload(format);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
      setCurrentFormat(null);
    }
  };

  const getFormatIcon = (format: 'pdf' | 'word' | 'excel') => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'word':
        return <FileIcon className="h-4 w-4 text-blue-500" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
    }
  };

  const getFormatLabel = (format: 'pdf' | 'word' | 'excel') => {
    if (language === 'ar') {
      switch (format) {
        case 'pdf':
          return 'تحميل PDF';
        case 'word':
          return 'تحميل Word';
        case 'excel':
          return 'تحميل Excel';
      }
    } else {
      switch (format) {
        case 'pdf':
          return 'Download PDF';
        case 'word':
          return 'Download Word';
        case 'excel':
          return 'Download Excel';
      }
    }
  };

  const buttonLabel = label || labelAr || (language === 'ar' ? 'تحميل' : 'Download');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`gap-2 ${className}`}
          disabled={disabled || downloading}
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {language === 'ar' ? 'جاري التحميل...' : 'Downloading...'}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {buttonLabel}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'} className="w-48">
        <DropdownMenuLabel>
          {language === 'ar' ? 'اختر صيغة التحميل' : 'Select Format'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.includes('pdf') && (
          <DropdownMenuItem 
            onClick={() => handleDownload('pdf')}
            disabled={downloading}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              {getFormatIcon('pdf')}
              <span className="flex-1">{getFormatLabel('pdf')}</span>
              {downloading && currentFormat === 'pdf' && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </div>
          </DropdownMenuItem>
        )}
        {formats.includes('word') && (
          <DropdownMenuItem 
            onClick={() => handleDownload('word')}
            disabled={downloading}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              {getFormatIcon('word')}
              <span className="flex-1">{getFormatLabel('word')}</span>
              {downloading && currentFormat === 'word' && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </div>
          </DropdownMenuItem>
        )}
        {formats.includes('excel') && (
          <DropdownMenuItem 
            onClick={() => handleDownload('excel')}
            disabled={downloading}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              {getFormatIcon('excel')}
              <span className="flex-1">{getFormatLabel('excel')}</span>
              {downloading && currentFormat === 'excel' && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
            </div>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
