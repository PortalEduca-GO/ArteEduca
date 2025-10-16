
import React, { useState, useEffect } from "react";
import { Form, Submission, User } from "@/api/entities";
import { SendEmail, GenerateImage, UploadFile } from "@/api/integrations"; // Added 'UploadFile'
import { Send, Eye, Lock, Star, UploadCloud, Loader2 } from "lucide-react"; // Added 'Star', 'UploadCloud', 'Loader2'
import SignaturePad from '../components/SignaturePad'; // Added SignaturePad import

export default function FormView() {
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [fileUploads, setFileUploads] = useState({}); // New state for file uploads

  // Helper function for creating page URLs, assuming client-side routing.
  // Adjust based on your actual routing setup (e.g., react-router, hash routing)
  const createPageUrl = (path) => {
    // If your app uses hash routing (e.g., example.com/#/FormView?id=...), you might need:
    // return `/#/${path}`;
    // For standard path routing (e.g., example.com/FormView?id=...), a direct path is common.
    // This assumes the path argument is a component/page identifier.
    return path.startsWith('/') ? path : `/${path}`;
  };

  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const formId = urlParams.get('id');
      
      if (formId) {
        const forms = await Form.list();
        const foundForm = forms.find(f => f.id === formId);
        if (foundForm) {
          if (!foundForm.settings?.isPublic && foundForm.settings?.password) {
            setShowPasswordPrompt(true);
          }
          setForm(foundForm);
        }
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === form.settings?.password) {
      setShowPasswordPrompt(false);
    } else {
      alert("Incorrect password");
    }
  };

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  const handleFileUpload = async (fieldId, file) => {
    if (!file) return;
    setFileUploads(prev => ({...prev, [fieldId]: { uploading: true, progress: 0 }}));
    try {
        const { file_url } = await UploadFile({ file });
        handleInputChange(fieldId, file_url);
        setFileUploads(prev => ({...prev, [fieldId]: { uploading: false, url: file_url }}));
    } catch(err) {
        console.error("File upload error:", err);
        setFileUploads(prev => ({...prev, [fieldId]: { uploading: false, error: "Upload failed" }}));
    }
  }

  const generateSubmissionPDF = async (submission) => {
    try {
      // Create HTML content for PDF generation
      const formDataHtml = form.fields?.map(field => {
        const value = submission.data[field.id];
        const displayValue = Array.isArray(value) ? value.join(', ') : (value || 'Not provided');
        return `
          <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
            <strong style="color: #333; display: block; margin-bottom: 5px;">${field.label}${field.required ? ' *' : ''}</strong>
            <span style="color: #666;">${displayValue}</span>
          </div>
        `;
      }).join('');

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e9ecef;">
            <h1 style="color: #333; margin-bottom: 10px;">${form.title}</h1>
            ${form.description ? `<p style="color: #666; font-size: 16px;">${form.description}</p>` : ''}
          </div>
          
          <div style="margin-bottom: 25px;">
            <h3 style="color: #333; margin-bottom: 15px;">Submission Details</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date(submission.created_date).toLocaleString()}</p>
              <p style="margin: 5px 0;"><strong>Submitter:</strong> ${submission.submitterName || 'Anonymous'}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${submission.submitterEmail || 'Not provided'}</p>
            </div>
          </div>
          
          <div>
            <h3 style="color: #333; margin-bottom: 15px;">Form Responses</h3>
            ${formDataHtml}
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666; font-size: 12px;">
            Generated by FormForge • ${new Date().toLocaleDateString()}
          </div>
        </div>
      `;

      // Use GenerateImage integration to create PDF-like image (since we don't have direct PDF generation)
      const pdfPrompt = `Create a professional form submission document with the following content: ${form.title} - ${form.description || ''} submitted by ${submission.submitterName || 'Anonymous'} on ${new Date(submission.created_date).toLocaleDateString()}. Include all form field responses in a clean, organized layout.`;
      
      const { url: pdfImageUrl } = await GenerateImage({ prompt: pdfPrompt });
      
      return pdfImageUrl;
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    }
  };

  const sendNotificationEmail = async (submission, pdfUrl) => { // Added pdfUrl parameter
    try {
      const formDataText = Object.entries(submission.data).map(([key, value]) => {
        const field = form.fields?.find(f => f.id === key);
        const fieldLabel = field?.label || key;
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        return `${fieldLabel}: ${displayValue}`;
      }).join('\n');

      const formUrl = `${window.location.origin}${createPageUrl(`FormView?id=${form.id}`)}`;
      const dataUrl = `${window.location.origin}${createPageUrl(`FormData?id=${form.id}`)}`;

      const emailSubject = `New Form Submission: ${form.title}`;
      
      const emailBody = `
You have received a new submission for your form "${form.title}".

Submission Details:
- Submitted at: ${new Date(submission.created_date).toLocaleString()}
- Submitter: ${submission.submitterName || 'Anonymous'}
- Email: ${submission.submitterEmail || 'Not provided'}

Form Data:
${formDataText}

Actions:
- View form: ${formUrl}
- View all submissions: ${dataUrl}
- Download Submission PDF: ${pdfUrl || 'Not available'}

This submission has been automatically saved to your FormForge dashboard.

Best regards,
FormForge Team
      `;

      await SendEmail({
        to: "book.drivepal@gmail.com",
        subject: emailSubject,
        body: emailBody,
        from_name: "FormForge"
      });

      console.log("Email notification sent successfully");
    } catch (error) {
      console.error("Error sending notification email:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const submission = await Submission.create({
        formId: form.id,
        data: formData,
        submitterEmail: formData.email || null,
        submitterName: formData.name || null
      });

      console.log("Form submitted successfully:", submission);
      
      const pdfUrl = await generateSubmissionPDF(submission); // Generate PDF

      // Send email notification
      await sendNotificationEmail(submission, pdfUrl); // Pass pdfUrl to email function

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting your form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const baseClasses = "neu-input w-full px-4 py-3 text-gray-700 placeholder-gray-500";
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone': // New field type
      case 'url': // New field type
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className={baseClasses}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            rows={4}
            className={`${baseClasses} resize-none`}
          />
        );
      
      case 'dropdown':
        return (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className={baseClasses}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(formData[field.id] || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = formData[field.id] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option);
                    handleInputChange(field.id, newValues);
                  }}
                  className="neu-input w-5 h-5"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'radio': // New field type
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="neu-input w-5 h-5"
                  required={field.required}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
      case 'datetime-local': // New field type
        return (
          <input
            type={field.type}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className={baseClasses}
          />
        );

      case 'rating': // New field type
        return (
          <div className="flex space-x-1">
            {[...Array(field.maxRating || 5)].map((_, i) => {
              const ratingValue = i + 1;
              return (
                <label key={i}>
                  <input
                    type="radio"
                    name={field.id}
                    value={ratingValue}
                    onClick={() => handleInputChange(field.id, ratingValue)}
                    className="sr-only"
                    required={field.required} // Rating might be required
                  />
                  <Star
                    className={`cursor-pointer w-8 h-8 transition-colors ${
                      ratingValue <= (formData[field.id] || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </label>
              );
            })}
          </div>
        );

      case 'image': // New field type (for image choice)
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((option, index) => (
              <label key={index} className={`neu-button rounded-lg p-2 cursor-pointer ${formData[field.id] === option ? 'neu-pressed' : ''}`}>
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  className="sr-only"
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  required={field.required}
                />
                <img src={option} alt={`Option ${index + 1}`} className="w-24 h-24 object-cover rounded-md" />
              </label>
            ))}
          </div>
        );

      case 'file': // New field type (for file upload)
        const uploadState = fileUploads[field.id] || {};
        return (
            <div>
                <input
                    id={field.id}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(field.id, e.target.files[0])}
                    accept={field.allowedFileTypes}
                    required={field.required}
                />
                <label htmlFor={field.id} className="neu-button w-full flex items-center justify-center p-4 rounded-lg cursor-pointer">
                    {uploadState.uploading ? (
                       <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                       <><UploadCloud className="w-5 h-5 mr-2" /> <span>{field.buttonText || field.label}</span></>
                    )}
                </label>
                {uploadState.url && <p className="text-green-600 text-sm mt-2">Upload complete! <a href={uploadState.url} target="_blank" rel="noopener noreferrer" className="underline">View file</a></p>}
                {uploadState.error && <p className="text-red-600 text-sm mt-2">{uploadState.error}</p>}
                {field.description && <p className="text-gray-500 text-xs mt-1">{field.description}</p>}
            </div>
        );

      case 'signature': // New field type
        return <SignaturePad fieldId={field.id} onChange={handleInputChange} initialValue={formData[field.id]} required={field.required} />;

      case 'statement': // New field type (for display text)
        return <p className="text-gray-700 p-2 neu-inset rounded-lg">{field.statementText}</p>;

      case 'button': // New field type (for custom action buttons, not tied to submission)
        return (
          <button type="button" className="neu-button w-full py-3 rounded-lg">
            {field.buttonText}
          </button>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="neu-card p-6 sm:p-8 max-w-md mx-auto">
          <div className="animate-pulse text-gray-600">Loading form...</div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="neu-card p-4 sm:p-6 max-w-md mx-auto mt-8 sm:mt-20">
        <div className="text-center py-6 sm:py-8">
          <h2 className="text-lg font-semibold text-gray-800">Form not found</h2>
          <p className="text-gray-600 mt-2">The form you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (showPasswordPrompt) {
    return (
      <div className="neu-card p-4 sm:p-6 max-w-md mx-auto mt-8 sm:mt-20">
        <div className="text-center mb-6">
          <div className="neu-raised p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Password Required</h2>
          <p className="text-gray-600 mt-2">This form is password protected.</p>
        </div>
        
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="neu-input w-full px-4 py-3 text-gray-700 placeholder-gray-500"
          />
          <button
            onClick={handlePasswordSubmit}
            className="neu-button w-full py-3 rounded-xl text-gray-700 hover:text-gray-900 font-medium"
          >
            Access Form
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="neu-card p-4 sm:p-6 max-w-md mx-auto mt-8 sm:mt-20">
        <div className="text-center py-6 sm:py-8">
          <div className="neu-raised p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center">
            <Send className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Thank you!</h2>
          <p className="text-gray-600 mt-2">Your response has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" style={{ backgroundColor: form.styling?.backgroundColor || '#e0e0e0' }}>
      <div className="neu-card p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-gray-600">{form.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {form.fields?.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="neu-button w-full py-4 rounded-xl text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
