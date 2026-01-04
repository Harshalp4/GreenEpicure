const { supabaseAdmin, getUser } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const user = await getUser(req);
  if (!user) {
    return error(res, 'Please login to manage addresses', 401);
  }

  // GET - Fetch user's addresses
  if (req.method === 'GET') {
    try {
      const { data: addresses, error: fetchError } = await supabaseAdmin
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (fetchError) {
        return error(res, fetchError.message, 500);
      }

      return json(res, { addresses });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // POST - Add new address
  if (req.method === 'POST') {
    try {
      const {
        label,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        is_default = false
      } = req.body;

      if (!address_line1 || !city || !state || !pincode) {
        return error(res, 'Address, city, state, and pincode are required');
      }

      // If this is set as default, unset other defaults
      if (is_default) {
        await supabaseAdmin
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error: insertError } = await supabaseAdmin
        .from('addresses')
        .insert({
          user_id: user.id,
          label,
          address_line1,
          address_line2,
          city,
          state,
          pincode,
          is_default
        })
        .select()
        .single();

      if (insertError) {
        return error(res, insertError.message, 500);
      }

      return json(res, {
        message: 'Address added',
        address: data
      }, 201);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
