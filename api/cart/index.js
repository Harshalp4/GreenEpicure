const { supabaseAdmin, getUser } = require('../_lib/supabase');
const { json, error, cors } = require('../_lib/response');

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication required for cart
  const user = await getUser(req);
  if (!user) {
    return error(res, 'Please login to access cart', 401);
  }

  // GET - Fetch cart items
  if (req.method === 'GET') {
    try {
      const { data: cartItems, error: cartError } = await supabaseAdmin
        .from('cart_items')
        .select(`
          id,
          quantity,
          created_at,
          products (
            id,
            name,
            slug,
            description,
            category,
            price,
            b2b_price,
            moq,
            unit,
            image_url,
            in_stock
          )
        `)
        .eq('user_id', user.id);

      if (cartError) {
        return error(res, cartError.message, 500);
      }

      // Get user type for pricing
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      const userType = profile?.user_type || 'b2c';

      // Calculate totals
      let subtotal = 0;
      const items = cartItems.map(item => {
        const displayPrice = userType === 'b2b' && item.products.b2b_price
          ? item.products.b2b_price
          : item.products.price;

        const itemTotal = displayPrice * item.quantity;
        subtotal += itemTotal;

        return {
          id: item.id,
          quantity: item.quantity,
          product: {
            ...item.products,
            display_price: displayPrice
          },
          item_total: itemTotal
        };
      });

      return json(res, {
        items,
        subtotal,
        item_count: items.reduce((sum, item) => sum + item.quantity, 0),
        userType
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  // POST - Add item to cart
  if (req.method === 'POST') {
    try {
      const { product_id, quantity = 1 } = req.body;

      console.log('Add to cart request:', { product_id, quantity, user_id: user.id });

      if (!product_id) {
        return error(res, 'Product ID is required');
      }

      // Check if product exists and is in stock
      // Try by ID first, then by slug if ID fails (for string IDs like 'dairy-001')
      let product = null;
      let productError = null;

      // First try exact ID match (UUID)
      const { data: productById, error: errById } = await supabaseAdmin
        .from('products')
        .select('id, name, moq, in_stock')
        .eq('id', product_id)
        .single();

      if (productById) {
        product = productById;
      } else {
        // Try by slug (for string IDs like 'dairy-001')
        const { data: productBySlug, error: errBySlug } = await supabaseAdmin
          .from('products')
          .select('id, name, moq, in_stock')
          .eq('slug', product_id)
          .single();

        if (productBySlug) {
          product = productBySlug;
        } else {
          console.log('Product not found by ID or slug:', product_id);
          productError = errById || errBySlug;
        }
      }

      if (!product) {
        console.log('Product lookup failed:', { product_id, error: productError });
        return error(res, 'Product not found', 404);
      }

      console.log('Product found:', product);

      // Use the actual product UUID for cart operations
      const actualProductId = product.id;

      if (!product.in_stock) {
        return error(res, 'Product is out of stock');
      }

      // Check MOQ
      if (quantity < product.moq) {
        return error(res, `Minimum order quantity is ${product.moq}`);
      }

      // Check if item already exists in cart (use actual UUID)
      const { data: existingItem } = await supabaseAdmin
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', actualProductId)
        .single();

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        const { data, error: updateError } = await supabaseAdmin
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (updateError) {
          return error(res, updateError.message, 500);
        }

        return json(res, {
          message: 'Cart updated',
          item: data
        });
      }

      // Add new item (use actual UUID)
      const { data, error: insertError } = await supabaseAdmin
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: actualProductId,
          quantity
        })
        .select()
        .single();

      if (insertError) {
        return error(res, insertError.message, 500);
      }

      return json(res, {
        message: 'Added to cart',
        item: data
      }, 201);
    } catch (err) {
      return error(res, err.message, 500);
    }
  }

  return error(res, 'Method not allowed', 405);
};
