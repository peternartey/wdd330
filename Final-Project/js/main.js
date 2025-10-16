/* ========================================
   MAIN APPLICATION LOGIC
======================================== */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', init);

function init() {
    const currentPage = getCurrentPage();
    
    // Initialize based on current page
    switch(currentPage) {
        case 'index':
            initHomePage();
            break;
        case 'search':
            initSearchPage();
            break;
        case 'recipe-detail':
            initRecipeDetailPage();
            break;
        case 'meal-planner':
            initMealPlannerPage();
            break;
        case 'shopping-list':
            initShoppingListPage();
            break;
    }
    
    // Initialize mobile menu (runs on all pages)
    Utils.initMobileMenu();
}

/**
 * Get current page name
 * @returns {string} - Page name
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    
    if (page === '' || page === 'index.html') return 'index';
    if (page === 'search.html') return 'search';
    if (page === 'recipe-detail.html') return 'recipe-detail';
    if (page === 'meal-planner.html') return 'meal-planner';
    if (page === 'shopping-list.html') return 'shopping-list';
    
    return 'index';
}

/* ========================================
   HOME PAGE
======================================== */

async function initHomePage() {
    console.log('🏠 Initializing Home Page');
    
    // Load recommended recipes
    loadRecommendedRecipes();
    
    // Load today's nutrition
    loadTodaysNutrition();
    
    // Initialize surprise me button
    const surpriseBtn = document.getElementById('surpriseMe');
    if (surpriseBtn) {
        surpriseBtn.addEventListener('click', showRandomRecipe);
    }
}

/**
 * Load recommended recipes on homepage
 */
async function loadRecommendedRecipes() {
    const container = document.getElementById('recommendedRecipes');
    if (!container) return;
    
    if (!API.isAPIKeyConfigured()) {
        container.innerHTML = '<p class="loading-message">⚠️ Please configure your API key in api.js</p>';
        return;
    }
    
    Utils.showLoading(container);
    
    try {
        // Get random recipes
        const recipes = await API.getRandomRecipes(6);
        Recipe.displayRecipes(recipes, container);
    } catch (error) {
        console.error('Error loading recommended recipes:', error);
        Utils.showError(container, 'Failed to load recipes');
    }
}

/**
 * Load today's nutrition from meal plan
 */
function loadTodaysNutrition() {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
    const mealPlan = Storage.getMealPlan();
    const todaysMeals = mealPlan[today];
    
    if (!todaysMeals) return;
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    // Calculate totals from meals
    Object.values(todaysMeals).forEach(meal => {
        if (meal && meal.nutrition) {
            totalCalories += meal.nutrition.calories || 0;
            totalProtein += meal.nutrition.protein || 0;
            totalCarbs += meal.nutrition.carbs || 0;
            totalFat += meal.nutrition.fat || 0;
        }
    });
    
    // Update UI
    const caloriesValue = document.getElementById('caloriesValue');
    const proteinValue = document.getElementById('proteinValue');
    const carbsValue = document.getElementById('carbsValue');
    const fatValue = document.getElementById('fatValue');
    const caloriesProgress = document.getElementById('caloriesProgress');
    
    if (caloriesValue) {
        caloriesValue.textContent = `${Math.round(totalCalories)} / 2000`;
    }
    if (proteinValue) {
        proteinValue.textContent = `${Math.round(totalProtein)}g`;
    }
    if (carbsValue) {
        carbsValue.textContent = `${Math.round(totalCarbs)}g`;
    }
    if (fatValue) {
        fatValue.textContent = `${Math.round(totalFat)}g`;
    }
    if (caloriesProgress) {
        const percentage = Math.min((totalCalories / 2000) * 100, 100);
        caloriesProgress.style.width = `${percentage}%`;
    }
}

/**
 * Show random recipe (Surprise Me feature)
 */
