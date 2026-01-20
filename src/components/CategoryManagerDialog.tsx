import { useState, useRef, useEffect } from 'react';
import {
  CustomCategory,
  ExpenseType,
  CATEGORY_COLORS,
  getAvailableIcons,
  generateCategoryId,
  EXPENSE_CATEGORIES,
} from '../types/expenseTracker';
import { MaterialIcon } from './MaterialIcon';
import './CategoryManagerDialog.css';

interface CategoryManagerDialogProps {
  customCategories: CustomCategory[];
  onAddCategory: (category: CustomCategory) => void;
  onUpdateCategory: (category: CustomCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onClose: () => void;
}

export function CategoryManagerDialog({
  customCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onClose,
}: CategoryManagerDialogProps) {
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [customColor, setCustomColor] = useState('');
  const [defaultExpenseType, setDefaultExpenseType] = useState<ExpenseType>('WANT');
  
  // Icon picker state
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  
  // Get icons available for selection (excluding already used ones, but include current icon when editing)
  const availableIcons = getAvailableIcons(
    editingCategory
      ? customCategories.filter(c => c.id !== editingCategory.id)
      : customCategories
  );
  
  // Close icon picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setIsIconPickerOpen(false);
      }
    };
    
    if (isIconPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isIconPickerOpen]);
  
  // Reset form
  const resetForm = () => {
    setName('');
    setSelectedIcon(availableIcons[0] || '');
    setSelectedColor(CATEGORY_COLORS[0]);
    setCustomColor('');
    setDefaultExpenseType('WANT');
    setEditingCategory(null);
  };
  
  // Handle starting add
  const handleStartAdd = () => {
    resetForm();
    setSelectedIcon(availableIcons[0] || '');
    setView('add');
  };
  
  // Handle starting edit
  const handleStartEdit = (category: CustomCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setSelectedIcon(category.icon);
    // Check if color is in predefined list or custom
    if (CATEGORY_COLORS.includes(category.color)) {
      setSelectedColor(category.color);
      setCustomColor('');
    } else {
      setSelectedColor('');
      setCustomColor(category.color);
    }
    setDefaultExpenseType(category.defaultExpenseType);
    setView('edit');
  };
  
  // Handle save
  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Please enter a category name');
      return;
    }
    
    if (!selectedIcon) {
      alert('Please select an icon');
      return;
    }
    
    const finalColor = customColor || selectedColor;
    if (!finalColor) {
      alert('Please select or enter a color');
      return;
    }
    
    // Validate custom color is a valid hex code
    if (customColor && !/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      alert('Please enter a valid hex color code (e.g., #FF5733)');
      return;
    }
    
    const category: CustomCategory = {
      id: editingCategory?.id || generateCategoryId(),
      name: trimmedName,
      icon: selectedIcon,
      color: finalColor,
      defaultExpenseType,
    };
    
    if (editingCategory) {
      onUpdateCategory(category);
    } else {
      onAddCategory(category);
    }
    
    resetForm();
    setView('list');
  };
  
  // Handle delete
  const handleDelete = (category: CustomCategory) => {
    if (confirm(`Are you sure you want to delete the category "${category.name}"? This will not delete transactions using this category.`)) {
      onDeleteCategory(category.id);
    }
  };
  
  // Handle color selection
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setCustomColor('');
  };
  
  // Handle custom color change
  const handleCustomColorChange = (value: string) => {
    setCustomColor(value);
    if (value) {
      setSelectedColor('');
    }
  };
  
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog category-manager-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2>
            {view === 'list' && 'Manage Categories'}
            {view === 'add' && 'Add Custom Category'}
            {view === 'edit' && 'Edit Category'}
          </h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        
        {view === 'list' && (
          <div className="category-manager-content">
            {/* Built-in categories section */}
            <div className="category-section">
              <h3>Built-in Categories</h3>
              <p className="section-info">These categories come with the app and cannot be deleted.</p>
              <div className="category-list builtin-categories">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="category-item builtin">
                    <div className="category-item-info">
                      <MaterialIcon name={cat.icon} size="medium" />
                      <span className="category-name">{cat.name}</span>
                      <span className={`expense-type-badge ${cat.defaultExpenseType.toLowerCase()}`}>
                        {cat.defaultExpenseType === 'NEED' ? 'Need' : 'Want'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Custom categories section */}
            <div className="category-section">
              <div className="section-header">
                <h3>Custom Categories</h3>
                <button className="btn-add-category" onClick={handleStartAdd}>
                  <MaterialIcon name="add" size="small" />
                  Add Category
                </button>
              </div>
              
              {customCategories.length === 0 ? (
                <p className="no-categories">
                  No custom categories yet. Click "Add Category" to create one.
                </p>
              ) : (
                <div className="category-list custom-categories">
                  {customCategories.map((cat) => (
                    <div key={cat.id} className="category-item custom">
                      <div className="category-item-info">
                        <span 
                          className="category-color-dot" 
                          style={{ backgroundColor: cat.color }}
                        />
                        <MaterialIcon name={cat.icon} size="medium" />
                        <span className="category-name">{cat.name}</span>
                        <span className={`expense-type-badge ${cat.defaultExpenseType.toLowerCase()}`}>
                          {cat.defaultExpenseType === 'NEED' ? 'Need' : 'Want'}
                        </span>
                      </div>
                      <div className="category-item-actions">
                        <button 
                          className="btn-icon" 
                          onClick={() => handleStartEdit(cat)}
                          aria-label={`Edit ${cat.name}`}
                        >
                          <MaterialIcon name="edit" size="small" />
                        </button>
                        <button 
                          className="btn-icon btn-delete" 
                          onClick={() => handleDelete(cat)}
                          aria-label={`Delete ${cat.name}`}
                        >
                          <MaterialIcon name="delete" size="small" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {(view === 'add' || view === 'edit') && (
          <form className="category-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Category Name */}
            <div className="form-group">
              <label htmlFor="category-name">Category Name</label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name..."
                maxLength={30}
                required
              />
            </div>
            
            {/* Icon Picker */}
            <div className="form-group">
              <label>Icon</label>
              <div className="icon-picker-container" ref={iconPickerRef}>
                <button
                  type="button"
                  className="icon-picker-trigger"
                  onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                >
                  {selectedIcon ? (
                    <>
                      <MaterialIcon name={selectedIcon} size="medium" />
                      <span>{selectedIcon}</span>
                    </>
                  ) : (
                    <span>Select an icon...</span>
                  )}
                  <MaterialIcon name={isIconPickerOpen ? 'expand_less' : 'expand_more'} size="small" />
                </button>
                
                {isIconPickerOpen && (
                  <div className="icon-picker-dropdown">
                    {availableIcons.length === 0 ? (
                      <p className="no-icons-message">No icons available. All icons are in use.</p>
                    ) : (
                      <div className="icon-grid">
                        {availableIcons.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedIcon(icon);
                              setIsIconPickerOpen(false);
                            }}
                            title={icon}
                          >
                            <MaterialIcon name={icon} size="medium" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Color Picker */}
            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                <div className="color-grid">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
                <div className="custom-color-input">
                  <label htmlFor="custom-color">Custom Color (Hex):</label>
                  <div className="custom-color-field">
                    <input
                      id="custom-color"
                      type="text"
                      value={customColor}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      placeholder="#FF5733"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    {(customColor || selectedColor) && (
                      <span 
                        className="color-preview" 
                        style={{ backgroundColor: customColor || selectedColor }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Default Expense Type */}
            <div className="form-group">
              <label htmlFor="expense-type">Default Expense Type</label>
              <select
                id="expense-type"
                value={defaultExpenseType}
                onChange={(e) => setDefaultExpenseType(e.target.value as ExpenseType)}
              >
                <option value="NEED">Need (Essential)</option>
                <option value="WANT">Want (Non-essential)</option>
              </select>
            </div>
            
            {/* Actions */}
            <div className="dialog-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => { resetForm(); setView('list'); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                {view === 'add' ? 'Add Category' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
