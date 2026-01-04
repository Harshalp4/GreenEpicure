const { supabaseAdmin, getUser } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const user = await getUser(req);
  if (!user) {
    return error(res, 'Please login to view orders', 401);
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          addresses (
            label,
            address_line1,
            address_line2,
            city,
            state,
            pincode
          ),
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (orderError || !order) {
        return error(res, 'Order not found', 404);
      }

      return json(res, { order });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
