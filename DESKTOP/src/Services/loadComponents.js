const pageConfig = {
  LandingPage: {
    path: '../Pages/LandingPage.html',
    title: 'Dashboard'
  },
  SchedulePage: {
    path: '../Pages/SchedulePage.html',
    title: 'Schedule'
  },
  GuestPage: {
    path: '../Pages/GuestPage.html',
    title: 'Guests'
  },
  BudgetPage: {
    path: '../Pages/BudgetPage.html',
    title: 'Budget'
  },
  ClientsPage: {
    path: '../Pages/ClientsPage.html',
    title: 'Clients'
  },
  AdminAccountPage: {
    path: '../Pages/Admin/AdminAccountPage.html',
    title: 'Account'
  }
};

// Dynamically load components
document.addEventListener("DOMContentLoaded", () => {
  loadSidebar();

  // Always start at LandingPage (or change to your preferred default)
  navigateToPage("LandingPage");
});

async function loadSidebar() {
  const sidebarContainer = document.getElementById("sidebar-container");

  if (sidebarContainer) {
    try {
      const response = await fetch("../components/Sidebar.html");
      const data = await response.text();
      sidebarContainer.innerHTML = data;

      // Highlight active link
      const currentPage = document.body.getAttribute("data-page");
      if (currentPage) {
        const activeLink = sidebarContainer.querySelector(`[data-page="${currentPage}"]`);
        if (activeLink) {
          activeLink.classList.add("active");
        }
      }

      // Setup navigation AFTER sidebar is loaded
      setupNavigation();
      setupSmoothScrolling();

    } catch (err) {
      console.error("Error loading sidebar:", err);
    }
  }
}

function setupNavigation() {
  const navLinks = document.querySelectorAll('.sidebar a[data-page]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const pageName = this.getAttribute('data-page');
      const href = this.getAttribute('href');
      
      if (pageName) {
        navigateToPage(pageName);
      } else if (href && href.startsWith('#')) {
        smoothScrollToAnchor(href);
      }
    });
  });
}

function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    if (!anchor.hasAttribute('data-page')) {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        smoothScrollToAnchor(this.getAttribute('href'));
      });
    }
  });
}

function smoothScrollToAnchor(anchorId) {
  const targetElement = document.querySelector(anchorId);
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

function navigateToPage(pageName) {
  console.log('Navigating to:', pageName);
  
  document.querySelectorAll('.sidebar a').forEach(link => {
    link.classList.remove('active');
  });
  
  const activeLink = document.querySelector(`.sidebar a[data-page="${pageName}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
  
  document.body.setAttribute('data-page', pageName);
  
  const contentContainer = document.querySelector('.content-container');
  contentContainer.classList.remove('loaded');

  if (contentContainer) {
    contentContainer.classList.add('loading');
    
    setTimeout(() => {
      loadPageContent(pageName);
      contentContainer.classList.remove('loading');
    }, 200);
  } else {
    loadPageContent(pageName);
  }
}

async function loadPageContent(pageName) {
  const page = pageConfig[pageName];
  const contentContainer = document.querySelector('.content-container');

  if (!page || !contentContainer) {
    console.error(`Page "${pageName}" not found in pageConfig`);
    return;
  }

  try {
    const response = await fetch(page.path);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const mainContent = doc.querySelector("#content, main, .page-content, body > *");
    contentContainer.innerHTML = mainContent ? mainContent.innerHTML : html;
    document.title = page.title;

    console.log(`${pageName} content loaded`);

    // --- Remove old page scripts ---
    const oldScripts = document.querySelectorAll("script[data-page-script]");
    oldScripts.forEach(s => s.remove());

    // --- Determine which JS file to load for this page ---
    const scriptMap = {
      LandingPage: "../Pages/script/LandingPage.js",
      SchedulePage: "../Pages/script/ScheduleController.js",
      GuestPage: "../Pages/script/GuestPage.js",
      BudgetPage: "../Pages/script/BudgetController.js",
      ClientsPage: "../Pages/script/ClientsController.js",
      GuestPage: "../Pages/script/GuestController.js",
      AdminAccountPage: "../Pages/script/AdminAccount.js" // ADD THIS LINE
    };

    const script = document.createElement("script");
    script.src = "../Pages/script/AdminAccount.js";
    script.dataset.pageScript = "GlobalAdmin";
    document.body.appendChild(script);

    const scriptPath = scriptMap[pageName];
    if (scriptPath) {
      console.log(`Loading script for ${pageName}: ${scriptPath}`);
      const script = document.createElement("script");
      script.src = scriptPath;
      script.dataset.pageScript = pageName; // tag it for cleanup
      script.onload = () => console.log(`${pageName} script executed`);
      document.body.appendChild(script);
    }

    // CALL PAGE-SPECIFIC INITIALIZATION
    if (pageName === "SchedulePage" && window.initSchedulePage) {
        console.log("Calling SchedulePage initialization...");
        setTimeout(() => {
            window.initSchedulePage();
        }, 200);
    }

    if (pageName === "BudgetPage" && window.initBudgetPage) {
        console.log("Calling BudgetPage initialization...");
        setTimeout(() => {
            window.initBudgetPage();
        }, 200);
    }

    if (pageName === "GuestPage" && window.initGuestPage) {
        console.log("Calling GuestPage initialization...");
        setTimeout(() => {
            window.initGuestPage();
        }, 200);
    }

    if (pageName === "ClientsPage" && window.initClientPage) {
        console.log("Calling GuestPage initialization...");
        setTimeout(() => {
            window.initClientPage();
        }, 200);
    }

    if (pageName === "LandingPage" && window.initializeLandingPage) {
        console.log("Calling LandingPage initialization...");
        setTimeout(() => {
            window.initializeLandingPage();
        }, 200);
    }

    // --- ADD THIS FOR ADMIN ACCOUNT PAGE ---
    if (pageName === "AdminAccountPage") {
      console.log("🔄 Initializing Admin Account Page...");
      setTimeout(() => {
        // Try multiple initialization methods
        if (window.initializeAdminAccount) {
          window.initializeAdminAccount();
        } else if (window.loadAdminProfile) {
          window.loadAdminProfile();
        } else {
          console.log("ℹ️ No specific Admin Account init function found, using default profile loader");
          loadAdminProfileFromAuth();
        }
      }, 300);
    }

  } catch (err) {
    console.error("Error loading page:", err);
    contentContainer.innerHTML = `<p>Error loading ${page.title}</p>`;
  }
}

// Fallback function to load admin profile
function loadAdminProfileFromAuth() {
  console.log("👤 Loading admin profile from Auth.js functions...");
  
  // Check if Auth.js functions are available
  if (window.loadAdminProfile) {
    window.loadAdminProfile();
  } else {
    console.error("❌ loadAdminProfile function not found");
    
    // Try to load profile data directly from localStorage as fallback
    const adminData = localStorage.getItem("adminData");
    if (adminData) {
      try {
        const profile = JSON.parse(adminData);
        updateProfileElements(profile);
        console.log("✅ Profile loaded from localStorage");
      } catch (e) {
        console.error("Error parsing adminData:", e);
      }
    } else {
      console.error("❌ No admin data found in localStorage");
    }
  }
}

// Profile update function (same as in Auth.js)
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

  console.log("✅ UI updated successfully!");
}