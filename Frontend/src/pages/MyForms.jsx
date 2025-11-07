
import React, { useState, useEffect, useCallback } from "react";
import { Form, Submission, User } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus,
  Edit,
  Eye,
  Copy,
  Trash2,
  Share,
  BarChart3,
  Search,
  Filter,
  FileText
} from "lucide-react";
import { format } from "date-fns";

export default function MyForms() {
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [formsData, submissionsData] = await Promise.all([
        Form.list("-created_date"),
        Submission.list()
      ]);
      setForms(formsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuthentication = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(userData.email === "dev@localhost.com" || userData.app_role === "admin");
      loadData();
    } catch (error) {
      console.error("User not authenticated:", error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const handleLogin = async () => {
    try {
      const callbackUrl = `${window.location.origin}${window.location.pathname}`;
      await User.loginWithRedirect(callbackUrl);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const getSubmissionCount = (formId) => {
    return submissions.filter(sub => sub.formId === formId).length;
  };

  const duplicateForm = async (form) => {
    if (!isAdmin) return;
    try {
      const duplicatedForm = {
        ...form,
        title: `${form.title} (Copy)`,
        id: undefined,
        created_date: undefined,
        updated_date: undefined
      };
      delete duplicatedForm.id;
      delete duplicatedForm.created_date;
      delete duplicatedForm.updated_date;

      await Form.create(duplicatedForm);
      loadData();
    } catch (error) {
      console.error("Error duplicating form:", error);
    }
  };

  const deleteForm = async (formId) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to delete this form? This action cannot be undone.")) {
      try {
        await Form.delete(formId);
        loadData();
      } catch (error) {
        console.error("Error deleting form:", error);
      }
    }
  };

  const toggleFormStatus = async (form) => {
    if (!isAdmin) return;
    try {
      await Form.update(form.id, { isActive: !form.isActive });
      loadData();
    } catch (error) {
      console.error("Error updating form status:", error);
    }
  };

  const copyFormLink = (formId) => {
    const url = `${window.location.origin}${createPageUrl(`FormView?id=${formId}`)}`;
    navigator.clipboard.writeText(url);
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" ||
                         (filterStatus === "active" && form.isActive) ||
                         (filterStatus === "inactive" && !form.isActive);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="neu-card p-6 sm:p-8">
          <div className="animate-pulse text-gray-600">Loading forms...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="neu-card p-4 sm:p-6 max-w-md mx-auto mt-8 sm:mt-20">
        <div className="text-center py-6 sm:py-8">
          <div className="neu-raised p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Access Required</h2>
          <p className="text-gray-600 mt-2 mb-6">You need to be logged in to manage forms.</p>
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

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="neu-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Forms</h1>
            <p className="text-gray-600 mt-1">Manage and track your form collection</p>
          </div>
          <Link
            to={createPageUrl("CreateForm")}
            className="neu-button px-4 py-3 rounded-xl flex items-center justify-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            <Plus className="w-5 h-5" />
            <span>Create Form</span>
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="neu-card p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neu-input w-full pl-10 pr-4 py-3 text-gray-700 placeholder-gray-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="neu-input px-4 py-3 text-gray-700 flex-1"
            >
              <option value="all">All Forms</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="neu-card p-4 sm:p-6">
        {filteredForms.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="neu-raised p-6 sm:p-8 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center">
              <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No forms found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Create your first form to get started"}
            </p>
            <Link
              to={createPageUrl("CreateForm")}
              className="neu-button px-6 py-4 rounded-xl inline-flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Form</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredForms.map((form) => (
              <div key={form.id} className="neu-inset p-4 sm:p-6 rounded-xl">
                <div className="flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1 sm:mb-0">{form.title}</h3>
                        {isAdmin && (
                          <button
                            onClick={() => toggleFormStatus(form)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors self-start ${
                              form.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {form.isActive ? 'Active' : 'Inactive'}
                          </button>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3">{form.description}</p>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <span>Created {format(new Date(form.created_date), 'MMM d, yyyy')}</span>
                        <span>{getSubmissionCount(form.id)} submissions</span>
                        <span>{form.fields?.length || 0} fields</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={createPageUrl(`FormView?id=${form.id}`)}
                      className="neu-button p-2 rounded-lg text-gray-600 hover:text-gray-800"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {isAdmin && (
                      <Link
                        to={createPageUrl(`FormData?id=${form.id}`)}
                        className="neu-button p-2 rounded-lg text-gray-600 hover:text-gray-800"
                        title="View Data"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Link>
                    )}

                    <button
                      onClick={() => copyFormLink(form.id)}
                      className="neu-button p-2 rounded-lg text-gray-600 hover:text-gray-800"
                      title="Copy Link"
                    >
                      <Share className="w-4 h-4" />
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => duplicateForm(form)}
                          className="neu-button p-2 rounded-lg text-gray-600 hover:text-gray-800"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <Link
                          to={createPageUrl(`EditForm?id=${form.id}`)}
                          className="neu-button px-3 py-2 rounded-lg text-white hover:text-white"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>

                        <button
                          onClick={() => deleteForm(form.id)}
                          className="neu-button p-2 rounded-lg text-red-600 hover:text-red-800"
                          title="Delete Form"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
