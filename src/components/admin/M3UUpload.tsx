import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, FileCheck, AlertCircle, Check, X, RefreshCw, Save } from 'lucide-react';
import type { ParsedChannel } from '@/types';

interface M3UUploadProps {
  onParse: (file: File) => Promise<ParsedChannel[]>;
  onImport: (channels: ParsedChannel[]) => Promise<void>;
  isLoading: boolean;
}

const M3UUpload: React.FC<M3UUploadProps> = ({ onParse, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedChannels, setParsedChannels] = useState<ParsedChannel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.m3u') && !file.name.endsWith('.m3u8')) {
      setParseError('Please select a valid M3U or M3U8 file');
      return;
    }

    setIsParsing(true);
    setParseError('');
    setParsedChannels([]);
    setSelectedChannels(new Set());
    setImportResult(null);

    try {
      const channels = await onParse(file);
      setParsedChannels(channels);
      
      // Select all channels by default
      setSelectedChannels(new Set(channels.map(c => c.id)));
      
      // Extract unique categories
      const cats = [...new Set(channels.map(c => c.category))];
      setCategories(cats);
    } catch (error: any) {
      setParseError(error.message || 'Failed to parse M3U file');
    } finally {
      setIsParsing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleChannelSelection = (channelId: string) => {
    const newSelected = new Set(selectedChannels);
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId);
    } else {
      newSelected.add(channelId);
    }
    setSelectedChannels(newSelected);
  };

  const toggleAllInCategory = (category: string) => {
    const categoryChannels = filteredChannels.filter(c => c.category === category);
    const categoryIds = new Set(categoryChannels.map(c => c.id));
    
    const newSelected = new Set(selectedChannels);
    const allSelected = categoryChannels.every(c => newSelected.has(c.id));
    
    if (allSelected) {
      // Deselect all in category
      categoryIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all in category
      categoryIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedChannels(newSelected);
  };

  const handleImport = async () => {
    if (selectedChannels.size === 0) return;

    setIsImporting(true);
    try {
      const channelsToImport = parsedChannels.filter(c => selectedChannels.has(c.id));
      await onImport(channelsToImport);
      setImportResult({
        success: true,
        message: `Successfully imported ${channelsToImport.length} channels`
      });
      setParsedChannels([]);
      setSelectedChannels(new Set());
    } catch (error: any) {
      setImportResult({
        success: false,
        message: error.message || 'Failed to import channels'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const filteredChannels = selectedCategory === 'all'
    ? parsedChannels
    : parsedChannels.filter(c => c.category === selectedCategory);

  const groupedChannels = filteredChannels.reduce((acc, channel) => {
    if (!acc[channel.category]) acc[channel.category] = [];
    acc[channel.category].push(channel);
    return acc;
  }, {} as Record<string, ParsedChannel[]>);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="bg-gray-900 border-gray-800 border-dashed-2">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Upload M3U Playlist
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Drag and drop your M3U file here, or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".m3u,.m3u8"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Select M3U File
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {parseError && (
        <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-400">{parseError}</p>
        </div>
      )}

      {/* Parsed Channels Preview */}
      {parsedChannels.length > 0 && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Parsed Channels ({selectedChannels.size} selected)
              </h3>
              <p className="text-gray-400 text-sm">
                Total: {parsedChannels.length} channels in {categories.length} categories
              </p>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-red-600' : 'border-gray-700'}
              >
                All
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? 'bg-red-600' : 'border-gray-700'}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Import Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleImport}
              disabled={selectedChannels.size === 0 || isImporting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Import {selectedChannels.size} Channels
                </>
              )}
            </Button>
          </div>

          {/* Channels List */}
          <div className="space-y-6">
            {Object.entries(groupedChannels).map(([category, channels]) => (
              <Card key={category} className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      {category}
                      <Badge variant="outline" className="border-gray-600">
                        {channels.length}
                      </Badge>
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllInCategory(category)}
                      className="text-gray-400 hover:text-white"
                    >
                      Toggle All
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {channels.map((channel) => (
                      <div
                        key={channel.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedChannels.has(channel.id)
                            ? 'bg-red-900/20 border-red-600/50'
                            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                        }`}
                        onClick={() => toggleChannelSelection(channel.id)}
                      >
                        <Checkbox
                          checked={selectedChannels.has(channel.id)}
                          onCheckedChange={() => toggleChannelSelection(channel.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {channel.name}
                          </p>
                          {channel.country && (
                            <p className="text-gray-500 text-xs">{channel.country}</p>
                          )}
                        </div>
                        {channel.logo && (
                          <img
                            src={channel.logo}
                            alt=""
                            className="w-8 h-8 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Import Result Dialog */}
      <Dialog open={!!importResult} onOpenChange={() => setImportResult(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className={importResult?.success ? 'text-green-500' : 'text-red-500'}>
              {importResult?.success ? 'Import Successful' : 'Import Failed'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {importResult?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setImportResult(null)}>
              {importResult?.success ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Done
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Close
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default M3UUpload;
