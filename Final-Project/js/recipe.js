/* ========================================
    RECIPE MODULE - Recipe Display & Management
======================================== */

/**
 * Display recipes in a grid
 * @param {Array} recipes - Array of recipe objects
 * @param {HTMLElement} container - Container element
 */
function displayRecipes(recipes, container) {
    if (!container) return;
    
    if (!recipes || recipes.length === 0) {
        Utils.showEmptyState(container, 'No recipes found. Try a different search.');
        return;
    }
    
    container.innerHTML = '';
    
    recipes.forEach((recipe, index) => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card fade-in';
        recipeCard.style.animationDelay = `${index * 0.1}s`;
        recipeCard.innerHTML = createRecipeCard(recipe);
        container.appendChild(recipeCard);
    });
    
    // Add event listeners to cards
    attachRecipeCardListeners(container);
}

/**
 * Create recipe card HTML
 * @param {object} recipe - Recipe object
 * @returns {string} - HTML string
 */
function createRecipeCard(recipe) {
    const image = recipe.image || Utils.getPlaceholderImage();
    const title = recipe.title || 'Untitled Recipe';
    const time = Utils.formatTime(recipe.readyInMinutes);
    const servings = recipe.servings || 'N/A';
    const isFavorite = Storage.isInFavorites(recipe.id);
    
    return `
        <img src="${image}" alt="${title}" class="recipe-card-image" loading="lazy">
        <div class="recipe-card-content">
            <h4 class="recipe-card-title">${Utils.truncateText(title, 60)}</h4>
            <div class="recipe-card-meta">
                <span>⏱️ ${time}</span>
                <span>👥 ${servings} servings</span>
            </div>
            <div class="recipe-card-actions">
                <button class="icon-btn view-recipe-btn" data-id="${recipe.id}">
                    👁️ View
                </button>
                <button class="icon-btn favorite-btn ${isFavorite ? 'active' : ''}" data-id="${recipe.id}">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
            </div>
        </div>
    `;
}

/**
 * Attach event listeners to recipe cards
 * @param {HTMLElement} container - Container with recipe cards
 */
function attachRecipeCardListeners(container) {
    // View recipe buttons - use currentTarget to handle clicks on inner elements
    container.querySelectorAll('.view-recipe-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const recipeId = e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.id : null;
            if (recipeId) viewRecipeDetail(recipeId);
        });
    });
    
    // Favorite buttons - use currentTarget so inner icon clicks still resolve to the button
    container.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const targetBtn = e.currentTarget || e.target;
            const recipeId = parseInt(targetBtn.dataset ? targetBtn.dataset.id : null);
            if (!Number.isInteger(recipeId)) return;
            await toggleFavorite(recipeId, targetBtn);
        });
    });
    
    // Make entire card clickable - ignore clicks originating from action buttons
    container.querySelectorAll('.recipe-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // If the click came from an action button (or inside one), ignore
            if (e.target.closest && (e.target.closest('.icon-btn') || e.target.closest('.favorite-btn'))) {
                return;
            }

            const btn = card.querySelector('.view-recipe-btn');
            const recipeId = btn && btn.dataset ? btn.dataset.id : null;
            if (recipeId) viewRecipeDetail(recipeId);
        });
    });
}

/**
 * Navigate to recipe detail page
 * @param {number} recipeId - Recipe ID
 */
function viewRecipeDetail(recipeId) {
    window.location.href = `recipe-detail.html?id=${recipeId}`;
}

/**
 * Toggle favorite status
 * @param {number} recipeId - Recipe ID
 * @param {HTMLElement} button - Favorite button
 */
async function toggleFavorite(recipeId, button) {
    const isCurrentlyFavorite = Storage.isInFavorites(recipeId);
    
    if (isCurrentlyFavorite) {
        // Remove from favorites
        Storage.removeFromFavorites(recipeId);
        button.textContent = '🤍';
        button.classList.remove('active');
        Utils.showToast('Removed from favorites', 'info');
    } else {
        // Add to favorites - need to fetch recipe details
        Utils.showLoading(button);
        const recipe = await API.getRecipeById(recipeId);
        
        if (recipe) {
            Storage.addToFavorites(recipe);
            button.textContent = '❤️';
            button.classList.add('active');
            Utils.animateElement(button, 'heart-animation');
            Utils.showToast('Added to favorites!', 'success');
        } else {
            button.textContent = '🤍';
            Utils.showToast('Failed to add to favorites', 'error');
        }
    }
}

