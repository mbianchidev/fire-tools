import { useState, useRef, useEffect } from 'react';
import {
  CustomCategory,
  ExpenseType,
  ExpenseCategory,
  CATEGORY_COLORS,
  getAvailableIcons,
  generateCategoryId,
  EXPENSE_CATEGORIES,
  CategoryInfo,
  CategoryOverride,
  NO_CATEGORY_ID,
  formatIconLabel,
} from '../types/expenseTracker';
import { MaterialIcon } from './MaterialIcon';
import './CategoryManagerDialog.css';

interface CategoryManagerDialogProps {
  customCategories: CustomCategory[];
  categoryOverrides?: CategoryOverride[];
  onAddCategory: (category: CustomCategory) => void;
  onUpdateCategory: (category: CustomCategory) => void;
  onDeleteCategory: (categoryId: string, reassignTo?: string) => void;
  onUpdateBuiltInCategory?: (override: CategoryOverride) => void;
  onClose: () => void;
  getExpenseCountForCategory?: (categoryId: string) => number;
}

export function CategoryManagerDialog({
  customCategories,
  categoryOverrides = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateBuiltInCategory,
  onClose,
  getExpenseCountForCategory,
}: CategoryManagerDialogProps) {
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'edit-builtin'>('list');
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [editingBuiltInCategory, setEditingBuiltInCategory] = useState<CategoryInfo | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [customColor, setCustomColor] = useState('');
  const [defaultExpenseType, setDefaultExpenseType] = useState<ExpenseType>('WANT');
  
  // Validation error state
  const [errors, setErrors] = useState<{ name?: string; icon?: string; color?: string }>({});
  
  // Delete confirmation state
  const [categoryToDelete, setCategoryToDelete] = useState<CustomCategory | null>(null);
  const [expenseCount, setExpenseCount] = useState(0);
  
  // Icon picker state
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  
  // Get icons available for selection (excluding already used ones, but include current icon when editing)
  const getIconsForEditing = () => {
    if (editingBuiltInCategory) {
      // When editing a built-in category, include all icons plus any custom category icons
      // but exclude icons used by OTHER built-in categories (except the one being edited)
      const otherBuiltInIcons = EXPENSE_CATEGORIES
        .filter(c => c.id !== editingBuiltInCategory.id)
        .map(c => {
          const override = categoryOverrides.find(o => o.id === c.id);
          return override?.icon || c.icon;
        });
      const customUsedIcons = customCategories.map(c => c.icon);
      const usedIcons = [...otherBuiltInIcons, ...customUsedIcons];
      // Include all icons that are not in use by others
      const allIcons = [...EXPENSE_CATEGORIES.map(c => c.icon), ...getAvailableIcons(customCategories, categoryOverrides)];
      const uniqueAllIcons = [...new Set(allIcons)];
      return uniqueAllIcons.filter(icon => !usedIcons.includes(icon) || icon === (categoryOverrides.find(o => o.id === editingBuiltInCategory.id)?.icon || editingBuiltInCategory.icon));
    }
    if (editingCategory) {
      return getAvailableIcons(
        customCategories.filter(c => c.id !== editingCategory.id),
        categoryOverrides
      );
    }
    return getAvailableIcons(customCategories, categoryOverrides);
  };
  
  const availableIcons = getIconsForEditing();
  
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
    setEditingBuiltInCategory(null);
    setEditingCategory(null);
    setErrors({});
  };
  
  // Handle starting add
  const handleStartAdd = () => {
    resetForm();
    setSelectedIcon(availableIcons[0] || '');
    setView('add');
  };
  
  // Handle starting edit custom category
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
  
  // Handle starting edit built-in category
  const handleStartEditBuiltIn = (category: CategoryInfo) => {
    // Get current override if exists
    const currentOverride = categoryOverrides.find(o => o.id === category.id);
    setEditingBuiltInCategory(category);
    setName(currentOverride?.name || category.name);
    setSelectedIcon(currentOverride?.icon || category.icon);
    
    const color = currentOverride?.color || '';
    if (color && CATEGORY_COLORS.includes(color)) {
      setSelectedColor(color);
      setCustomColor('');
    } else if (color) {
      setSelectedColor('');
      setCustomColor(color);
    } else {
      setSelectedColor(CATEGORY_COLORS[0]);
      setCustomColor('');
    }
    setDefaultExpenseType(category.defaultExpenseType);
    setView('edit-builtin');
  };
  
  // Handle save for custom categories
  const handleSave = () => {
    const newErrors: { name?: string; icon?: string; color?: string } = {};
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Please enter a category name';
    }
    
    if (!selectedIcon) {
      newErrors.icon = 'Please select an icon';
    }
    
    const finalColor = customColor || selectedColor;
    if (!finalColor) {
      newErrors.color = 'Please select or enter a color';
    } else if (customColor && !/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      newErrors.color = 'Please enter a valid hex color code (e.g., #FF5733)';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    
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
  
  // Handle save for built-in category overrides
  const handleSaveBuiltIn = () => {
    if (!editingBuiltInCategory || !onUpdateBuiltInCategory) return;
    
    const newErrors: { name?: string; icon?: string; color?: string } = {};
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Please enter a category name';
    }
    
    if (!selectedIcon) {
      newErrors.icon = 'Please select an icon';
    }
    
    const finalColor = customColor || selectedColor;
    if (customColor && !/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      newErrors.color = 'Please enter a valid hex color code (e.g., #FF5733)';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    
    const override: CategoryOverride = {
      id: editingBuiltInCategory.id as ExpenseCategory,
      name: trimmedName !== editingBuiltInCategory.name ? trimmedName : undefined,
      icon: selectedIcon !== EXPENSE_CATEGORIES.find(c => c.id === editingBuiltInCategory.id)?.icon ? selectedIcon : undefined,
      color: finalColor || undefined,
    };
    
    onUpdateBuiltInCategory(override);
    
    resetForm();
    setView('list');
  };
  
  // Handle delete - shows confirmation with expense count warning
  const handleDeleteClick = (category: CustomCategory) => {
    const count = getExpenseCountForCategory ? getExpenseCountForCategory(category.id) : 0;
    setExpenseCount(count);
    setCategoryToDelete(category);
  };
  
  // Confirm delete - reassign expenses to NO_CATEGORY
  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id, NO_CATEGORY_ID);
      setCategoryToDelete(null);
      setExpenseCount(0);
    }
  };
  
  // Cancel delete
  const handleCancelDelete = () => {
    setCategoryToDelete(null);
    setExpenseCount(0);
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
  
  // Get category info with overrides applied
  const getCategoryWithOverride = (cat: CategoryInfo): CategoryInfo => {
    const override = categoryOverrides.find(o => o.id === cat.id);
    if (override) {
      return {
        ...cat,
        name: override.name || cat.name,
        icon: override.icon || cat.icon,
        color: override.color,
      };
    }
    return cat;
  };
  
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog category-manager-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2>
            {view === 'list' && 'Manage Categories'}
            {view === 'add' && 'Add Custom Category'}
            {view === 'edit' && 'Edit Category'}
            {view === 'edit-builtin' && 'Edit Category'}
          </h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        
        {view === 'list' && (
          <div className="category-manager-content">
            {/* Built-in categories section */}
            <div className="category-section">
              <h3>Default Categories</h3>
              <p className="section-info">Customize name, icon, and color. These cannot be deleted.</p>
              <div className="category-list builtin-categories">
                {EXPENSE_CATEGORIES.map((baseCat) => {
                  const cat = getCategoryWithOverride(baseCat);
                  const isProtected = cat.id === NO_CATEGORY_ID;
                  return (
                    <div key={cat.id} className={`category-item builtin ${isProtected ? 'protected' : ''}`}>
                      <div className="category-item-info">
                        {cat.color && (
                          <span 
                            className="category-color-dot" 
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
                        <MaterialIcon name={cat.icon} size="medium" />
                        <span className="category-name">{cat.name}</span>
                        <span className={`expense-type-badge ${cat.defaultExpenseType.toLowerCase()}`}>
                          {cat.defaultExpenseType === 'NEED' ? 'Need' : 'Want'}
                        </span>
                      </div>
                      {!isProtected && onUpdateBuiltInCategory && (
                        <div className="category-item-actions">
                          <button 
                            className="btn-icon" 
                            onClick={() => handleStartEditBuiltIn(baseCat)}
                            aria-label={`Edit ${cat.name}`}
                          >
                            <MaterialIcon name="edit" size="small" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                          onClick={() => handleDeleteClick(cat)}
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
            <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
              <label htmlFor="category-name">Category Name</label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
                placeholder="Enter category name..."
                maxLength={30}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && <span id="name-error" className="error-message">{errors.name}</span>}
            </div>
            
            {/* Icon Picker */}
            <div className={`form-group ${errors.icon ? 'has-error' : ''}`}>
              <label>Icon</label>
              <div className="icon-picker-container" ref={iconPickerRef}>
                <button
                  type="button"
                  className="icon-picker-trigger"
                  onClick={() => { setIsIconPickerOpen(!isIconPickerOpen); if (errors.icon) setErrors(prev => ({ ...prev, icon: undefined })); }}
                  aria-invalid={!!errors.icon}
                  aria-describedby={errors.icon ? 'icon-error' : undefined}
                >
                  {selectedIcon ? (
                    <>
                      <MaterialIcon name={selectedIcon} size="medium" />
                      <span>{formatIconLabel(selectedIcon)}</span>
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
                              if (errors.icon) setErrors(prev => ({ ...prev, icon: undefined }));
                            }}
                            title={formatIconLabel(icon)}
                          >
                            <MaterialIcon name={icon} size="medium" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.icon && <span id="icon-error" className="error-message">{errors.icon}</span>}
            </div>
            
            {/* Color Picker */}
            <div className={`form-group ${errors.color ? 'has-error' : ''}`}>
              <label>Color</label>
              <div className="color-picker">
                <div className="color-grid">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => { handleColorSelect(color); if (errors.color) setErrors(prev => ({ ...prev, color: undefined })); }}
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
                      onChange={(e) => { handleCustomColorChange(e.target.value); if (errors.color) setErrors(prev => ({ ...prev, color: undefined })); }}
                      placeholder="#FF5733"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      aria-invalid={!!errors.color}
                      aria-describedby={errors.color ? 'color-error' : undefined}
                    />
                    {(customColor || selectedColor) && (
                      <span 
                        className="color-preview" 
                        style={{ backgroundColor: customColor || selectedColor }}
                      />
                    )}
                  </div>
                </div>
                {errors.color && <span id="color-error" className="error-message">{errors.color}</span>}
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

        {/* Edit Built-in Category Form */}
        {view === 'edit-builtin' && (
          <form className="category-form" onSubmit={(e) => { e.preventDefault(); handleSaveBuiltIn(); }}>
            {/* Category Name */}
            <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
              <label htmlFor="category-name">Category Name</label>
              <input
                id="category-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
                placeholder="Enter category name..."
                maxLength={30}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && <span id="name-error" className="error-message">{errors.name}</span>}
            </div>
            
            {/* Icon Picker */}
            <div className={`form-group ${errors.icon ? 'has-error' : ''}`}>
              <label>Icon</label>
              <div className="icon-picker-container" ref={iconPickerRef}>
                <button
                  type="button"
                  className="icon-picker-trigger"
                  onClick={() => { setIsIconPickerOpen(!isIconPickerOpen); if (errors.icon) setErrors(prev => ({ ...prev, icon: undefined })); }}
                  aria-invalid={!!errors.icon}
                  aria-describedby={errors.icon ? 'icon-error' : undefined}
                >
                  {selectedIcon ? (
                    <>
                      <MaterialIcon name={selectedIcon} size="medium" />
                      <span>{formatIconLabel(selectedIcon)}</span>
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
                              if (errors.icon) setErrors(prev => ({ ...prev, icon: undefined }));
                            }}
                            title={formatIconLabel(icon)}
                          >
                            <MaterialIcon name={icon} size="medium" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.icon && <span id="icon-error" className="error-message">{errors.icon}</span>}
            </div>
            
            {/* Color Picker */}
            <div className={`form-group ${errors.color ? 'has-error' : ''}`}>
              <label>Color (Optional)</label>
              <div className="color-picker">
                <div className="color-grid">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => { handleColorSelect(color); if (errors.color) setErrors(prev => ({ ...prev, color: undefined })); }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
                <div className="custom-color-input">
                  <label htmlFor="custom-color-builtin">Custom Color (Hex):</label>
                  <div className="custom-color-field">
                    <input
                      id="custom-color-builtin"
                      type="text"
                      value={customColor}
                      onChange={(e) => { handleCustomColorChange(e.target.value); if (errors.color) setErrors(prev => ({ ...prev, color: undefined })); }}
                      placeholder="#FF5733"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      aria-invalid={!!errors.color}
                      aria-describedby={errors.color ? 'color-error-builtin' : undefined}
                    />
                    {(customColor || selectedColor) && (
                      <span 
                        className="color-preview" 
                        style={{ backgroundColor: customColor || selectedColor }}
                      />
                    )}
                  </div>
                </div>
                {errors.color && <span id="color-error-builtin" className="error-message">{errors.color}</span>}
              </div>
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
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation Dialog */}
        {categoryToDelete && (
          <div className="confirm-overlay">
            <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
              <h3 id="confirm-title">Delete Category</h3>
              {expenseCount > 0 ? (
                <div id="confirm-description" className="warning-text" role="alert">
                  <MaterialIcon name="warning" size="small" />
                  <span>
                    <strong>Warning:</strong> There {expenseCount === 1 ? 'is' : 'are'} <strong>{expenseCount}</strong> expense{expenseCount !== 1 ? 's' : ''} 
                    {' '}tied to this category. If you proceed with deletion, all expenses will be assigned to &ldquo;No Category&rdquo;.
                  </span>
                  <p>Are you sure you want to delete &ldquo;{categoryToDelete.name}&rdquo;?</p>
                </div>
              ) : (
                <p id="confirm-description">
                  Are you sure you want to delete the category &ldquo;{categoryToDelete.name}&rdquo;?
                </p>
              )}
              <div className="confirm-actions">
                <button className="btn-cancel" onClick={handleCancelDelete}>
                  Cancel
                </button>
                <button className="btn-delete" onClick={handleConfirmDelete}>
                  {expenseCount > 0 ? 'Yes, Delete' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
