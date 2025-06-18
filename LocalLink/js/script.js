// This script handles all the dynamic behavior of the LocalLink Market website.
// It includes Firebase initialization, user authentication (login, signup, logout),
// listing new items, and displaying items from Firestore in real-time.

// Important: The Firebase SDKs are imported as modules directly from a CDN.
// The global variables __app_id, __firebase_config, and __initial_auth_token are
// provided by the hosting environment (like Google's Canvas). If you're running
// this outside such an environment, you would need to replace these with your
// actual Firebase project configuration.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, serverTimestamp, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables for Firebase instances and current user ID
let app;  // This will hold your Firebase app instance
let auth; // This will manage user authentication
let db;   // This will be your connection to the Firestore database
let userId = null; // This variable will store the current user's unique ID

// --- UI Element References ---
// Get references to various HTML elements by their IDs for easy manipulation in JavaScript
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Elements to display information about the currently logged-in user
const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
const usernameDisplay = document.getElementById('usernameDisplay');
const userIdDisplay = document.getElementById('userIdDisplay');

// Containers for the authentication buttons (their visibility will change based on login status)
const loginButtonContainer = document.getElementById('loginButtonContainer');
const signupButtonContainer = document.getElementById('signupButtonContainer');
const logoutButtonContainer = document.getElementById('logoutButtonContainer');

// References to your custom modal (pop-up) elements for Login, Sign Up, Listing an Item, and general Messages
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const listItemModal = document.getElementById('listItemModal');
const messageBox = document.getElementById('messageBox');

// Elements inside the message box modal
const messageBoxText = document.getElementById('messageBoxText');
const closeMessageBox = document.getElementById('closeMessageBox');
const messageBoxOkBtn = document.getElementById('messageBoxOkBtn');

// Close buttons for specific modals (the 'x' icon)
const closeLoginModal = document.getElementById('closeLoginModal');
const closeSignupModal = document.getElementById('closeSignupModal');
const closeListItemModal = document.getElementById('closeListItemModal');

// Form elements for handling user input
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const itemListingForm = document.getElementById('itemListingForm');

// Specific input fields within the login and signup forms
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const signupUsernameInput = document.getElementById('signupUsername');
const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');

// Elements to display error messages directly within the forms
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const itemListingError = document.getElementById('itemListingError');

// Button on the main page to trigger the "List an Item" modal
const listItemPageBtn = document.getElementById('listItemBtn');

// The HTML container where all the item listings will be dynamically inserted
const itemListingsContainer = document.getElementById('itemListings');
// The message to show if no items are currently listed
const noItemsMessage = document.getElementById('noItemsMessage');

// --- Helper Functions for Modals ---
// Function to show any given modal by removing its 'd-none' class (which hides it)
function showModal(modalElement) {
    modalElement.classList.remove('d-none');
}

// Function to hide any given modal by adding the 'd-none' class
function hideModal(modalElement) {
    modalElement.classList.add('d-none');
    // Important: Clear any old error messages when a modal is closed for a clean start
    loginError.textContent = '';
    signupError.textContent = '';
    itemListingError.textContent = '';
}

// Function to display a simple message using the custom message box modal
function showMessageBox(message) {
    messageBoxText.textContent = message; // Set the message text in the modal
    showModal(messageBox); // Display the message box
}

