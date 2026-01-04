const { supabaseAdmin, getUser, isAdmin } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check admin auth
  const user = await getUser(req);
  if (!user) {
    return error(res, 'Unauthorized', 401);
  }

  const adminCheck = await isAdmin(user.id);
  if (!adminCheck) {
    return error(res, 'Admin access required', 403);
  }

  // GET - List all categories
  if (req.method === 'GET') {
    try {
      const { data, error: dbError } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (dbError) {
        // If categories table doesn't exist, return default categories
        if (dbError.code === '42P01') {
          return json(res, {
            categories: [
              { id: 'dairy', name: 'A2 Dairy', slug: 'dairy', description: 'A2 Gir Cow dairy products', sort_order: 1 },
              { id: 'grains', name: 'Grains & Staples', slug: 'grains', description: 'Organic grains and staples', sort_order: 2 },
              { id: 'oils', name: 'Oils & Sweeteners', slug: 'oils', description: 'Cold-pressed oils and natural sweeteners', sort_order: 3 }
            ],
            isDefault: true
          });
        }
        return error(res, dbError.message, 500);
      }

      return json(res, { categories: data || [] });
    } catch (err) {
      console.error('Categories GET error:', err);
      return error(res, err.message, 500);
    }
  }

  // POST - Create new category
  if (req.method === 'POST') {
    try {
      const { name, description, image_url, sort_order = 0 } = req.body;

      if (!name) {
        return error(res, 'Category name is required');
      }

      // Generate slug from name
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error: insertError } = await supabaseAdmin
        .from('categories')
        .insert({
          name,
          slug,
          description,
          image_url,
          sort_order: parseInt(sort_order)
        })
        .select()
        .single();

      if (insertError) {
        console.error('Category insert error:', insertError);
        return error(res, insertError.message, 500);
      }

      return json(res, {
        message: 'Category created',
        category: data
      }, 201);
    } catch (err) {
      console.error('Categories POST error:', err);
      return error(res, err.message, 500);
    }
  }

  // PUT - Update category
  if (req.method === 'PUT') {
    try {
      const { id, name, description, image_url, sort_order } = req.body;

      if (!id) {
        return error(res, 'Category ID is required');
      }

      const updateData = { updated_at: new Date().toISOString() };

      if (name) {
        updateData.name = name;
        updateData.slug = name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      if (description !== undefined) updateData.description = description;
      if (image_url !== undefined) updateData.image_url = image_url;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);

      const { data, error: updateError } = await supabaseAdmin
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return error(res, updateError.message, 500);
      }

      return json(res, {
        message: 'Category updated',
        category: data
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // DELETE - Delete category
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id) {
        return error(res, 'Category ID is required');
      }

      // Check if any products use this category
      const { count } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category', id);

      if (count > 0) {
        return error(res, `Cannot delete category. ${count} products are using it.`);
      }

      const { error: deleteError } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return error(res, deleteError.message, 500);
      }

      return json(res, { message: 'Category deleted' });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
