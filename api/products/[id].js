const { supabaseAdmin, getUser } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data, error: dbError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (dbError || !data) {
        return error(res, 'Product not found', 404);
      }

      // Check user type for pricing
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

      const product = {
        ...data,
        display_price: userType === 'b2b' && data.b2b_price
          ? data.b2b_price
          : data.price
      };

      return json(res, { product, userType });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
