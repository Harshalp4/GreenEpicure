const { supabaseAdmin, getUser } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const user = await getUser(req);
  if (!user) {
    return error(res, 'Please login to access cart', 401);
  }

  const { id } = req.query;

  // Verify cart item belongs to user
  const { data: cartItem, error: fetchError } = await supabaseAdmin
    .from('cart_items')
    .select('*, products(moq)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !cartItem) {
    return error(res, 'Cart item not found', 404);
  }

  // PUT - Update quantity
  if (req.method === 'PUT') {
    try {
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return error(res, 'Quantity must be at least 1');
      }

      // Check MOQ
      if (quantity < cartItem.products.moq) {
        return error(res, `Minimum order quantity is ${cartItem.products.moq}`);
      }

      const { data, error: updateError } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return error(res, updateError.message, 500);
      }

      return json(res, {
        message: 'Cart updated',
        item: data
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // DELETE - Remove from cart
  if (req.method === 'DELETE') {
    try {
      const { error: deleteError } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return error(res, deleteError.message, 500);
      }

      return json(res, {
        message: 'Item removed from cart'
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
