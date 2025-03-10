// JavaScript code for interactive map of US Congress members

let currentViewLevel = "national";  // Tracks zoom state: "national", "state", "district"
let lastSelectedState = null;
let lastSelectedDistrict = null;
let states, districts;
let stateDistricts = [];


// Load GeoJSON data from API
Promise.all([
    fetch("/static/data/us_states.geojson").then(response => response.json()),
    fetch("/static/data/congressional_districts.geojson").then(response => response.json())
        
]).then(([loadedStates, loadedDistricts]) => {
    states = loadedStates;
    districts = loadedDistricts;
    console.log("Loaded states and districts:", states, districts);
    initPlotlyMap(states, districts);
}).catch(error => {
    console.error("Error loading GeoJSON:", error);
});

// Initialize Plotly map
function initPlotlyMap() {
    let zValuesStates = states.features.map(d => d.properties.STATE_PARTY === "R" ? 1 : 0);
    let zValuesDistricts = districts.features.map(d => d.properties.PARTY === "R" ? 1 : 0);

    let stateTrace = {
        type: "choropleth",
        geojson: states,
        locations: states.features.map(d => d.properties.STATEFP),
        z: zValuesStates,
        featureidkey: "properties.STATEFP",
        colorscale: [[0, "rgba(247, 23, 19, 0.8)"], [1, "rgba(51, 8, 241, 0.94)"]],
        autocolorcale: false,
        reversescale: true,
        zmin: 0,
        zmax: 1,
        showscale: false,
        marker: { line: { color: "black", width: 1.5 } },
        style: { fill: "currentColor !important" },
        hoverinfo: "text",
        text: states.features.map(d => `${d.properties.NAME} (${d.properties.STATE_PARTY})`),
    };

    let districtTrace = {
        type: "choropleth",
        geojson: districts,
        locations: districts.features.map(d => d.properties.OFFICE_ID),
        z: zValuesDistricts,
        featureidkey: "properties.OFFICE_ID",
        colorscale: [[0, "rgba(247, 23, 19, 0.8)"], [1, "rgba(51, 7, 246, 0.89)"]],
        autocolorcale: false,
        reversescale: true,
        zmin: 0,
        zmax: 1,
        showscale: false,
        marker: { line: { color: "black", width: 1.5 } },
        hoverinfo: "text",
        text: districts.features.map(d => `${d.properties.LISTING_NAME} (${d.properties.PARTY}) - District ${d.properties.DISTRICT}`),
        visible: false
    }

    let layout = {
        geo: {
            scope: "usa",
            showlakes: false,
            showland: false,
            lakescolor: "rgba(244,244,244,1)",
            bgcolor: "rgba(244,244,244,1)",
        },
        paper_bgcolor: "rgba(244,244,244,1)",
        plot_bgcolor: "rgba(244,244,244,1)",
    };

    console.log("Rendering state mep with:", stateTrace, districtTrace);

    Plotly.newPlot("plotly-map", [stateTrace, districtTrace], layout, {
        responsive: true,
        displayModeBar: false,
        scrollZoom: false,
        modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'editInChartStudio', 'zoom2d', 'select2d', 'lasso2d']
    }).then(() => {
        setTimeout(() => {
            let choroplethLayer = document.querySelector(".choroplethlayer");
            if (choroplethLayer) {
                choroplethLayer.parentNode.appendChild(choroplethLayer);
                console.log("Choropleth layer moved to top");
            }
        }, 1000);
    });

    console.log("Plotly map initialized");

    // Event Listeners for clicking on states and districts
    document.getElementById("plotly-map").on("plotly_click", function(data) {
        let clickedPoint = data.points[0].location;
        console.log("Clicked point:", clickedPoint);

        let isStateClick = states.features.find(d => d.properties.STATEFP === clickedPoint);
        let isDistrictClick = districts.features.find(d => d.properties.OFFICE_ID === clickedPoint);

        if (isStateClick) {
            console.log(`Clicked on state: ${clickedPoint}`);
            stateClicked(clickedPoint);
        } else if (isDistrictClick) {
            districtClicked(clickedPoint);
        }
    });
}

