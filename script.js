const recipesPerPage = 9;
let currentPage = 1;
let allRecipes = [];
let isSearchActive = false;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

const loading = document.getElementById("loading");
const returnHomeBtn = document.getElementById("returnHome");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const authModal = new bootstrap.Modal(document.getElementById('authModal'));
const authForm = document.getElementById('authForm');
const authModalTitle = document.getElementById('authModalTitle');
const showFavoritesCheckbox = document.getElementById("showFavorites");

const dietaryPreferences = {
    vegetarian: document.getElementById("vegetarian"),
    vegan: document.getElementById("vegan"),
    glutenFree: document.getElementById("glutenFree")
};

async function fetchRecipes() {
    loading.style.display = "block";
    try {
        const storedRecipes = localStorage.getItem("recipes");
        if (storedRecipes) {
            allRecipes = JSON.parse(storedRecipes);
        } else {
            const response = await fetch("https://dummyjson.com/recipes?limit=50&skip=10");
            const data = await response.json();
            allRecipes = data.recipes.map(recipe => ({
                ...recipe,
                vegetarian: Math.random() < 0.3,
                vegan: Math.random() < 0.2,
                glutenFree: Math.random() < 0.25,
            }));
            localStorage.setItem("recipes", JSON.stringify(allRecipes));
        }
        displayRecipes(currentPage);
        setupPagination();
    } catch (error) {
        console.error("Error fetching recipes:", error);
    } finally {
        loading.style.display = "none";
    }
}

function filterRecipes(recipes) {
    if (isSearchActive) {
        return recipes;
    }

    const vegetarianChecked = dietaryPreferences.vegetarian.checked;
    const veganChecked = dietaryPreferences.vegan.checked;
    const glutenFreeChecked = dietaryPreferences.glutenFree.checked;
    const showFavoritesChecked = showFavoritesCheckbox.checked;

    return recipes.filter((recipe) => {
        const dietaryMatch = (!vegetarianChecked || recipe.vegetarian) &&
            (!veganChecked || recipe.vegan) &&
            (!glutenFreeChecked || recipe.glutenFree);
        const favoriteMatch = !showFavoritesChecked || favorites.includes(recipe.id);
        return dietaryMatch && favoriteMatch;
    });
}