/**
 * Load and display recipe details
 * @param {number} recipeId - Recipe ID
 */
async function loadRecipeDetails(recipeId) {
    if (!API.isAPIKeyConfigured()) {
        Utils.showError(
            document.querySelector('.recipe-content'),
            'API key not configured. Please add your Spoonacular API key.'
        );
        return;
    }
    
    // Show loading states
    Utils.showLoading(document.querySelector('.recipe-hero-content'));
    
    try {
        const recipe = await API.getRecipeById(recipeId);
        
        if (!recipe) {
            Utils.showError(
                document.querySelector('.recipe-content'),
                'Recipe not found'
            );
            return;
        }
        
        displayRecipeDetails(recipe);
        loadSimilarRecipes(recipeId);
        
    } catch (error) {
        console.error('Error loading recipe:', error);
        Utils.showError(
            document.querySelector('.recipe-content'),
            'Failed to load recipe details'
        );
    }
}

/**
 * Display recipe details on page
 * @param {object} recipe - Recipe object
 */
function displayRecipeDetails(recipe) {
    // Update image and title
    document.getElementById('recipeImage').src = recipe.image || Utils.getPlaceholderImage(600, 400);
    document.getElementById('recipeImage').alt = recipe.title;
    document.getElementById('recipeTitle').textContent = recipe.title;
    
    // Update meta information
    document.getElementById('recipeTime').textContent = Utils.formatTime(recipe.readyInMinutes);
    document.getElementById('recipeServings').textContent = `${recipe.servings} servings`;
    document.getElementById('recipeRating').textContent = recipe.spoonacularScore 
        ? (recipe.spoonacularScore / 20).toFixed(1) 
        : 'N/A';
    
    // Update summary
    const summary = Utils.stripHTML(recipe.summary);
    document.getElementById('recipeSummary').textContent = summary;
    
    // Display ingredients
    displayIngredients(recipe.extendedIngredients || []);
    
    // Display nutrition
    displayNutrition(recipe.nutrition);
    
    // Display instructions
    displayInstructions(recipe.analyzedInstructions || []);
    
    // Display diet labels
    displayDietLabels(recipe);
    
    // Update favorite button
    const saveBtn = document.getElementById('saveBtn');
    const isFavorite = Storage.isInFavorites(recipe.id);
    saveBtn.innerHTML = isFavorite ? '<span>❤️</span> Saved' : '<span>❤️</span> Save to Favorites';
    saveBtn.onclick = () => toggleFavoriteDetail(recipe, saveBtn);
}

/**
 * Display ingredients list
 * @param {Array} ingredients - Array of ingredients
 */
function displayIngredients(ingredients) {
    const list = document.getElementById('ingredientsList');
    
    if (!ingredients || ingredients.length === 0) {
        list.innerHTML = '<li>No ingredients available</li>';
        return;
    }
    
    list.innerHTML = ingredients.map(ing => `
        <li>${Utils.formatIngredient(ing)}</li>
    `).join('');
}

/**
 * Display nutrition information
 * @param {object} nutrition - Nutrition object
 */
function displayNutrition(nutrition) {
    if (!nutrition || !nutrition.nutrients) {
        return;
    }
    
    const nutrients = nutrition.nutrients;
    
    const calories = nutrients.find(n => n.name === 'Calories');
    const protein = nutrients.find(n => n.name === 'Protein');
    const carbs = nutrients.find(n => n.name === 'Carbohydrates');
    const fat = nutrients.find(n => n.name === 'Fat');
    
    document.getElementById('nutritionCalories').textContent = calories ? Math.round(calories.amount) : '0';
    document.getElementById('nutritionProtein').textContent = protein ? Utils.formatNutrition(protein.amount) : '0g';
    document.getElementById('nutritionCarbs').textContent = carbs ? Utils.formatNutrition(carbs.amount) : '0g';
    document.getElementById('nutritionFat').textContent = fat ? Utils.formatNutrition(fat.amount) : '0g';
}

