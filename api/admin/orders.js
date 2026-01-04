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

  // GET - List all orders
  if (req.method === 'GET') {
    try {
      const { status, limit = 50, offset = 0 } = req.query;

      // First try with joins, fallback to simple query if relations don't exist
      let data, dbError;

      // Explicit column selection to avoid auto-expanding relationships
      let query = supabaseAdmin
        .from('orders')
        .select(`
          id,
          order_number,
          user_id,
          total,
          subtotal,
          delivery_fee,
          order_status,
          payment_status,
          payment_method,
          notes,
          created_at,
          updated_at,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (status) {
        query = query.eq('order_status', status);
      }

      const result = await query;
      data = result.data;
      dbError = result.error;

      // If successful, try to enrich with profile data
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(o => o.user_id).filter(Boolean))];

        if (userIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, phone, user_type, business_name')
            .in('id', userIds);

          const profileMap = {};
          if (profiles) {
            profiles.forEach(p => profileMap[p.id] = p);
          }

          data = data.map(order => ({
            ...order,
            profiles: profileMap[order.user_id] || null
          }));
        }
      }

      if (dbError) {
        console.error('Orders query error:', dbError);
        return error(res, dbError.message, 500);
      }

      // Get total count
      const { count: totalCount } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true });

      return json(res, {
        orders: data || [],
        total: totalCount || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (err) {
      console.error('Orders API error:', err);
      return error(res, err.message, 500);
    }
  }

  // PUT - Update order status
  if (req.method === 'PUT') {
    try {
      const { id, order_status, payment_status } = req.body;

      if (!id) {
        return error(res, 'Order ID is required');
      }

      const validOrderStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

      const updateData = { updated_at: new Date().toISOString() };

      if (order_status) {
        if (!validOrderStatuses.includes(order_status)) {
          return error(res, `Invalid order status. Must be one of: ${validOrderStatuses.join(', ')}`);
        }
        updateData.order_status = order_status;
      }

      if (payment_status) {
        if (!validPaymentStatuses.includes(payment_status)) {
          return error(res, `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`);
        }
        updateData.payment_status = payment_status;
      }

      const { data, error: updateError } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return error(res, updateError.message, 500);
      }

      return json(res, {
        message: 'Order updated',
        order: data
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
