import React, { useState, useEffect } from "react";
import { Form } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FormBuilderComponent from "../components/FormBuilder";

export default function EditForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          setForm(foundForm);
        } else {
          navigate(createPageUrl("MyForms"));
        }
      } else {
        navigate(createPageUrl("MyForms"));
      }
    } catch (error) {
      console.error("Error loading form:", error);
      navigate(createPageUrl("MyForms"));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      await Form.update(form.id, formData);
      navigate(createPageUrl("MyForms"));
    } catch (error) {
      console.error("Error updating form:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="neu-card p-8">
          <div className="animate-pulse text-gray-600">Loading form...</div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="neu-card p-6">
        <div className="text-center py-8">
          <h2 className="text-lg font-semibold text-gray-800">Form not found</h2>
          <p className="text-gray-600 mt-2">The form you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="neu-card p-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Form</h1>
        <p className="text-gray-600 mt-2">Make changes to "{form.title}"</p>
      </div>

      <FormBuilderComponent 
        initialForm={form} 
        onSave={handleSave} 
        saving={saving} 
        isEditing={true}
      />
    </div>
  );
}