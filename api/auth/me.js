const { supabaseAdmin, getUser } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return error(res, 'Method not allowed', 405);
  }

  try {
    const user = await getUser(req);

    if (!user) {
      return error(res, 'Unauthorized', 401);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return error(res, 'Profile not found', 404);
    }

    // Get user addresses
    const { data: addresses } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    return json(res, {
      user: {
        id: user.id,
        email: user.email,
        ...profile,
        addresses: addresses || []
      }
    });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
