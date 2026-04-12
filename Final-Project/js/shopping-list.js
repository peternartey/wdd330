function generateShoppingList() {
  const mealPlan = JSON.parse(localStorage.getItem("mealPlan"));

  if (!mealPlan) {
    alert("No meal plan found!");
    return;
  }

  let ingredients = [];

  Object.values(mealPlan).forEach(meals => {
    meals.forEach(meal => {
      if (meal.ingredients) {
        ingredients = ingredients.concat(meal.ingredients);
      }
    });
  });

  // Save to localStorage
  localStorage.setItem("shoppingList", JSON.stringify(ingredients));

  // Update total items
  document.getElementById("totalItems").textContent = ingredients.length;

  //  Display items
  displayShoppingList(ingredients);
}