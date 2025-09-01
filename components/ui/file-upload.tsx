"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  className?: string
  children?: React.ReactNode
}

interface UploadedFile {
  file: File
  status: "uploading" | "success" | "error"
  progress: number
  error?: string
  url?: string
}

export function FileUpload({
  onUpload,
  accept = { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  className = "",
  children,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.slice(0, maxFiles - files.length).map((file) => ({
        file,
        status: "uploading" as const,
        progress: 0,
      }))

      setFiles((prev) => [...prev, ...newFiles])

      try {
        await onUpload(acceptedFiles)

        setFiles((prev) =>
          prev.map((f) => (newFiles.some((nf) => nf.file === f.file) ? { ...f, status: "success", progress: 100 } : f)),
        )
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            newFiles.some((nf) => nf.file === f.file)
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        )
      }
    },
    [files.length, maxFiles, onUpload],
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
    maxSize,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input {...getInputProps()} />
          {children || (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                {isDragActive ? "Drop files here" : "Drag & drop files here, or click to select"}
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
              </p>
            </>
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {uploadedFile.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                {uploadedFile.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                {uploadedFile.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                <p className="text-xs text-muted-foreground">{(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                {uploadedFile.status === "uploading" && <Progress value={uploadedFile.progress} className="mt-1" />}
                {uploadedFile.status === "error" && uploadedFile.error && (
                  <Alert variant="destructive" className="mt-1">
                    <AlertDescription className="text-xs">{uploadedFile.error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
