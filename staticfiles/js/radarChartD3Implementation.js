// radarChartD3Implementation.js

// 1) Define your policy areas just like the old code had
const policyAreas = [
  {
    display: "Agriculture and Food",
    member_self: "Agriculture_and_Food_self_proportion",
    member_across_all: "Agriculture_and_Food_across_all_proportion",
    state_self: "Agriculture_And_Food_state_self_proportion",
    state_national: "Agriculture_And_Food_state_national_proportion"
  },
  {
    display: "Crime and Law Enforcement",
    member_self: "Crime_and_Law_Enforcement_self_proportion",
    member_across_all: "Crime_and_Law_Enforcement_across_all_proportion",
    state_self: "Crime_And_Law_Enforcement_state_self_proportion",
    state_national: "Crime_And_Law_Enforcement_state_national_proportion"
  },
  {
    display: "Culture and Recreation",
    member_self: "Culture_and_Recreation_self_proportion",
    member_across_all: "Culture_and_Recreation_across_all_proportion",
    state_self: "Culture_And_Recreation_state_self_proportion",
    state_national: "Culture_And_Recreation_state_national_proportion"
  },
  {
    display: "Economy and Finance",
    member_self: "Economy_and_Finance_self_proportion",
    member_across_all: "Economy_and_Finance_across_all_proportion",
    state_self: "Economy_And_Finance_state_self_proportion",
    state_national: "Economy_And_Finance_state_national_proportion"
  },
  {
    display: "Education and Social Services",
    member_self: "Education_and_Social_Services_self_proportion",
    member_across_all: "Education_and_Social_Services_across_all_proportion",
    state_self: "Education_And_Social_Services_state_self_proportion",
    state_national: "Education_And_Social_Services_state_national_proportion"
  },
  {
    display: "Environment and Natural Resources",
    member_self: "Environment_and_Natural_Resources_self_proportion",
    member_across_all: "Environment_and_Natural_Resources_across_all_proportion",
    state_self: "Environment_And_Natural_Resources_state_self_proportion",
    state_national: "Environment_And_Natural_Resources_state_national_proportion"
  },
  {
    display: "Government Operations and Politics",
    member_self: "Government_Operations_and_Politics_self_proportion",
    member_across_all: "Government_Operations_and_Politics_across_all_proportion",
    state_self: "Government_Operations_And_Politics_state_self_proportion",
    state_national: "Government_Operations_And_Politics_state_national_proportion"
  },
  {
    display: "Health and Healthcare",
    member_self: "Health_and_Healthcare_self_proportion",
    member_across_all: "Health_and_Healthcare_across_all_proportion",
    state_self: "Health_And_Healthcare_state_self_proportion",
    state_national: "Health_And_Healthcare_state_national_proportion"
  },
  {
    display: "Immigration and Civil Rights",
    member_self: "Immigration_and_Civil_Rights_self_proportion",
    member_across_all: "Immigration_and_Civil_Rights_across_all_proportion",
    state_self: "Immigration_And_Civil_Rights_state_self_proportion",
    state_national: "Immigration_And_Civil_Rights_state_national_proportion"
  },
  {
    display: "National Security and International Affairs",
    member_self: "National_Security_and_International_Affairs_self_proportion",
    member_across_all: "National_Security_and_International_Affairs_across_all_proportio",
    state_self: "National_Security_And_International_Affairs_state_self_proportio",
    state_national: "National_Security_And_International_Affairs_state_national_propo"
  },
  {
    display: "Science, Technology and Communications",
    member_self: "Science_Technology_and_Communications_self_proportion", 
    member_across_all: "Science_Technology_and_Communications_across_all_proportion",
    state_self: "Science_Technology_And_Communications_state_self_proportion",
    state_national: "Science_Technology_And_Communications_state_national_proportion"
  },
  {
    display: "Transportation and Infrastructure",
    member_self: "Transportation_and_Infrastructure_self_proportion",
    member_across_all: "Transportation_and_Infrastructure_across_all_proportion",
    state_self: "Transportation_And_Infrastructure_state_self_proportion",
    state_national: "Transportation_And_Infrastructure_state_national_proportion"
  }
];

// If you have any “special” scaling for certain chambers:
const SCALING_FACTORS = {
  "Senate": 2,
  "House of Representatives": 5
};

let globalMembersData = [];         // We'll store the API data here
let radarChartInitialized = false;  // Flag to check if chart is first drawn

