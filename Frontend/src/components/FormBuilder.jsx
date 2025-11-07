import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Plus, 
  Type, 
  Mail, 
  List, 
  CheckSquare, 
  Calendar, 
  FileText, 
  Eye,
  Trash2,
  Settings,
  Palette,
  Save,
  Phone,
  Clock,
  Link as LinkIcon,
  ListChecks,
  Star,
  Image as ImageIcon,
  UploadCloud,
  PenTool,
  MessageSquare,
  MousePointerClick,
  GripVertical,
  Edit
} from "lucide-react";

const fieldTypes = [
  { type: 'text', label: 'Short Text', icon: Type },
  { type: 'textarea', label: 'Long Text', icon: FileText },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone Number', icon: Phone },
  { type: 'url', label: 'Website URL', icon: LinkIcon },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'datetime-local', label: 'Date & Time Picker', icon: Clock },
  { type: 'dropdown', label: 'Dropdown Menu', icon: List },
  { type: 'radio', label: 'Multiple Choice', icon: ListChecks },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'rating', label: 'Rating Scale', icon: Star },
  { type: 'image', label: 'Image Choices', icon: ImageIcon },
  { type: 'file', label: 'File Upload', icon: UploadCloud },
  { type: 'signature', label: 'Signature Field', icon: PenTool },
  { type: 'statement', label: 'Statement', icon: MessageSquare },
  { type: 'button', label: 'Button', icon: MousePointerClick },
];

