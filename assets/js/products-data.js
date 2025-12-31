/* ============================================
   GREEN EPICURE - Product Data
   B2B Organic Product Catalog
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

// Products
const PRODUCTS = [
    // A2 Dairy Products
    {
        id: 'dairy-001',
        name: 'A2 Gir Cow Milk',
        category: 'dairy',
        description: 'Pure A2 beta-casein milk from indigenous Gir cows, farm-fresh daily',
        certifications: ['A2 Certified', 'Organic'],
        image: 'assets/images/products/milk.jpg',
        featured: true,
        minOrder: '50 liters'
    },
    {
        id: 'dairy-002',
        name: 'Bilona A2 Ghee',
        category: 'dairy',
        description: 'Traditional hand-churned bilona ghee from A2 Gir cow milk, golden and aromatic',
        certifications: ['A2 Certified', 'Traditional'],
        image: 'assets/images/products/ghee.jpg',
        featured: true,
        minOrder: '10 kg'
    },
    {
        id: 'dairy-003',
        name: 'Fresh A2 Paneer',
        category: 'dairy',
        description: 'Soft, creamy paneer made from fresh A2 Gir cow milk',
        certifications: ['A2 Certified', 'Fresh'],
        image: 'assets/images/products/paneer.jpg',
        featured: false,
        minOrder: '5 kg'
    },

    // Grains & Staples
    {
        id: 'grains-001',
        name: 'Organic Millets',
        category: 'grains',
        description: 'Nutrient-rich millets - Ragi, Jowar, Bajra & more. Perfect for health-conscious consumers',
        certifications: ['Organic', 'Gluten-Free'],
        image: 'assets/images/products/millets.jpg',
        featured: true,
        minOrder: '25 kg'
    },
    {
        id: 'grains-002',
        name: 'Organic Basmati Rice',
        category: 'grains',
        description: 'Premium aged basmati rice, naturally aromatic, extra-long grain',
        certifications: ['Organic', 'Non-GMO'],
        image: 'assets/images/products/rice.jpg',
        featured: true,
        minOrder: '50 kg'
    },
    {
        id: 'grains-003',
        name: 'Organic Pulses',
        category: 'grains',
        description: 'Premium organic dal - Toor, Moong, Chana, Masoor & more',
        certifications: ['Organic', 'Non-GMO'],
        image: 'assets/images/products/pulses.jpg',
        featured: true,
        minOrder: '25 kg'
    },
    {
        id: 'grains-004',
        name: 'Stone-Ground Wheat',
        category: 'grains',
        description: 'Traditional chakki-ground whole wheat flour, nutrient-rich',
        certifications: ['Organic', 'Stone-Ground'],
        image: 'assets/images/products/wheat.jpg',
        featured: false,
        minOrder: '25 kg'
    },

    // Oils & Sweeteners
    {
        id: 'oils-001',
        name: 'Cold-Pressed Oils',
        category: 'oils',
        description: 'Traditional kachi ghani mustard, groundnut & coconut oils, unrefined and pure',
        certifications: ['Organic', 'Cold-Pressed'],
        image: 'assets/images/products/oil.jpg',
        featured: true,
        minOrder: '20 liters'
    },
    {
        id: 'oils-002',
        name: 'Organic Jaggery',
        category: 'oils',
        description: 'Pure sugarcane jaggery powder and blocks, chemical-free processing',
        certifications: ['Organic', 'Natural'],
        image: 'assets/images/products/jaggery.jpg',
        featured: true,
        minOrder: '25 kg'
    },
    {
        id: 'oils-003',
        name: 'Organic Tea',
        category: 'oils',
        description: 'Premium organic tea from certified gardens, rich in antioxidants',
        certifications: ['Organic', 'Single Origin'],
        image: 'assets/images/products/tea.jpg',
        featured: true,
        minOrder: '10 kg'
    },
    {
        id: 'oils-004',
        name: 'Raw Forest Honey',
        category: 'oils',
        description: 'Pure unprocessed honey from forest apiaries, naturally crystallizing',
        certifications: ['Organic', 'Raw'],
        image: 'assets/images/products/honey.jpg',
        featured: false,
        minOrder: '10 kg'
    },
    {
        id: 'oils-005',
        name: 'Organic Spices',
        category: 'oils',
        description: 'Premium whole spices - Turmeric, Cumin, Coriander, Cardamom & more',
        certifications: ['Organic', 'Non-GMO'],
        image: 'assets/images/products/spices.jpg',
        featured: true,
        minOrder: '5 kg'
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
