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

  // GET - List all customers or get specific customer
  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      // If ID is provided, get specific customer with their orders
      if (id) {
        const { data: customer, error: customerError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (customerError) {
          return error(res, customerError.message, 500);
        }

        // Get customer's orders
        const { data: orders, error: ordersError } = await supabaseAdmin
          .from('orders')
          .select(`
            id,
            order_number,
            total,
            order_status,
            payment_status,
            created_at
          `)
          .eq('user_id', id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
        }

        // Calculate total spent
        const totalSpent = orders?.reduce((sum, order) => {
          if (order.payment_status === 'paid') {
            return sum + parseFloat(order.total);
          }
          return sum;
        }, 0) || 0;

        return json(res, {
          customer: {
            ...customer,
            total_spent: totalSpent,
            order_count: orders?.length || 0
          },
          orders: orders || []
        });
      }

      // Get all customers (non-admin profiles)
      const { data: customers, error: dbError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('is_admin', false)
        .order('created_at', { ascending: false });

      if (dbError) {
        return error(res, dbError.message, 500);
      }

      // Get order counts and total spent for each customer
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('total, payment_status')
            .eq('user_id', customer.id);

          const orderCount = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, order) => {
            if (order.payment_status === 'paid') {
              return sum + parseFloat(order.total);
            }
            return sum;
          }, 0) || 0;

          return {
            ...customer,
            order_count: orderCount,
            total_spent: totalSpent
          };
        })
      );

      return json(res, { customers: customersWithStats });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