export default function FormBuilder({ initialForm, onSave, saving, isEditing = false }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    fields: [],
    styling: {
      primaryColor: '#6b73ff',
      backgroundColor: '#e0e0e0',
      font: 'Inter'
    },
    settings: {
      isPublic: true,
      password: '',
      emailNotifications: true
    }
  });

  const [activeTab, setActiveTab] = useState('builder');
  const [selectedField, setSelectedField] = useState(null);

  useEffect(() => {
    if (initialForm) {
      setForm(initialForm);
    }
  }, [initialForm]);

  const addField = (type) => {
    const fieldTypeData = fieldTypes.find(f => f.type === type);
    const newField = {
      id: Date.now().toString(),
      type,
      label: fieldTypeData?.label || 'New Field',
      placeholder: getDefaultPlaceholder(type),
      required: false,
      helpText: '',
      options: ['dropdown', 'checkbox', 'radio', 'image'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
      buttonText: type === 'button' ? 'Click Me' : undefined,
      statementText: type === 'statement' ? 'This is a statement text.' : undefined,
      maxRating: type === 'rating' ? 5 : undefined,
      allowedFileTypes: type === 'file' ? '.pdf,.doc,.docx,.jpg,.png' : undefined,
      validation: getDefaultValidation(type)
    };

    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setSelectedField(newField);
  };

  const getDefaultPlaceholder = (type) => {
    switch (type) {
      case 'text': return 'Enter text here...';
      case 'email': return 'Enter your email address...';
      case 'phone': return 'Enter your phone number...';
      case 'url': return 'Enter website URL...';
      case 'textarea': return 'Enter your message here...';
      case 'date': return 'Select date';
      case 'datetime-local': return 'Select date and time';
      case 'dropdown': return 'Select an option...';
      case 'file': return 'Click to upload file';
      default: return 'Enter value...';
    }
  };

  const getDefaultValidation = (type) => {
    switch (type) {
      case 'email': return { pattern: 'email' };
      case 'phone': return { pattern: 'phone' };
      case 'url': return { pattern: 'url' };
      default: return {};
    }
  };

  const updateField = (fieldId, updates) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
    
    if (selectedField?.id === fieldId) {
      setSelectedField(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteField = (fieldId) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(form.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setForm(prev => ({
      ...prev,
      fields: items
    }));
  };

  const addOption = (fieldId) => {
    const field = form.fields.find(f => f.id === fieldId);
    if (field) {
      updateField(fieldId, {
        options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`]
      });
    }
  };

  const updateOption = (fieldId, optionIndex, value) => {
    const field = form.fields.find(f => f.id === fieldId);
    if (field) {
      const newOptions = [...(field.options || [])];
      newOptions[optionIndex] = value;
      updateField(fieldId, { options: newOptions });
    }
  };

  const removeOption = (fieldId, optionIndex) => {
    const field = form.fields.find(f => f.id === fieldId);
    if (field && field.options && field.options.length > 1) {
      const newOptions = field.options.filter((_, index) => index !== optionIndex);
      updateField(fieldId, { options: newOptions });
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      alert('Please enter a form title');
      return;
    }
    onSave(form);
  };

  const renderFieldPreview = (field) => {
    const baseClasses = "neu-input w-full px-4 py-3 text-gray-700 placeholder-gray-500";
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            disabled
            className={baseClasses}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            disabled
            rows={4}
            className={`${baseClasses} resize-none`}
          />
        );
      
      case 'dropdown':
        return (
          <select disabled className={baseClasses}>
            <option>{field.placeholder || 'Select an option'}</option>
            {field.options?.map((option, index) => (
              <option key={index}>{option}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input type="checkbox" disabled className="neu-input w-5 h-5" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input type="radio" name={field.id} disabled className="neu-input w-5 h-5" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'date':
      case 'datetime-local':
        return (
          <input
            type={field.type}
            disabled
            className={baseClasses}
          />
        );

      case 'rating':
        return (
          <div className="flex space-x-1">
            {[...Array(field.maxRating || 5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-gray-300" />
            ))}
          </div>
        );

      case 'image':
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((option, index) => (
              <div key={index} className="neu-inset p-2 rounded-lg text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm mt-1">Option {index + 1}</p>
              </div>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="neu-button flex items-center justify-center w-full px-4 py-3 rounded-lg">
            <UploadCloud className="w-5 h-5 mr-2" />
            <span>{field.placeholder || 'Upload File'}</span>
          </div>
        );

      case 'signature':
        return (
          <div className="neu-inset w-full h-24 rounded-lg bg-gray-50 border-t border-gray-200 flex items-center justify-center">
            <PenTool className="w-8 h-8 text-gray-400" />
          </div>
        );

      case 'statement':
        return <p className="text-gray-700 p-2 neu-inset rounded-lg">{field.statementText || 'Statement text'}</p>;

      case 'button':
        return (
          <button type="button" disabled className="neu-button w-full py-3 rounded-lg">
            {field.buttonText || 'Button'}
          </button>
        );
      
      default:
        return null;
    }
  };

  const renderFieldEditor = () => {
    if (!selectedField) return null;

    const isOptionField = ['dropdown', 'checkbox', 'radio', 'image'].includes(selectedField.type);
    const requiresOptions = isOptionField;
    const canHaveRequired = !['statement', 'button'].includes(selectedField.type);

    return (
      <div className="neu-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Field Settings</h3>
          <button
            onClick={() => deleteField(selectedField.id)}
            className="neu-button p-2 rounded-lg text-red-600 hover:text-red-800"
            title="Delete Field"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Field Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Label</label>
            <input
              type="text"
              value={selectedField.label}
              onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
              className="neu-input w-full px-4 py-3 text-gray-700"
              placeholder="Enter field label"
            />
          </div>

          {/* Placeholder/Content */}
          {selectedField.type === 'statement' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statement Text</label>
              <textarea
                value={selectedField.statementText || ''}
                onChange={(e) => updateField(selectedField.id, { statementText: e.target.value })}
                className="neu-input w-full px-4 py-3 text-gray-700"
                rows={3}
                placeholder="Enter statement text"
              />
            </div>
          ) : selectedField.type === 'button' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
              <input
                type="text"
                value={selectedField.buttonText || ''}
                onChange={(e) => updateField(selectedField.id, { buttonText: e.target.value })}
                className="neu-input w-full px-4 py-3 text-gray-700"
                placeholder="Enter button text"
              />
            </div>
          ) : !requiresOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder Text</label>
              <input
                type="text"
                value={selectedField.placeholder || ''}
                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                className="neu-input w-full px-4 py-3 text-gray-700"
                placeholder="Enter placeholder text"
              />
            </div>
          )}

          {/* Help Text */}
          {selectedField.type !== 'statement' && selectedField.type !== 'button' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Help Text (Optional)</label>
              <input
                type="text"
                value={selectedField.helpText || ''}
                onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                className="neu-input w-full px-4 py-3 text-gray-700"
                placeholder="Enter help text"
              />
            </div>
          )}

          {/* Required Toggle */}
          {canHaveRequired && (
            <div className="flex items-center justify-between p-3 neu-inset rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800">Required Field</h4>
                <p className="text-sm text-gray-600">Make this field mandatory</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedField.required || false}
                  onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}

          {/* Options for dropdown, checkbox, radio, image */}
          {requiresOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedField.type === 'image' ? 'Image URLs' : 'Options'}
              </label>
              <div className="space-y-2">
                {selectedField.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(selectedField.id, index, e.target.value)}
                      className="neu-input flex-1 px-3 py-2 text-gray-700"
                      placeholder={selectedField.type === 'image' ? 'Image URL' : `Option ${index + 1}`}
                    />
                    {selectedField.options.length > 1 && (
                      <button
                        onClick={() => removeOption(selectedField.id, index)}
                        className="neu-button p-2 rounded-lg text-red-600 hover:text-red-800"
                        title="Remove Option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addOption(selectedField.id)}
                  className="neu-button w-full py-2 rounded-lg text-gray-700 hover:text-gray-900 text-sm flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Option</span>
                </button>
              </div>
            </div>
          )}

          {/* Rating Scale Settings */}
          {selectedField.type === 'rating' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Rating</label>
              <select
                value={selectedField.maxRating || 5}
                onChange={(e) => updateField(selectedField.id, { maxRating: parseInt(e.target.value) })}
                className="neu-input w-full px-4 py-3 text-gray-700"
              >
                {[...Array(9)].map((_, i) => (
                  <option key={i + 2} value={i + 2}>{i + 2} Stars</option>
                ))}
              </select>
            </div>
          )}

          {/* File Upload Settings */}
          {selectedField.type === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
              <input
                type="text"
                value={selectedField.allowedFileTypes || ''}
                onChange={(e) => updateField(selectedField.id, { allowedFileTypes: e.target.value })}
                className="neu-input w-full px-4 py-3 text-gray-700"
                placeholder=".pdf,.doc,.docx,.jpg,.png"
              />
              <p className="text-xs text-gray-500 mt-1">Separate file extensions with commas</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Mobile Tabs */}
      <div className="lg:hidden neu-card p-2">
        <div className="grid grid-cols-3 gap-1">
          {['builder', 'style', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                activeTab === tab
                  ? 'neu-pressed text-blue-600'
                  : 'neu-button text-gray-700 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Builder Panel */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Desktop Tabs */}
          <div className="hidden lg:block neu-card p-2">
            <div className="flex space-x-2">
              {['builder', 'style', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'neu-pressed text-blue-600'
                      : 'neu-button text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {tab === 'builder' && <Settings className="w-4 h-4 mr-2 inline" />}
                  {tab === 'style' && <Palette className="w-4 h-4 mr-2 inline" />}
                  {tab === 'settings' && <Settings className="w-4 h-4 mr-2 inline" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Form Details */}
          <div className="neu-card p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="Enter form title"
                  className="neu-input w-full px-4 py-3 text-gray-700 placeholder-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Enter form description"
                  rows={3}
                  className="neu-input w-full px-4 py-3 text-gray-700 placeholder-gray-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'builder' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Field Types */}
              <div className="neu-card p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Fields</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fieldTypes.map((fieldType) => (
                    <button
                      key={fieldType.type}
                      onClick={() => addField(fieldType.type)}
                      className="neu-button p-3 sm:p-4 rounded-xl flex flex-col items-center space-y-2 text-gray-700 hover:text-gray-900"
                    >
                      <fieldType.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-xs sm:text-sm font-medium text-center">{fieldType.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="neu-card p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Fields</h3>
                
                {form.fields.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Plus className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No fields added yet. Select a field type above to get started.</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="form-fields">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 sm:space-y-4">
                          {form.fields.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`neu-inset p-3 sm:p-4 rounded-xl ${
                                    selectedField?.id === field.id ? 'ring-2 ring-blue-500' : ''
                                  }`}
                                  onClick={() => setSelectedField(field)}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <div {...provided.dragHandleProps} className="cursor-move">
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                      </div>
                                      <span className="font-medium text-gray-800">{field.label}</span>
                                      {field.required && <span className="text-red-500 text-sm">*</span>}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Edit className="w-4 h-4 text-gray-400" />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteField(field.id);
                                        }}
                                        className="text-red-600 hover:text-red-800 p-1"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  {field.helpText && (
                                    <p className="text-sm text-gray-500 mb-2">{field.helpText}</p>
                                  )}
                                  {renderFieldPreview(field)}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            </div>
          )}

          {activeTab === 'style' && (
            <div className="neu-card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Styling</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                    <input
                      type="color"
                      value={form.styling.primaryColor}
                      onChange={(e) => setForm({
                        ...form,
                        styling: {...form.styling, primaryColor: e.target.value}
                      })}
                      className="neu-input w-full h-12 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={form.styling.backgroundColor}
                      onChange={(e) => setForm({
                        ...form,
                        styling: {...form.styling, backgroundColor: e.target.value}
                      })}
                      className="neu-input w-full h-12 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                  <select
                    value={form.styling.font}
                    onChange={(e) => setForm({
                      ...form,
                      styling: {...form.styling, font: e.target.value}
                    })}
                    className="neu-input w-full px-4 py-3 text-gray-700"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="neu-card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">Public Form</h4>
                    <p className="text-sm text-gray-600">Anyone can access this form</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.settings.isPublic}
                      onChange={(e) => setForm({
                        ...form,
                        settings: {...form.settings, isPublic: e.target.checked}
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {!form.settings.isPublic && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={form.settings.password}
                      onChange={(e) => setForm({
                        ...form,
                        settings: {...form.settings, password: e.target.value}
                      })}
                      placeholder="Enter password"
                      className="neu-input w-full px-4 py-3 text-gray-700 placeholder-gray-500"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Get notified of new submissions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.settings.emailNotifications}
                      onChange={(e) => setForm({
                        ...form,
                        settings: {...form.settings, emailNotifications: e.target.checked}
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Live Preview */}
          <div className="neu-card p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Eye className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Live Preview</h3>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">{form.title || 'Untitled Form'}</h4>
                <p className="text-gray-600 text-sm mb-4">{form.description || 'No description'}</p>
              </div>
              
              {form.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.helpText && (
                    <p className="text-xs text-gray-500">{field.helpText}</p>
                  )}
                  {renderFieldPreview(field)}
                </div>
              ))}
            </div>
          </div>

          {/* Field Editor */}
          {selectedField && renderFieldEditor()}
        </div>
      </div>

      {/* Save Button */}
      <div className="neu-card p-4 sm:p-6">
        <button
          onClick={handleSave}
          disabled={saving || !form.title}
          className="neu-button w-full py-4 rounded-xl text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving...' : (isEditing ? 'Update Form' : 'Create Form')}</span>
        </button>
      </div>
    </div>
  );
}