// Function to zoom into a state
function stateClicked(stateID) {
    let stateFeature = states.features.find(d => d.properties.STATEFP === stateID);
    console.log("State feature:", stateFeature);
    if (!stateFeature) {
        console.log("State not found:", stateID);
        return;
    }

    // Extract state abbreviation from selected state
    let stateAbbr = stateFeature.properties.STUSPS;
    let stateName = stateFeature.properties.NAME;

    // Filter districts that belong to the state
    stateDistricts = districts.features.filter(d =>
        d.properties.OFFICE_ID.startsWith(stateAbbr)
    );

    let { minLon, maxLon, minLat, maxLat } = getGeoBounds(stateFeature.geometry);
    let lonRange = maxLon - minLon;
    let latRange = maxLat - minLat;

    // Apply extra padding for large states
    let lonPadding, latPadding;
    if (["CA", "TX", "NV"].includes(stateAbbr)) {
        lonPadding = lonRange * 0.25;
        latPadding = latRange * 0.3;
    } else if (lonRange > 15 || latRange > 10) {
        lonPadding = lonRange * 0.15;
        latPadding = latRange * 0.15;
    } else {
        lonPadding = lonRange * 0.1;
        latPadding = latRange * 0.1;
    }

    // Adjust bounding box
    let adjMinLon = minLon - lonPadding;
    let adjMaxLon = maxLon + lonPadding;
    let adjMinLat = minLat - latPadding;
    let adjMaxLat = maxLat + latPadding;

    // Calculate new center and zoom scale
    let newLonCenter = (adjMinLon + adjMaxLon) / 2;
    let newLatCenter = (adjMinLat + adjMaxLat) / 2;
    let optimalScale = calculateZoom(adjMinLon, adjMaxLon, adjMinLat, adjMaxLat);
    
    // Switch to 'Members' tab
    loadTab("members");

    // Clear all district traces
    let numTraces = document.getElementById("plotly-map").data.length;
    if (numTraces > 1) {
        for (let i = numTraces - 1; i >= 1; i--) {
            Plotly.deleteTraces("plotly-map", i);
        }
    }

    Plotly.relayout("plotly-map", {
        "geo.center": { lon: newLonCenter, lat: newLatCenter },
        "geo.projection.scale": optimalScale,
    });

    Plotly.restyle("plotly-map", { visible: false }, [1]);

    let districtTrace = {
        type: "choropleth",
        geojson: { type: "FeatureCollection", features: stateDistricts },
        locations: stateDistricts.map(d => d.properties.OFFICE_ID),
        z: stateDistricts.map(d => d.properties.PARTY === "R" ? 1 : 0),
        featureidkey: "properties.OFFICE_ID",
        colorscale: [
            [0, "rgba(247, 23, 19, 0.8)"],
            [0.5, "yellow"], 
            [1, "rgba(51, 7, 246, 0.93)"],
        ],
        autocolorcale: false,
        reversescale: true,
        zmin: 0,
        zmax: 1,
        showscale: false,
        marker: { line: { color: "black", width: 1.5 } },
        hoverinfo: "text",
        text: stateDistricts.map(d => `${d.properties.LISTING_NAME} (${d.properties.PARTY}) - District ${d.properties.DISTRICT}`),
        visible: true
    };

    Plotly.addTraces("plotly-map", districtTrace);
    /*Plotly.restyle("plotly-map", { visible: [false, true] }, [1]);*/

    currentViewLevel = "state";
    lastSelectedState = stateName;
    lastSelectedDistrict = null;  // Reset district when clicking a state

    updateButtonVisibility(true, false);
    console.log("State clicked:", stateAbbr);

    updateMemberProfile(stateName);
    console.log("Calling updateMemberProfile for:", stateName);

   // Load members and radar chart data (if selected)
   if (document.querySelector(`[onclick="loadTab('radar-chart')"].active`)) {
        updateRadarChart(window.selectedMemberID);
    }   
}

// Function to zoom into a district
function districtClicked(districtID) {
    let districtFeature = districts.features.find(d => d.properties.OFFICE_ID === districtID);
    console.log("District feature:", districtFeature);
    if (!districtFeature) return;

    let { minLon, maxLon, minLat, maxLat } = getGeoBounds(districtFeature.geometry);
    let lonCenter = (minLon + maxLon) / 2;
    let latCenter = (minLat + maxLat) / 2;
    let optimalScale = calculateZoom(minLon, maxLon, minLat, maxLat);

    let stateAbbr = districtFeature.properties.OFFICE_ID.slice(0, 2);

    // Restore previous district color
    if (lastSelectedDistrict !== null) {
        Plotly.restyle("plotly-map", {
            z: stateDistricts.map(d => d.properties.PARTY === "R" ? 1 : 0),
        }, [1]);
    }
                 
    // Highlight selected district
    let newZValues = stateDistricts.map(d => d.properties.OFFICE_ID === districtID ? 0.5 : (d.properties.PARTY === "R" ? 1 : 0));
    console.log("New Z values:", newZValues);
    Plotly.restyle("plotly-map", {
        z: [newZValues],
    }, [1]);

    Plotly.relayout("plotly-map", {
        "geo.center": { lon: lonCenter, lat: latCenter },
        "geo.projection.scale": optimalScale
    });
    
    currentViewLevel = "district";
    lastSelectedDistrict = districtID;
    updateButtonVisibility(false, true);

    // Load members and radar chart data (if selected)
    if (document.querySelector(`[onclick="loadTab('members')"].active`)) {
        console.log("Calling updatateMemberProfile for district:", stateAbbr, lastSelectedDistrict.slice(-2));
        updateMemberProfile(lastSelectedState, lastSelectedDistrict.slice(-2));
    }
    if (document.querySelector(`[onclick="loadTab('radar-chart')"].active`)) {
        updateRadarChart(window.selectedMemberID);
    }
}