// RadarChart default config
const radarChartOptions = {
  w: 450,
  h: 450,
  margin: { top: 50, right: 60, bottom: 50, left: 60 },
  levels: 5,
  roundStrokes: true,
  transitionDuration: 800 // Feel free to adjust the duration
};

/**
 * Creates the actual dataset arrays that `radarChart.js` expects.
 * dataSet[0] = array of {axis, value} for the Member
 * dataSet[1] = array of {axis, value} for the State
 */
function buildRadarDataset(member, proportionType) {
  const dataset = [[], []]; // [memberData[], stateData[]]

  policyAreas.forEach(area => {
    const memField = (proportionType === 'self') ? area.member_self : area.member_across_all;
    let memVal = parseFloat(member[memField]) || 0;

    const stField = (proportionType === 'self') ? area.state_self : area.state_national;
    let stVal = parseFloat(member[stField]) || 0;

    // Log each area value to see what is coming in
    console.log(`${area.display}: member value = ${memVal}, state value = ${stVal}`);

    // Apply chamber-specific scaling if needed:
    if (proportionType === 'across_all') {
      const scalingFactor = SCALING_FACTORS[member.chamber] || 1;
      memVal *= scalingFactor;
    }

    dataset[0].push({ axis: area.display, value: memVal });
    dataset[1].push({ axis: area.display, value: stVal });
  });

  // Assign fixed indices for the color scale:
  dataset[0].index = 0;
  dataset[1].index = 1;

  return dataset;
}



/**
 * Initializes the dropdown for radar chart members.
 */
function initRadarDropdown(members) {
  console.log("Initializing radar dropdown with members:", members);
  const dropdown = document.getElementById("radar-member-select");
  if (!dropdown) {
      console.error("Radar chart member list not found.");
      return;
  }
  dropdown.innerHTML = "";
  dropdown.append(new Option("-- Select a Member --", ""));
  members.forEach(member => {
      const opt = document.createElement("option");
      opt.value = member.bioguide_id;
      opt.text = `${member.name} (${member.state})`;
      dropdown.appendChild(opt);
  });
}

/**
* Renders or updates the radar chart.
*/
function renderRadarChart(bioguideId, proportionType) {
  const member = globalMembersData.find(d => d.bioguide_id === bioguideId);
  if (!member) {
    console.warn("No member found with ID:", bioguideId);
    return;
  }
  console.log("Selected member:", member);  // <-- Logging the selected member

  // Build the data array for RadarChart
  const dataForRadar = buildRadarDataset(member, proportionType);
  console.log("Data for Radar:", dataForRadar);  // <-- Logging the built dataset

  // First time? Create the chart from scratch
  if (!radarChartInitialized) {
    RadarChart("#radar-chart", dataForRadar, radarChartOptions);
    radarChartInitialized = true;
  } else {
    // Already drawn? Smoothly update with transitions
    RadarChart.update(dataForRadar);
  }
}

/**
* DOMContentLoaded: Fetch API data, initialize dropdown, and wire up events.
*/
document.addEventListener("DOMContentLoaded", function() {
  // Replace the CSV fetch with an API call
  fetch("/api/member_proportions/")
    .then(response => {
        if (!response.ok) throw new Error("Failed to fetch API data.");
        return response.json();
    })
    .then(apiData => {
        globalMembersData = apiData;

        // Initialize the dropdown using the new function
        initRadarDropdown(globalMembersData);

        // Change event for the dropdown
        const dropdown = document.getElementById("radar-member-select");
        dropdown.addEventListener("change", function() {
            const selectedID = this.value;
            if (!selectedID) return;
            const proportionType = document.querySelector('input[name="proportion-toggle"]:checked').value;
            renderRadarChart(selectedID, proportionType);
        });

        // Change events for the radio buttons (for toggling between 'self' and 'across_all')
        const radios = document.querySelectorAll('input[name="proportion-toggle"]');
        radios.forEach(radio => {
            radio.addEventListener("change", function() {
                const selectedID = dropdown.value;
                if (selectedID) {
                    renderRadarChart(selectedID, this.value);
                }
            });
        });

        // Optionally auto-select the first member if available
        if (globalMembersData.length > 0) {
            dropdown.value = globalMembersData[0].bioguide_id;
            renderRadarChart(globalMembersData[0].bioguide_id, "self");
        }
    })
    .catch(err => console.error("Error loading API data for RadarChart:", err));
});