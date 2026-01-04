const { supabase, supabaseAdmin } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
  }

  console.log('=== REGISTER API CALLED ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      email,
      password,
      full_name,
      phone,
      user_type = 'b2c',
      business_name,
      gst_number
    } = req.body;

    console.log('Parsed fields:', { email, full_name, phone, user_type });

    // Validate required fields
    if (!email || !password || !full_name || !phone) {
      return error(res, 'Email, password, full name, and phone are required');
    }

    // Validate B2B fields
    if (user_type === 'b2b' && (!business_name || !gst_number)) {
      return error(res, 'Business name and GST number are required for B2B accounts');
    }

    // Create user in Supabase Auth
    console.log('Attempting Supabase auth signup...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone
        }
      }
    });

    if (authError) {
      console.error('=== AUTH ERROR ===');
      console.error('Auth error:', JSON.stringify(authError, null, 2));
      return error(res, authError.message);
    }

    console.log('=== AUTH SUCCESS ===');
    console.log('User created:', authData.user?.id);
    console.log('Session exists:', !!authData.session);

    // Create profile
    console.log('Attempting profile creation...');
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        phone,
        user_type,
        business_name: user_type === 'b2b' ? business_name : null,
        gst_number: user_type === 'b2b' ? gst_number : null
      })
      .select();

    if (profileError) {
      console.error('=== PROFILE ERROR ===');
      console.error('Profile creation error:', JSON.stringify(profileError, null, 2));
      // Don't fail registration if profile creation fails - user can still login
    } else {
      console.log('=== PROFILE SUCCESS ===');
      console.log('Profile created:', JSON.stringify(profileData, null, 2));
    }

    return json(res, {
      message: 'Registration successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        user_type
      },
      session: authData.session
    }, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
