/* ========================================
    UTILITY FUNCTIONS
======================================== */

/**
 * Format number to display with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
    if (num === null || typeof num === 'undefined' || num === '') return '';
    const n = Number(num);
    if (Number.isNaN(n)) return num.toString();
    return n.toLocaleString('en-US');
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Strip HTML tags from string
 * @param {string} html - HTML string
 * @returns {string} - Plain text
 */
function stripHTML(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

/**
 * Format time in minutes to human readable
 * @param {number} minutes - Time in minutes
 * @returns {string} - Formatted time (e.g., "1h 30min")
 */
function formatTime(minutes) {
    if (!minutes) return 'N/A';
    
    if (minutes < 60) {
        return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) {
        return `${hours}h`;
    }
    
    return `${hours}h ${mins}min`;
}

/**
 * Get current date formatted
 * @param {string} format - Format type ('short', 'long', 'full')
 * @returns {string} - Formatted date
 */
function getCurrentDate(format = 'short') {
    const date = new Date();
    
    if (format === 'short') {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    } else if (format === 'long') {
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
    
    return date.toLocaleDateString();
}

/**
 * Get week dates for meal planner
 * @param {Date} startDate - Starting date
 * @returns {object} - Object with day names and dates
 */
function getWeekDates(startDate = new Date()) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weekDates = {};
    
    // Get Monday of current week
    const current = new Date(startDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    
    days.forEach((dayName, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        weekDates[dayName] = {
            date: date,
            formatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        };
    });
    
    return weekDates;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show loading spinner
 * @param {HTMLElement} element - Element to show spinner in
 */
function showLoading(element) {
    if (!element) return;
    element.innerHTML = '<div class="spinner"></div><p class="loading-message">Loading...</p>';
}

/**
 * Show error message
 * @param {HTMLElement} element - Element to show error in
 * @param {string} message - Error message
 */
function showError(element, message = 'Something went wrong. Please try again.') {
    if (!element) return;
    element.innerHTML = `
        <div class="error-message">
            <p>❌ ${message}</p>
        </div>
    `;
}

/**
 * Show empty state message
 * @param {HTMLElement} element - Element to show message in
 * @param {string} message - Message to display
 */
function showEmptyState(element, message = 'No items found') {
    if (!element) return;
    element.innerHTML = `
        <div class="empty-state">
            <p>${message}</p>
        </div>
    `;
}

/**
 * Show toast notification
 * @param {string} message - Notification message
 * @param {string} type - Type of notification ('success', 'error', 'info')
 */
function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type} toast-animation`;
    toast.textContent = message;
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--info)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Scroll to top of page smoothly
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Scroll to element smoothly
 * @param {string|HTMLElement} target - Element or selector
 */
function scrollToElement(target) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get query parameter from URL
 * @param {string} param - Parameter name
 * @returns {string|null} - Parameter value
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Set query parameter in URL
 * @param {string} param - Parameter name
 * @param {string} value - Parameter value
 */
function setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} - True if in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Format nutrition value
 * @param {number} value - Nutrition value
 * @param {string} unit - Unit (g, mg, etc.)
 * @returns {string} - Formatted value
 */
function formatNutrition(value, unit = 'g') {
    if (!value) return `0${unit}`;
    return `${Math.round(value)}${unit}`;
}

/**
 * Calculate total nutrition from recipes
 * @param {Array} recipes - Array of recipe objects
 * @returns {object} - Total nutrition
 */
function calculateTotalNutrition(recipes) {
    const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };
    
    recipes.forEach(recipe => {
        if (recipe.nutrition) {
            totals.calories += recipe.nutrition.calories || 0;
            totals.protein += recipe.nutrition.protein || 0;
            totals.carbs += recipe.nutrition.carbs || 0;
            totals.fat += recipe.nutrition.fat || 0;
        }
    });
    
    return totals;
}

/**
 * Get random item from array
 * @param {Array} array - Array to pick from
 * @returns {any} - Random item
 */
function getRandomItem(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} - Cloned object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 * @param {object} obj - Object to check
 * @returns {boolean} - True if empty
 */
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Format ingredient for display
 * @param {object} ingredient - Ingredient object
 * @returns {string} - Formatted ingredient string
 */
function formatIngredient(ingredient) {
    if (!ingredient) return '';
    
    const amount = ingredient.amount ? Math.round(ingredient.amount * 100) / 100 : '';
    const unit = ingredient.unit || '';
    const name = ingredient.name || '';
    
    return `${amount} ${unit} ${name}`.trim();
}

/**
 * Toggle element visibility
 * @param {HTMLElement|string} element - Element or selector
 * @param {boolean} show - True to show, false to hide
 */
function toggleElement(element, show) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    
    if (show) {
        el.style.display = 'block';
        el.classList.remove('hidden');
    } else {
        el.style.display = 'none';
        el.classList.add('hidden');
    }
}

/**
 * Add animation class to element
 * @param {HTMLElement} element - Element to animate
 * @param {string} animationClass - Animation class name
 */
function animateElement(element, animationClass) {
    if (!element) return;
    
    element.classList.add(animationClass);
    
    // Remove class after animation completes
    element.addEventListener('animationend', () => {
        element.classList.remove(animationClass);
    }, { once: true });
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Get placeholder image URL
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} - Placeholder image URL
 */
function getPlaceholderImage(width = 300, height = 200) {
    return `https://via.placeholder.com/${width}x${height}/4CAF50/FFFFFF?text=Recipe+Image`;
}

/**
 * Format recipe card HTML
 * @param {object} recipe - Recipe object
 * @returns {string} - HTML string
 */
function createRecipeCardHTML(recipe) {
    const image = recipe.image || getPlaceholderImage();
    const title = recipe.title || 'Untitled Recipe';
    const time = formatTime(recipe.readyInMinutes);
    const servings = recipe.servings || 'N/A';
    
    return `
        <div class="recipe-card fade-in" data-id="${recipe.id}">
            <img src="${image}" alt="${title}" class="recipe-card-image" loading="lazy">
            <div class="recipe-card-content">
                <h4 class="recipe-card-title">${truncateText(title, 60)}</h4>
                <div class="recipe-card-meta">
                    <span>⏱️ ${time}</span>
                    <span>👥 ${servings} servings</span>
                </div>
                <div class="recipe-card-actions">
                    <button class="icon-btn view-recipe-btn" data-id="${recipe.id}">
                        👁️ View
                    </button>
                    <button class="icon-btn favorite-btn" data-id="${recipe.id}">
                        ${Storage.isInFavorites(recipe.id) ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
        
        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
});

/* ========================================
   EXPORT (make functions available globally)
======================================== */

window.Utils = {
    formatNumber,
    truncateText,
    capitalizeFirst,
    stripHTML,
    formatTime,
    getCurrentDate,
    getWeekDates,
    debounce,
    showLoading,
    showError,
    showEmptyState,
    showToast,
    scrollToTop,
    scrollToElement,
    generateId,
    getQueryParam,
    setQueryParam,
    isInViewport,
    formatNutrition,
    calculateTotalNutrition,
    getRandomItem,
    shuffleArray,
    deepClone,
    isEmptyObject,
    formatIngredient,
    toggleElement,
    animateElement,
    isValidEmail,
    getPlaceholderImage,
    createRecipeCardHTML,
    initMobileMenu
};