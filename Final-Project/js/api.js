

// API key loaded from config.js
const API_KEY = CONFIG.SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com';

// API Endpoints
const API = {
    // Search recipes
    searchRecipes: (query, filters = {}) => {
        const params = new URLSearchParams({
            apiKey: API_KEY,
            query: query || '',
            number: 12,
            addRecipeInformation: true,
            fillIngredients: true,
            ...filters
        });
        return `${BASE_URL}/recipes/complexSearch?${params}`;
    },

    // Get recipe details by ID
    getRecipeDetails: (id) => {
        return `${BASE_URL}/recipes/${id}/information?apiKey=${API_KEY}&includeNutrition=true`;
    },

    // Get similar recipes
    getSimilarRecipes: (id) => {
        return `${BASE_URL}/recipes/${id}/similar?apiKey=${API_KEY}&number=4`;
    },

    // Get random recipes
    getRandomRecipes: (number = 6, tags = '') => {
        const params = new URLSearchParams({
            apiKey: API_KEY,
            number: number,
            tags: tags
        });
        return `${BASE_URL}/recipes/random?${params}`;
    },

    // Get recipe ingredients
    getIngredientInfo: (id) => {
        return `${BASE_URL}/food/ingredients/${id}/information?apiKey=${API_KEY}`;
    }
};

/* ========================================
   API REQUEST FUNCTIONS
======================================== */

/**
 * Fetch data from API with error handling
 * @param {string} url - API endpoint URL
 * @returns {Promise} - Response data or error
 */
async function fetchFromAPI(url) {
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return { success: true, data };
        
    } catch (error) {
        console.error('API Fetch Error:', error);
        return { 
            success: false, 
            error: error.message || 'Failed to fetch data from API' 
        };
    }
}

/**
 * Search for recipes
 * @param {string} query - Search query
 * @param {object} filters - Filter options (cuisine, diet, maxReadyTime, etc.)
 * @returns {Promise} - Array of recipes
 */
async function searchRecipes(query = '', filters = {}) {
    const url = API.searchRecipes(query, filters);
    const result = await fetchFromAPI(url);
    
    if (result.success) {
        return result.data.results || [];
    }
    return [];
}

/**
 * Get detailed information about a recipe
 * @param {number} recipeId - Recipe ID
 * @returns {Promise} - Recipe details object
 */
async function getRecipeById(recipeId) {
    const url = API.getRecipeDetails(recipeId);
    const result = await fetchFromAPI(url);
    
    if (result.success) {
        return result.data;
    }
    return null;
}

/**
 * Get similar recipes to a given recipe
 * @param {number} recipeId - Recipe ID
 * @returns {Promise} - Array of similar recipes
 */
async function getSimilarRecipes(recipeId) {
    const url = API.getSimilarRecipes(recipeId);
    const result = await fetchFromAPI(url);
    
    if (result.success) {
        return result.data || [];
    }
    return [];
}

/**
 * Get random recipes
 * @param {number} count - Number of recipes to fetch
 * @param {string} tags - Tags for filtering (e.g., 'vegetarian,dessert')
 * @returns {Promise} - Array of random recipes
 */
async function getRandomRecipes(count = 6, tags = '') {
    const url = API.getRandomRecipes(count, tags);
    const result = await fetchFromAPI(url);
    
    if (result.success) {
        return result.data.recipes || [];
    }
    return [];
}

/**
 * Get recipes by cuisine type
 * @param {string} cuisine - Cuisine type (e.g., 'italian', 'mexican')
 * @param {number} count - Number of recipes
 * @returns {Promise} - Array of recipes
 */
async function getRecipesByCuisine(cuisine, count = 12) {
    return await searchRecipes('', { cuisine, number: count });
}

/**
 * Get recipes by diet type
 * @param {string} diet - Diet type (e.g., 'vegetarian', 'vegan')
 * @param {number} count - Number of recipes
 * @returns {Promise} - Array of recipes
 */
async function getRecipesByDiet(diet, count = 12) {
    return await searchRecipes('', { diet, number: count });
}

/**
 * Check if API key is configured
 * @returns {boolean} - True if API key is set
 */
function isAPIKeyConfigured() {
    if (API_KEY === 'YOUR_API_KEY_HERE' || !API_KEY) {
        console.error('⚠️ Spoonacular API key not configured! Please add your API key in api.js');
        return false;
    }
    return true;
}

/* ========================================
   CACHE MANAGEMENT (Optional)
======================================== */

/**
 * Cache API responses to reduce API calls
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} expiryMinutes - Cache expiry time in minutes
 */
function cacheAPIResponse(key, data, expiryMinutes = 60) {
    const cacheData = {
        data: data,
        timestamp: Date.now(),
        expiry: expiryMinutes * 60 * 1000
    };
    localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheData));
}

/**
 * Get cached API response if valid
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if expired/not found
 */
function getCachedAPIResponse(key) {
    const cached = localStorage.getItem(`api_cache_${key}`);
    if (!cached) return null;
    
    try {
        const cacheData = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - cacheData.timestamp < cacheData.expiry) {
            return cacheData.data;
        } else {
            // Cache expired, remove it
            localStorage.removeItem(`api_cache_${key}`);
            return null;
        }
    } catch (error) {
        console.error('Cache parse error:', error);
        return null;
    }
}

/**
 * Search recipes with caching
 * @param {string} query - Search query
 * @param {object} filters - Filter options
 * @returns {Promise} - Array of recipes
 */
async function searchRecipesWithCache(query = '', filters = {}) {
    const cacheKey = `search_${query}_${JSON.stringify(filters)}`;
    
    // Check cache first
    const cached = getCachedAPIResponse(cacheKey);
    if (cached) {
        console.log('📦 Using cached results');
        return cached;
    }
    
    // Fetch from API
    const results = await searchRecipes(query, filters);
    
    // Cache the results
    if (results.length > 0) {
        cacheAPIResponse(cacheKey, results, 30); // Cache for 30 minutes
    }
    
    return results;
}

/* ========================================
   EXPORT (for use in other modules)
======================================== */

// Make functions available globally
window.API = {
    searchRecipes,
    getRecipeById,
    getSimilarRecipes,
    getRandomRecipes,
    getRecipesByCuisine,
    getRecipesByDiet,
    isAPIKeyConfigured,
    searchRecipesWithCache,
    cacheAPIResponse,
    getCachedAPIResponse
};