/**
 * Display cooking instructions
 * @param {Array} instructions - Array of instruction sets
 */
function displayInstructions(instructions) {
    const list = document.getElementById('instructionsList');
    
    if (!instructions || instructions.length === 0 || !instructions[0].steps) {
        list.innerHTML = '<li>No instructions available</li>';
        return;
    }
    
    const steps = instructions[0].steps;
    list.innerHTML = steps.map(step => `
        <li>${step.step}</li>
    `).join('');
}

/**
 * Display diet labels/badges
 * @param {object} recipe - Recipe object
 */
function displayDietLabels(recipe) {
    const container = document.getElementById('dietLabels');
    const labels = [];
    
    if (recipe.vegetarian) labels.push('Vegetarian');
    if (recipe.vegan) labels.push('Vegan');
    if (recipe.glutenFree) labels.push('Gluten Free');
    if (recipe.dairyFree) labels.push('Dairy Free');
    if (recipe.veryHealthy) labels.push('Very Healthy');
    
    if (labels.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = labels.map(label => `
        <span class="diet-badge">${label}</span>
    `).join('');
}

/**
 * Toggle favorite on detail page
 * @param {object} recipe - Recipe object
 * @param {HTMLElement} button - Save button
 */
function toggleFavoriteDetail(recipe, button) {
    const isFavorite = Storage.isInFavorites(recipe.id);
    
    if (isFavorite) {
        Storage.removeFromFavorites(recipe.id);
        button.innerHTML = '<span>❤️</span> Save to Favorites';
        Utils.showToast('Removed from favorites', 'info');
    } else {
        Storage.addToFavorites(recipe);
        button.innerHTML = '<span>❤️</span> Saved';
        Utils.animateElement(button, 'pulse');
        Utils.showToast('Added to favorites!', 'success');
    }
}

/**
 * Load similar recipes
 * @param {number} recipeId - Recipe ID
 */
async function loadSimilarRecipes(recipeId) {
    const container = document.getElementById('similarRecipes');
    
    try {
        const similar = await API.getSimilarRecipes(recipeId);
        
        if (!similar || similar.length === 0) {
            container.innerHTML = '<p class="loading-message">No similar recipes found</p>';
            return;
        }
        
        // Get full details for similar recipes
        const detailedRecipes = await Promise.all(
            similar.slice(0, 4).map(r => API.getRecipeById(r.id))
        );
        
        displayRecipes(detailedRecipes.filter(r => r !== null), container);
        
    } catch (error) {
        console.error('Error loading similar recipes:', error);
        container.innerHTML = '<p class="loading-message">Failed to load similar recipes</p>';
    }
}

/**
 * Add recipe ingredients to shopping list
 * @param {number} recipeId - Recipe ID
 */
async function addIngredientsToShoppingList(recipeId) {
    const recipe = await API.getRecipeById(recipeId);
    
    if (!recipe || !recipe.extendedIngredients) {
        Utils.showToast('Failed to add ingredients', 'error');
        return;
    }
    
    let addedCount = 0;
    
    recipe.extendedIngredients.forEach(ingredient => {
        const item = {
            name: ingredient.name,
            category: Storage.categorizeIngredient(ingredient.aisle || ingredient.name)
        };
        
        if (Storage.addToShoppingList(item)) {
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        Utils.showToast(`Added ${addedCount} ingredients to shopping list!`, 'success');
    } else {
        Utils.showToast('All ingredients already in shopping list', 'info');
    }
}

/* ========================================
   EXPORT
======================================== */

window.Recipe = {
    displayRecipes,
    createRecipeCard,
    viewRecipeDetail,
    toggleFavorite,
    loadRecipeDetails,
    displayRecipeDetails,
    addIngredientsToShoppingList
};