const { supabaseAdmin, getUser } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

// Generate order number
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GE-${year}-${random}`;
}

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const user = await getUser(req);
  if (!user) {
    return error(res, 'Please login to view orders', 401);
  }

  // GET - Fetch user's orders
  if (req.method === 'GET') {
    try {
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          addresses (
            address_line1,
            address_line2,
            city,
            state,
            pincode
          ),
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        return error(res, ordersError.message, 500);
      }

      return json(res, { orders });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // POST - Create new order
  if (req.method === 'POST') {
    try {
      const { address_id, payment_method, notes } = req.body;

      if (!address_id) {
        return error(res, 'Delivery address is required');
      }

      if (!payment_method || !['razorpay', 'cod'].includes(payment_method)) {
        return error(res, 'Valid payment method is required (razorpay or cod)');
      }

      // Verify address belongs to user
      const { data: address, error: addressError } = await supabaseAdmin
        .from('addresses')
        .select('*')
        .eq('id', address_id)
        .eq('user_id', user.id)
        .single();

      if (addressError || !address) {
        return error(res, 'Address not found', 404);
      }

      // Get cart items
      const { data: cartItems, error: cartError } = await supabaseAdmin
        .from('cart_items')
        .select(`
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            price,
            b2b_price,
            in_stock
          )
        `)
        .eq('user_id', user.id);

      console.log('Cart items query result:', { cartItems, cartError, userId: user.id });

      if (cartError) {
        console.error('Cart query error:', cartError);
        return error(res, 'Failed to load cart: ' + cartError.message, 500);
      }

      if (!cartItems || cartItems.length === 0) {
        return error(res, 'Cart is empty');
      }

      // Filter out items with missing product references
      const validCartItems = cartItems.filter(item => {
        if (!item.products) {
          console.warn('Cart item missing product reference:', item);
          return false;
        }
        return true;
      });

      if (validCartItems.length === 0) {
        return error(res, 'Cart items have invalid product references. Please clear your cart and try again.');
      }

      // Check stock and calculate totals
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      const userType = profile?.user_type || 'b2c';
      let subtotal = 0;

      const orderItems = validCartItems.map(item => {
        if (!item.products.in_stock) {
          throw new Error(`${item.products.name} is out of stock`);
        }

        const unitPrice = userType === 'b2b' && item.products.b2b_price
          ? item.products.b2b_price
          : item.products.price;

        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        return {
          product_id: item.products.id,
          product_name: item.products.name,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice
        };
      });

      // Calculate delivery fee (free above 500)
      const deliveryFee = subtotal >= 500 ? 0 : 50;
      const total = subtotal + deliveryFee;

      // Create order
      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          address_id,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          payment_method,
          payment_status: payment_method === 'cod' ? 'pending' : 'pending',
          order_status: 'placed',
          notes
        })
        .select()
        .single();

      if (orderError) {
        return error(res, orderError.message, 500);
      }

      // Create order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: order.id
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItemsWithOrderId);

      if (itemsError) {
        console.error('Order items error:', itemsError);
      }

      // Clear cart
      await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      return json(res, {
        message: 'Order placed successfully',
        order: {
          ...order,
          items: orderItems
        }
      }, 201);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
