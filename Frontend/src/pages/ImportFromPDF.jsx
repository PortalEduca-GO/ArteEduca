import React, { useState, useCallback } from "react";
import { Form } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadCloud, File, BarChart, Check, X, Loader2 } from "lucide-react";

const StatusIcon = ({ status }) => {
  switch (status) {
    case "uploading":
    case "processing":
      return <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />;
    case "success":
      return <Check className="w-8 h-8 text-green-600" />;
    case "error":
      return <X className="w-8 h-8 text-red-600" />;
    default:
      return <UploadCloud className="w-8 h-8 text-gray-500" />;
  }
};

export default function ImportFromPDF() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, uploading, processing, success, error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (selectedFile) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
      handleUpload(selectedFile);
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleUpload = async (fileToUpload) => {
    setStatus("uploading");
    setProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 200);

      const { file_url } = await UploadFile({ file: fileToUpload });
      clearInterval(progressInterval);
      setProgress(100);

      setStatus("processing");
      
      const formSchema = Form.schema();
      const extractionSchema = {
        ...formSchema,
        properties: {
          ...formSchema.properties,
          title: { type: "string", description: "The title of the form, extracted from the PDF." },
          fields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "A unique ID for the field (e.g., 'field_1')." },
                type: { type: "string", enum: ["text", "email", "dropdown", "checkbox", "date", "textarea"], description: "The type of form field." },
                label: { type: "string", description: "The label text associated with the field." },
                placeholder: { type: "string", description: "Generic placeholder text for the field - DO NOT include any personal data, license numbers, or specific values from the PDF. Use generic placeholders like 'Enter text here', 'Select option', etc." },
                required: { type: "boolean", description: "Whether the field is required." },
                options: { type: "array", items: { type: "string" }, description: "Options for dropdown or checkbox fields." }
              },
              required: ["id", "type", "label"]
            }
          }
        },
        required: ["title", "fields"]
      };

      const result = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: extractionSchema
      });

      if (result.status === "success" && result.output) {
        // Clean up any personal data from placeholders
        const cleanedForm = {
          ...result.output,
          fields: result.output.fields?.map(field => ({
            ...field,
            placeholder: getGenericPlaceholder(field.type, field.label)
          }))
        };

        setStatus("success");
        const newForm = await Form.create(cleanedForm);
        navigate(createPageUrl(`EditForm?id=${newForm.id}`));
      } else {
        throw new Error(result.details || "Could not extract form data from the PDF.");
      }

    } catch (err) {
      setStatus("error");
      setError(err.message);
      console.error(err);
    }
  };

  const getGenericPlaceholder = (fieldType, label) => {
    switch (fieldType) {
      case 'text':
        return `Enter ${label.toLowerCase()}`;
      case 'email':
        return 'Enter your email address';
      case 'textarea':
        return `Enter ${label.toLowerCase()} details`;
      case 'date':
        return 'Select date';
      case 'dropdown':
        return 'Select an option';
      default:
        return `Enter ${label.toLowerCase()}`;
    }
  };

  const statusMessages = {
    idle: "Drag & drop your PDF here or click to select",
    uploading: "Uploading PDF...",
    processing: "Analyzing PDF and generating form...",
    success: "Form created successfully! Redirecting...",
    error: "An error occurred. Please try again."
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="neu-card p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Import from PDF</h1>
        <p className="text-gray-600 mt-1">Automatically create a form from a PDF file</p>
      </div>

      {/* Upload Zone */}
      <div className="neu-card p-4 sm:p-6">
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 transition-all duration-300 ${
            dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
          }`}
        >
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileChange(e.target.files[0])}
            className="hidden"
            disabled={status === 'uploading' || status === 'processing'}
          />
          <label htmlFor="pdf-upload" className="cursor-pointer">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className={`neu-raised p-3 sm:p-4 rounded-full transition-all ${
                status === 'error' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                <StatusIcon status={status} />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800">{statusMessages[status]}</h3>
              
              {status === 'idle' && (
                <p className="text-sm text-gray-500">Max file size: 10MB</p>
              )}
              
              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
              )}
              
              {(status === 'uploading' || status === 'processing') && (
                <div className="w-full max-w-sm">
                  <div className="neu-inset rounded-full h-3 sm:h-4 p-1">
                    <div
                      className="bg-blue-600 h-1 sm:h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {file && status !== 'uploading' && status !== 'processing' && (
                <div className="neu-inset p-3 rounded-lg flex items-center space-x-2">
                  <File className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800 truncate">{file.name}</span>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}