async function showRandomRecipe() {
    const btn = document.getElementById('surpriseMe');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<span class="spinner"></span> Finding...';
    btn.disabled = true;
    
    try {
        const recipes = await API.getRandomRecipes(1);
        
        if (recipes && recipes.length > 0) {
            window.location.href = `recipe-detail.html?id=${recipes[0].id}`;
        } else {
            Utils.showToast('Could not find a recipe. Try again!', 'error');
        }
    } catch (error) {
        console.error('Error getting random recipe:', error);
        Utils.showToast('Failed to get random recipe', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/* ========================================
   SEARCH PAGE
======================================== */

function initSearchPage() {
    console.log('🔍 Initializing Search Page');
    
    // Get elements
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const cuisineFilter = document.getElementById('cuisineFilter');
    const dietFilter = document.getElementById('dietFilter');
    const maxTimeFilter = document.getElementById('maxTimeFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    
    // Load initial popular recipes
    performSearch();
    
    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performSearch();
        });
    }
    
    // Enter key in search input
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Filter changes
    [cuisineFilter, dietFilter, maxTimeFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => {
                performSearch();
            });
        }
    });
    
    // Clear filters
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (cuisineFilter) cuisineFilter.value = '';
            if (dietFilter) dietFilter.value = '';
            if (maxTimeFilter) maxTimeFilter.value = '';
            performSearch();
        });
    }
    
    // Quick filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const diet = e.target.dataset.diet;
            const cuisine = e.target.dataset.cuisine;
            const time = e.target.dataset.time;
            
            if (diet && dietFilter) {
                dietFilter.value = diet;
            }
            if (cuisine && cuisineFilter) {
                cuisineFilter.value = cuisine;
            }
            if (time && maxTimeFilter) {
                maxTimeFilter.value = time;
            }
            
            performSearch();
        });
    });
}

/**
 * Perform recipe search with filters
 */
async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const cuisineFilter = document.getElementById('cuisineFilter');
    const dietFilter = document.getElementById('dietFilter');
    const maxTimeFilter = document.getElementById('maxTimeFilter');
    const resultsContainer = document.getElementById('searchResults');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!resultsContainer) return;
    
    if (!API.isAPIKeyConfigured()) {
        resultsContainer.innerHTML = '<p class="loading-message">⚠️ Please configure your API key in api.js</p>';
        return;
    }
    
    Utils.showLoading(resultsContainer);
    
    // Build filters object
    const filters = {};
    const query = searchInput ? searchInput.value.trim() : '';
    
    if (cuisineFilter && cuisineFilter.value) {
        filters.cuisine = cuisineFilter.value;
    }
    if (dietFilter && dietFilter.value) {
        filters.diet = dietFilter.value;
    }
    if (maxTimeFilter && maxTimeFilter.value) {
        filters.maxReadyTime = maxTimeFilter.value;
    }
    
    try {
        const recipes = await API.searchRecipesWithCache(query, filters);
        
        if (resultsTitle) {
            resultsTitle.textContent = query ? `Results for "${query}"` : 'Popular Recipes';
        }
        if (resultsCount) {
            resultsCount.textContent = `${recipes.length} recipes found`;
        }
        
        Recipe.displayRecipes(recipes, resultsContainer);
        
        // Save search to recent searches
        if (query) {
            Storage.addRecentSearch(query);
        }
        
    } catch (error) {
        console.error('Search error:', error);
        Utils.showError(resultsContainer, 'Failed to search recipes');
    }
}

/* ========================================
   RECIPE DETAIL PAGE
======================================== */

function initRecipeDetailPage() {
    console.log('📄 Initializing Recipe Detail Page');
    
    // Get recipe ID from URL
    const recipeId = Utils.getQueryParam('id');
    
    if (!recipeId) {
        Utils.showError(
            document.querySelector('.recipe-content'),
            'Recipe ID not found. Please return to search.'
        );
        return;
    }
    
    // Load recipe details
    Recipe.loadRecipeDetails(recipeId);
    
    // Add to shopping list button
    const addToShoppingBtn = document.getElementById('addToShoppingBtn');
    if (addToShoppingBtn) {
        addToShoppingBtn.addEventListener('click', () => {
            Recipe.addIngredientsToShoppingList(recipeId);
        });
    }
    
    // Add to meal plan button
    const addToMealPlanBtn = document.getElementById('addToMealPlanBtn');
    if (addToMealPlanBtn) {
        addToMealPlanBtn.addEventListener('click', () => {
            Utils.showToast('Redirecting to meal planner...', 'info');
            setTimeout(() => {
                window.location.href = `meal-planner.html?recipeId=${recipeId}`;
            }, 1000);
        });
    }
}

/* ========================================
   MEAL PLANNER PAGE
======================================== */

function initMealPlannerPage() {
    console.log('📅 Initializing Meal Planner Page');
    
    // Load current meal plan
    loadMealPlan();
    
    // Initialize week navigation
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            // Week navigation functionality (optional for now)
            Utils.showToast('Previous week navigation coming soon!', 'info');
        });
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            Utils.showToast('Next week navigation coming soon!', 'info');
        });
    }
    
    // Generate plan button
    const generatePlanBtn = document.getElementById('generatePlanBtn');
    if (generatePlanBtn) {
        generatePlanBtn.addEventListener('click', generateAutoMealPlan);
    }
    
    // Clear plan button
    const clearPlanBtn = document.getElementById('clearPlanBtn');
    if (clearPlanBtn) {
        clearPlanBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the entire meal plan?')) {
                Storage.clearMealPlan();
                loadMealPlan();
                Utils.showToast('Meal plan cleared', 'info');
            }
        });
    }
    
    // Update week dates
    updateWeekDates();
}

