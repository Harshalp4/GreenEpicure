const { supabaseAdmin, getUser, isAdmin } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return error(res, 'Method not allowed', 405);
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

  try {
    // Get total orders
    const { count: totalOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Get pending orders
    const { count: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('order_status', ['placed', 'confirmed', 'processing']);

    // Get total revenue
    const { data: revenueData } = await supabaseAdmin
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid');

    const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;

    // Get total customers
    const { count: totalCustomers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false);

    // Get total products
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get recent orders (last 5) - without profiles join to avoid FK issues
    let { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        order_status,
        payment_status,
        created_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Enrich with profile data separately
    if (recentOrders && recentOrders.length > 0) {
      const userIds = [...new Set(recentOrders.map(o => o.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profileMap = {};
        if (profiles) {
          profiles.forEach(p => profileMap[p.id] = p);
        }

        recentOrders = recentOrders.map(order => ({
          ...order,
          profiles: profileMap[order.user_id] || null
        }));
      }
    }

    // Get orders by status
    const { data: statusCounts } = await supabaseAdmin
      .from('orders')
      .select('order_status');

    const ordersByStatus = statusCounts?.reduce((acc, order) => {
      acc[order.order_status] = (acc[order.order_status] || 0) + 1;
      return acc;
    }, {}) || {};

    return json(res, {
      stats: {
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalRevenue,
        totalCustomers: totalCustomers || 0,
        totalProducts: totalProducts || 0
      },
      ordersByStatus,
      recentOrders: recentOrders || []
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
