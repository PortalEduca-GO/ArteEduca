
import React, { useState, useEffect } from "react";
import { Form, Submission, User } from "@/api/entities";
import { Download, Eye, Filter, Search, X, Trash2, LogIn } from "lucide-react";
import { format } from "date-fns";

export default function FormData() {
  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      if (userData.email === "dev@localhost.com" || userData.app_role === "admin") {
        setIsAuthenticated(true);
        loadData();
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("User not authenticated:", error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const callbackUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
      await User.loginWithRedirect(callbackUrl);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const loadData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const formId = urlParams.get('id');
      
      if (formId) {
        const [forms, submissionsData] = await Promise.all([
          Form.list(),
          Submission.list()
        ]);
        
        const foundForm = forms.find(f => f.id === formId);
        const formSubmissions = submissionsData.filter(s => s.formId === formId);
        
        setForm(foundForm);
        setSubmissions(formSubmissions);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (submissionId) => {
    if (confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      try {
        await Submission.delete(submissionId);
        setSubmissions(prev => prev.filter(s => s.id !== submissionId));
        setSelectedSubmission(null);
      } catch (error) {
        console.error("Error deleting submission:", error);
      }
    }
  };

  const exportToCSV = () => {
    if (!form || !submissions.length) return;

    const headers = ['Submission Date', 'Submitter Name', 'Submitter Email'];
    form.fields?.forEach(field => {
      headers.push(field.label);
    });

    const rows = submissions.map(submission => {
      const row = [
        format(new Date(submission.created_date), 'yyyy-MM-dd HH:mm'),
        submission.submitterName || 'Anonymous',
        submission.submitterEmail || 'N/A'
      ];
      
      form.fields?.forEach(field => {
        const value = submission.data[field.id];
        row.push(Array.isArray(value) ? value.join(', ') : (value || 'N/A'));
      });
      
      return row;
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title}_submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!form || !submissions.length) return;

    // Create HTML content for PDF-like document
    const submissionsHtml = submissions.map(submission => {
      const formDataHtml = form.fields?.map(field => {
        const value = submission.data[field.id];
        const displayValue = Array.isArray(value) ? value.join(', ') : (value || 'Not provided');
        return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e9ecef; font-weight: bold;">${field.label}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e9ecef;">${displayValue}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="page-break-inside: avoid; margin-bottom: 30px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Submission ${submission.id}</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${format(new Date(submission.created_date), 'yyyy-MM-dd HH:mm')}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Submitter:</strong> ${submission.submitterName || 'Anonymous'}</p>
          <p style="margin: 5px 0 15px 0; color: #666;"><strong>Email:</strong> ${submission.submitterEmail || 'N/A'}</p>
          <table style="width: 100%; border-collapse: collapse;">
            ${formDataHtml}
          </table>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <title>${form.title} - Submissions Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${form.title}</h1>
            <p>Submissions Report - Generated on ${new Date().toLocaleDateString()}</p>
            <p>Total Submissions: ${submissions.length}</p>
          </div>
          ${submissionsHtml}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title}_submissions.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSubmissions = submissions.filter(submission => {
    const submitterName = submission.submitterName || '';
    const submitterEmail = submission.submitterEmail || '';
    const searchData = Object.values(submission.data).join(' ').toLowerCase();
    
    return submitterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           submitterEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
           searchData.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="neu-card p-6 sm:p-8">
          <div className="animate-pulse text-gray-600">Loading data...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="neu-card p-4 sm:p-6 max-w-md mx-auto mt-8 sm:mt-20">
        <div className="text-center py-6 sm:py-8">
          <div className="neu-raised p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center">
            <LogIn className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Admin Access Required</h2>
          <p className="text-gray-600 mt-2 mb-6">You need to be logged in as an admin to view form submissions.</p>
          <button
            onClick={handleLogin}
            className="neu-button px-6 py-3 rounded-xl text-gray-700 hover:text-gray-900 font-medium"
          >
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="neu-card p-4 sm:p-6">
        <div className="text-center py-6 sm:py-8">
          <h2 className="text-lg font-semibold text-gray-800">Form not found</h2>
          <p className="text-gray-600 mt-2">The form you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="neu-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Form Data</h1>
            <p className="text-gray-600 mt-1">Submissions for "{form.title}"</p>
            <p className="text-sm text-gray-500 mt-1">Logged in as: {user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              disabled={!submissions.length}
              className="neu-button px-4 py-3 rounded-xl flex items-center justify-center space-x-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              <span>CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              disabled={!submissions.length}
              className="neu-button px-4 py-3 rounded-xl flex items-center justify-center space-x-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="neu-card p-4 sm:p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="neu-input w-full pl-10 pr-4 py-3 text-gray-700 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Submissions */}
      <div className="neu-card p-4 sm:p-6">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="neu-raised p-6 sm:p-8 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center">
              <Eye className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No submissions found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search criteria" : "No one has submitted this form yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="neu-inset p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <div className="font-medium text-gray-800 mb-1 sm:mb-0">
                        {submission.submitterName || 'Anonymous'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(submission.created_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {submission.submitterEmail || 'No email provided'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {form.fields?.slice(0, 2).map(field => {
                        const value = submission.data[field.id];
                        return (
                          <div key={field.id} className="mb-1">
                            <span className="font-medium">{field.label}:</span> {
                              Array.isArray(value) ? value.join(', ') : (value || 'N/A')
                            }
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="neu-button px-4 py-2 rounded-lg text-gray-600 hover:text-gray-800"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => deleteSubmission(submission.id)}
                      className="neu-button p-2 rounded-lg text-white hover:text-white"
                      title="Delete Submission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="neu-card p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Submission Details</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => deleteSubmission(selectedSubmission.id)}
                  className="neu-button p-2 rounded-lg text-white hover:text-white"
                  title="Delete Submission"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="neu-button p-2 rounded-lg text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                  <p className="text-gray-600">{format(new Date(selectedSubmission.created_date), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Submitter</label>
                  <p className="text-gray-600">{selectedSubmission.submitterName || 'Anonymous'}</p>
                </div>
              </div>

              <div className="space-y-4">
                {form.fields?.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <div className="neu-inset p-3 rounded-lg">
                      <p className="text-gray-700 break-words">
                        {Array.isArray(selectedSubmission.data[field.id]) 
                          ? selectedSubmission.data[field.id].join(', ')
                          : (selectedSubmission.data[field.id] || 'No response')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
