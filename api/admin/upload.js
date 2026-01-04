const { supabaseAdmin, getUser, isAdmin } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
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

  try {
    const { fileName, fileBase64, contentType } = req.body;

    if (!fileName || !fileBase64) {
      return error(res, 'fileName and fileBase64 are required');
    }

    // Decode base64
    const buffer = Buffer.from(fileBase64, 'base64');

    // Generate unique file name
    const timestamp = Date.now();
    const ext = fileName.split('.').pop();
    const uniqueName = `${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `products/${uniqueName}`;

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('products')
      .upload(uniqueName, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      return error(res, uploadError.message, 500);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('products')
      .getPublicUrl(uniqueName);

    return json(res, {
      message: 'Image uploaded successfully',
      path: data.path,
      url: urlData.publicUrl
    }, 201);
  } catch (err) {
    console.error('Upload error:', err);
    return error(res, err.message, 500);
  }
};