// Function to reset to national view
function resetView() {
    Plotly.relayout("plotly-map", {
        "geo.center.lon": -95.7129,
        "geo.center.lat": 37.0902,
        "geo.projection.scale": 0.9
    });

    // Clear all district traces
    let numTraces = document.getElementById("plotly-map").data.length;
    if (numTraces > 1) {
        for (let i = numTraces - 1; i >= 1; i--) {
            Plotly.deleteTraces("plotly-map", i);
        }
    }

    currentViewLevel = "national";
    lastSelectedState = null;
    updateButtonVisibility(false, false);

    // Reset sidebar content to the original welcome message
    const sidebarContent = document.getElementById("member-details");
    if (sidebarContent) {
        sidebarContent.innerHTML = "";
        sidebarContent.classList.remove("has-content");
    }

}

// Function to go back to state view
function backToStateView() {
    if (!lastSelectedState) return;

    let stateFeature = states.features.find(d => d.properties.NAME === lastSelectedState);
    if (!stateFeature) return;
    let { minLon, maxLon, minLat, maxLat } = getGeoBounds(stateFeature.geometry);
    let center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
    let optimalScale = calculateZoom(minLon, maxLon, minLat, maxLat);


    Plotly.relayout("plotly-map", {
        "geo.center.lon": center[0],
        "geo.center.lat": center[1],
        "geo.projection.scale": optimalScale
    });

    // Restore state trace visibility
    Plotly.restyle("plotly-map", { visible: true }, [0]);

    let originalValues = stateDistricts.map(d => d.properties.PARTY === "R" ? 1 : 0);
    Plotly.restyle("plotly-map", { z: [originalValues] }, [1]);
    

    currentViewLevel = "state";
    lastSelectedDistrict = null;
    updateButtonVisibility(true, false);

    // Reset the sidebar to show all members of the state
    updateMemberProfile(lastSelectedState);
}

// Function to calculate geometric center of a feature
function getGeoBounds(geometry) {
    if (!geometry || !geometry.coordinates) {
        console.error("Invalid geometry:", geometry);
        return [0, 0];  // Default to center of the map
    }

    let allCoords = geometry.type === "MultiPolygon"
        ? geometry.coordinates.flat(2)  // Flatten multi-polygons
        : geometry.coordinates[0]; // Single polygon

    let lats = allCoords.map(c => c[1]);  // Extract latitudes
    let lons = allCoords.map(c => c[0]);  // Extract longitudes

    let minLon = Math.min(...lons);
    let maxLon = Math.max(...lons);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);

    return { minLon, maxLon, minLat, maxLat };
}

function calculateZoom(minLon, maxLon, minLat, maxLat) {
    let latDiff = maxLat - minLat;
    let lonDiff = maxLon - minLon;

    let baseScale = 5;
    let scaleFactor = Math.max(lonDiff, latDiff) * 0.1;
    let optimalScale;

    // Dynamically adjust zoom based on state size
    if (lonDiff > 15 || latDiff > 10) {
        // Large states
        optimalScale = baseScale - (scaleFactor * 1.65);
    } else if (lonDiff > 5 || latDiff > 5) {
        // Medium states
        optimalScale = baseScale - scaleFactor;
    } else {
        // Small states
        optimalScale = baseScale - (scaleFactor * 0.7);
    }

    return Math.max(2, Math.min(optimalScale, 6));
}

// Function to update button visibility
function updateButtonVisibility(showBackToNational, showBackToState) {
    document.getElementById("backToNationalView").style.display = showBackToNational ? "block" : "none";
    document.getElementById("backToStateView").style.display = showBackToState ? "block" : "none";
}