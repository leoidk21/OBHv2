if (window.__LandingPageModuleInstance) {
    console.log("LandingPageModule already loaded – reusing existing instance");
    window.LandingPageModule = window.__LandingPageModuleInstance;
} else {
    if (!window.AdminLogger) {
        console.log("Loading AdminLogger for Landing Page...");
        window.AdminLogger = {
            API_BASE: window.supabaseConfig?.url ? `${window.supabaseConfig.url}/rest/v1` : "https://vxukqznjkdtuytnkhldu.supabase.co/rest/v1",
            SUPABASE_ANON_KEY: window.supabaseConfig?.anonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dWtxem5qa2R0dXl0bmtobGR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI0NDE4MCwiZXhwIjoyMDc2ODIwMTgwfQ.7hCf7BDqlVuNkzP1CcbORilAzMqOHhexP4Y7bsTPRJA",

        /**
         * Get current admin ID - USING GLOBAL SUPABASE CLIENT
        */
        async getCurrentAdminId() {
            try {
                console.log("🔍 Getting admin ID from Landing Page...");
                
                // Method 1: Get from GLOBAL Supabase session
                if (window.supabase && window.supabase.auth) {
                    console.log("🔄 Using GLOBAL Supabase client for session check");
                    const { data: { session }, error } = await window.supabase.auth.getSession();
                    if (!error && session?.user?.id) {
                        console.log("✅ Using admin ID from GLOBAL session:", session.user.id);
                        return session.user.id;
                    }
                    if (error) {
                        console.error("❌ Global Supabase session error:", error);
                    }
                } else {
                    console.warn("❌ Global Supabase client not available");
                }

                // Method 2: Get from localStorage
                const adminData = localStorage.getItem("adminData");
                if (adminData) {
                    try {
                        const admin = JSON.parse(adminData);
                        if (admin.id) {
                            console.log("✅ Using admin ID from localStorage:", admin.id);
                            return admin.id;
                        }
                    } catch (e) {
                        console.error("Error parsing adminData:", e);
                    }
                }

                // Method 3: Lookup by email
                const adminEmail = localStorage.getItem("adminEmail") || 
                                 (adminData ? JSON.parse(adminData).email : null);
                
                if (adminEmail) {
                    console.log("🔍 Looking up admin ID by email:", adminEmail);
                    const adminId = await this.lookupAdminIdByEmail(adminEmail);
                    if (adminId) {
                        console.log("✅ Found admin ID by email:", adminId);
                        return adminId;
                    }
                }

                console.warn("❌ No admin ID found in Landing Page");
                return null;

            } catch (error) {
                console.error("❌ Error getting admin ID:", error);
                return null;
            }
        },

        /**
         * Lookup admin ID by email
        */
        async lookupAdminIdByEmail(email) {
            try {
                const response = await fetch(
                    `${this.API_BASE}/admin_profiles?email=eq.${encodeURIComponent(email)}&select=id`,
                    {
                        headers: {
                            'apikey': this.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                            "Content-Type": "application/json"
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        return data[0].id;
                    }
                }
                return null;
            } catch (error) {
                console.error("Error looking up admin ID by email:", error);
                return null;
            }
        },

        /**
         * Log admin action to database
        */
        async logAction(action, targetPage, details = {}) {
            try {
                console.log(`📝 Landing Page - Logging: ${action} on ${targetPage}`, details);
                
                const adminId = await this.getCurrentAdminId();
                
                if (!adminId) {
                    console.warn("❌ Cannot log action: No admin ID");
                    this.storeLogLocally(action, targetPage, details);
                    return { success: false, error: "No admin ID" };
                }

                const logEntry = {
                    admin_id: adminId,
                    action: action,
                    target_page: targetPage,
                    details: details,
                    timestamp: new Date().toISOString()
                };

                console.log("📋 Log entry:", logEntry);

                const response = await fetch(`${this.API_BASE}/admin_logs`, {
                    method: "POST",
                    headers: {
                        'apikey': this.SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
                        "Content-Type": "application/json",
                        "Prefer": "return=representation"
                    },
                    body: JSON.stringify([logEntry])
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                console.log("✅ Action logged successfully:", data);
                return { success: true, data };

            } catch (error) {
                console.error("❌ Failed to log action:", error);
                this.storeLogLocally(action, targetPage, details);
                return { success: false, error: error.message };
            }
        },

        /**
         * Store log locally as fallback
        */
        storeLogLocally(action, targetPage, details) {
            try {
                const logs = JSON.parse(localStorage.getItem('pending_admin_logs') || '[]');
                logs.push({
                    action,
                    targetPage,
                    details,
                    timestamp: new Date().toISOString(),
                    admin_id: localStorage.getItem("adminData") ? JSON.parse(localStorage.getItem("adminData")).id : 'unknown'
                });
                localStorage.setItem('pending_admin_logs', JSON.stringify(logs));
                console.log("💾 Log stored locally for later sync");
            } catch (error) {
                console.error("❌ Failed to store log locally:", error);
            }
        }
    };
    console.log("✅ AdminLogger loaded for Landing Page");
}

    window.LandingPageModule = (function () {
        // USE GLOBAL CONFIG INSTEAD OF HARDCODED VALUES
        const API_BASE = window.supabaseConfig?.url ? `${window.supabaseConfig.url}/rest/v1` : "https://vxukqznjkdtuytnkhldu.supabase.co/rest/v1";
        const SUPABASE_ANON_KEY = window.supabaseConfig?.anonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dWtxem5qa2R0dXl0bmtobGR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI0NDE4MCwiZXhwIjoyMDc2ODIwMTgwfQ.7hCf7BDqlVuNkzP1CcbORilAzMqOHhexP4Y7bsTPRJA";
        
        let allEvents = [];
        let dashboardStats = null;
        let currentEventId = null;
        let isInitialized = false;

        // ============================================
        // AUTHENTICATION - USING GLOBAL SUPABASE
        // ============================================
        function isAuthenticated() {
            const token = localStorage.getItem("token");
            return token !== null && token !== "";
        }

        function getAuthToken() {
            return localStorage.getItem("token");
        }

        // ============================================
        // INIT FUNCTION
        // ============================================
        function init() {
            console.log("🚀 LandingPageModule init started");
            
            // Check if we're on the right page
            const isLandingPage = document.body.getAttribute("data-page") === "LandingPage";
            
            if (!isLandingPage) {
                // Reset initialization state when not on landing page
                if (isInitialized) {
                    return;
                }
            }

            const landingContent = document.querySelector('.landing-content');
            if (landingContent) {
                landingContent.style.opacity = '0';
                landingContent.classList.remove('ready');
            }

            // If already initialized, just refresh the UI
            if (isInitialized) {
                refreshUI();
                showContent(); 
                return;
            }

            // Check authentication
            if (!isAuthenticated()) {
                console.warn("❌ Not authenticated");
                return;
            }

            // Load data and setup UI
            loadCachedData();
            loadEvents();
            loadDashboardStats();
            isInitialized = true;
            console.log("✅ LandingPageModule init completed");
        }

        function showContent() {
            const landingContent = document.querySelector('.landing-content');
            if (landingContent) {
                setTimeout(() => {
                    landingContent.classList.add('ready');
                }, 50);
            }
        }

        function normalizeDate(d) {
            const dt = new Date(d);
            dt.setHours(0,0,0,0);
            return dt;
        }

        function refreshUI() {
            displayUpcomingEvents();
            displayPastEvents();
            updateDashboardCards(dashboardStats);
        }

        // ============================================
        // LOAD CACHED DATA
        // ============================================
        function loadCachedData() {
            let hasCachedData = false;

            // Try restore from Electron memory store first
            const storedEvents = window.store?.get("events");
            if (storedEvents && storedEvents.length > 0) {
                allEvents = storedEvents;
                hasCachedData = true;
            } else {
                // Fallback to localStorage
                const cachedEvents = localStorage.getItem("cachedEvents");
                if (cachedEvents) {
                    try {
                        allEvents = JSON.parse(cachedEvents);
                        hasCachedData = true;
                    } catch (error) {
                        console.error("Error parsing cached events:", error);
                    }
                }
            }

            const cachedStats = localStorage.getItem("cachedDashboardStats");
            if (cachedStats) {
                try {
                    dashboardStats = JSON.parse(cachedStats);
                    hasCachedData = true;
                } catch (error) {
                    console.error("Error parsing cached stats:", error);
                }
            }

            if (hasCachedData) {
                refreshUI();
                showContent(); 
            }

            return hasCachedData;
        }

        // ============================================
        // COMPUTE DASHBOARD STATS LOCALLY
        // ============================================
        function computeDashboardStatsLocally() {
            if (!Array.isArray(allEvents)) return {
                total_events: 0,
                pending_count: 0,
                approved_count: 0,
                completed_count: 0,
                upcoming_count: 0,
            };

            // Normalize today to midnight
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const total = allEvents.length;
            const pending = allEvents.filter(e => e.status === "Pending").length;
            const approved = allEvents.filter(e => e.status === "Approved").length;
            const completed = allEvents.filter(e => e.status === "Completed").length;

            // Upcoming = pending + approved with event_date >= today
            const upcoming = allEvents.filter(e => {
                const eventDate = new Date(e.event_date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= today && ["Pending", "Approved"].includes(e.status);
            }).length;

            return {
                total_events: total,
                pending_count: pending,
                approved_count: approved,
                completed_count: completed,
                upcoming_count: upcoming,
            };
        }

        // ============================================
        // IMPROVED ERROR HANDLING FOR ALL FETCH CALLS
        // ============================================
        async function supabaseFetch(url, options = {}) {
            const defaultHeaders = {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                "Content-Type": "application/json",
            };

            const config = {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers,
                },
            };

            try {
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error(`❌ Fetch error for ${url}:`, error);
                throw error;
            }
        }

        // ============================================
        // IMPROVED FETCH ALL EVENTS
        // ============================================
        async function loadEvents(forceRefresh = false) {
            // Don't refetch if we already have events and not forcing refresh
            if (allEvents.length > 0 && !forceRefresh) {
                console.log("📂 Using cached events, skipping API call");
                showContent();
                return;
            }

            try {
                console.log("📡 Fetching events from Supabase...");
                
                const data = await supabaseFetch(`${API_BASE}/event_plans?select=*&order=event_date.desc`);
                
                if (Array.isArray(data)) {
                    allEvents = data;

                    // Save to localStorage for persistence
                    localStorage.setItem("cachedEvents", JSON.stringify(allEvents));

                    // Save to Electron memory store
                    if (window.store) {
                        window.store.set("events", allEvents);
                    }

                    // Update UI
                    refreshUI();
                    await loadDashboardStats();

                    showContent();

                    console.log(`✅ Loaded ${allEvents.length} events from Supabase`);
                } else {
                    throw new Error("Invalid data format received from server");
                }
            } catch (error) {
                console.error("❌ Error loading events:", error);
                showNotification("Failed to load events: " + error.message, "error");
                showContent();
            }
        }

        // ============================================
        // LOAD DASHBOARD STATS
        // ============================================
        async function loadDashboardStats(forceRefresh = false) {
            if (dashboardStats && !forceRefresh) {
                updateDashboardCards(dashboardStats);
                return;
            }

            try {
                // Since we don't have a stats endpoint, compute locally
                dashboardStats = computeDashboardStatsLocally();
            } catch (error) {
                console.error("❌ Error loading stats:", error);
                dashboardStats = computeDashboardStatsLocally(); // fallback
            }

            localStorage.setItem("cachedDashboardStats", JSON.stringify(dashboardStats));
            updateDashboardCards(dashboardStats);
        }

        // ============================================
        // UPDATE DASHBOARD CARDS - FIXED
        // ============================================
        function updateDashboardCards(stats) {
            if (!stats) {
                console.warn("❌ No stats provided to updateDashboardCards");
                return;
            }

            // Update total events
            const totalEventsEl = document.getElementById("total-events-count");
            if (totalEventsEl) {
                totalEventsEl.textContent = stats.total_events || 0;
            }

            // Update upcoming events
            const upcomingEventsEl = document.getElementById("upcoming-events-count");
            if (upcomingEventsEl) {
                upcomingEventsEl.textContent = stats.upcoming_count || 0;
            }

            // Update approved count
            const approvedEl = document.getElementById("approved-events-count");
            if (approvedEl) {
                approvedEl.textContent = stats.approved_count || 0;
            }

            // Update pending count
            const pendingEl = document.getElementById("pending-events-count");
            if (pendingEl) {
                pendingEl.textContent = stats.pending_count || 0;
            }
        }

        // ============================================
        // DISPLAY UPCOMING EVENTS - USING IDS
        // ============================================
        function displayUpcomingEvents() {
            const today = normalizeDate(new Date());

            const upcomingEvents = allEvents.filter((event) => {
                const eventDate = normalizeDate(event.event_date);
                return (event.status === "Pending" || event.status === "Approved") && eventDate >= today;
            });

            const tbody = document.getElementById("upcoming-events-tbody");
            if (!tbody) {
                console.error("❌ Upcoming events table body not found");
                return;
            }

            if (upcomingEvents.length === 0) {
                tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">No upcoming events</td>
                </tr>`;
                return;
            }

            tbody.innerHTML = upcomingEvents.map(event => `
                <tr data-event-id="${event.id}">
                    <td>${escapeHtml(event.client_name || "N/A")}</td>
                    <td>${escapeHtml(event.event_type || "N/A")}</td>
                    <td>${formatDate(event.event_date)}</td>
                    <td><span class="status status-${event.status.toLowerCase()}">${event.status}</span></td>
                    <td><button class="view-btn" onclick="LandingPageModule.viewEvent(${event.id})">View</button></td>
                </tr>
            `).join("");

            console.log(`✅ Displayed ${upcomingEvents.length} upcoming events`);
        }

        // ============================================
        // DISPLAY PAST EVENTS (Auto-Complete old ones)
        // ============================================
        async function displayPastEvents() {
            const today = normalizeDate(new Date());

            // find events that are past-date and not yet Completed
            const outdated = allEvents.filter(event => {
                const eventDate = normalizeDate(event.event_date);
                return eventDate < today && (event.status === "Pending" || event.status === "Approved");
            });

            if (outdated.length > 0) {
                console.log(`🔄 Found ${outdated.length} outdated events — marking Completed...`);

                // Option A: update server in parallel
                const promises = outdated.map(ev => markEventAsCompleted(ev.id));
                const results = await Promise.all(promises);

                // Update local statuses for those that succeeded
                for (let i = 0; i < outdated.length; i++) {
                if (results[i]) {
                    const id = outdated[i].id;
                    const local = allEvents.find(e => e.id === id);
                    if (local) local.status = "Completed";
                } else {
                    // if server failed, we keep the local status unchanged
                }
                }

                // persist cache
                localStorage.setItem("cachedEvents", JSON.stringify(allEvents));
                if (window.store) window.store.set("events", allEvents);

                // refresh stats after server sync
                await loadDashboardStats(true);
            }

            // Now render all completed events
            const pastEvents = allEvents.filter(event => event.status === "Completed");

            const tbody = document.getElementById("past-events-tbody");
            if (!tbody) return;

            if (pastEvents.length === 0) {
                tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">No past events</td>
                </tr>`;
                return;
            }

            tbody.innerHTML = pastEvents.map(event => `
                <tr data-event-id="${event.id}">
                <td>${escapeHtml(event.client_name || "N/A")}</td>
                <td>${escapeHtml(event.event_type || "N/A")}</td>
                <td>${formatDate(event.event_date)}</td>
                <td><span class="status status-${event.status.toLowerCase()}">${event.status}</span></td>
                <td><button class="view-btn" onclick="LandingPageModule.viewEvent(${event.id})">View</button></td>
                </tr>
            `).join("");
        }
        
        // ============================================
        // MARK EVENT AS COMPLETED (PUT request)
        // ============================================
        async function markEventAsCompleted(eventId) {
            try {
                const response = await fetch(`${API_BASE}/event_plans?id=eq.${eventId}`, {
                    method: "PATCH",
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        "Content-Type": "application/json",
                        "Prefer": "return=representation"
                    },
                    body: JSON.stringify({
                        status: "Completed",
                        remarks: "Automatically marked as completed after event date",
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                if (data && data.length > 0) {
                    console.log(`✅ Event ${eventId} marked as Completed (server)`);
                    return true;
                } else {
                    console.warn(`❌ Server rejected completing event ${eventId}`);
                    return false;
                }
            } catch (err) {
                console.error("❌ Error marking event completed:", err);
                return false;
            }
        }

        // ============================================
        // VIEW EVENT DETAILS
        // ============================================
        async function viewEvent(eventId) {
            try {
                console.log("👀 Viewing event:", eventId);
                currentEventId = eventId;

                const response = await fetch(
                    `${API_BASE}/event_plans?id=eq.${eventId}`,
                    {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch event details: HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data && data.length > 0) {
                    displayEventModal(data[0]);
                } else {
                    throw new Error("Event not found in database");
                }
            } catch (error) {
                console.error("❌ Error viewing event:", error);
                showNotification("Failed to load event details: " + error.message, "error");
            }
        }

        // ============================================
        // DISPLAY EVENT IN MODAL
        // ============================================
        function displayEventModal(event) {
            const modal = document.getElementById("event-modal");
            const modalBody = modal.querySelector(".modal-body");

            if (!modalBody) return;

            // Parse event segments if it's a JSON string
            let segments = [];
            if (typeof event.event_segments === "string") {
                try {
                    segments = JSON.parse(event.event_segments);
                } catch (e) {
                    console.error("Failed to parse event segments:", e);
                }
            } else if (Array.isArray(event.event_segments)) {
                segments = event.event_segments;
            }

            modalBody.innerHTML = `
                <div class="event-details">
                    <div class="detail-row">
                        <strong>Client Name:</strong>
                        <span>${escapeHtml(event.client_name)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Partner Name:</strong>
                        <span>${escapeHtml(event.partner_name || "N/A")}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Event Type:</strong>
                        <span>${escapeHtml(event.event_type)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Package:</strong>
                        <!-- FIX: Use guest_range instead of package since package is null -->
                        <span>${escapeHtml(event.package_name || "Not specified")} Pax</span>
                    </div>
                    <div class="detail-row">
                        <strong>Price:</strong>
                        <span>${event.package_price || 0}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Event Date:</strong>
                        <span>${formatDate(event.event_date)}</span>
                    </div>
                    <!-- Show event segments if available -->
                    ${segments.length > 0 ? `
                        <div class="detail-row">
                            <strong>Event Segments:</strong>
                            <div class="segments-list">
                                ${segments.map(segment => `
                                    <div class="segment-item">
                                        <strong>${escapeHtml(segment.name || 'Segment')}:</strong> 
                                        ${escapeHtml(segment.venue || '')} 
                                        (${segment.startTime || ''} - ${segment.endTime || ''})
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="detail-row">
                        <strong>Status:</strong>
                        <span class="status status-${event.status.toLowerCase()}">${event.status}</span>
                    </div>
                    
                    ${event.remarks ? `
                        <div class="detail-row last-row">
                            <strong>Remarks:</strong>
                            <span>${escapeHtml(event.remarks)}</span>
                        </div>
                    ` : ''}
                </div>
            `;

            // Show/hide approve/reject buttons based on status
            const approveBtn = modal.querySelector(".approve");
            const rejectBtn = modal.querySelector(".reject");

            if (event.status === "Pending") {
                approveBtn.style.display = "inline-block";
                rejectBtn.style.display = "inline-block";
            } else {
                approveBtn.style.display = "none";
                rejectBtn.style.display = "none";
            }

            // Show modal
            modal.style.display = "flex";
        }

        // ============================================                     
        // APPROVE EVENT - USING GLOBAL SUPABASE FOR AUTH
        // ============================================
        async function approveEvent() {
            if (!currentEventId) {
                showNotification("No event selected", "error");
                return;
            }

            try {
                console.log("🚀 ========== APPROVE EVENT START ==========");
                
                // Get event details
                const eventToApprove = allEvents.find(e => e.id === currentEventId);
                console.log("📋 Event to approve:", eventToApprove);
                
                // DEBUG: Check current admin context using GLOBAL client
                console.log("🔍 === LANDING PAGE DEBUG ===");
                
                // 1. Check GLOBAL Supabase session
                if (window.supabase && window.supabase.auth) {
                    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
                    console.log("🔍 GLOBAL Supabase session:", session);
                    console.log("🔍 Session error:", sessionError);
                } else {
                    console.error("❌ GLOBAL Supabase client not available");
                }
                
                // 2. Check localStorage
                console.log("🔍 localStorage adminData:", localStorage.getItem("adminData"));
                console.log("🔍 localStorage token:", localStorage.getItem("token"));
                
                // 3. Test AdminLogger directly
                console.log("🔍 Testing AdminLogger.getCurrentAdminId()...");
                const adminId = await AdminLogger.getCurrentAdminId();
                console.log("🔍 AdminLogger returned ID:", adminId);
                
                if (adminId && window.supabase) {
                    const { data: adminProfile } = await window.supabase
                        .from('admin_profiles')
                        .select('id, email, first_name, last_name')
                        .eq('id', adminId)
                        .single();
                    console.log("🔍 Corresponding admin profile:", adminProfile);
                }
                
                // 4. Test direct log creation
                console.log("🔍 Testing direct log creation...");
                const testLogResult = await AdminLogger.logAction('debug_approve', 'Landing Page', {
                    debug: true,
                    event_id: currentEventId,
                    testing: "direct_log_test",
                    timestamp: new Date().toISOString()
                });
                console.log("🔍 Direct log test result:", testLogResult);

                // If direct log test failed, stop here
                if (!testLogResult.success) {
                    throw new Error(`Logging test failed: ${testLogResult.error}`);
                }

                console.log("✅ Logging test passed, proceeding with approval...");

                // Proceed with actual approval
                const response = await fetch(
                    `${API_BASE}/event_plans?id=eq.${currentEventId}`,
                    {
                        method: "PATCH",
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            "Content-Type": "application/json",
                            "Prefer": "return=representation"
                        },
                        body: JSON.stringify({
                            status: "Approved",
                            remarks: "Approved by admin",
                        }),
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const data = await response.json();

                if (data && data.length > 0) {
                    // LOG THE ACTUAL APPROVAL ACTION
                    console.log("📝 Logging actual approval action...");
                    const logResult = await AdminLogger.logAction('approve', 'Landing Page', {
                        event_id: currentEventId,
                        event_name: eventToApprove?.event_type || 'Unknown Event',
                        client_name: eventToApprove?.client_name || 'Unknown Client',
                        event_date: eventToApprove?.event_date,
                        approved_at: new Date().toISOString()
                    });
                    
                    console.log("📝 Final log result:", logResult);

                    if (!logResult.success) {
                        console.error("❌ APPROVAL ACTION LOGGING FAILED:", logResult.error);
                        // Continue with approval but show warning
                        showNotification("Event approved but failed to log action", "warning");
                    } else {
                        showNotification("Event approved successfully", "success");
                    }
                    
                    // Update cache and UI
                    const updatedEvent = data[0];
                    const index = allEvents.findIndex(e => e.id === currentEventId);
                    if (index !== -1) {
                        allEvents[index] = updatedEvent;
                        localStorage.setItem("cachedEvents", JSON.stringify(allEvents));
                        if (window.store) {
                            window.store.set("events", allEvents);
                        }
                    }
                    
                    closeModal();
                    await loadEvents(true);
                    await loadDashboardStats(true);
                    
                    console.log("✅ ========== APPROVE EVENT COMPLETE ==========");
                } else {
                    throw new Error("No data returned from server");
                }
            } catch (error) {
                console.error("❌ Approve event error:", error);
                showNotification("Failed to approve event: " + error.message, "error");
            }
        }

        // ============================================
        // REJECT EVENT
        // ============================================
        async function rejectEvent() {
            if (!currentEventId) return;

            try {
                const response = await fetch(
                    `${API_BASE}/event_plans?id=eq.${currentEventId}`,
                    {
                        method: "PATCH",
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            "Content-Type": "application/json",
                            "Prefer": "return=representation"
                        },
                        body: JSON.stringify({
                            status: "Rejected",
                            remarks: "Rejected by admin",
                        }),
                    },
                );

                if (!response.ok) {
                    throw new Error("Failed to reject event");
                }

                const data = await response.json();

                if (data && data.length > 0) {
                    showNotification("Event rejected", "success");
                    
                    // Update local cache
                    const updatedEvent = data[0];
                    const index = allEvents.findIndex(e => e.id === currentEventId);
                    if (index !== -1) {
                        allEvents[index] = updatedEvent;
                        localStorage.setItem("cachedEvents", JSON.stringify(allEvents));
                    }
                    
                    closeModal();
                    loadEvents(true);
                    loadDashboardStats(true);
                }
            } catch (error) {
                console.error("❌ Error rejecting event:", error);
                showNotification("Failed to reject event", "error");
            }
        }

        // ============================================
        // DELETE EVENT
        // ============================================
        async function deleteEvent(eventId) {
            try {
                const confirmDelete = confirm("Are you sure you want to delete this event?");
                if (!confirmDelete) return;

                const response = await fetch(`${API_BASE}/event_plans?id=eq.${eventId}`, {
                    method: "DELETE",
                    headers: { 
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        "Content-Type": "application/json"
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                showNotification("Event deleted successfully", "success");

                // Force-refresh dashboard & events
                await loadEvents(true);
                await loadDashboardStats(true);
            } catch (error) {
                console.error("❌ Error deleting event:", error);
                showNotification("Error deleting event", "error");
            }
        }

        // ============================================
        // REFRESH DATA
        // ============================================
        function refreshData() {
            loadEvents(true);
            loadDashboardStats(true);
        }

        // ============================================
        // CLOSE MODAL
        // ============================================
        function closeModal() {
            const modal = document.getElementById("event-modal");
            if (modal) {
                modal.style.display = "none";
            }
        }

        // ============================================
        // UTILITY FUNCTIONS
        // ============================================
        function formatDate(dateString) {
            if (!dateString) return "N/A";
            const date = new Date(dateString);
            const options = { year: "numeric", month: "long", day: "numeric" };
            return date.toLocaleDateString("en-US", options);
        }
        
        function formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        function escapeHtml(text) {
            if (!text) return "";
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        }

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

        // ============================================
        // PUBLIC API
        // ============================================
        return {
            init,
            viewEvent,
            approveEvent,
            rejectEvent,
            deleteEvent,
            loadEvents,
            closeModal,
            refreshUI,
            refreshData,
            loadDashboardStats,
            hasData: () => allEvents.length > 0,
            getEventCount: () => allEvents.length
        };
    })();

    window.__LandingPageModuleInstance = window.LandingPageModule;
}

// ============================================
// AUTO-INITIALIZATION
// ============================================

(function initializeLandingPage() {
    if (window.__LandingPageAutoInit) return;
    window.__LandingPageAutoInit = true;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-page') {
                const currentPage = document.body.getAttribute('data-page');
                if (currentPage === 'LandingPage' && window.LandingPageModule) {
                    console.log('🎯 Landing Page detected - refreshing events');
                    
                    // Hide content during refresh
                    const landingContent = document.querySelector('.landing-content');
                    if (landingContent) {
                        landingContent.style.opacity = '0';
                        landingContent.classList.remove('ready');
                    }
                    
                    setTimeout(() => {
                        window.LandingPageModule.loadEvents(true);
                        window.LandingPageModule.loadDashboardStats(true);
                    }, 300);
                }
            }
        });
    });

    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-page']
    });

    const isLandingPage = document.body.getAttribute("data-page") === "LandingPage";
    if (isLandingPage && window.LandingPageModule) {
        
        // Hide content initially
        const landingContent = document.querySelector('.landing-content');
        if (landingContent) {
            landingContent.style.opacity = '0';
            landingContent.classList.remove('ready');
        }
        
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                window.LandingPageModule.init();
            });
        } else {
            window.LandingPageModule.init();
        }
    }
})();

window.initializeAdminProfile = initializeAdminProfile;
window.updateProfileElements = updateProfileElements;