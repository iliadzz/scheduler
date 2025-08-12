// This file isolates all your Firebase Authentication logic. It handles showing the login screen,
// processing sign-in and sign-up attempts, listening for authentication state changes, and logging the user out. It acts as the "gatekeeper" for your application.
// js/firebase/auth.js

/**
 * Sets up all Firebase Authentication listeners and login form handlers.
 * This function acts as the entry point for the application's auth flow.
 */
export function setupAuthListeners() {
    const appContainer = document.querySelector('.app-container');
    const loginContainer = document.getElementById('login-container');
    const exitBtn = document.getElementById('exit-btn');

    const showLogin = () => {
        if (loginContainer) loginContainer.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
    };

    const showApp = () => {
        if (loginContainer) loginContainer.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
    };

    // Listen for changes in the user's login state
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in.
                showApp();
                // Call the main app initialization function (defined in main.js)
                if (window.__startApp) {
                    window.__startApp();
                }
            } else {
                // User is signed out.
                showLogin();
            }
        });
    } else {
        // If Firebase Auth is not available, just show the app.
        // This allows for offline or auth-less development.
        console.warn("Firebase Auth not found. Running in offline mode.");
        showApp();
        if (window.__startApp) {
            window.__startApp();
        }
    }


    // --- Login Form Event Listeners ---

    // Using a single listener on the login container for efficiency
    loginContainer.addEventListener('click', (e) => {
        if (!window.auth) return;

        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const errorMsg = document.getElementById('login-error-message');
        const email = emailInput.value || '';
        const pwd = passwordInput.value || '';

        if (e.target && e.target.id === 'login-btn') {
            window.auth.signInWithEmailAndPassword(email, pwd)
                .catch(err => {
                    if (errorMsg) errorMsg.textContent = err.message;
                });
        }


    });


    // --- Logout Button ---
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            if (window.auth) {
                window.auth.signOut();
            }
        });
    }
}