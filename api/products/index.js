const { supabaseAdmin, getUser } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { category, featured } = req.query;

      let query = supabaseAdmin
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      if (featured === 'true') {
        query = query.eq('featured', true);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        return error(res, dbError.message, 500);
      }

      // Check if user is B2B to show wholesale prices
      const user = await getUser(req);
      let userType = 'b2c';

      if (user) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        userType = profile?.user_type || 'b2c';
      }

      // Map products with appropriate pricing
      const products = data.map(product => ({
        ...product,
        display_price: userType === 'b2b' && product.b2b_price
          ? product.b2b_price
          : product.price
      }));

      return json(res, { products, userType });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
