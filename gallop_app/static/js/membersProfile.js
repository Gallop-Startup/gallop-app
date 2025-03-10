
let membersData = [];
window.previousMemberList = [];

// Function to load Congress members from a local CSV file
async function loadCongressMembers() {
    try {
        const response = await fetch("/static/data/cleaned_congress_members.csv");

        if (!response.ok) {
            throw new Error("CSV file not found");
        }

        const csvText = await response.text();
        membersData = Papa.parse(csvText, { header: true }).data;
        window.membersData = membersData; // Store globally for other functions
        console.log("Loaded Congress members data:", membersData);
        console.log("Members available:", window.membersData.length);
        return membersData;
    } catch (error) {
        console.error("Error loading Congress members data:", error);
        window.membersData = []; // Ensure global variable is set to empty on error
        return [];
    }
}

// Function to update members based on state selection
async function updateMemberProfile(stateID, districtNumber = null) {
    console.log(`Updating member profile for state: ${stateID}, district: ${districtNumber}`);
    await ensureCongressMembersLoaded();

    const memberDetails = document.getElementById("member-details");
    memberDetails.innerHTML = "";
    memberDetails.classList.remove("has-content");

    let titleHTML = (districtNumber != null)
        ? `Congress Members for ${stateID} - District ${districtNumber}`
        : `Congress Members for ${stateID}`;

    const titleElement = document.createElement("h4");
    titleElement.id = "member-title";
    titleElement.textContent = titleHTML;
    memberDetails.appendChild(titleElement);

    // Filter members by state
    const stateMembers = window.membersData.filter(member => member.state === stateID);
    if (stateMembers.length === 0) {
        memberDetails.innerHTML = `<p>No members found for ${stateID}.</p>`;
        return;
    }
    memberDetails.classList.add("has-content");

    // If district number is provided, filter by district
    if (districtNumber != null) {
        let parsedDistrict = parseInt(districtNumber, 10);
        let districtMembers = stateMembers.filter(member => parseInt(member.district, 10) === parsedDistrict);

        if (districtMembers.length > 0) {
            // Store previous state member list before rendering district-specific list
            renderMemberList(districtMembers);
        } else {
            memberDetails.innerHTML = `<p>No members found for District ${districtNumber} in ${stateID}.</p>`;
        }
    } else {
        renderMemberList(stateMembers);
    }
}

// Function to dynamically render member profiles
function renderMemberList(members) {
    console.log("Rendering member profiles for:", members);
    const memberDetails = document.getElementById("member-details");
    if (!memberDetails) {
        console.error("Element #member-details not found in DOM!");
        return;
    }

    // Store previous member list for potential restoration
    window.previousMemberList = members;

    // Clear previous content
    console.log("Before update, member-details content:", memberDetails.innerHTML);  

    members.forEach(member => {
        console.log("Rendering member:", member.name);

        // Parse district number=[]
        const parsedDistrict = parseInt(member.district, 10);
        const districtDisplay = (!isNaN(parsedDistrict) && member.chamber === "House of Representatives")
            ? `<span><strong>District:</strong> ${parsedDistrict}<span><br>`
            : "";

        const memberDiv = document.createElement("div");
        memberDiv.classList.add("member-profile");

        // Member Image
        const img = document.createElement("img");
        img.src = member.imageUrl;
        img.alt = member.name;
        img.classList.add("profile-image");

        // Member Info Wrapper (Left & Right Columns)
        const memberInfo = document.createElement("div");
        memberInfo.classList.add("member-info");

        // Left Column (Basic Details)
        const leftColumn = document.createElement("div");
        leftColumn.classList.add("left-column");
        leftColumn.innerHTML = `
            <span><strong>Name:</strong> ${member.name}</span><br>
            <span><strong>Party:</strong> ${member.partyName}</span><br>
            <span><strong>Chamber:</strong> ${member.chamber}</span><br>
            ${districtDisplay}
            <span><strong>Active:</strong> ${member.startYear} - Present</span><br>
            <span><strong>Bills Sponsored:</strong> ${member.sponsoredLegislation}</span><br>
            <span><strong>Bills Co-sponsored:</strong> ${member.cosponsoredLegislation}</span><br>
        `;

        // Right Column (Contact Details)
        const rightColumn = document.createElement("div");
        rightColumn.classList.add("right-column");
        rightColumn.innerHTML = `
            <span><strong>Address:</strong> ${member.address}</span><br>
            <span><strong>Phone:</strong> ${member.phoneNumber}</span><br>
            <span><strong>Website:</strong> <a href="${member.websiteURL}" target="_blank">${member.websiteURL}</a></span><br>
        `;

        // Click event to open Radar Chart
        memberDiv.addEventListener("click", () => {
            console.log(`Clicked on member: ${member.name}, switching to Radar Chart`);
            window.selectedMemberID = member.BIOGUIDE_ID;

            loadTab('radar-chart');
        });

        // Append everything to the member container
        memberInfo.appendChild(leftColumn);
        memberInfo.appendChild(rightColumn);
        memberDiv.appendChild(img);
        memberDiv.appendChild(memberInfo);
        memberDetails.appendChild(memberDiv);

    });

    console.log("Member details:", memberDetails.innerHTML);
    console.log("Member profiles rendered successfully.");
}

async function ensureCongressMembersLoaded() {
    if (!window.membersData || window.membersData.length === 0) {
        console.warn("Congress members not loaded. Fetching data...");
        await loadCongressMembers();
    }
}

// Function to restore previous members list when switching back to General
function restorePreviousMemberList() {
    if (window.previousMemberList && window.previousMemberList.length > 0) {
        console.log("Restoring previous member list....");
        renderMemberList(window.previousMemberList);
    } else {
        console.warn("No previous member list to restore.");
    }
}