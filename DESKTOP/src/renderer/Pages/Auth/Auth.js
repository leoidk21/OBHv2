// ============================================
// GLOBAL SUPABASE CLIENT MANAGEMENT
// ============================================

// Global flag to track initialization
window.__supabaseInitialized = window.__supabaseInitialized || false;

function initializeGlobalSupabase() {
    console.log("🌍 Initializing GLOBAL Supabase client...");
    
    // If already initialized, return the existing client
    if (window.supabase && typeof window.supabase.auth?.signInWithPassword === 'function') {
        console.log("✅ Global Supabase client already exists");
        window.__supabaseInitialized = true;
        return window.supabase;
    }
    
    // If library isn't loaded yet, wait for it
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        console.log("⏳ Supabase library not loaded yet, waiting...");
        return null;
    }
    
    // Create global client using preload config
    if (window.supabaseConfig?.isConfigured && window.supabase.createClient) {
        console.log("✅ Creating GLOBAL Supabase client from preload config");
        const { createClient } = window.supabase;
        window.supabase = createClient(window.supabaseConfig.url, window.supabaseConfig.anonKey);
        window._supabaseClient = window.supabase;
        window.__supabaseInitialized = true;
        console.log("✅ GLOBAL Supabase client created successfully");
        return window.supabase;
    }
    
    console.error("❌ Cannot create global Supabase client - missing config or library");
    return null;
}

// ============================================
// LOAD SUPABASE LIBRARY (IMPROVED)
// ============================================
function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            console.log("📦 Supabase library already loaded");
            resolve();
            return;
        }
        
        console.log("📦 Loading Supabase JS library...");
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            console.log("✅ Supabase JS library loaded");
            resolve();
        };
        script.onerror = () => {
            console.error("❌ Failed to load Supabase JS library");
            reject(new Error('Failed to load Supabase library'));
        };
        document.head.appendChild(script);
    });
}

// ============================================
// MAIN INITIALIZATION FUNCTION
// ============================================
async function initializeApp() {
    console.log("🚀 Starting app initialization...");
    
    try {
        // Step 1: Load Supabase library
        await loadSupabaseLibrary();
        
        // Step 2: Initialize global Supabase client
        const supabase = initializeGlobalSupabase();
        
        if (!supabase) {
            console.error("❌ Failed to initialize Supabase client");
            return;
        }
        
        console.log("✅ App initialization completed successfully");
        
        // Step 3: Setup DOM event listeners
        setupEventListeners(supabase);
        
    } catch (error) {
        console.error("💥 App initialization failed:", error);
        showGlobalError("Failed to initialize application. Please refresh the page.");
    }
}

// ============================================
// SETUP EVENT LISTENERS
// ============================================
function setupEventListeners(supabase) {
    console.log("🎯 Setting up event listeners...");
    
    // If DOM is already loaded, initialize immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initializeForms(supabase));
    } else {
        initializeForms(supabase);
    }
    
    // Setup session check
    setupSessionCheck(supabase);
}

