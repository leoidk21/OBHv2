// Pages/script/AdminAccount.js
console.log("👤 AdminAccount.js loaded");

// Initialize when script loads
window.initializeAdminAccount = function() {
    console.log("🚀 Initializing Admin Account Page...");
    
    // Check if we have a Supabase client
    if (!window.supabase) {
        console.error("❌ Supabase client not available, retrying...");
        setTimeout(window.initializeAdminAccount, 500);
        return;
    }

    console.log("✅ Supabase client available, loading profile...");
    loadAdminProfile();
};

// Load admin profile function
async function loadAdminProfile() {
    console.log("👤 Loading admin profile...");

    try {
        // First try to use stored data for immediate display
        const storedAdmin = localStorage.getItem("adminData");
        if (storedAdmin) {
            console.log("📁 Using cached admin data");
            updateProfileElements(JSON.parse(storedAdmin));
        }

        // Verify session and get fresh data
        const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error("❌ Session error:", sessionError);
            showProfileError("Session expired. Please login again.");
            return;
        }

        console.log("✅ Session valid, user:", session.user.email);

        // Fetch fresh profile data
        const { data: profileData, error: profileError } = await window.supabase
            .from('admin_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profileData) {
            console.warn("❌ Profile fetch failed:", profileError);
            // Don't show error, use cached data if available
            if (!storedAdmin) {
                showProfileError("Failed to load profile data");
            }
            return;
        }

        // Update stored data with fresh info
        const freshAdminData = {
            id: profileData.id,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            email: profileData.email || session.user.email,
            phone: profileData.phone,
            role: profileData.role,
            status: profileData.status
        };

        updateProfileElements(freshAdminData);
        localStorage.setItem("adminData", JSON.stringify(freshAdminData));
        
        console.log("✅ Admin profile loaded successfully");

        // Setup edit profile functionality
        setupEditProfile(freshAdminData);

    } catch (error) {
        console.error("❌ Profile load error:", error);
        showProfileError("Error loading profile: " + error.message);
    }
}

// Update profile elements in UI
function updateProfileElements(data) {
    console.log("Updating UI with profile data:", data);

    const fullName = `${data.first_name} ${data.last_name}`;
    
    // Update all name elements
    document.querySelectorAll("#profile-account-name").forEach(el => {
        el.textContent = fullName;
    });
    
    // Update all email elements
    document.querySelectorAll("#profile-email").forEach(el => {
        el.textContent = data.email || "Not provided";
    });
    
    // Update all role elements
    document.querySelectorAll("#profile-role").forEach(el => {
        let roleText = data.role;
        if (roleText === 'superadmin') {
            roleText = 'SUPER ADMIN';
        } else if (roleText === 'admin') {
            roleText = 'ADMIN';
        } else {
            roleText = roleText.replace("_", " ").toUpperCase();
        }
        el.textContent = roleText;
    });
    
    // Update phone element
    const phoneElement = document.getElementById("profile-phone");
    if (phoneElement) {
        if (data.phone) {
            let phone = data.phone.replace(/\D/g, "");
            if (phone.startsWith("0")) {
                phone = phone.substring(1);
            }
            phoneElement.textContent = `+63 ${phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}`;
        } else {
            phoneElement.textContent = "Not provided";
        }
    }

    console.log("✅ Profile UI updated successfully!");
}

// Setup edit profile functionality
function setupEditProfile(profileData) {
    const editBtn = document.getElementById('editProfileBtn');
    const modal = document.getElementById('editProfileModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('editProfileForm');

    if (!editBtn || !modal || !form) {
        console.warn("Edit profile elements not found");
        return;
    }

    // Populate form with current data
    document.getElementById('editName').value = `${profileData.first_name} ${profileData.last_name}`;
    document.getElementById('editEmail').value = profileData.email || '';
    document.getElementById('editPhone').value = profileData.phone || '';

    // Show modal
    editBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Hide modal
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateProfile();
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Update profile in database
async function updateProfile() {
    const form = document.getElementById('editProfileForm');
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();

    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');

    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session) throw new Error('No session found');

        const { error } = await window.supabase
            .from('admin_profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
            })
            .eq('id', session.user.id);

        if (error) throw error;

        // Update local storage and UI
        const updatedProfile = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone
        };
        
        const currentData = JSON.parse(localStorage.getItem('adminData') || '{}');
        localStorage.setItem('adminData', JSON.stringify({...currentData, ...updatedProfile}));
        
        updateProfileElements({...currentData, ...updatedProfile});
        
        document.getElementById('editProfileModal').style.display = 'none';
        showNotification('Profile updated successfully!', 'success');

    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile: ' + error.message, 'error');
    }
}

// Show error message
function showProfileError(message) {
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

// Show notification
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === "error" ? "#f44336" : type === "success" ? "#4CAF50" : "#2196F3"};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease-out";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Auto-initialize when the script loads
console.log("🎯 Auto-initializing Admin Account Page...");
setTimeout(() => {
    if (window.initializeAdminAccount) {
        window.initializeAdminAccount();
    }
}, 100);