function displayRecipes(page) {
    const filteredRecipes = filterRecipes(allRecipes);
    const startIndex = (page - 1) * recipesPerPage;
    const endIndex = startIndex + recipesPerPage;
    const recipesToShow = filteredRecipes.slice(startIndex, endIndex);

    const container = document.getElementById("recipesContainer");
    container.innerHTML = "";

    if (recipesToShow.length === 0) {
        container.innerHTML = '<div class="col-12"><h3 class="text-center">No recipes match the selected criteria.</h3></div>';
        return;
    }

    recipesToShow.forEach((recipe) => {
        const isFavorite = favorites.includes(recipe.id);
        const card = `
            <div class="col-md-6 col-lg-4">
                <div class="card recipe-card">
                    <img src="${recipe.image}" class="card-img-top recipe-image" alt="${recipe.name}">
                    <div class="card-body">
                        <h5 class="card-title">${recipe.name}</h5>
                        <p class="card-text">Cuisine: ${recipe.cuisine}</p>
                        <button onclick="showRecipeDetails(${recipe.id})" class="btn btn-custom">View Recipe</button>
                        <button onclick="toggleFavorite(${recipe.id})" class="btn ${isFavorite ? 'btn-danger' : 'btn-outline-danger'} mt-2">
                            ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

function setupPagination() {
    const filteredRecipes = filterRecipes(allRecipes);
    const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    if (totalPages <= 1) {
        pagination.style.display = "none";
        return;
    }

    pagination.style.display = "flex";

    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
            <li class="page-item ${currentPage === i ? "active" : ""}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;
}

function changePage(page) {
    const filteredRecipes = filterRecipes(allRecipes);
    const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayRecipes(currentPage);
    setupPagination();
    window.scrollTo(0, 0);
}

async function showRecipeDetails(id) {
    loading.style.display = "block";
    try {
        let recipe = allRecipes.find((r) => r.id === id);
        if (!recipe) {
            const response = await fetch(`https://dummyjson.com/recipes/${id}`);
            recipe = await response.json();
        }

        const container = document.getElementById("recipesContainer");
        container.innerHTML = `
            <div class="col-12">
                <div class="recipe-details">
                    <h2 class="recipe-title">${recipe.name}</h2>
                    <div class="row">
                        <div class="col-md-6 mb-4">
                            <img src="${recipe.image}" class="img-fluid detailed-recipe-image" alt="${recipe.name}">
                        </div>
                        <div class="col-md-6">
                            <div class="recipe-section">
                                <h4>Ingredients</h4>
                                <ul class="ingredients-list">
                                    ${recipe.ingredients.map((ingredient) => `<li>${ingredient}</li>`).join("")}
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="recipe-section">
                        <h4>Instructions</h4>
                        <p>${recipe.instructions}</p>
                    </div>
                    <div class="cooking-info">
                        <div>
                            <strong>Cooking Time</strong>
                            ${recipe.cookTimeMinutes} minutes
                        </div>
                        <div>
                            <strong>Servings</strong>
                            ${recipe.servings}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("pagination").style.display = "none";
        returnHomeBtn.style.display = "block";
    } catch (error) {
        console.error("Error fetching recipe details:", error);
    } finally {
        loading.style.display = "none";
    }
}

async function searchRecipes(query) {
    loading.style.display = "block";
    try {
        const response = await fetch(`https://dummyjson.com/recipes/search?q=${query}`);
        const data = await response.json();
        allRecipes = data.recipes.map(recipe => ({
            ...recipe,
            vegetarian: Math.random() < 0.3,
            vegan: Math.random() < 0.2,
            glutenFree: Math.random() < 0.25,
        }));
        currentPage = 1;
        isSearchActive = true;
        displayRecipes(currentPage);
        setupPagination();
        returnHomeBtn.style.display = "block";
    } catch (error) {
        console.error("Error searching recipes:", error);
    } finally {
        loading.style.display = "none";
    }
}

function returnHome() {
    isSearchActive = false;
    returnHomeBtn.style.display = "none";
    document.getElementById("pagination").style.display = "flex";
    searchInput.value = "";
    localStorage.removeItem("searchResults");
    fetchRecipes();
}

function showAuthModal(type) {
    authModalTitle.textContent = type === 'register' ? 'Register' : 'Login';
    authForm.onsubmit = (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (type === 'register') {
            registerUser(email, password);
        } else {
            loginUser(email, password);
        }
    };
    authModal.show();
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
}

function registerUser(email, password) {
    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    if (!validatePassword(password)) {
        alert('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
        return;
    }
    // Here  I can typically send a request to my backend to register the user
    console.log('Registering user:', email, password);
    alert('User registered successfully!');
    authModal.hide();
}

function loginUser(email, password) {
    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    if (!validatePassword(password)) {
        alert('Invalid password. Please try again.');
        return;
    }
    // Here I would typically send a request to my backend to authenticate the user
    console.log('Logging in user:', email, password);
    alert('User logged in successfully!');
    authModal.hide();
}

function toggleFavorite(recipeId) {
    const index = favorites.indexOf(recipeId);
    if (index === -1) {
        favorites.push(recipeId);
    } else {
        favorites.splice(index, 1);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayRecipes(currentPage);
}

searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
        searchRecipes(query);
    }
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
            searchRecipes(query);
        }
    }
});

returnHomeBtn.addEventListener("click", returnHome);

Object.values(dietaryPreferences).forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        currentPage = 1;
        displayRecipes(currentPage);
        setupPagination();
    });
});

showFavoritesCheckbox.addEventListener('change', () => {
    currentPage = 1;
    displayRecipes(currentPage);
    setupPagination();
});

registerBtn.addEventListener('click', () => showAuthModal('register'));
loginBtn.addEventListener('click', () => showAuthModal('login'));

fetchRecipes();