/**
 * Load and display meal plan
 */
function loadMealPlan() {
    const mealPlan = Storage.getMealPlan();
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
            const slotId = `${day}-${mealType}`;
            const slotElement = document.getElementById(slotId);
            
            if (slotElement) {
                const meal = mealPlan[day][mealType];
                
                if (meal) {
                    slotElement.innerHTML = `
                        <div class="meal-item">
                            <p class="meal-name">${Utils.truncateText(meal.title, 30)}</p>
                            <button class="remove-meal-btn" data-day="${day}" data-meal="${mealType}">×</button>
                        </div>
                    `;
                } else {
                    slotElement.innerHTML = '<button class="add-meal-btn">+ Add Meal</button>';
                }
            }
        });
    });
    
    // Attach event listeners
    attachMealPlanListeners();
    
    // Update summary
    updateMealPlanSummary();
}

/**
 * Attach event listeners to meal plan
 */
function attachMealPlanListeners() {
    // Add meal buttons
    document.querySelectorAll('.add-meal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            Utils.showToast('Redirecting to recipe search...', 'info');
            setTimeout(() => {
                window.location.href = 'search.html';
            }, 1000);
        });
    });
    
    // Remove meal buttons
    document.querySelectorAll('.remove-meal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const day = e.target.dataset.day;
            const mealType = e.target.dataset.meal;
            
            Storage.removeMealFromPlan(day, mealType);
            loadMealPlan();
            Utils.showToast('Meal removed', 'info');
        });
    });
}

/**
 * Update week dates display
 */
