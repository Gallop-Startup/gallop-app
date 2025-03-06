// Function to dynamically update sidebar content based on selected tab
function loadTab(tabName) {
    console.log(`Switching to tab: ${tabName}`);

    // Hide all tab containers
    document.querySelectorAll(".tab-container").forEach(tab => tab.style.display = "none");

    // Show the selected tab container
    const selectedTab = document.getElementById(`${tabName}-container`);
    if (selectedTab) {
        selectedTab.style.display = "block";
    } 
    
    // Handle tab-specific content updates
    if (tabName === "general") {
        // Restore previous member list when switching back to "General"
        if (window.previousMemberList && window.previousMemberList.length > 0) {
            console.log("Restoring previous member list....");
            restorePreviousMemberList();
        }
    } else if (tabName === "members") {
        // Load members list if switching to the Members tab
        console.log("Loading members list...");
        updateMemberProfile(window.lastSelectedState, window.lastSelectedDistrict);
    } else if (tabName === "radar-chart") {
        // Load radar chart if switching to the Radar Chart tab
        console.log("Loading radar chart...");

        if (!window.congressMembersData || window.congressMembersData.length > 0) {
            initRadarDropdown(window.congressMembersData);
        } else {
            console.warn("Congress members data not loaded. Fetching data...");
        }

        document.getElementById("radar-member-select").addEventListener("change", function() {
            let selectedMember = this.value;
            if (!selectedMember) return;

            console.log("Selected member:", selectedMember);
            updateRadarChart(selectedMember);
        });

        if (window.selectedMemberID) {
            updateRadarChart(window.selectedMemberID);
        } else {
            console.warn("No member selected for radar chart.");
        }
    } else if (tabName === "ideology-chart") {
        // Load ideology chart if switching to the Ideology tab
        console.log("Loading ideology chart...");

        if (!window.loadIdeologyData || !window.ideologyData.length === 0) {
            console.warn("Ideology data not loaded. Fetching data...");
            return;
        }

        if (window.ideologyTopics) {
            populateTopicDropdown(window.ideologyTopics);
        }
        loadIdeologyChart();
    }

    // Update active tab styling
    document.querySelectorAll(".tabs button").forEach(btn => btn.classList.remove("active"));

    let activeTab = document.querySelector(`.tabs button[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add("active");
    } else {
        console.warn(`Tab not found: ${tabName}`);
    }
}