// --- Main Application Logic (this code runs once the entire HTML document is loaded) ---
document.addEventListener('DOMContentLoaded', async () => {
    // --- Event Listeners for User Interface Interactions ---

    // Event listeners to open the login and signup modals when their buttons are clicked
    loginBtn.addEventListener('click', () => showModal(loginModal));
    signupBtn.addEventListener('click', () => showModal(signupModal));

    // Event listeners to close the modals when their 'x' (close) buttons are clicked
    closeLoginModal.addEventListener('click', () => hideModal(loginModal));
    closeSignupModal.addEventListener('click', () => hideModal(signupModal));
    closeListItemModal.addEventListener('click', () => hideModal(listItemModal));

    // Event listeners to close the message box modal
    closeMessageBox.addEventListener('click', () => hideModal(messageBox));
    messageBoxOkBtn.addEventListener('click', () => hideModal(messageBox));

    // Event listeners for the "switch" links within the login/signup modals
    // This allows users to easily switch between "Login" and "Sign Up" forms
    document.getElementById('switchToSignup').addEventListener('click', (e) => {
        e.preventDefault(); // Stop the link from trying to navigate to a new page
        hideModal(loginModal); // Hide the login form
        showModal(signupModal); // Show the signup form
    });

    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault(); // Stop the link from trying to navigate to a new page
        hideModal(signupModal); // Hide the signup form
        showModal(loginModal); // Show the login form
    });

    // Event listener for the main "List an Item" button on the homepage
    listItemPageBtn.addEventListener('click', () => {
        // Before showing the listing form, check if the user is properly logged in (not anonymous)
        if (!auth.currentUser || auth.currentUser.isAnonymous) {
            showMessageBox("Please log in or create an account to list an item.");
            return; // If not logged in, stop here and don't open the modal
        }
        showModal(listItemModal); // If logged in, show the item listing modal
    });

    // --- Firebase Initialization ---
    // This block tries to connect your website to Firebase services
    try {
        // These special global variables (__app_id, __firebase_config, __initial_auth_token)
        // are provided by the Google Canvas environment. If you were deploying this website
        // elsewhere, you would replace these with your actual Firebase project's configuration
        // (usually found in your Firebase project settings).
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

        // A quick check to make sure the Firebase configuration actually loaded
        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase configuration is empty. Make sure your project setup is correct.");
            showMessageBox("Error: Website could not connect. Please check the console for details.");
            return; // Stop running if Firebase can't be set up
        }

        // Initialize your Firebase app and get references to Authentication and Firestore
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        // --- Authentication State Management ---
        // This is a very important listener that runs every time the user's login status changes.
        // It helps your website react whether a user logs in, logs out, or is already signed in.
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // If 'user' exists, it means someone is logged in (either by email/password or anonymously)
                userId = user.uid; // Store the unique ID of the current user
                // Try to get the user's display name, or use their email if no display name is set
                let userDisplayName = user.displayName || user.email;

                // Update the header to show the welcome message and truncated user ID
                usernameDisplay.textContent = userDisplayName.split('@')[0]; // Show username or part before @ for email
                userIdDisplay.textContent = user.uid.substring(0, 8) + '...'; // Show a short version of the user ID

                // Adjust the visibility of header buttons: hide login/signup, show logout
                loginButtonContainer.classList.add('d-none'); // Hide login button
                signupButtonContainer.classList.add('d-none'); // Hide signup button
                logoutButtonContainer.classList.remove('d-none'); // Show logout button
                loggedInUserDisplay.classList.remove('d-none'); // Show welcome message
                listItemPageBtn.classList.remove('d-none'); // Make sure "List an Item" button is visible

                // Optional: If you store custom usernames in Firestore, this part fetches it.
                // This ensures the username is always correct, even if they refresh the page.
                const userDocRef = doc(db, "artifacts", appId, "users", user.uid);
                onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists() && docSnap.data().username) {
                        usernameDisplay.textContent = docSnap.data().username;
                    }
                }, (error) => {
                    console.error("Error fetching user profile from Firestore:", error);
                });

            } else {
                // If 'user' is null, it means no one is logged in, or they are anonymously signed in.
                userId = null; // Clear the user ID
                // Adjust the visibility of header buttons: show login/signup, hide logout
                loginButtonContainer.classList.remove('d-none'); // Show login button
                signupButtonContainer.classList.remove('d-none'); // Show signup button
                logoutButtonContainer.classList.add('d-none'); // Hide logout button
                loggedInUserDisplay.classList.add('d-none'); // Hide welcome message
                listItemPageBtn.classList.remove('d-none'); // "List an Item" button remains visible, but will prompt login if clicked
            }

            // After the authentication state is determined (who is logged in, if anyone),
            // then fetch and display the items from the database. This ensures everything is ready.
            fetchItems();
        });

        // Initial sign-in attempt:
        // Try to sign in using the custom authentication token provided by Canvas (if it exists).
        // If that fails or the token isn't there, fall back to anonymous sign-in.
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token)
                .catch((error) => {
                    console.error("Error signing in with custom token:", error);
                    signInAnonymously(auth); // Fallback to anonymous sign-in
                });
        } else {
            signInAnonymously(auth); // Sign in anonymously if no custom token is available
        }

    } catch (error) {
        // If there's a problem during the initial Firebase setup
        console.error("Firebase initialization failed:", error);
        showMessageBox("Error setting up the website. Please check the console for more details.");
    }

    // --- Authentication Form Submissions ---

    // Handle when the user tries to log in using the login form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the form from refreshing the page
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        loginError.textContent = ''; // Clear any old error messages in the login form

        try {
            await signInWithEmailAndPassword(auth, email, password); // Attempt to sign in with email and password
            hideModal(loginModal); // Hide the login pop-up on successful login
            showMessageBox("You've successfully logged in!"); // Show a friendly success message
            loginForm.reset(); // Clear the email and password fields
        } catch (error) {
            console.error("Login Error:", error); // Log the technical error for debugging
            // Show a user-friendly error message based on what went wrong
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    loginError.textContent = 'Incorrect email or password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    loginError.textContent = 'Please enter a valid email address format.';
                    break;
                default:
                    loginError.textContent = 'Login failed. Something unexpected happened.';
            }
        }
    });

    // Handle when a new user tries to sign up using the signup form
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the form from refreshing the page
        const username = signupUsernameInput.value;
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        signupError.textContent = ''; // Clear any old error messages in the signup form

        try {
            // Create a new user account with Firebase using email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Immediately update the new user's profile with their chosen username (display name)
            await updateProfile(user, { displayName: username });

            // Also save the username and other user details into Firestore.
            // This data is stored in a private user collection, ensuring security: /artifacts/{appId}/users/{userId}/
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const userDocRef = doc(db, "artifacts", appId, "users", user.uid);
            await setDoc(userDocRef, {
                username: username,
                email: email,
                dateJoined: serverTimestamp(), // Record the exact time they joined
            }, { merge: true }); // 'merge: true' is important; it adds these fields without erasing other user data

            hideModal(signupModal); // Hide the signup pop-up on success
            showMessageBox("Account created successfully! Welcome to LocalLink Market!"); // Show a friendly welcome message
            signupForm.reset(); // Clear the form fields
        } catch (error) {
            console.error("Signup Error:", error); // Log the technical error for debugging
            // Show a user-friendly error message based on what went wrong
            switch (error.code) {
                case 'auth/email-already-in-use':
                    signupError.textContent = 'This email address is already in use. Try logging in or use a different email.';
                    break;
                case 'auth/weak-password':
                    signupError.textContent = 'Password is too weak. It needs to be at least 6 characters long.';
                    break;
                case 'auth/invalid-email':
                    signupError.textContent = 'Please enter a valid email address format.';
                    break;
                default:
                    signupError.textContent = 'Account creation failed. Please try again.';
            }
        }
    });

    // Handle when the user clicks the "Logout" button
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth); // Sign out the current user from Firebase
            showMessageBox("You have been logged out."); // Confirm successful logout
        }
        catch (error) {
            console.error("Logout Error:", error); // Log any errors if logout fails
            showMessageBox("Logout failed. Please try again.");
        }
    });

    // --- Item Listing Form Submission ---
    // Handle when a logged-in user submits the "List Your Item" form
    itemListingForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the form from refreshing the page
        itemListingError.textContent = ''; // Clear any old error messages in the form

        // Double-check if the user is truly logged in (and not an anonymous user)
        if (!auth.currentUser || auth.currentUser.isAnonymous) {
            itemListingError.textContent = "You must be logged in to list an item.";
            return; // If not logged in, stop here
        }

        // Get the values the user typed into the form fields
        const itemTitle = document.getElementById('itemTitle').value;
        const itemDescription = document.getElementById('itemDescription').value;
        const itemCategory = document.getElementById('itemCategory').value;
        const itemPrice = document.getElementById('itemPrice').value;
        // Note: The itemImage input is commented out in HTML; image upload is not part of this basic version.

        try {
            // Define where this item's data will be stored in Firestore.
            // It goes into a 'public' collection so everyone can see it: /artifacts/{appId}/public/data/items
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const itemsCollectionRef = collection(db, "artifacts", appId, "public", "data", "items");

            // Add a new document (your item listing) to the 'items' collection in Firestore
            await addDoc(itemsCollectionRef, {
                title: itemTitle,
                description: itemDescription,
                category: itemCategory,
                price: itemPrice,
                // Create a simple placeholder image URL using the first word of the item title
                imageUrl: "https://placehold.co/400x250/d4edda/495057?text=" + encodeURIComponent(itemTitle.split(' ')[0]),
                listedByUserId: auth.currentUser.uid, // Record the ID of the user who listed this item
                listedByUsername: auth.currentUser.displayName || auth.currentUser.email.split('@')[0], // Record their username
                datePosted: serverTimestamp(), // Record the exact time the item was posted
                status: 'available' // Set the initial status of the item
            });

            hideModal(listItemModal); // Hide the item listing pop-up on success
            showMessageBox("Your item has been listed successfully!"); // Confirm success to the user
            itemListingForm.reset(); // Clear all the form fields for the next listing
        } catch (error) {
            console.error("Error adding document to Firestore: ", error); // Log the technical error
            itemListingError.textContent = "Failed to list item. Please check your input and try again.";
        }
    });

    // --- Fetch and Display Items in Real-time ---
    // This function retrieves and shows item listings from Firestore on your webpage
    function fetchItems() {
        // First, check if Firestore is properly set up
        if (!db) {
            console.warn("Firestore is not initialized yet. Cannot fetch items.");
            return;
        }

        // Define the specific location (collection) in Firestore where your public item data lives
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const itemsCollectionRef = collection(db, "artifacts", appId, "public", "data", "items");

        // Use 'onSnapshot' to listen for real-time updates to the 'items' collection.
        // This is powerful: your item list on the page will automatically update
        // whenever an item is added, changed, or removed in the database, without needing to refresh the page!
        onSnapshot(itemsCollectionRef, (snapshot) => {
            itemListingsContainer.innerHTML = ''; // Clear all existing items from the display before showing new ones

            if (snapshot.empty) {
                // If there are no items in the database, show the "No items listed yet" message
                noItemsMessage.classList.remove('d-none');
            } else {
                noItemsMessage.classList.add('d-none'); // Hide the "No items" message if there are items
                snapshot.forEach((doc) => {
                    const item = doc.data(); // Get all the data for the current item
                    const itemId = doc.id; // Get the unique ID of this item from Firestore

                    // Create the HTML for one individual item card
                    const itemCardHtml = `
                        <div class="col">
                            <div class="card h-100 shadow-sm border-0 rounded-lg">
                                <img src="${item.imageUrl}" class="card-img-top rounded-t-lg" alt="${item.title}">
                                <div class="card-body">
                                    <h5 class="card-title text-success">${item.title}</h5>
                                    <p class="card-text text-muted mb-2">${item.description}</p>
                                    <!-- Display the item's category as a colored badge -->
                                    <span class="badge bg-${getCategoryBadgeColor(item.category)} text-white mb-2">${item.category}</span>
                                    <p class="card-text fw-bold fs-5 text-success mt-2 mb-0">${item.price}</p>
                                </div>
                                <div class="card-footer bg-white border-top-0 d-flex justify-content-between align-items-center">
                                    <small class="text-secondary">Listed by: ${item.listedByUsername || 'Unknown'}</small>
                                    <!-- "Message Seller" button with data attributes to store item and seller IDs -->
                                    <button class="btn btn-sm btn-outline-success rounded-pill message-seller-btn" data-item-id="${itemId}" data-seller-id="${item.listedByUserId}">Message Seller</button>
                                </div>
                            </div>
                        </div>
                    `;
                    // Add this new item card HTML to the main items display area
                    itemListingsContainer.insertAdjacentHTML('beforeend', itemCardHtml);
                });

                // IMPORTANT: You need to re-attach event listeners for the "Message Seller" buttons here.
                // This is because when new items are added to the page, their buttons are new HTML elements
                // and won't automatically have the old JavaScript listeners attached.
                document.querySelectorAll('.message-seller-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        // Check if the user is logged in before they can message a seller
                        if (!auth.currentUser || auth.currentUser.isAnonymous) {
                            showMessageBox("Please login to message the seller.");
                            return;
                        }
                        const itemId = this.dataset.itemId; // Get the item ID from the button's data attribute
                        const sellerId = this.dataset.sellerId; // Get the seller ID from the button's data attribute
                        console.log(`Message Seller button clicked for item ID: ${itemId}, from seller ID: ${sellerId}!`);
                        // This is where you would build the actual messaging feature.
                        showMessageBox(`Feature: Messaging seller for item ID: ${itemId}. (This part is not yet fully implemented, but you can build it next!)`);
                    });
                });
            }
        }, (error) => {
            // Handle any errors that occur while fetching items from Firestore
            console.error("Error fetching items from Firestore:", error);
            itemListingsContainer.innerHTML = `<p class="text-center text-danger">Error loading items. Please try again later.</p>`;
        });
    }

    // Helper function to pick a Bootstrap badge color based on the item's category
    function getCategoryBadgeColor(category) {
        switch (category) {
            case 'Furniture': return 'primary'; // Blue badge
            case 'Electronics': return 'danger'; // Red badge
            case 'Books': return 'info'; // Light blue badge
            case 'Fashion': return 'secondary'; // Grey badge
            case 'Sporting Goods': return 'warning'; // Yellow badge
            case 'Home Goods': return 'success'; // Green badge
            case 'Services': return 'dark'; // Dark grey badge
            case 'Other': return 'light text-dark'; // Light badge with dark text for contrast
            default: return 'secondary'; // Default to a grey badge if category is not recognized
        }
    }
    // Signup form handler
document.getElementById("signupForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch("register.php", {
        method: "POST",
        body: formData,
    })
    .then(res => res.text())
    .then(data => {
        if (data === "success") {
            alert("Registered successfully!");
        } else {
            document.getElementById("signupError").textContent = data;
        }
    });
});

// Login form handler
document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch("login.php", {
        method: "POST",
        body: formData,
    })
    .then(res => res.text())
    .then(data => {
        if (data === "success") {
            alert("Login successful!");
            // Redirect or show user dashboard
        } else {
            document.getElementById("loginError").textContent = data;
        }
    });
});

});