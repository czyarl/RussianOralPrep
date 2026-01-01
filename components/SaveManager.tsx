import React, { useRef, useState } from 'react';
import { X, Download, Upload, Trash2, AlertTriangle, FileJson, Save } from 'lucide-react';
import { exportSaveData, importSaveData, resetHistory } from '../services/storage';

interface Props {
  onClose: () => void;
}

const SaveManager: React.FC<Props> = ({ onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = () => {
    const data = exportSaveData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create link and click it
    const a = document.createElement('a');
    a.href = url;
    // Format: russian-prep-save-YYYY-MM-DD.json
    const date = new Date().toISOString().split('T')[0];
    a.download = `russian-prep-save-${date}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
            const success = importSaveData(content);
            if (success) {
                alert("存档读取成功！即将刷新页面...");
                window.location.reload();
            } else {
                setError("无法读取存档文件，格式可能已损坏。");
            }
        }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleReset = () => {
      const confirmText = "警告：此操作不可撤销！\n\n这将清空所有的学习记录和自定义答案。\n\n建议先点击【导出存档】进行备份。";
      if (window.confirm(confirmText)) {
          resetHistory();
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Save size={20} />
                <h2 className="font-bold text-lg">存档管理</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {/* Export */}
                <button 
                    onClick={handleDownload}
                    className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition-all group"
                >
                    <div className="flex flex-col items-start">
                        <span className="font-bold flex items-center gap-2">
                            <Download size={18} />
                            导出存档 (备份)
                        </span>
                        <span className="text-xs text-blue-500/80 mt-1">保存当前进度到文件</span>
                    </div>
                    <FileJson className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Import */}
                <button 
                    onClick={handleUploadClick}
                    className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition-all group"
                >
                    <div className="flex flex-col items-start">
                        <span className="font-bold flex items-center gap-2">
                            <Upload size={18} />
                            读取存档
                        </span>
                        <span className="text-xs text-emerald-500/80 mt-1">从文件恢复进度</span>
                    </div>
                    <FileJson className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden" 
                />
            </div>

            <div className="border-t border-gray-100 pt-6">
                <button 
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                    <Trash2 size={16} />
                    清空所有数据 (重来)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SaveManager;