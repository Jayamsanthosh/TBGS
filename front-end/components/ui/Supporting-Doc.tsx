"use client";

import React from "react";
import { Upload, FileText, Trash2 } from "lucide-react";

export interface FileData {
  id: string | number;
  documentType: string;
  descriptionDetails: string;
  fileName: string;
  contentType: string;
  contentData: string;
  remarks: string;
  sizeMB?: string;
}

interface SupportingDocProps {
  files: FileData[];
  onFilesChange: (files: FileData[]) => void;
}

export function SupportingDoc({ files, onFilesChange }: SupportingDocProps) {
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    processFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = (newFiles: File[]) => {
    const currentFiles = [...files];
    let filesProcessed = 0;

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(",")[1];
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

        const newFileData: FileData = {
          id: Date.now() + Math.random(),
          documentType: "Other",
          descriptionDetails: file.name,
          fileName: file.name,
          contentType: file.type,
          contentData: base64String,
          remarks: "",
          sizeMB: fileSizeMB,
        };
        currentFiles.push(newFileData);
        filesProcessed++;

        if (filesProcessed === newFiles.length) {
          onFilesChange(currentFiles);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="bg-white rounded-[24px] border p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      <h3 className="text-[17px] font-bold text-slate-800 mb-6 tracking-tight">Supporting Documents</h3>

      <div
        className="w-full flex flex-col items-center justify-center py-14 px-10 border-2 border-dashed border-slate-200/80 rounded-[20px] bg-slate-50/30 mb-8 relative hover:border-primary/30 transition-colors group"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={handleFileDrop}
      >
        <input
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileInput}
        />
        <div className="w-[52px] h-[52px] bg-white rounded-[14px] flex items-center justify-center text-slate-400 mb-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 group-hover:scale-105 transition-transform duration-300 group-hover:text-primary">
          <Upload className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <p className="font-bold text-slate-800 text-[15px] mb-1.5">Click to upload or drag and drop</p>
        <p className="text-slate-400 text-[13px] font-medium">PDF, JPG, PNG up to 10MB</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
            SELECTED FILES ({files.length})
          </p>
          <div className="space-y-3">
            {files.map((f, index) => {
              const sizeStr = f.sizeMB
                ? `${f.sizeMB} MB`
                : f.contentData
                ? `${((f.contentData.length * 0.75) / (1024 * 1024)).toFixed(2)} MB`
                : "0.01 MB";
              return (
                <div
                  key={f.id || (f as any).SNO || index}
                  className="flex items-center justify-between p-4 border border-slate-200/70 rounded-[14px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-emerald-100/50 rounded-[10px] flex items-center justify-center text-emerald-500 bg-emerald-50/50 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[15px] font-bold text-slate-800 leading-tight">
                        {f.fileName || "Unnamed File"}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{sizeStr}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
                    className="text-red-300 hover:text-red-500 transition-colors p-2 shrink-0 mr-1"
                    type="button"
                  >
                    <Trash2 className="w-[18px] h-[18px]" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
