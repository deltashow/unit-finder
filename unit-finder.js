// Sample Data Model for Units
const unitsData = [
    { id: 1, name: "شقة A-101", rooms: 2, price: 3200000, area: 135, status: "available", floor: 1, x: -3, y: 0.5, z: 0 },
    { id: 2, name: "شقة A-102", rooms: 3, price: 4250000, area: 185, status: "available", floor: 1, x: 0, y: 0.5, z: 0 },
    { id: 3, name: "بنتهاوس A-201", rooms: 4, price: 7800000, area: 290, status: "reserved", floor: 2, x: 3, y: 2, z: 0 },
    { id: 4, name: "شقة B-101", rooms: 3, price: 4100000, area: 170, status: "sold", floor: 1, x: -3, y: 0.5, z: -4 },
    { id: 5, name: "شقة B-102", rooms: 2, price: 3500000, area: 140, status: "available", floor: 1, x: 0, y: 0.5, z: -4 },
    { id: 6, name: "دوبلكس B-201", rooms: 4, price: 8900000, area: 320, status: "available", floor: 2, x: 3, y: 2, z: -4 }
];

let scene, camera, renderer, raycaster, mouse;
let meshes = [];

document.addEventListener("DOMContentLoaded", () => {
    initUI();
    renderGridView(unitsData);
    init3DScene();
    updateStats();
});

// UI & Logic Control
function initUI() {
    const priceRange = document.getElementById("priceRange");
    const priceValue = document.getElementById("priceValue");
    const statusFilter = document.getElementById("statusFilter");
    const roomsFilter = document.getElementById("roomsFilter");

    priceRange.addEventListener("input", (e) => {
        priceValue.textContent = Number(e.target.value).toLocaleString();
        applyFilters();
    });

    statusFilter.addEventListener("change", applyFilters);
    roomsFilter.addEventListener("change", applyFilters);

    // View Toggles
    const view3dBtn = document.getElementById("view3dBtn");
    const viewGridBtn = document.getElementById("viewGridBtn");
    const canvas3d = document.getElementById("canvas3dContainer");
    const gridView = document.getElementById("gridContainer");

    view3dBtn.addEventListener("click", () => {
        view3dBtn.classList.add("active");
        viewGridBtn.classList.remove("active");
        canvas3d.classList.add("active");
        gridView.classList.remove("active");
    });

    viewGridBtn.addEventListener("click", () => {
        viewGridBtn.classList.add("active");
        view3dBtn.classList.remove("active");
        gridView.classList.add("active");
        canvas3d.classList.remove("active");
    });

    document.getElementById("closeModal").addEventListener("click", closeModal);
}

function applyFilters() {
    const maxPrice = Number(document.getElementById("priceRange").value);
    const status = document.getElementById("statusFilter").value;
    const rooms = document.getElementById("roomsFilter").value;

    const filtered = unitsData.filter(unit => {
        const matchesPrice = unit.price <= maxPrice;
        const matchesStatus = status === "all" || unit.status === status;
        const matchesRooms = rooms === "all" || unit.rooms.toString() === rooms;
        return matchesPrice && matchesStatus && matchesRooms;
    });

    renderGridView(filtered);
    update3DVisibility(filtered);
}

function updateStats() {
    document.getElementById("availableCount").textContent = unitsData.filter(u => u.status === "available").length;
    document.getElementById("reservedCount").textContent = unitsData.filter(u => u.status === "reserved").length;
    document.getElementById("soldCount").textContent = unitsData.filter(u => u.status === "sold").length;
}

// Render Grid
function renderGridView(data) {
    const grid = document.getElementById("gridContainer");
    grid.innerHTML = "";

    data.forEach(unit => {
        const card = document.createElement("div");
        card.className = "unit-card";
        card.innerHTML = `
            <span class="card-status status-${unit.status}">${getArabicStatus(unit.status)}</span>
            <h3 style="margin-top:15px; margin-bottom:10px;">${unit.name}</h3>
            <p style="color:var(--text-muted); font-size:13px;"><i class="fa-solid fa-ruler-combined"></i> المساحة: ${unit.area} م²</p>
            <p style="color:var(--text-muted); font-size:13px;"><i class="fa-solid fa-bed"></i> الغرف: ${unit.rooms}</p>
            <h4 style="color:var(--accent-gold); margin-top:15px;">${unit.price.toLocaleString()} ج.م</h4>
        `;
        card.addEventListener("click", () => openModal(unit));
        grid.appendChild(card);
    });
}

// Three.js Interactive 3D Setup
function init3DScene() {
    const container = document.getElementById("canvas3dContainer");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(8, 8, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Build 3D Unit Blocks
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    unitsData.forEach(unit => {
        const geometry = new THREE.BoxGeometry(2, 1.2, 2);
        let color = unit.status === "available" ? 0x10b981 : (unit.status === "reserved" ? 0xf59e0b : 0xef4444);
        
        const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.2 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(unit.x, unit.y, unit.z);
        mesh.userData = unit;

        scene.add(mesh);
        meshes.push(mesh);
    });

    // Raycasting Click Listener
    container.addEventListener("click", on3DClick);

    // Basic Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();
}

function on3DClick(event) {
    const container = document.getElementById("canvas3dContainer");
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
        const selectedUnit = intersects[0].object.userData;
        openModal(selectedUnit);
    }
}

function update3DVisibility(filteredData) {
    const ids = filteredData.map(u => u.id);
    meshes.forEach(mesh => {
        mesh.visible = ids.includes(mesh.userData.id);
    });
}

// Modal Helpers
function openModal(unit) {
    document.getElementById("modalTitle").textContent = unit.name;
    document.getElementById("modalArea").textContent = `${unit.area} م²`;
    document.getElementById("modalBedrooms").textContent = `${unit.rooms} غرف`;
    document.getElementById("modalPrice").textContent = `${unit.price.toLocaleString()} ج.م`;
    
    const badge = document.getElementById("modalBadge");
    badge.textContent = getArabicStatus(unit.status);
    badge.className = `badge status-${unit.status}`;

    document.getElementById("unitModal").classList.add("open");
}

function closeModal() {
    document.getElementById("unitModal").classList.remove("open");
}

function getArabicStatus(status) {
    switch (status) {
        case "available": return "متاح للبيع";
        case "reserved": return "محجوز";
        case "sold": return "مباع";
        default: return "";
    }
}