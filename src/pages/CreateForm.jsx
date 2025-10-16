import React, { useState } from "react";
import { Form } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FormBuilder from "../components/FormBuilder";

export default function CreateForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const newForm = await Form.create(formData);
      navigate(createPageUrl("MyForms"));
    } catch (error) {
      console.error("Error creating form:", error);
      alert("Error creating form. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="neu-card p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Create New Form</h1>
        <p className="text-gray-600 mt-1">Build your form with drag-and-drop simplicity</p>
      </div>

      <FormBuilder onSave={handleSave} saving={saving} />
    </div>
  );
}