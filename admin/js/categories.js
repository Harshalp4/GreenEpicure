/**
 * Categories Management JavaScript
 */

let categories = [];
let isDefaultCategories = false;

document.addEventListener('DOMContentLoaded', () => {
    if (!AdminAuth.checkAuth()) return;
    updateAdminInfo();
    loadCategories();
});

function updateAdminInfo() {
    const user = AdminAuth.getUser();
    if (user) {
        const adminName = document.getElementById('adminName');
        const adminAvatar = document.getElementById('adminAvatar');
        if (adminName) adminName.textContent = user.full_name || user.email || 'Admin';
        if (adminAvatar) adminAvatar.textContent = (user.full_name || user.email || 'A').charAt(0).toUpperCase();
    }
}

async function loadCategories() {
    try {
        const data = await AdminAuth.get('/admin/categories');
        if (data) {
            categories = data.categories || [];
            isDefaultCategories = data.isDefault || false;

            if (isDefaultCategories) {
                document.getElementById('defaultAlert').style.display = 'block';
            }

            renderCategories();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Failed to load categories', 'error');
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesTable');

    if (categories.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    No categories found. Click "Add Category" to create one.
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = categories.map(category => `
        <tr>
            <td style="width: 60px; text-align: center;">
                <span style="font-weight: 600; color: var(--gold);">${category.sort_order || 0}</span>
            </td>
            <td style="width: 80px;">
                ${category.image_url
                    ? `<img src="${category.image_url}" alt="${category.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">`
                    : `<div style="width: 50px; height: 50px; background: var(--bg-tertiary); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                    </div>`
                }
            </td>
            <td><strong>${category.name}</strong></td>
            <td><code style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${category.slug}</code></td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${category.description || '-'}
            </td>
            <td>
                ${isDefaultCategories ? `
                    <span style="color: var(--text-muted); font-size: 0.8rem;">Read-only</span>
                ` : `
                    <div class="action-buttons">
                        <button class="action-btn" onclick="editCategory('${category.id}')" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete" onclick="deleteCategory('${category.id}', '${category.name}')" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                        </button>
                    </div>
                `}
            </td>
        </tr>
    `).join('');
}

function openAddModal() {
    if (isDefaultCategories) {
        showToast('Create the categories table in Supabase first', 'error');
        return;
    }

    document.getElementById('modalTitle').textContent = 'Add Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categorySortOrder').value = categories.length + 1;

    document.getElementById('categoryModal').classList.add('active');
}

function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    document.getElementById('modalTitle').textContent = 'Edit Category';
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryImage').value = category.image_url || '';
    document.getElementById('categorySortOrder').value = category.sort_order || 0;

    document.getElementById('categoryModal').classList.add('active');
}

function closeModal() {
    document.getElementById('categoryModal').classList.remove('active');
}

async function saveCategory() {
    const categoryId = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    const image_url = document.getElementById('categoryImage').value.trim();
    const sort_order = parseInt(document.getElementById('categorySortOrder').value) || 0;

    if (!name) {
        showToast('Please enter a category name', 'error');
        return;
    }

    const categoryData = {
        name,
        description,
        image_url,
        sort_order
    };

    try {
        if (categoryId) {
            categoryData.id = categoryId;
            await AdminAuth.put('/admin/categories', categoryData);
            showToast('Category updated successfully', 'success');
        } else {
            await AdminAuth.post('/admin/categories', categoryData);
            showToast('Category created successfully', 'success');
        }

        closeModal();
        loadCategories();
    } catch (error) {
        console.error('Error saving category:', error);
        showToast(error.message || 'Failed to save category', 'error');
    }
}

function deleteCategory(categoryId, categoryName) {
    document.getElementById('deleteCategoryId').value = categoryId;
    document.getElementById('deleteCategoryName').textContent = categoryName;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
}

async function confirmDelete() {
    const categoryId = document.getElementById('deleteCategoryId').value;

    try {
        await AdminAuth.delete('/admin/categories', { id: categoryId });
        showToast('Category deleted successfully', 'success');
        closeDeleteModal();
        loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast(error.message || 'Failed to delete category', 'error');
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
