/* ============================================
   GREEN EPICURE - Product Data
   B2B/B2C Organic Product Catalog
   ============================================ */

// Product Categories
const PRODUCT_CATEGORIES = [
    {
        id: 'dairy',
        name: 'A2 Dairy',
        image: 'assets/images/products/ghee.jpg',
        description: 'Premium A2 milk and dairy products from indigenous Gir cows'
    },
    {
        id: 'grains',
        name: 'Grains & Staples',
        image: 'assets/images/products/millets.jpg',
        description: 'Organic grains, millets, pulses and cooking essentials'
    },
    {
        id: 'oils',
        name: 'Oils & Sweeteners',
        image: 'assets/images/products/oil.jpg',
        description: 'Cold-pressed oils, jaggery and natural sweeteners'
    }
];

// Products with prices
// Note: IDs should match database slugs for cart to work with logged-in users
const PRODUCTS = [
    // A2 Dairy Products
    {
        id: 'a2-gir-cow-milk',
        name: 'A2 Gir Cow Milk',
        category: 'dairy',
        description: 'Pure A2 beta-casein milk from indigenous Gir cows, farm-fresh daily',
        certifications: ['A2 Certified', 'Organic'],
        image: 'assets/images/products/milk.jpg',
        featured: true,
        price: 80,
        unit: 'litre',
        minOrder: '1 litre',
        moq: 1
    },
    {
        id: 'a2-gir-cow-ghee',
        name: 'Bilona A2 Ghee',
        category: 'dairy',
        description: 'Traditional hand-churned bilona ghee from A2 Gir cow milk, golden and aromatic',
        certifications: ['A2 Certified', 'Traditional'],
        image: 'assets/images/products/ghee.jpg',
        featured: true,
        price: 2200,
        unit: 'kg',
        minOrder: '1 kg',
        moq: 1
    },
    {
        id: 'fresh-paneer',
        name: 'Fresh A2 Paneer',
        category: 'dairy',
        description: 'Soft, creamy paneer made from fresh A2 Gir cow milk',
        certifications: ['A2 Certified', 'Fresh'],
        image: 'assets/images/products/paneer.jpg',
        featured: false,
        price: 450,
        unit: 'kg',
        minOrder: '1 kg',
        moq: 1
    },

    // Grains & Staples
    {
        id: 'organic-ragi',
        name: 'Organic Millets',
        category: 'grains',
        description: 'Nutrient-rich millets - Ragi, Jowar, Bajra & more. Perfect for health-conscious consumers',
        certifications: ['Organic', 'Gluten-Free'],
        image: 'assets/images/products/millets.jpg',
        featured: true,
        price: 120,
        unit: 'kg',
        minOrder: '1 kg',
        moq: 1
    },
    {
        id: 'organic-brown-rice',
        name: 'Organic Basmati Rice',
        category: 'grains',
        description: 'Premium aged basmati rice, naturally aromatic, extra-long grain',
        certifications: ['Organic', 'Non-GMO'],
        image: 'assets/images/products/rice.jpg',
        featured: true,
        price: 180,
        unit: 'kg',
        minOrder: '1 kg',
        moq: 1
    },
    {
        id: 'organic-foxtail-millet',
        name: 'Organic Pulses',
        category: 'grains',
        description: 'Premium organic dal - Toor, Moong, Chana, Masoor & more',
        certifications: ['Organic', 'Non-GMO'],
        image: 'assets/images/products/pulses.jpg',
        featured: true,
        price: 150,
        unit: 'kg',
        minOrder: '1 kg',
        moq: 1
    },
    {
        id: 'organic-whole-wheat',
        name: 'Stone-Ground Wheat',
        category: 'grains',
        description: 'Traditional chakki-ground whole wheat flour, nutrient-rich',
        certifications: ['Organic', 'Stone-Ground'],
        image: 'assets/images/products/wheat.jpg',
        featured: false,
        price: 65,
        unit: 'kg',
        minOrder: '1 kg',
        moq: 1
    },

    // Oils & Sweeteners
    {
        id: 'cold-pressed-coconut-oil',
        name: 'Cold-Pressed Oils',
        category: 'oils',
        description: 'Traditional kachi ghani mustard, groundnut & coconut oils, unrefined and pure',
        certifications: ['Organic', 'Cold-Pressed'],
        image: 'assets/images/products/oil.jpg',
        featured: true,
        price: 380,
        unit: 'litre',
        minOrder: '1 litre',
        moq: 1
    },
    {
        id: 'organic-jaggery',
        name: 'Organic Jaggery',
        category: 'oils',
        description: 'Pure sugarcane jaggery powder and blocks, chemical-free processing',
        certifications: ['Organic', 'Natural'],
        image: 'assets/images/products/jaggery.jpg',
        featured: true,
        price: 120,
        unit: 'kg',
        minOrder: '1 kg',
        moq: 1
    },
    {
        id: 'cold-pressed-groundnut-oil',
        name: 'Organic Tea',
        category: 'oils',
        description: 'Premium organic tea from certified gardens, rich in antioxidants',
        certifications: ['Organic', 'Single Origin'],
        image: 'assets/images/products/tea.jpg',
        featured: true,
        price: 450,
        unit: 'kg',
        minOrder: '250 gm',
        moq: 1
    },
    {
        id: 'wild-forest-honey',
        name: 'Raw Forest Honey',
        category: 'oils',
        description: 'Pure unprocessed honey from forest apiaries, naturally crystallizing',
        certifications: ['Organic', 'Raw'],
        image: 'assets/images/products/honey.jpg',
        featured: false,
        price: 650,
        unit: 'kg',
        minOrder: '500 gm',
        moq: 1
    },
    {
        id: 'organic-spices',
        name: 'Organic Spices',
        category: 'oils',
        description: 'Premium whole spices - Turmeric, Cumin, Coriander, Cardamom & more',
        certifications: ['Organic', 'Non-GMO'],
        image: 'assets/images/products/spices.jpg',
        featured: true,
        price: 350,
        unit: 'kg',
        minOrder: '100 gm',
        moq: 1
    }
];

// Helper Functions
function getProductsByCategory(categoryId) {
    if (categoryId === 'all') {
        return PRODUCTS;
    }
    return PRODUCTS.filter(product => product.category === categoryId);
}

function getFeaturedProducts() {
    return PRODUCTS.filter(product => product.featured);
}

function getProductById(productId) {
    return PRODUCTS.find(product => product.id === productId);
}

function getCategoryById(categoryId) {
    return PRODUCT_CATEGORIES.find(category => category.id === categoryId);
}

// Export for module use (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PRODUCT_CATEGORIES,
        PRODUCTS,
        getProductsByCategory,
        getFeaturedProducts,
        getProductById,
        getCategoryById
    };
}

// Make functions available globally for cart.js
window.getProductById = getProductById;
window.PRODUCTS = PRODUCTS;
