const crypto = require('crypto');
const { supabaseAdmin, getUser } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

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
    return error(res, 'Please login to verify payment', 401);
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return error(res, 'Missing payment verification data');
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return error(res, 'Invalid payment signature', 400);
    }

    // Update order status
    const { data: order, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id,
        order_status: 'confirmed'
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return error(res, 'Failed to update order', 500);
    }

    return json(res, {
      message: 'Payment verified successfully',
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_status: order.payment_status,
        order_status: order.order_status
      }
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    return error(res, err.message, 500);
  }
};