// ============================================
// INITIALIZE FORMS
// ============================================
function initializeForms(supabase) {
    console.log("📄 DOM Content Loaded - Initializing forms");
    
    if (!supabase) {
        console.error("💥 CRITICAL: Supabase client not available for forms");
        showGlobalError("Application configuration error. Please restart the app.");
        return;
    }

    console.log("✅ Supabase client ready for forms");

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    function showGlobalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 80%;
            text-align: center;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 5000);
    }

    function showError(formId, message, focusId, type = "error") {
        let errorBox = document.querySelector(`#${formId} .errorBox`);
        
        if (!errorBox) {
            errorBox = document.querySelector('.errorBox');
        }
        
        if (!errorBox) {
            console.error("ErrorBox not found for form:", formId);
            showGlobalError(message);
            return;
        }

        errorBox.textContent = message;
        errorBox.classList.remove("error", "success");
        errorBox.classList.add("errorBox");

        if (type === "success") {
            errorBox.classList.add("success");
        } else {
            errorBox.classList.add("error");
        }

        errorBox.style.display = "block";

        if (type === "success") {
            setTimeout(() => {
                errorBox.style.display = "none";
                errorBox.classList.remove("success");
            }, 2000);
        }

        if (focusId) {
            const field = document.getElementById(focusId);
            if (field) field.focus();
        }
    }

    // ============================================
    // LOGOUT FUNCTION
    // ============================================
    async function logout() {
        console.log("🚪 Logging out...");

        try {
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();

            setTimeout(() => {
                window.location.href = "Auth/LoginPage.html?" + Date.now();
            }, 200);
        } catch (error) {
            console.error("Logout error:", error);
            localStorage.clear();
            sessionStorage.clear();
            setTimeout(() => {
                window.location.href = "Auth/LoginPage.html?" + Date.now();
            }, 200);
        }
    }

    // ============================================
    // SIGNUP FORM
    // ============================================
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        console.log("✅ Signup form found");

        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("📝 Signup form submitted");

            const payload = {
                firstName: document.getElementById("firstName")?.value.trim(),
                lastName: document.getElementById("lastName")?.value.trim(),
                email: document.getElementById("email")?.value.trim(),
                phone: document.getElementById("phone")?.value.trim(),
                password: document.getElementById("password")?.value,
            };

            console.log("Signup payload:", { ...payload, password: '[HIDDEN]' });

            if (payload.password.length < 8) {
                showError("signupForm", "Password must be at least 8 characters long", "password");
                return;
            }

            try {
                // Step 1: Create user in Supabase Auth
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: payload.email,
                    password: payload.password,
                });

                console.log("Signup response:", { authData, authError });

                if (authError) {
                    console.error("Auth signup error:", authError);
                    showError("signupForm", authError.message, "firstName");
                    return;
                }

                if (!authData.user) {
                    showError("signupForm", "Signup failed. Please try again.", "firstName");
                    return;
                }

                console.log("✅ Auth user created:", authData.user.id);

                // Step 2: Insert into admin_profiles as "pending"
                const { error: profileError } = await supabase
                    .from("admin_profiles")
                    .insert([
                        {
                            id: authData.user.id,
                            first_name: payload.firstName,
                            last_name: payload.lastName,
                            phone: payload.phone,
                            email: payload.email,
                            role: "admin",
                            status: "pending",
                            created_at: new Date().toISOString(),
                        },
                    ]);

                if (profileError) {
                    console.error("Profile creation error:", profileError);
                    showError("signupForm", "Registration failed. Please contact support.", "firstName");
                    return;
                }

                showError("signupForm", "Registration successful! Please wait for super admin approval.", null, "success");

                setTimeout(() => {
                    window.location.href = "./LoginPage.html";
                }, 3000);
            } catch (error) {
                console.error("Signup error:", error);
                showError("signupForm", "Network error: " + error.message, "firstName");
            }
        });
    }

    // ============================================
    // LOGIN FORM
    // ============================================
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        console.log("✅ Login form found");

        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            console.log("🔐 Login form submitted");

            const email = document.getElementById("email")?.value.trim();
            const password = document.getElementById("password")?.value;

            console.log("📧 Email:", email);
            console.log("🔑 Password length:", password?.length);

            if (!email || !password) {
                console.log("❌ Missing credentials");
                showError("loginForm", "Please enter both email and password", "email");
                return;
            }

            try {
                console.log("🔄 Attempting authentication...");
                
                // Step 1: Sign in with Supabase Auth
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                console.log("🔐 Auth response received");

                if (authError) {
                    console.error("❌ Auth error:", authError);
                    console.error("❌ Auth error message:", authError.message);
                    showError("loginForm", "Invalid email or password", "email");
                    return;
                }

                const { user, session } = authData;
                if (!user) {
                    console.log("❌ No user object in response");
                    showError("loginForm", "Login failed. Please try again.", "email");
                    return;
                }

                console.log("✅ User authenticated:", user.id);
                console.log("👤 User email:", user.email);

                // Step 2: Fetch admin profile
                console.log("🔄 Fetching admin profile...");
                const { data: profile, error: profileError } = await supabase
                    .from("admin_profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                console.log("📊 Profile response:", { profile, profileError });

                if (profileError) {
                    console.error("❌ Profile error:", profileError);
                    await supabase.auth.signOut();
                    showError("loginForm", "Admin profile not found. Please contact support.", "email");
                    return;
                }

                console.log("✅ Profile fetched - Role:", profile.role, "Status:", profile.status);

                // Step 3: Check approval status (skip for superadmin)
                if (profile.role !== "superadmin" && profile.status !== "approved") {
                    console.log("❌ Account not approved");
                    alert("Your admin account is still pending approval from the Super Admin.");
                    await supabase.auth.signOut();
                    return;
                }

                // Step 4: Store user info
                console.log("💾 Storing user data...");
                localStorage.setItem("token", session.access_token);
                localStorage.setItem("adminData", JSON.stringify(profile));

                console.log("✅ Login successful! Preparing redirect...");
                showError("loginForm", "Login successful!", null, "success");

                // Step 5: Redirect based on role
                setTimeout(() => {
                    console.log("🔄 Redirecting to:", profile.role);
                    if (profile.role === "superadmin") {
                        window.location.href = "../../Pages/SuperAdmin.html";
                    } else if (profile.role === "admin") {
                        window.location.href = "../../Pages/LandingPage.html";
                    } else {
                        showError("loginForm", "Unauthorized role", null);
                    }
                }, 1500);
            } catch (error) {
                console.error("💥 Unexpected error:", error);
                showError("loginForm", "Network error: " + error.message, "email");
            }
        });
    }

    // ============================================
    // LOGOUT BUTTON
    // ============================================
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        console.log("✅ Logout button found");
        logoutBtn.addEventListener("click", logout);
    }

    // ============================================
    // AUTO-FOCUS FOR BETTER UX
    // ============================================
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (emailInput) emailInput.disabled = false;
    if (passwordInput) passwordInput.disabled = false;

    setTimeout(() => {
        if (emailInput) {
            emailInput.focus();
            console.log("✅ Email input focused");
        }
        window.focus();
    }, 300);
}

// ============================================
// SESSION CHECK SETUP
// ============================================
function setupSessionCheck(supabase) {
    window.addEventListener('load', async () => {
        const publicPages = ['LoginPage.html', 'SignupPage.html', 'index.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        console.log("📄 Page loaded:", currentPage);
        
        if (publicPages.includes(currentPage) || window.location.pathname.includes('/Auth/')) {
            console.log("Public/Auth page, skipping session check");
            return;
        }

        if (supabase) {
            console.log("🔒 Protected page - checking session...");
            
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error("Session check error:", error);
                    return;
                }
                
                if (!session) {
                    console.log("No session found, redirecting to login");
                    localStorage.removeItem("token");
                    localStorage.removeItem("adminData");
                    window.location.href = "/Auth/LoginPage.html";
                    return;
                }
                
                console.log("✅ Session valid:", session.user.email);
                
            } catch (err) {
                console.error("Session check failed:", err);
            }
        }
    });
}

// ============================================
// START THE APPLICATION
// ============================================
console.log("🎯 Starting Auth.js initialization...");

// Use a small delay to ensure the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeApp, 100);
    });
} else {
    setTimeout(initializeApp, 100);
}