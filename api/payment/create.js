const Razorpay = require('razorpay');
const { supabaseAdmin, getUser } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
  }

  const user = await getUser(req);
  if (!user) {
    return error(res, 'Please login to make payment', 401);
  }

  try {
    const { order_id } = req.body;

    if (!order_id) {
      return error(res, 'Order ID is required');
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, profiles(email, full_name, phone)')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return error(res, 'Order not found', 404);
    }

    if (order.payment_status === 'paid') {
      return error(res, 'Order is already paid');
    }

    if (order.payment_method !== 'razorpay') {
      return error(res, 'This order is not for online payment');
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // Amount in paise
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        order_id: order.id,
        user_id: user.id
      }
    });

    // Update order with Razorpay order ID
    await supabaseAdmin
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order_id);

    return json(res, {
      razorpay_order_id: razorpayOrder.id,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_number: order.order_number,
      prefill: {
        name: order.profiles?.full_name,
        email: order.profiles?.email,
        contact: order.profiles?.phone
      }
    });
  } catch (err) {
    console.error('Razorpay error:', err);
    return error(res, err.message, 500);
  }
};
