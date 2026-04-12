/* ========================================
   MEAL PLANNER MODULE
======================================== */

/**
 * Initialize meal planner functionality
 */
function initMealPlanner() {
    loadMealPlan();
    initWeekNavigation();
    initMealPlanActions();
    updateWeekDates();
    updateMealPlanSummary();
}

/**
 * Load and display the current meal plan
 */
function loadMealPlan() {
    const mealPlan = Storage.getMealPlan();
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    
    days.forEach(day => {
        mealTypes.forEach(mealType => {
            const slotId = `${day}-${mealType}`;
            const slotElement = document.getElementById(slotId);
            
            if (!slotElement) return;
            
            const meal = mealPlan[day] && mealPlan[day][mealType];
            
            if (meal) {
                displayMealInSlot(slotElement, meal, day, mealType);
            } else {
                displayEmptySlot(slotElement, day, mealType);
            }
        });
    });
    
    attachMealPlanEventListeners();
}

/**
 * Display a meal in a slot
 */
function displayMealInSlot(slotElement, meal, day, mealType) {
    const calories = meal.nutrition?.calories ? `${Math.round(meal.nutrition.calories)} cal` : '';
    
    slotElement.innerHTML = `
        <div class="meal-item fade-in">
            <img src="${meal.image || Utils.getPlaceholderImage(100, 80)}" 
                 alt="${meal.title}" 
                 class="meal-thumbnail">
            <div class="meal-info">
                <p class="meal-title">${Utils.truncateText(meal.title, 35)}</p>
                ${calories ? `<span class="meal-calories">${calories}</span>` : ''}
            </div>
            <button class="remove-meal-btn" 
                    data-day="${day}" 
                    data-meal="${mealType}"
                    title="Remove meal">×</button>
        </div>
    `;
}

/**
 * Display empty meal slot
 */
function displayEmptySlot(slotElement, day, mealType) {
    slotElement.innerHTML = `
        <button class="add-meal-btn" 
                data-day="${day}" 
                data-meal="${mealType}">
            + Add Meal
        </button>
    `;
}

/**
 * Attach event listeners to meal plan elements
 */
function attachMealPlanEventListeners() {
    // Add meal buttons
    document.querySelectorAll('.add-meal-btn').forEach(btn => {
        btn.addEventListener('click', handleAddMeal);
    });
    
    // Remove meal buttons
    document.querySelectorAll('.remove-meal-btn').forEach(btn => {
        btn.addEventListener('click', handleRemoveMeal);
    });
    
    // Meal items (click to view details)
    document.querySelectorAll('.meal-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-meal-btn')) {
                // Could open modal with meal details
                Utils.showToast('Click "View" to see recipe details', 'info');
            }
        });
    });
}

/**
 * Handle adding a meal
 */
function handleAddMeal(e) {
    const day = e.target.dataset.day;
    const mealType = e.target.dataset.meal;
    
    // Redirect to search page with parameters
    Utils.showToast('Redirecting to recipe search...', 'info');
    setTimeout(() => {
        window.location.href = `search.html?day=${day}&meal=${mealType}`;
    }, 800);
}

/**
 * Handle removing a meal
 */
function handleRemoveMeal(e) {
    e.stopPropagation();
    const day = e.target.dataset.day;
    const mealType = e.target.dataset.meal;
    
    if (confirm(`Remove this ${mealType}?`)) {
        Storage.removeMealFromPlan(day, mealType);
        loadMealPlan();
        updateMealPlanSummary();
        Utils.showToast('Meal removed', 'info');
    }
}

/**
 * Initialize week navigation
 */
function initWeekNavigation() {
    const prevWeekBtn = document.getElementById('prevWeek');
    const nextWeekBtn = document.getElementById('nextWeek');
    
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            Utils.showToast('Previous week navigation coming soon!', 'info');
        });
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            Utils.showToast('Next week navigation coming soon!', 'info');
        });
    }
}

