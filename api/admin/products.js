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

  // GET - List all products (including out of stock)
  if (req.method === 'GET') {
    try {
      const { data, error: dbError } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        return error(res, dbError.message, 500);
      }

      return json(res, { products: data });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // POST - Create new product
  if (req.method === 'POST') {
    try {
      const {
        name,
        description,
        category,
        price,
        b2b_price,
        moq = 1,
        unit = 'kg',
        image_url,
        certifications = [],
        in_stock = true,
        featured = false
      } = req.body;

      if (!name || !category || !price) {
        return error(res, 'Name, category, and price are required');
      }

      // Generate slug
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error: insertError } = await supabaseAdmin
        .from('products')
        .insert({
          name,
          slug,
          description,
          category,
          price: parseFloat(price),
          b2b_price: b2b_price ? parseFloat(b2b_price) : null,
          moq: parseInt(moq),
          unit,
          image_url,
          certifications,
          in_stock,
          featured
        })
        .select()
        .single();

      if (insertError) {
        return error(res, insertError.message, 500);
      }

      return json(res, {
        message: 'Product created',
        product: data
      }, 201);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // PUT - Update product
  if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;

      if (!id) {
        return error(res, 'Product ID is required');
      }

      // If name changed, update slug
      if (updateData.name) {
        updateData.slug = updateData.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      // Parse numeric fields
      if (updateData.price) updateData.price = parseFloat(updateData.price);
      if (updateData.b2b_price) updateData.b2b_price = parseFloat(updateData.b2b_price);
      if (updateData.moq) updateData.moq = parseInt(updateData.moq);

      updateData.updated_at = new Date().toISOString();

      const { data, error: updateError } = await supabaseAdmin
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return error(res, updateError.message, 500);
      }

      return json(res, {
        message: 'Product updated',
        product: data
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // DELETE - Delete product
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id) {
        return error(res, 'Product ID is required');
      }

      const { error: deleteError } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return error(res, deleteError.message, 500);
      }

      return json(res, {
        message: 'Product deleted'
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
