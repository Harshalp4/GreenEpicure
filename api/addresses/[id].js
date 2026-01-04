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

  const { id } = req.query;

  // Verify address belongs to user
  const { data: address, error: fetchError } = await supabaseAdmin
    .from('addresses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !address) {
    return error(res, 'Address not found', 404);
  }

  // PUT - Update address
  if (req.method === 'PUT') {
    try {
      const {
        label,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        is_default
      } = req.body;

      // If setting as default, unset other defaults
      if (is_default) {
        await supabaseAdmin
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error: updateError } = await supabaseAdmin
        .from('addresses')
        .update({
          label,
          address_line1,
          address_line2,
          city,
          state,
          pincode,
          is_default
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return error(res, updateError.message, 500);
      }

      return json(res, {
        message: 'Address updated',
        address: data
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // DELETE - Remove address
  if (req.method === 'DELETE') {
    try {
      const { error: deleteError } = await supabaseAdmin
        .from('addresses')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return error(res, deleteError.message, 500);
      }

      return json(res, {
        message: 'Address deleted'
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