function updateWeekDates() {
    const weekDates = Utils.getWeekDates();
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
        const dateElement = document.getElementById(`${day}Date`);
        if (dateElement && weekDates[day]) {
            dateElement.textContent = weekDates[day].formatted;
        }
    });
    
    // Update week header
    const currentWeekElement = document.getElementById('currentWeek');
    if (currentWeekElement && weekDates.monday) {
        const startDate = weekDates.monday.date;
        const endDate = weekDates.sunday.date;
        currentWeekElement.textContent = `Week of ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }
}

/**
 * Generate automatic meal plan
 */
async function generateAutoMealPlan() {
    const btn = document.getElementById('generatePlanBtn');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<span class="spinner"></span> Generating...';
    btn.disabled = true;
    
    try {
        // Clear existing plan
        Storage.clearMealPlan();
        
        // Get random recipes for the week
        const recipes = await API.getRandomRecipes(21); // 7 days × 3 meals
        
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        
        let recipeIndex = 0;
        
        days.forEach(day => {
            mealTypes.forEach(mealType => {
                if (recipes[recipeIndex]) {
                    Storage.addMealToPlan(day, mealType, recipes[recipeIndex]);
                    recipeIndex++;
                }
            });
        });
        
        loadMealPlan();
        Utils.showToast('Meal plan generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating meal plan:', error);
        Utils.showToast('Failed to generate meal plan', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Update meal plan summary statistics
 */
function updateMealPlanSummary() {
    const meals = Storage.getAllMealsFromPlan();
    const totalMeals = meals.length;
    
    // Update total meals
    const totalMealsElement = document.getElementById('totalMeals');
    if (totalMealsElement) {
        totalMealsElement.textContent = `${totalMeals} / 21`;
    }
    
    // Calculate average calories (if nutrition data available)
    let totalCalories = 0;
    let mealsWithCalories = 0;
    
    meals.forEach(({ recipe }) => {
        if (recipe.nutrition && recipe.nutrition.calories) {
            totalCalories += recipe.nutrition.calories;
            mealsWithCalories++;
        }
    });
    
    const avgCaloriesElement = document.getElementById('avgCalories');
    if (avgCaloriesElement) {
        const avg = mealsWithCalories > 0 ? Math.round(totalCalories / 7) : 0;
        avgCaloriesElement.textContent = avg;
    }
    
    // Update shopping items count
    const shoppingItemsElement = document.getElementById('shoppingItems');
    if (shoppingItemsElement) {
        const shoppingList = Storage.generateShoppingListFromMealPlan();
        shoppingItemsElement.textContent = shoppingList.length;
    }
}

/* ========================================
   SHOPPING LIST PAGE
======================================== */

function initShoppingListPage() {
    console.log('🛒 Initializing Shopping List Page');
    
    // Load shopping list
    loadShoppingList();
    
    // Generate list from meal plan
    const generateListBtn = document.getElementById('generateListBtn');
    if (generateListBtn) {
        generateListBtn.addEventListener('click', generateShoppingList);
    }
    
    // Clear list
    const clearListBtn = document.getElementById('clearListBtn');
    if (clearListBtn) {
        clearListBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the shopping list?')) {
                Storage.clearShoppingList();
                loadShoppingList();
                Utils.showToast('Shopping list cleared', 'info');
            }
        });
    }
    
    // Print list
    const printListBtn = document.getElementById('printListBtn');
    if (printListBtn) {
        printListBtn.addEventListener('click', () => {
            window.print();
        });
    }
    
    // Add custom item
    const addItemBtn = document.getElementById('addItemBtn');
    const customItemInput = document.getElementById('customItemInput');
    const customCategorySelect = document.getElementById('customCategorySelect');
    
    if (addItemBtn && customItemInput && customCategorySelect) {
        addItemBtn.addEventListener('click', () => {
            const itemName = customItemInput.value.trim();
            const category = customCategorySelect.value;
            
            if (itemName) {
                Storage.addToShoppingList({ name: itemName, category });
                customItemInput.value = '';
                loadShoppingList();
                Utils.showToast('Item added!', 'success');
            }
        });
        
        // Enter key to add item
        customItemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addItemBtn.click();
            }
        });
    }
}

/**
 * Load and display shopping list
 */
function loadShoppingList() {
    const shoppingList = Storage.getShoppingList();
    const emptyState = document.getElementById('emptyState');
    
    if (shoppingList.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        hideAllCategories();
        updateShoppingListSummary(0, 0);
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    // Group items by category
    const grouped = {};
    shoppingList.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });
    
    // Display each category
    const categories = ['produce', 'meat', 'dairy', 'grains', 'pantry', 'spices', 'other'];
    
    categories.forEach(category => {
        const section = document.getElementById(`${category}Section`);
        const itemsList = document.getElementById(`${category}Items`);
        const countElement = document.getElementById(`${category}Count`);
        
        if (grouped[category] && grouped[category].length > 0) {
            if (section) section.style.display = 'block';
            if (countElement) countElement.textContent = `${grouped[category].length} items`;
            
            if (itemsList) {
                itemsList.innerHTML = grouped[category].map(item => `
                    <li class="${item.checked ? 'checked' : ''}" data-id="${item.id}">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}">
                        <span>${item.name}</span>
                        <button class="delete-item-btn" data-id="${item.id}">🗑️</button>
                    </li>
                `).join('');
            }
        } else {
            if (section) section.style.display = 'none';
        }
    });
    
    // Attach event listeners
    attachShoppingListListeners();
    
    // Update summary
    const checkedCount = shoppingList.filter(item => item.checked).length;
    updateShoppingListSummary(shoppingList.length, checkedCount);
}

/**
 * Hide all category sections
 */
function hideAllCategories() {
    const categories = ['produce', 'meat', 'dairy', 'grains', 'pantry', 'spices', 'other'];
    categories.forEach(category => {
        const section = document.getElementById(`${category}Section`);
        if (section) section.style.display = 'none';
    });
}

/**
 * Attach event listeners to shopping list items
 */
function attachShoppingListListeners() {
    // Checkboxes
    document.querySelectorAll('.shopping-items input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const itemId = parseInt(e.target.dataset.id);
            Storage.toggleShoppingItem(itemId);
            loadShoppingList();
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = parseInt(e.target.dataset.id);
            Storage.removeFromShoppingList(itemId);
            loadShoppingList();
            Utils.showToast('Item removed', 'info');
        });
    });
}

/**
 * Generate shopping list from meal plan
 */
function generateShoppingList() {
    const items = Storage.generateShoppingListFromMealPlan();
    
    if (items.length === 0) {
        Utils.showToast('No meals in your meal plan', 'info');
        return;
    }
    
    // Clear existing list
    Storage.clearShoppingList();
    
    // Add all items
    items.forEach(item => {
        Storage.addToShoppingList(item);
    });
    
    loadShoppingList();
    Utils.showToast(`Generated list with ${items.length} items!`, 'success');
}

/**
 * Update shopping list summary
 */
function updateShoppingListSummary(total, checked) {
    const totalElement = document.getElementById('totalItems');
    const checkedElement = document.getElementById('checkedItems');
    const remainingElement = document.getElementById('remainingItems');
    
    if (totalElement) totalElement.textContent = total;
    if (checkedElement) checkedElement.textContent = checked;
    if (remainingElement) remainingElement.textContent = total - checked;
}

/* ========================================
   EXPORT
======================================== */

console.log('✅ Main app initialized');