/**
 * Initialize meal plan action buttons
 */
function initMealPlanActions() {
    // Generate auto plan
    const generateBtn = document.getElementById('generatePlanBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateAutoMealPlan);
    }
    
    // Clear plan
    const clearBtn = document.getElementById('clearPlanBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearMealPlan);
    }
}

/**
 * Generate automatic meal plan
 */
async function generateAutoMealPlan() {
    const btn = document.getElementById('generatePlanBtn');
    const originalText = btn.innerHTML;
    
    if (!API.isAPIKeyConfigured()) {
        Utils.showToast('Please configure your API key first', 'error');
        return;
    }
    
    btn.innerHTML = '<span class="spinner"></span> Generating...';
    btn.disabled = true;
    
    try {
        // Clear existing plan
        Storage.clearMealPlan();
        
        // Get 21 random recipes (7 days × 3 meals)
        const recipes = await API.getRandomRecipes(21);
        
        if (!recipes || recipes.length === 0) {
            throw new Error('No recipes returned');
        }
        
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
        updateMealPlanSummary();
        Utils.showToast('Meal plan generated successfully! 🎉', 'success');
        
    } catch (error) {
        console.error('Error generating meal plan:', error);
        Utils.showToast('Failed to generate meal plan. Try again.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Clear entire meal plan
 */
function clearMealPlan() {
    if (confirm('Are you sure you want to clear the entire meal plan?')) {
        Storage.clearMealPlan();
        loadMealPlan();
        updateMealPlanSummary();
        Utils.showToast('Meal plan cleared', 'info');
    }
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
        currentWeekElement.textContent = `Week of ${startDate.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        })}`;
    }
}

/**
 * Update meal plan summary statistics
 */
function updateMealPlanSummary() {
    const meals = Storage.getAllMealsFromPlan();
    const totalMeals = meals.length;
    
    // Update total meals count
    const totalMealsElement = document.getElementById('totalMeals');
    if (totalMealsElement) {
        totalMealsElement.textContent = `${totalMeals} / 21`;
    }
    
    // Calculate average calories per day
    let totalCalories = 0;
    let mealsWithCalories = 0;
    
    meals.forEach(({ recipe }) => {
        if (recipe.nutrition?.calories) {
            totalCalories += recipe.nutrition.calories;
            mealsWithCalories++;
        }
    });
    
    const avgCaloriesElement = document.getElementById('avgCalories');
    if (avgCaloriesElement) {
        const avgPerDay = mealsWithCalories > 0 ? Math.round(totalCalories / 7) : 0;
        avgCaloriesElement.textContent = avgPerDay;
    }
    
    // Update shopping items count
    const shoppingItemsElement = document.getElementById('shoppingItems');
    if (shoppingItemsElement) {
        const shoppingList = Storage.generateShoppingListFromMealPlan();
        shoppingItemsElement.textContent = shoppingList.length;
    }
}

/**
 * Add recipe to meal plan from URL parameter
 */
function addRecipeFromURL() {
    const recipeId = Utils.getQueryParam('recipeId');
    const day = Utils.getQueryParam('day');
    const mealType = Utils.getQueryParam('meal');
    
    if (recipeId && day && mealType) {
        // Fetch recipe and add to plan
        API.getRecipeById(recipeId).then(recipe => {
            if (recipe) {
                Storage.addMealToPlan(day, mealType, recipe);
                loadMealPlan();
                updateMealPlanSummary();
                Utils.showToast('Recipe added to meal plan!', 'success');
                
                // Remove URL parameters
                window.history.replaceState({}, document.title, 'meal-planner.html');
            }
        });
    }
}

/* ========================================
   EXPORT
======================================== */

window.MealPlanner = {
    initMealPlanner,
    loadMealPlan,
    generateAutoMealPlan,
    clearMealPlan,
    updateWeekDates,
    updateMealPlanSummary,
    addRecipeFromURL
};