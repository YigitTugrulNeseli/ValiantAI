const CURRENT_SCHEMA_VERSION = 14;
const STORAGE_KEY = `valiant-flow-state-v${CURRENT_SCHEMA_VERSION}`;
const LEGACY_STORAGE_KEYS = ["valiant-flow-state-v13"];
const NODE_HEIGHT = 104;
const COLUMN_GAP = 286;
const ROW_GAP = 118;
const X_PADDING = 58;
const Y_PADDING = 54;
const PROJECT_FRAME_PADDING = 50;
const PROJECT_ISLAND_WIDTH = 760;
const PROJECT_ISLAND_HEIGHT = 560;
const WORKSPACE_ZOOM = 0.48;
const MIN_ZOOM = 0.22;
const MAX_ZOOM = 1.9;
const SIDEBAR_MIN_WIDTH = 176;
const SIDEBAR_MAX_WIDTH = 340;
const DRAG_THRESHOLD = 4;
const PAN_THRESHOLD = 4;
const SVG_NS = "http://www.w3.org/2000/svg";

const statusLabels = {
  backlog: "Backlog",
  active: "Active",
  review: "Review",
  done: "Done",
  blocked: "Blocked"
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

const projectTemplates = {
  build: {
    label: "Build Sprint",
    title: "Build Sprint",
    category: "Build",
    tone: "rose",
    detail: "A compact build loop with planning, making, review, and release steps.",
    steps: [
      ["Scope", "active", "high", "Today"],
      ["Build", "backlog", "high", "Tomorrow"],
      ["Review", "backlog", "medium", "After build"],
      ["Ship", "backlog", "medium", "This week"]
    ]
  },
  writing: {
    label: "Writing Flow",
    title: "Writing Flow",
    category: "Writing",
    tone: "blue",
    detail: "A writing island for turning an idea into a structured draft.",
    steps: [
      ["Outline", "active", "high", "Today"],
      ["Research", "backlog", "medium", "Tomorrow"],
      ["Draft", "backlog", "high", "This week"],
      ["Edit", "backlog", "medium", "After draft"]
    ]
  },
  research: {
    label: "Research Map",
    title: "Research Map",
    category: "Research",
    tone: "green",
    detail: "A research map for collecting sources, notes, patterns, and decisions.",
    steps: [
      ["Questions", "active", "high", "Today"],
      ["Sources", "backlog", "medium", "Tomorrow"],
      ["Synthesis", "backlog", "high", "This week"],
      ["Decision", "backlog", "medium", "After synthesis"]
    ]
  },
  launch: {
    label: "Launch Plan",
    title: "Launch Plan",
    category: "Launch",
    tone: "amber",
    detail: "A launch island for positioning, assets, publishing, and follow-up.",
    steps: [
      ["Positioning", "active", "high", "Today"],
      ["Assets", "backlog", "high", "Tomorrow"],
      ["Publish", "backlog", "critical", "Launch day"],
      ["Follow-up", "backlog", "medium", "After launch"]
    ]
  },
  blank: {
    label: "Blank Island",
    title: "Blank Island",
    category: "General",
    tone: "iris",
    detail: "A quiet blank island ready for a new branch of work.",
    steps: [
      ["First Step", "backlog", "medium", "Today"]
    ]
  }
};

const projectTones = new Set(["blue", "green", "amber", "rose", "iris"]);

const els = {
  flowApp: document.querySelector(".flow-app"),
  sidePanel: document.querySelector(".side-panel"),
  sideResizeHandle: document.querySelector("#side-resize-handle"),
  inspectorPanel: document.querySelector(".inspector-panel"),
  inspectorHeader: document.querySelector(".inspector-header"),
  projectTitle: document.querySelector("#project-title"),
  searchInput: document.querySelector("#search-input"),
  projectSearch: document.querySelector("#project-search"),
  projectTemplate: document.querySelector("#project-template"),
  createProjectTemplate: document.querySelector("#create-project-template"),
  fitWorkspace: document.querySelector("#fit-workspace"),
  workspaceCount: document.querySelector("#workspace-count"),
  workspaceActiveTitle: document.querySelector("#workspace-active-title"),
  metricTotal: document.querySelector("#metric-total"),
  metricDone: document.querySelector("#metric-done"),
  metricActive: document.querySelector("#metric-active"),
  saveState: document.querySelector("#save-state"),
  themeToggle: document.querySelector("#theme-toggle"),
  newProject: document.querySelector("#new-project"),
  workspaceToggle: document.querySelector("#workspace-toggle"),
  toggleSidebar: document.querySelector("#toggle-sidebar"),
  addChild: document.querySelector("#add-child"),
  undoAction: document.querySelector("#undo-action"),
  redoAction: document.querySelector("#redo-action"),
  exportState: document.querySelector("#export-state"),
  importState: document.querySelector("#import-state"),
  importStateInput: document.querySelector("#import-state-input"),
  focusNode: document.querySelector("#focus-node"),
  showAll: document.querySelector("#show-all"),
  resetLayout: document.querySelector("#reset-layout"),
  resetFlow: document.querySelector("#reset-flow"),
  focusLabel: document.querySelector("#focus-label"),
  canvasTitle: document.querySelector("#canvas-title"),
  zoomOut: document.querySelector("#zoom-out"),
  zoomIn: document.querySelector("#zoom-in"),
  fitView: document.querySelector("#fit-view"),
  zoomReadout: document.querySelector("#zoom-readout"),
  mapScroll: document.querySelector("#map-scroll"),
  stageScaler: document.querySelector("#stage-scaler"),
  mapStage: document.querySelector("#map-stage"),
  projectFrame: document.querySelector("#project-frame"),
  projectChip: document.querySelector("#project-chip"),
  workspaceLayer: document.querySelector("#workspace-layer"),
  workspaceMinimap: document.querySelector("#workspace-minimap"),
  minimapCanvas: document.querySelector("#minimap-canvas"),
  minimapFit: document.querySelector("#minimap-fit"),
  connectorLayer: document.querySelector("#connector-layer"),
  edgeActionLayer: document.querySelector("#edge-action-layer"),
  nodeLayer: document.querySelector("#node-layer"),
  selectedHeading: document.querySelector("#selected-heading"),
  nodeTitle: document.querySelector("#node-title"),
  nodeDetail: document.querySelector("#node-detail"),
  nodeStatus: document.querySelector("#node-status"),
  nodePriority: document.querySelector("#node-priority"),
  nodeOwner: document.querySelector("#node-owner"),
  nodeDue: document.querySelector("#node-due"),
  closeInspector: document.querySelector("#close-inspector"),
  inspectorAdd: document.querySelector("#inspector-add"),
  duplicateNode: document.querySelector("#duplicate-node"),
  deleteNode: document.querySelector("#delete-node"),
  childCount: document.querySelector("#child-count"),
  childList: document.querySelector("#child-list"),
  appToast: document.querySelector("#app-toast")
};

let state = loadState();
let zoom = clamp(Number(state.zoom) || 1, MIN_ZOOM, MAX_ZOOM);
let selectedId = state.selectedId && state.nodes[state.selectedId] ? state.selectedId : null;
let focusedRootId = state.focusedRootId && state.nodes[state.focusedRootId] ? state.focusedRootId : null;
let currentLayout = null;
let currentLayoutProjectId = null;
let saveTimer = null;
let inspectorPositionFrame = null;
let interaction = null;
let transitionTimer = null;
let minimapMeta = null;
let undoStack = [];
let redoStack = [];
let lastPersistedSnapshot = "";
let toastTimer = null;

wireEvents();
lastPersistedSnapshot = serializeState();
render();
if (state.migratedFrom) {
  const migratedKey = state.migratedFrom;
  state.migratedFrom = null;
  persist({ history: false });
  showToast(`Workspace migrated from ${migratedKey}`);
}
requestAnimationFrame(() => scrollToNode(selectedId || state.rootId, true, "auto"));

function wireEvents() {
  els.projectTitle.addEventListener("input", () => {
    state.projectTitle = els.projectTitle.value || "Untitled Flow";
    els.canvasTitle.textContent = state.projectTitle;
    persist();
  });

  els.searchInput.addEventListener("input", () => {
    renderMap();
  });

  els.projectSearch.addEventListener("input", () => {
    renderWorkspaceSummary();
    renderMap();
  });

  els.themeToggle.addEventListener("click", toggleTheme);
  els.sideResizeHandle.addEventListener("pointerdown", beginSidebarResize);
  document.querySelectorAll(".panel-accordion").forEach((section) => {
    section.addEventListener("toggle", () => {
      state.openPanels = state.openPanels || {};
      state.openPanels[section.dataset.panel] = section.open;
      persist({ history: false });
    });
  });
  els.newProject.addEventListener("click", () => createProjectIsland());
  els.createProjectTemplate.addEventListener("click", () => createProjectIsland());
  els.undoAction.addEventListener("click", undoChange);
  els.redoAction.addEventListener("click", redoChange);
  els.exportState.addEventListener("click", exportWorkspaceState);
  els.importState.addEventListener("click", () => els.importStateInput.click());
  els.importStateInput.addEventListener("change", importWorkspaceState);
  els.fitWorkspace.addEventListener("click", fitWorkspace);
  els.minimapFit.addEventListener("click", fitWorkspace);
  els.workspaceToggle.addEventListener("click", toggleWorkspaceMode);
  els.toggleSidebar.addEventListener("click", toggleSidebar);
  els.projectChip.addEventListener("click", (event) => {
    event.stopPropagation();
    openProject(state.activeProjectId);
  });

  els.addChild.addEventListener("click", () => addChild(selectedId || state.rootId));
  els.inspectorAdd.addEventListener("click", () => addChild(selectedId));

  els.focusNode.addEventListener("click", () => {
    if (!selectedId) {
      return;
    }

    focusedRootId = selectedId === state.rootId ? null : selectedId;
    state.focusedRootId = focusedRootId;
    persist();
    render();
    requestAnimationFrame(() => scrollToNode(selectedId || state.rootId, true));
  });

  els.showAll.addEventListener("click", () => {
    focusedRootId = null;
    state.focusedRootId = null;
    persist();
    render();
    requestAnimationFrame(() => scrollToNode(selectedId || state.rootId, true));
  });

  els.resetLayout.addEventListener("click", () => {
    Object.values(state.nodes).forEach((item) => {
      item.x = null;
      item.y = null;
    });
    persist();
    render();
    requestAnimationFrame(() => scrollToNode(selectedId || state.rootId, true));
  });

  els.resetFlow.addEventListener("click", () => {
    if (!window.confirm("Reset the flow to the premium starter map?")) {
      return;
    }

    state = createDefaultState();
    selectedId = null;
    focusedRootId = null;
    zoom = 1;
    persist();
    render();
    requestAnimationFrame(() => scrollToNode(state.rootId, true));
  });

  els.zoomOut.addEventListener("click", () => setZoom(zoom - 0.1));
  els.zoomIn.addEventListener("click", () => setZoom(zoom + 0.1));
  els.fitView.addEventListener("click", fitView);
  els.closeInspector.addEventListener("click", clearSelection);
  els.inspectorPanel.addEventListener("pointerdown", beginInspectorDrag);

  els.mapScroll.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (event.button !== 0 || target.closest?.(".flow-node") || target.closest?.(".link-port") || target.closest?.(".edge-delete") || target.closest?.(".project-chip") || target.closest?.(".workspace-project") || target.closest?.(".workspace-minimap")) {
      return;
    }

    beginCanvasPan(event);
  });

  els.mapScroll.addEventListener("wheel", handleCanvasWheel, { passive: false });
  els.mapScroll.addEventListener("scroll", () => {
    window.cancelAnimationFrame(inspectorPositionFrame);
    inspectorPositionFrame = window.requestAnimationFrame(() => {
      positionInspectorPanel();
      renderMinimapViewport();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearSelection();
    }
  });

  [
    els.nodeTitle,
    els.nodeDetail,
    els.nodeOwner,
    els.nodeDue
  ].forEach((input) => input.addEventListener("input", updateSelectedFromInspector));

  [
    els.nodeStatus,
    els.nodePriority
  ].forEach((input) => input.addEventListener("change", updateSelectedFromInspector));

  els.duplicateNode.addEventListener("click", duplicateSelected);
  els.deleteNode.addEventListener("click", deleteSelected);
}

function loadState() {
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        continue;
      }

      const saved = JSON.parse(raw);

      if (saved?.projects?.length || (saved?.rootId && saved?.nodes?.[saved.rootId])) {
        const nextState = normalizeLoadedState(saved);
        nextState.migratedFrom = key === STORAGE_KEY ? null : key;
        return nextState;
      }
    } catch {
      localStorage.removeItem(key);
    }
  }

  return createDefaultState();
}

function normalizeLoadedState(saved) {
  const projects = Array.isArray(saved.projects) && saved.projects.length
    ? saved.projects.map(normalizeProject).filter(Boolean)
    : [normalizeProject({
        id: "project-thesis",
        title: saved.projectTitle,
        rootId: saved.rootId,
        selectedId: saved.selectedId,
        focusedRootId: saved.focusedRootId,
        x: 88,
        y: 88,
        frameWidth: PROJECT_ISLAND_WIDTH,
        frameHeight: PROJECT_ISLAND_HEIGHT,
        nodes: saved.nodes
      })].filter(Boolean);

  if (!projects.length) {
    return createDefaultState();
  }

  const activeProjectId = projects.some((project) => project.id === saved.activeProjectId)
    ? saved.activeProjectId
    : projects[0].id;
  const nextState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activeProjectId,
    projects,
    selectedProjectId: projects.some((project) => project.id === saved.selectedProjectId) ? saved.selectedProjectId : activeProjectId,
    lastOpenedProjectId: projects.some((project) => project.id === saved.lastOpenedProjectId) ? saved.lastOpenedProjectId : activeProjectId,
    pinnedProjectIds: Array.isArray(saved.pinnedProjectIds) ? saved.pinnedProjectIds.filter((id) => projects.some((project) => project.id === id)) : [],
    projectOpen: saved.projectOpen !== false,
    theme: saved.theme === "dark" ? "dark" : "light",
    sidebarOpen: saved.sidebarOpen !== false,
    sidebarWidth: clamp(Number(saved.sidebarWidth) || 208, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH),
    openPanels: normalizeOpenPanels(saved.openPanels),
    zoom: saved.zoom || 1
  };

  return hydrateActiveProject(nextState);
}

function normalizeProject(savedProject) {
  if (!savedProject?.rootId || !savedProject?.nodes?.[savedProject.rootId]) {
    return null;
  }

  const nodes = {};

  Object.values(savedProject.nodes).forEach((node) => {
    nodes[node.id] = {
      id: node.id,
      parentId: node.parentId || null,
      title: node.title || "Untitled Node",
      detail: node.detail || "",
      status: statusLabels[node.status] ? node.status : "backlog",
      priority: priorityLabels[node.priority] ? node.priority : "medium",
      owner: node.owner || "",
      due: node.due || "",
      x: Number.isFinite(node.x) ? node.x : null,
      y: Number.isFinite(node.y) ? node.y : null,
      parentAnchor: normalizeAnchor(node.parentAnchor, "right"),
      inputAnchor: normalizeAnchor(node.inputAnchor, "left"),
      collapsed: Boolean(node.collapsed),
      children: Array.isArray(node.children) ? node.children.filter((id) => savedProject.nodes[id]) : []
    };
  });

  return {
    id: savedProject.id || createId("project"),
    title: savedProject.title || savedProject.projectTitle || nodes[savedProject.rootId]?.title || "Untitled Flow",
    rootId: savedProject.rootId,
    selectedId: savedProject.selectedId && nodes[savedProject.selectedId] ? savedProject.selectedId : null,
    focusedRootId: savedProject.focusedRootId && nodes[savedProject.focusedRootId] ? savedProject.focusedRootId : null,
    x: Number.isFinite(savedProject.x) ? savedProject.x : 88,
    y: Number.isFinite(savedProject.y) ? savedProject.y : 88,
    frameWidth: Number.isFinite(savedProject.frameWidth) ? savedProject.frameWidth : PROJECT_ISLAND_WIDTH,
    frameHeight: Number.isFinite(savedProject.frameHeight) ? savedProject.frameHeight : PROJECT_ISLAND_HEIGHT,
    category: savedProject.category || inferProjectCategory(savedProject.title || nodes[savedProject.rootId]?.title),
    tone: projectTones.has(savedProject.tone) ? savedProject.tone : inferProjectTone(savedProject.category || savedProject.title),
    templateKey: projectTemplates[savedProject.templateKey] ? savedProject.templateKey : "build",
    inspectorX: Number.isFinite(savedProject.inspectorX) ? savedProject.inspectorX : null,
    inspectorY: Number.isFinite(savedProject.inspectorY) ? savedProject.inspectorY : null,
    nodes
  };
}

function createDefaultState() {
  const thesisProject = createThesisProject({
    id: "project-thesis",
    x: 88,
    y: 88
  });
  const sideProject = createStarterProject({
    id: "project-side-build",
    title: "Valiant Flow Polish",
    x: 980,
    y: 140
  });
  const nextState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activeProjectId: thesisProject.id,
    projects: [thesisProject, sideProject],
    selectedProjectId: thesisProject.id,
    lastOpenedProjectId: thesisProject.id,
    pinnedProjectIds: [],
    selectedId: null,
    focusedRootId: null,
    theme: "light",
    sidebarOpen: false,
    sidebarWidth: 208,
    openPanels: {
      project: true,
      workspace: true,
      actions: true,
      legend: false
    },
    projectOpen: true,
    zoom: 1
  };

  return hydrateActiveProject(nextState);
}

function createThesisProject({ id, x, y }) {
  const nodes = {
    root: node("root", null, "Thesis Writing", {
      detail: "A clean writing sequence that keeps the main steps visible while each step can open into focused sub-work.",
      status: "active",
      priority: "critical",
      owner: "Yigit",
      due: "This week",
      children: ["thema", "literature", "introduction", "writing", "presenting"]
    }),
    thema: node("thema", "root", "Thema", {
      detail: "Pick the thesis theme, narrow the question, and define the first research direction.",
      status: "active",
      priority: "high",
      owner: "Yigit",
      due: "Day 1",
      children: ["theme-finding"]
    }),
    "theme-finding": node("theme-finding", "thema", "Theme Finding", {
      detail: "Collect possible topics, compare scope, and choose the strongest direction.",
      status: "active",
      priority: "high",
      owner: "Yigit",
      due: "Day 1"
    }),
    literature: node("literature", "root", "Literature", {
      detail: "Open this step to plan the research, finding, reading, and summarizing work.",
      status: "review",
      priority: "high",
      owner: "Yigit",
      due: "Day 2",
      collapsed: true,
      children: ["literature-research", "literature-finding", "literature-reading", "literature-summary"]
    }),
    "literature-research": node("literature-research", "literature", "Literature Research", {
      detail: "Search databases, papers, books, and reliable sources connected to the topic.",
      status: "active",
      priority: "medium",
      owner: "Yigit",
      due: "Day 2"
    }),
    "literature-finding": node("literature-finding", "literature", "Literature Finding", {
      detail: "Save useful references and decide which sources belong in the thesis.",
      status: "active",
      priority: "medium",
      owner: "Yigit",
      due: "Day 2"
    }),
    "literature-reading": node("literature-reading", "literature", "Literature Reading", {
      detail: "Read selected sources and mark the arguments, methods, and useful quotes.",
      status: "backlog",
      priority: "medium",
      owner: "Yigit",
      due: "Day 3"
    }),
    "literature-summary": node("literature-summary", "literature", "Literature Summarizing", {
      detail: "Turn notes into summaries that can be reused in the writing phase.",
      status: "backlog",
      priority: "medium",
      owner: "Yigit",
      due: "Day 3"
    }),
    introduction: node("introduction", "root", "Introduction", {
      detail: "Write the opening chapter: problem, relevance, question, and structure.",
      status: "backlog",
      priority: "high",
      owner: "Yigit",
      due: "Day 4"
    }),
    writing: node("writing", "root", "Writing", {
      detail: "Draft, revise, and connect chapters into a coherent thesis.",
      status: "backlog",
      priority: "high",
      owner: "Yigit",
      due: "Day 5"
    }),
    presenting: node("presenting", "root", "Presenting", {
      detail: "Prepare the final presentation and practice the key argument.",
      status: "backlog",
      priority: "high",
      owner: "Yigit",
      due: "Day 6"
    })
  };

  return {
    id,
    title: "Thesis Writing",
    category: "Writing",
    tone: "blue",
    templateKey: "writing",
    rootId: "root",
    selectedId: null,
    focusedRootId: null,
    x,
    y,
    frameWidth: PROJECT_ISLAND_WIDTH,
    frameHeight: PROJECT_ISLAND_HEIGHT,
    nodes
  };
}

function createStarterProject({ id, title, x, y }) {
  return createTemplateProject({ id, title, x, y, templateKey: "build" });
}

function createTemplateProject({ id, title, x, y, templateKey = "build" }) {
  const template = projectTemplates[templateKey] || projectTemplates.build;
  const rootId = `${id}-root`;
  const childIds = template.steps.map(([stepTitle], index) => `${id}-${slugify(stepTitle)}-${index + 1}`);
  const nodes = {
    [rootId]: node(rootId, null, title || template.title, {
      detail: template.detail,
      status: "active",
      priority: "high",
      owner: "Yigit",
      due: "This week",
      children: childIds
    })
  };

  template.steps.forEach(([stepTitle, status, priority, due], index) => {
    const childId = childIds[index];
    nodes[childId] = node(childId, rootId, stepTitle, {
      detail: `Move this ${template.category.toLowerCase()} step forward, then split it when the work becomes clearer.`,
      status,
      priority,
      owner: "Yigit",
      due
    });
  });

  return {
    id,
    title: title || template.title,
    category: template.category,
    tone: template.tone,
    templateKey,
    rootId,
    selectedId: null,
    focusedRootId: null,
    x,
    y,
    frameWidth: PROJECT_ISLAND_WIDTH,
    frameHeight: PROJECT_ISLAND_HEIGHT,
    nodes
  };
}

function getActiveProject() {
  return state.projects?.find((project) => project.id === state.activeProjectId) || state.projects?.[0] || null;
}

function hydrateActiveProject(nextState = state) {
  const project = nextState.projects?.find((item) => item.id === nextState.activeProjectId) || nextState.projects?.[0];

  if (!project) {
    return nextState;
  }

  nextState.activeProjectId = project.id;
  nextState.selectedProjectId = nextState.projects?.some((item) => item.id === nextState.selectedProjectId)
    ? nextState.selectedProjectId
    : project.id;
  nextState.lastOpenedProjectId = nextState.projects?.some((item) => item.id === nextState.lastOpenedProjectId)
    ? nextState.lastOpenedProjectId
    : project.id;
  nextState.pinnedProjectIds = Array.isArray(nextState.pinnedProjectIds)
    ? nextState.pinnedProjectIds.filter((id) => nextState.projects.some((item) => item.id === id))
    : [];
  nextState.projectTitle = project.title;
  nextState.rootId = project.rootId;
  nextState.nodes = project.nodes;
  nextState.selectedId = project.selectedId && project.nodes[project.selectedId] ? project.selectedId : null;
  nextState.focusedRootId = project.focusedRootId && project.nodes[project.focusedRootId] ? project.focusedRootId : null;
  return nextState;
}

function saveActiveProject() {
  const project = getActiveProject();

  if (!project) {
    return;
  }

  project.title = state.projectTitle || project.title || "Untitled Flow";
  project.rootId = state.rootId;
  project.nodes = state.nodes;
  project.selectedId = selectedId && state.nodes[selectedId] ? selectedId : null;
  project.focusedRootId = focusedRootId && state.nodes[focusedRootId] ? focusedRootId : null;
  project.category = project.category || inferProjectCategory(project.title);
  project.tone = projectTones.has(project.tone) ? project.tone : inferProjectTone(project.category);

  if (currentLayout && currentLayoutProjectId === project.id) {
    const frame = getProjectFrame(currentLayout);
    project.frameWidth = frame.width;
    project.frameHeight = frame.height;
  }
}

function getActiveProjectOffset() {
  const project = getActiveProject();
  return {
    x: Number.isFinite(project?.x) ? project.x : 88,
    y: Number.isFinite(project?.y) ? project.y : 88
  };
}

function node(id, parentId, title, options = {}) {
  return {
    id,
    parentId,
    title,
    detail: options.detail || "",
    status: options.status || "backlog",
    priority: options.priority || "medium",
    owner: options.owner || "",
    due: options.due || "",
    x: Number.isFinite(options.x) ? options.x : null,
    y: Number.isFinite(options.y) ? options.y : null,
    parentAnchor: normalizeAnchor(options.parentAnchor, "right"),
    inputAnchor: normalizeAnchor(options.inputAnchor, "left"),
    collapsed: Boolean(options.collapsed),
    children: options.children || []
  };
}

function render() {
  ensureValidSelection();
  if (!interaction || (interaction.type !== "link" && interaction.type !== "rewire")) {
    els.flowApp.classList.remove("linking");
  }
  applyTheme();
  applySidebarState();
  applyPanelState();
  applyWorkspaceState();
  els.projectTitle.value = state.projectTitle;
  els.canvasTitle.textContent = state.projectTitle;
  renderMetrics();
  renderWorkspaceSummary();
  renderInspector();
  renderMap();
  updateHistoryButtons();
}

function renderMetrics() {
  const nodes = Object.values(state.nodes);
  const total = nodes.length;
  const done = nodes.filter((item) => item.status === "done").length;
  const active = nodes.filter((item) => item.status === "active" || item.status === "review").length;
  const donePercent = total ? Math.round((done / total) * 100) : 0;

  els.metricTotal.textContent = String(total);
  els.metricDone.textContent = `${donePercent}%`;
  els.metricActive.textContent = String(active);
}

function renderWorkspaceSummary() {
  const count = state.projects?.length || 0;
  const query = getProjectSearchQuery();
  const visibleCount = query ? state.projects.filter((project) => matchesProjectSearch(project, query)).length : count;
  const activeProject = getActiveProject();
  els.workspaceCount.textContent = query
    ? `${visibleCount}/${count} islands`
    : `${count} ${count === 1 ? "island" : "islands"}`;
  els.workspaceActiveTitle.textContent = activeProject?.title || "Workspace";
}

function renderInspector() {
  const hasSelection = isProjectOpen() && Boolean(selectedId && state.nodes[selectedId]);
  els.flowApp.classList.toggle("inspector-closed", !hasSelection);
  els.inspectorPanel.setAttribute("aria-hidden", String(!hasSelection));

  if (!hasSelection) {
    els.focusNode.disabled = true;
    els.inspectorAdd.disabled = true;
    els.duplicateNode.disabled = true;
    els.deleteNode.disabled = true;
    return;
  }

  const selected = state.nodes[selectedId];
  els.selectedHeading.textContent = selected.title;
  els.nodeTitle.value = selected.title;
  els.nodeDetail.value = selected.detail;
  els.nodeStatus.value = selected.status;
  els.nodePriority.value = selected.priority;
  els.nodeOwner.value = selected.owner;
  els.nodeDue.value = selected.due;
  els.focusNode.disabled = false;
  els.inspectorAdd.disabled = false;
  els.duplicateNode.disabled = selectedId === state.rootId;
  els.deleteNode.disabled = selectedId === state.rootId;
  renderChildList(selected);
}

function renderChildList(selected) {
  const children = selected.children.map((id) => state.nodes[id]).filter(Boolean);
  els.childCount.textContent = String(children.length);

  if (!children.length) {
    els.childList.innerHTML = `<div class="empty-children">No child nodes</div>`;
    return;
  }

  els.childList.innerHTML = children.map((child) => `
    <button class="child-item" type="button" data-id="${escapeHtml(child.id)}">
      <span class="legend-dot status-${escapeHtml(child.status)}"></span>
      <span>
        <strong>${escapeHtml(child.title)}</strong>
        <span>${escapeHtml(statusLabels[child.status])} / ${escapeHtml(priorityLabels[child.priority])}</span>
      </span>
      <svg aria-hidden="true"><use href="#icon-chevron"></use></svg>
    </button>
  `).join("");

  els.childList.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => selectNode(button.dataset.id, true));
  });
}

function renderMap() {
  const rootId = getVisibleRootId();
  const layout = buildLayout(rootId);
  extendLayoutForWorkspace(layout);
  currentLayout = layout;
  currentLayoutProjectId = state.activeProjectId;
  const query = els.searchInput.value.trim().toLowerCase();

  els.focusLabel.textContent = !isProjectOpen()
    ? "Workspace overview"
    : focusedRootId ? `Focus / ${state.nodes[focusedRootId].title}` : "Full tree";
  els.canvasTitle.textContent = isProjectOpen() ? state.projectTitle : "Workspace Islands";
  els.stageScaler.style.width = `${layout.width * zoom}px`;
  els.stageScaler.style.height = `${layout.height * zoom}px`;
  els.mapStage.style.width = `${layout.width}px`;
  els.mapStage.style.height = `${layout.height}px`;
  els.mapStage.style.transform = `scale(${zoom})`;
  renderProjectFrame(layout);
  renderWorkspaceIslands(layout);
  renderMinimap(layout);
  positionInspectorPanel(layout);
  els.connectorLayer.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  els.connectorLayer.setAttribute("width", String(layout.width));
  els.connectorLayer.setAttribute("height", String(layout.height));
  els.nodeLayer.innerHTML = "";
  renderConnections();

  layout.ids.forEach((id) => {
    const item = state.nodes[id];
    const position = layout.positions[id];
    const progress = getCompletionPercent(id);
    const isMatch = query && `${item.title} ${item.detail} ${item.owner}`.toLowerCase().includes(query);
    const nodeEl = document.createElement("article");

    nodeEl.className = [
      "flow-node",
      `status-${item.status}`,
      selectedId === id ? "selected" : "",
      item.collapsed ? "collapsed" : "",
      isMatch ? "match" : ""
    ].filter(Boolean).join(" ");
    nodeEl.dataset.id = id;
    nodeEl.style.left = `${position.x}px`;
    nodeEl.style.top = `${position.y}px`;
    nodeEl.innerHTML = nodeTemplate(item, progress);
    nodeEl.addEventListener("pointerdown", (event) => beginNodeDrag(event, id, nodeEl));

    nodeEl.querySelectorAll(".link-port").forEach((port) => {
      port.addEventListener("pointerdown", (event) => {
        if (event.altKey && state.nodes[id]?.parentId) {
          beginRewireDrag(event, id, port);
          return;
        }

        beginLinkDrag(event, id, port);
      });
    });

    const toggle = nodeEl.querySelector(".child-toggle");
    if (toggle) {
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        item.collapsed = !item.collapsed;
        persist();
        renderMap();
        if (selectedId) {
          renderChildList(state.nodes[selectedId]);
        }
      });
    }

    els.nodeLayer.append(nodeEl);
  });

  updateZoomReadout();
}

function renderConnections() {
  if (!currentLayout) {
    return;
  }

  els.connectorLayer.innerHTML = "";
  els.edgeActionLayer.innerHTML = "";

  currentLayout.connections.forEach(({ parentId, childId }) => {
    const parent = currentLayout.positions[parentId];
    const child = currentLayout.positions[childId];
    const childNode = state.nodes[childId];

    if (!parent || !child || !childNode) {
      return;
    }

    const parentAnchor = normalizeAnchor(childNode.parentAnchor, "right");
    const inputAnchor = normalizeAnchor(childNode.inputAnchor, "left");
    const start = getNodeAnchorPoint(parent, parentAnchor);
    const end = getNodeAnchorPoint(child, inputAnchor);
    const path = createConnectorPath({
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
      startAnchor: parentAnchor,
      endAnchor: inputAnchor,
      className: `connector-path status-${childNode.status}`
    });
    els.connectorLayer.append(path);
    renderEdgeAction(parentId, childId, start.x, start.y, end.x, end.y);
  });

  if (interaction?.type === "link" || interaction?.type === "rewire") {
    const anchor = interaction.type === "link"
      ? currentLayout.positions[interaction.sourceId]
      : currentLayout.positions[interaction.childId];
    if (anchor) {
      const anchorName = interaction.type === "link"
        ? normalizeAnchor(interaction.sourceAnchor, "right")
        : normalizeAnchor(interaction.childInputAnchor, "left");
      const start = getNodeAnchorPoint(anchor, anchorName);
      const path = createConnectorPath({
        startX: start.x,
        startY: start.y,
        endX: interaction.pointer.x,
        endY: interaction.pointer.y,
        startAnchor: anchorName,
        endAnchor: interaction.validTargetAnchor || "left",
        className: `connector-path connector-preview ${interaction.validTargetId ? "valid" : ""}`
      });
      els.connectorLayer.append(path);
    }
  }
}

function renderProjectFrame(layout) {
  const frame = getProjectFrame(layout);

  els.projectFrame.style.left = `${frame.x}px`;
  els.projectFrame.style.top = `${frame.y}px`;
  els.projectFrame.style.width = `${frame.width}px`;
  els.projectFrame.style.height = `${frame.height}px`;
  els.projectChip.textContent = getActiveProject()?.title || state.projectTitle || "Untitled Flow";
  els.projectChip.setAttribute("aria-label", `Open ${getActiveProject()?.title || state.projectTitle || "Untitled Flow"}`);
}

function renderWorkspaceIslands(layout) {
  els.workspaceLayer.innerHTML = "";

  if (isProjectOpen()) {
    return;
  }

  const query = getProjectSearchQuery();
  const visibleProjects = state.projects.filter((project) => matchesProjectSearch(project, query));
  renderWorkspaceGroups(layout, visibleProjects);

  visibleProjects.slice().sort(compareWorkspaceProjects).forEach((project) => {
    const frame = getWorkspaceProjectFrame(project, layout);
    const islandFrame = getOverviewIslandFrame(frame);
    const stats = getProjectStats(project);
    const island = document.createElement("div");
    const button = document.createElement("button");

    island.className = [
      "workspace-project",
      `tone-${projectTones.has(project.tone) ? project.tone : "blue"}`,
      project.id === state.activeProjectId ? "active" : "",
      project.id === state.selectedProjectId ? "selected" : "",
      project.id === state.lastOpenedProjectId ? "last-opened" : "",
      isProjectPinned(project.id) ? "pinned" : "",
      query ? "search-match" : ""
    ].filter(Boolean).join(" ");
    island.style.left = `${islandFrame.x}px`;
    island.style.top = `${islandFrame.y}px`;
    island.style.width = `${islandFrame.width}px`;
    island.style.height = `${islandFrame.height}px`;
    island.dataset.projectId = project.id;
    island.addEventListener("pointerdown", (event) => beginProjectDrag(event, project.id, island));

    button.className = "workspace-project-button";
    button.type = "button";
    button.innerHTML = workspaceProjectTemplate(project, stats);
    button.setAttribute("aria-label", `Open ${project.title}`);
    const pinButton = document.createElement("button");
    const pinned = isProjectPinned(project.id);
    pinButton.className = "workspace-project-pin";
    pinButton.type = "button";
    pinButton.title = pinned ? "Unpin island" : "Pin island";
    pinButton.setAttribute("aria-label", pinned ? "Unpin island" : "Pin island");
    pinButton.innerHTML = `<svg aria-hidden="true"><use href="#icon-pin"></use></svg>`;
    pinButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleProjectPin(project.id);
    });

    island.append(pinButton);
    island.append(button);
    els.workspaceLayer.append(island);
  });

  if (!visibleProjects.length) {
    const empty = document.createElement("div");
    empty.className = "workspace-empty";
    empty.style.left = `${Math.max(X_PADDING, els.mapScroll.scrollLeft / zoom + 48)}px`;
    empty.style.top = `${Math.max(Y_PADDING, els.mapScroll.scrollTop / zoom + 48)}px`;
    empty.textContent = "No project island matches this search.";
    els.workspaceLayer.append(empty);
  }
}

function compareWorkspaceProjects(a, b) {
  const pinnedDelta = Number(isProjectPinned(b.id)) - Number(isProjectPinned(a.id));

  if (pinnedDelta) {
    return pinnedDelta;
  }

  if (a.id === state.lastOpenedProjectId) {
    return -1;
  }

  if (b.id === state.lastOpenedProjectId) {
    return 1;
  }

  return state.projects.indexOf(a) - state.projects.indexOf(b);
}

function renderWorkspaceGroups(layout, projects) {
  const groups = new Map();

  projects.forEach((project) => {
    const frame = getWorkspaceProjectFrame(project, layout);
    const islandFrame = getOverviewIslandFrame(frame);
    const key = project.category || "General";
    const group = groups.get(key) || {
      minX: islandFrame.x,
      minY: islandFrame.y,
      count: 0
    };

    group.minX = Math.min(group.minX, islandFrame.x);
    group.minY = Math.min(group.minY, islandFrame.y);
    group.count += 1;
    groups.set(key, group);
  });

  groups.forEach((group, label) => {
    const item = document.createElement("div");
    item.className = "workspace-group";
    item.style.left = `${Math.max(24, group.minX)}px`;
    item.style.top = `${Math.max(24, group.minY - 42)}px`;
    item.textContent = `${label} / ${group.count}`;
    els.workspaceLayer.append(item);
  });
}

function workspaceProjectTemplate(project, stats) {
  return `
    <span class="workspace-project-label">
      <svg aria-hidden="true"><use href="#icon-tag"></use></svg>
      ${escapeHtml(project.category || "General")}
    </span>
    <span class="workspace-project-main">
      <strong class="workspace-project-title">${escapeHtml(project.title)}</strong>
      <span class="workspace-project-meta">
        <span>${stats.total} ${stats.total === 1 ? "node" : "nodes"}</span>
        <span>${stats.active} active</span>
        <span>${stats.donePercent}% done</span>
      </span>
    </span>
    <span class="workspace-project-footer">
      <span class="island-progress" aria-hidden="true">
        <span class="island-progress-fill" style="width: ${stats.donePercent}%"></span>
      </span>
    </span>
  `;
}

function getProjectStats(project) {
  const nodes = Object.values(project.nodes || {});
  const total = nodes.length;
  const done = nodes.filter((item) => item.status === "done").length;
  const active = nodes.filter((item) => item.status === "active" || item.status === "review").length;
  return {
    total,
    active,
    donePercent: total ? Math.round((done / total) * 100) : 0
  };
}

function isProjectPinned(projectId) {
  return Array.isArray(state.pinnedProjectIds) && state.pinnedProjectIds.includes(projectId);
}

function toggleProjectPin(projectId) {
  if (!state.projects.some((project) => project.id === projectId)) {
    return;
  }

  const pinned = new Set(state.pinnedProjectIds || []);

  if (pinned.has(projectId)) {
    pinned.delete(projectId);
  } else {
    pinned.add(projectId);
  }

  state.pinnedProjectIds = [...pinned];
  state.selectedProjectId = projectId;
  persist();
  renderMap();
  renderWorkspaceSummary();
  showToast(pinned.has(projectId) ? "Island pinned" : "Island unpinned");
}

function getProjectSearchQuery() {
  return els.projectSearch.value.trim().toLowerCase();
}

function matchesProjectSearch(project, query = getProjectSearchQuery()) {
  if (!query) {
    return true;
  }

  const statsText = Object.values(project.nodes || {})
    .map((item) => `${item.title} ${item.owner} ${item.status}`)
    .join(" ");
  return `${project.title} ${project.category || ""} ${statsText}`.toLowerCase().includes(query);
}

function getOverviewIslandFrame(frame) {
  const width = clamp(frame.width * WORKSPACE_ZOOM + 86, 280, 468);
  const height = clamp(frame.height * 0.18 + 34, 104, 172);

  return {
    x: frame.x,
    y: frame.y,
    width,
    height
  };
}

function getStoredProjectFrame(project) {
  return {
    x: Number.isFinite(project.x) ? project.x : 88,
    y: Number.isFinite(project.y) ? project.y : 88,
    width: Number.isFinite(project.frameWidth) ? project.frameWidth : PROJECT_ISLAND_WIDTH,
    height: Number.isFinite(project.frameHeight) ? project.frameHeight : PROJECT_ISLAND_HEIGHT
  };
}

function getWorkspaceProjectFrame(project, layout = currentLayout) {
  if (isProjectOpen() && project.id === state.activeProjectId && layout) {
    return getProjectFrame(layout);
  }

  return getStoredProjectFrame(project);
}

function renderMinimap(layout = currentLayout) {
  if (!layout) {
    return;
  }

  const bounds = getWorkspaceBounds(layout);
  const canvasWidth = els.minimapCanvas.clientWidth || 190;
  const canvasHeight = els.minimapCanvas.clientHeight || 124;
  const padding = 10;
  const scale = Math.min(
    (canvasWidth - padding * 2) / Math.max(1, bounds.width),
    (canvasHeight - padding * 2) / Math.max(1, bounds.height)
  );
  const query = getProjectSearchQuery();

  minimapMeta = { bounds, scale, padding };
  els.minimapCanvas.innerHTML = "";

  state.projects.forEach((project) => {
    const frame = getWorkspaceProjectFrame(project, layout);
    const item = document.createElement("button");
    const matches = matchesProjectSearch(project, query);

    item.className = [
      "minimap-project",
      `tone-${projectTones.has(project.tone) ? project.tone : "blue"}`,
      project.id === state.activeProjectId ? "active" : "",
      query && !matches ? "filtered-out" : ""
    ].filter(Boolean).join(" ");
    item.type = "button";
    item.title = project.title;
    item.setAttribute("aria-label", `Open ${project.title}`);
    item.style.left = `${padding + (frame.x - bounds.x) * scale}px`;
    item.style.top = `${padding + (frame.y - bounds.y) * scale}px`;
    item.style.width = `${Math.max(6, frame.width * scale)}px`;
    item.style.height = `${Math.max(6, frame.height * scale)}px`;
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      openProject(project.id);
    });
    els.minimapCanvas.append(item);
  });

  const viewport = document.createElement("div");
  viewport.className = "minimap-viewport";
  els.minimapCanvas.append(viewport);
  renderMinimapViewport();
}

function renderMinimapViewport() {
  if (!minimapMeta) {
    return;
  }

  const viewport = els.minimapCanvas.querySelector(".minimap-viewport");

  if (!viewport) {
    return;
  }

  const { bounds, scale, padding } = minimapMeta;
  const left = padding + (els.mapScroll.scrollLeft / zoom - bounds.x) * scale;
  const top = padding + (els.mapScroll.scrollTop / zoom - bounds.y) * scale;
  const width = els.mapScroll.clientWidth / zoom * scale;
  const height = els.mapScroll.clientHeight / zoom * scale;

  viewport.style.left = `${left}px`;
  viewport.style.top = `${top}px`;
  viewport.style.width = `${Math.max(8, width)}px`;
  viewport.style.height = `${Math.max(8, height)}px`;
}

function getWorkspaceBounds(layout = currentLayout) {
  const frames = state.projects.map((project) => getWorkspaceProjectFrame(project, layout));

  if (!frames.length) {
    return { x: 0, y: 0, width: els.mapScroll.clientWidth / zoom, height: els.mapScroll.clientHeight / zoom };
  }

  const minX = Math.min(...frames.map((frame) => frame.x));
  const minY = Math.min(...frames.map((frame) => frame.y));
  const maxX = Math.max(...frames.map((frame) => frame.x + frame.width));
  const maxY = Math.max(...frames.map((frame) => frame.y + frame.height));
  const padding = 180;

  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2
  };
}

function extendLayoutForWorkspace(layout) {
  const frames = state.projects.map((project) => getWorkspaceProjectFrame(project, layout));

  frames.forEach((frame) => {
    layout.width = Math.max(layout.width, frame.x + frame.width + X_PADDING);
    layout.height = Math.max(layout.height, frame.y + frame.height + Y_PADDING);
  });

  const maxRight = Math.max(...frames.map((frame) => frame.x + frame.width));
  const maxBottom = Math.max(...frames.map((frame) => frame.y + frame.height));
  layout.width = Math.max(layout.width, maxRight + 180);
  layout.height = Math.max(layout.height, maxBottom + 180);
}

function positionInspectorPanel(layout = currentLayout) {
  if (!layout || !isProjectOpen()) {
    return;
  }

  const project = getActiveProject();
  const frame = getProjectFrame(layout);
  const appRect = els.flowApp.getBoundingClientRect();
  const scrollRect = els.mapScroll.getBoundingClientRect();
  const minPanelWidth = 312;
  const panelWidth = Math.min(374, Math.max(minPanelWidth, scrollRect.width * 0.34));
  const frameTop = scrollRect.top - appRect.top + frame.y * zoom - els.mapScroll.scrollTop;
  const scrollLeft = scrollRect.left - appRect.left;
  const scrollTop = scrollRect.top - appRect.top;
  const scrollBottom = scrollRect.bottom - appRect.top;
  const gutter = 14;
  let left = scrollLeft + gutter;

  let top = clamp(frameTop + gutter, scrollTop + gutter, Math.max(scrollTop + gutter, scrollBottom - 430));

  if (Number.isFinite(project?.inspectorX) && Number.isFinite(project?.inspectorY)) {
    left = clamp(project.inspectorX, scrollLeft + gutter, Math.max(scrollLeft + gutter, scrollRect.right - appRect.left - panelWidth - gutter));
    top = clamp(project.inspectorY, scrollTop + gutter, Math.max(scrollTop + gutter, scrollBottom - 260));
  }

  const height = Math.max(360, scrollBottom - top - gutter);

  els.inspectorPanel.style.setProperty("--inspector-left", `${left}px`);
  els.inspectorPanel.style.setProperty("--inspector-top", `${top}px`);
  els.inspectorPanel.style.setProperty("--inspector-width", `${panelWidth}px`);
  els.inspectorPanel.style.setProperty("--inspector-height", `${height}px`);
}

function getProjectFrame(layout) {
  const positions = Object.values(layout.positions);
  const nodeWidth = getNodeWidth();

  if (!positions.length) {
    return {
      x: X_PADDING,
      y: Y_PADDING,
      width: 520,
      height: 320
    };
  }

  const minX = Math.min(...positions.map((position) => position.x));
  const minY = Math.min(...positions.map((position) => position.y));
  const maxX = Math.max(...positions.map((position) => position.x + nodeWidth));
  const maxY = Math.max(...positions.map((position) => position.y + NODE_HEIGHT));
  const x = Math.max(24, minX - PROJECT_FRAME_PADDING);
  const y = Math.max(24, minY - PROJECT_FRAME_PADDING);

  return {
    x,
    y,
    width: Math.max(520, maxX - minX + PROJECT_FRAME_PADDING * 2),
    height: Math.max(340, maxY - minY + PROJECT_FRAME_PADDING * 2)
  };
}

function isPointInProjectFrame(point, layout = currentLayout) {
  if (!point || !layout) {
    return false;
  }

  const frame = getProjectFrame(layout);
  return (
    point.x >= frame.x &&
    point.x <= frame.x + frame.width &&
    point.y >= frame.y &&
    point.y <= frame.y + frame.height
  );
}

function createConnectorPath({ startX, startY, endX, endY, startAnchor = "right", endAnchor = "left", className }) {
  const path = document.createElementNS(SVG_NS, "path");
  const points = getConnectorRoute({
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    startAnchor,
    endAnchor
  });

  path.setAttribute("class", className);
  path.setAttribute("d", roundedPath(points, 18));
  return path;
}

function getConnectorRoute({ start, end, startAnchor, endAnchor }) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const lead = clamp(distance * 0.18, 42, 116);
  const startVector = getAnchorVector(startAnchor);
  const endVector = getAnchorVector(endAnchor);
  const startLead = {
    x: start.x + startVector.x * lead,
    y: start.y + startVector.y * lead
  };
  const endLead = {
    x: end.x + endVector.x * lead,
    y: end.y + endVector.y * lead
  };
  const startHorizontal = startAnchor === "left" || startAnchor === "right";
  const endHorizontal = endAnchor === "left" || endAnchor === "right";

  if (startHorizontal && endHorizontal) {
    const midX = (startLead.x + endLead.x) / 2;
    return cleanRoutePoints([start, startLead, { x: midX, y: startLead.y }, { x: midX, y: endLead.y }, endLead, end]);
  }

  if (!startHorizontal && !endHorizontal) {
    const midY = (startLead.y + endLead.y) / 2;
    return cleanRoutePoints([start, startLead, { x: startLead.x, y: midY }, { x: endLead.x, y: midY }, endLead, end]);
  }

  return cleanRoutePoints([start, startLead, { x: endLead.x, y: startLead.y }, endLead, end]);
}

function cleanRoutePoints(points) {
  return points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || Math.hypot(point.x - previous.x, point.y - previous.y) > 1;
  });
}

function roundedPath(points, radius) {
  if (points.length < 2) {
    return "";
  }

  const commands = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const before = pointAlong(current, previous, radius);
    const after = pointAlong(current, next, radius);

    commands.push(`L ${before.x} ${before.y}`);
    commands.push(`Q ${current.x} ${current.y} ${after.x} ${after.y}`);
  }

  const last = points[points.length - 1];
  commands.push(`L ${last.x} ${last.y}`);
  return commands.join(" ");
}

function pointAlong(from, to, distance) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  if (!length) {
    return from;
  }

  const amount = Math.min(distance, length / 2);
  return {
    x: from.x + (dx / length) * amount,
    y: from.y + (dy / length) * amount
  };
}

function renderEdgeAction(parentId, childId, startX, startY, endX, endY) {
  const button = document.createElement("button");
  button.className = "edge-delete";
  button.type = "button";
  button.title = "Delete connection";
  button.setAttribute("aria-label", "Delete connection");
  button.dataset.parentId = parentId;
  button.dataset.childId = childId;
  button.style.left = `${(startX + endX) / 2}px`;
  button.style.top = `${(startY + endY) / 2}px`;
  button.innerHTML = `<svg aria-hidden="true"><use href="#icon-x"></use></svg>`;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    detachConnection(parentId, childId);
  });
  els.edgeActionLayer.append(button);
}

function getNodeAnchorPoint(position, anchor) {
  const nodeWidth = getNodeWidth();
  const anchorName = normalizeAnchor(anchor, "right");
  const points = {
    left: { x: position.x, y: position.y + NODE_HEIGHT / 2 },
    right: { x: position.x + nodeWidth, y: position.y + NODE_HEIGHT / 2 },
    top: { x: position.x + nodeWidth / 2, y: position.y },
    bottom: { x: position.x + nodeWidth / 2, y: position.y + NODE_HEIGHT }
  };

  return points[anchorName];
}

function getAnchorVector(anchor) {
  const vectors = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 }
  };

  return vectors[normalizeAnchor(anchor, "right")];
}

function nodeTemplate(item, progress) {
  const childCount = item.children.length;
  const ports = ["left", "top", "right", "bottom"].map((anchor) => `
    <button class="link-port link-${anchor}" type="button" data-anchor="${anchor}" title="Drag connection. Option-drag to reroute." aria-label="Connection point ${anchor}"></button>
  `).join("");
  const toggle = childCount ? `
    <button class="child-toggle" type="button" title="Toggle branch" aria-label="Toggle branch">
      <svg aria-hidden="true"><use href="#icon-chevron"></use></svg>
      ${childCount}
    </button>
  ` : "";

  return `
    ${ports}
    <div class="node-top">
      <span class="node-kicker">
        <span class="status-dot status-${escapeHtml(item.status)}"></span>
        ${escapeHtml(statusLabels[item.status])}
      </span>
      <span class="priority-pill priority-${escapeHtml(item.priority)}">${escapeHtml(priorityLabels[item.priority])}</span>
    </div>
    <strong class="node-title">${escapeHtml(item.title)}</strong>
    <div class="node-meta">
      <span class="node-due">${escapeHtml(item.due || "No due")}</span>
    </div>
    <div class="node-footer">
      <span class="progress-track"><span class="progress-fill" style="width: ${progress}%"></span></span>
      ${toggle}
    </div>
  `;
}

function buildLayout(rootId) {
  const autoPositions = {};
  const positions = {};
  const ids = [];
  const connections = [];
  const nodeWidth = getNodeWidth();
  const offset = getActiveProjectOffset();
  let row = 0;

  function walk(id, depth) {
    const item = state.nodes[id];
    ids.push(id);
    const children = item.collapsed ? [] : item.children.filter((childId) => state.nodes[childId]);

    if (!children.length) {
      const y = Y_PADDING + row * ROW_GAP;
      row += 1;
      autoPositions[id] = { x: X_PADDING + depth * COLUMN_GAP, y };
      return y;
    }

    const childYs = children.map((childId) => {
      connections.push({ parentId: id, childId });
      return walk(childId, depth + 1);
    });
    const y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    autoPositions[id] = { x: X_PADDING + depth * COLUMN_GAP, y };
    return y;
  }

  walk(rootId, 0);

  if (rootId === state.rootId) {
    getDetachedRootIds().forEach((id) => {
      row += 1;
      walk(id, 0);
    });
  }

  ids.forEach((id) => {
    const item = state.nodes[id];
    const autoPosition = autoPositions[id] || { x: X_PADDING, y: Y_PADDING };
    positions[id] = hasManualPosition(item)
      ? { x: item.x, y: item.y }
      : { x: autoPosition.x + offset.x, y: autoPosition.y + offset.y };
  });

  const maxX = Math.max(...Object.values(positions).map((position) => position.x));
  const maxY = Math.max(...Object.values(positions).map((position) => position.y));
  const frame = getProjectFrame({ positions });

  return {
    ids,
    positions,
    connections,
    width: Math.max(frame.x + frame.width + X_PADDING, maxX + nodeWidth + X_PADDING * 2, els.mapScroll.clientWidth / zoom),
    height: Math.max(frame.y + frame.height + Y_PADDING, maxY + NODE_HEIGHT + Y_PADDING, els.mapScroll.clientHeight / zoom)
  };
}

function hasManualPosition(item) {
  return Number.isFinite(item.x) && Number.isFinite(item.y);
}

function getDetachedRootIds() {
  return Object.values(state.nodes)
    .filter((item) => item.id !== state.rootId && !item.parentId)
    .map((item) => item.id);
}

function updateSelectedFromInspector() {
  if (!selectedId || !state.nodes[selectedId]) {
    return;
  }

  const selected = state.nodes[selectedId];
  selected.title = els.nodeTitle.value.trim() || "Untitled Node";
  selected.detail = els.nodeDetail.value;
  selected.status = els.nodeStatus.value;
  selected.priority = els.nodePriority.value;
  selected.owner = els.nodeOwner.value.trim();
  selected.due = els.nodeDue.value.trim();
  els.selectedHeading.textContent = selected.title;
  persist();
  renderMetrics();
  renderMap();
  renderChildList(selected);
}

function addChild(parentId) {
  if (!parentId || !state.nodes[parentId]) {
    return;
  }

  const parent = state.nodes[parentId];
  const id = createId();
  const childNumber = parent.children.length + 1;
  state.nodes[id] = node(id, parentId, `New Branch ${childNumber}`, {
    detail: "",
    status: "backlog",
    priority: "medium",
    owner: parent.owner,
    due: ""
  });
  parent.children.push(id);
  parent.collapsed = false;
  selectNode(id);
  persist();
  render();
  requestAnimationFrame(() => scrollToNode(id, true));
}

function duplicateSelected() {
  if (!selectedId || selectedId === state.rootId) {
    return;
  }

  const source = state.nodes[selectedId];
  const parent = source.parentId ? state.nodes[source.parentId] : null;
  const newId = cloneSubtree(selectedId, source.parentId, true);

  if (parent) {
    const index = parent.children.indexOf(selectedId);
    parent.children.splice(index + 1, 0, newId);
  }

  selectNode(newId);
  persist();
  render();
  requestAnimationFrame(() => scrollToNode(newId, true));
}

function cloneSubtree(sourceId, parentId, isRootClone = false) {
  const source = state.nodes[sourceId];
  const id = createId();
  state.nodes[id] = {
    ...source,
    id,
    parentId,
    title: isRootClone ? `${source.title} Copy` : source.title,
    collapsed: false,
    children: []
  };

  source.children.forEach((childId) => {
    const childCloneId = cloneSubtree(childId, id);
    state.nodes[id].children.push(childCloneId);
  });

  return id;
}

function deleteSelected() {
  if (!selectedId || selectedId === state.rootId) {
    return;
  }

  const selected = state.nodes[selectedId];
  if (!window.confirm(`Delete "${selected.title}" and its children?`)) {
    return;
  }

  const parentId = selected.parentId;
  const parent = parentId ? state.nodes[parentId] : null;

  if (parent) {
    parent.children = parent.children.filter((id) => id !== selectedId);
  }

  removeSubtree(selectedId);
  selectedId = parentId || state.rootId;
  state.selectedId = selectedId;

  if (focusedRootId && !state.nodes[focusedRootId]) {
    focusedRootId = null;
    state.focusedRootId = null;
  }

  persist();
  render();
  requestAnimationFrame(() => scrollToNode(selectedId, true));
}

function removeSubtree(id) {
  const item = state.nodes[id];
  item.children.forEach(removeSubtree);
  delete state.nodes[id];
}

function selectNode(id, shouldScroll = false) {
  if (!state.nodes[id]) {
    return;
  }

  selectedId = id;
  state.selectedId = id;

  if (focusedRootId && !isDescendantOf(id, focusedRootId) && id !== focusedRootId) {
    focusedRootId = null;
    state.focusedRootId = null;
  }

  persist({ history: false });
  render();

  if (shouldScroll) {
    requestAnimationFrame(() => scrollToNode(id, true));
  }
}

function clearSelection() {
  if (!selectedId) {
    return;
  }

  selectedId = null;
  state.selectedId = null;
  persist({ history: false });
  render();
}

function beginCanvasPan(event) {
  interaction = {
    type: "pan",
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startScrollLeft: els.mapScroll.scrollLeft,
    startScrollTop: els.mapScroll.scrollTop,
    startStagePoint: stagePointFromEvent(event),
    moved: false
  };

  els.mapScroll.setPointerCapture(event.pointerId);
  els.mapScroll.classList.add("panning");
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", finishInteraction, { once: true });
  window.addEventListener("pointercancel", finishInteraction, { once: true });
  event.preventDefault();
}

function beginNodeDrag(event, id, nodeEl) {
  if (
    event.button !== 0 ||
    event.target.closest(".child-toggle") ||
    event.target.closest(".link-port") ||
    !currentLayout?.positions[id]
  ) {
    return;
  }

  const position = currentLayout.positions[id];
  interaction = {
    type: "node",
    id,
    nodeEl,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: position.x,
    startY: position.y,
    moved: false
  };

  nodeEl.setPointerCapture(event.pointerId);
  nodeEl.classList.add("pressed");
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", finishInteraction, { once: true });
  window.addEventListener("pointercancel", finishInteraction, { once: true });
  event.preventDefault();
}

function beginProjectDrag(event, projectId, islandEl) {
  const project = state.projects.find((item) => item.id === projectId);

  if (event.button !== 0 || !project || isProjectOpen() || event.target.closest(".workspace-project-pin")) {
    return;
  }

  state.selectedProjectId = projectId;
  persist({ history: false });
  renderWorkspaceSummary();
  els.workspaceLayer.querySelectorAll(".workspace-project.selected").forEach((item) => {
    item.classList.remove("selected");
  });
  islandEl.classList.add("selected");

  interaction = {
    type: "project",
    projectId,
    islandEl,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: Number.isFinite(project.x) ? project.x : 88,
    startY: Number.isFinite(project.y) ? project.y : 88,
    moved: false
  };

  islandEl.setPointerCapture(event.pointerId);
  islandEl.classList.add("dragging");
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", finishInteraction, { once: true });
  window.addEventListener("pointercancel", finishInteraction, { once: true });
  event.preventDefault();
  event.stopPropagation();
}

function beginInspectorDrag(event) {
  if (
    event.button !== 0 ||
    event.target.closest("button") ||
    event.target.closest("input") ||
    event.target.closest("textarea") ||
    event.target.closest("select") ||
    event.target.closest(".inspector-form") ||
    event.target.closest(".child-list-section") ||
    !isProjectOpen()
  ) {
    return;
  }

  const appRect = els.flowApp.getBoundingClientRect();
  const panelRect = els.inspectorPanel.getBoundingClientRect();

  interaction = {
    type: "inspector",
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: panelRect.left - appRect.left,
    startY: panelRect.top - appRect.top,
    moved: false
  };

  els.inspectorPanel.setPointerCapture(event.pointerId);
  els.inspectorPanel.classList.add("dragging");
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", finishInteraction, { once: true });
  window.addEventListener("pointercancel", finishInteraction, { once: true });
  event.preventDefault();
}

function beginSidebarResize(event) {
  if (event.button !== 0) {
    return;
  }

  interaction = {
    type: "sidebar-resize",
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startWidth: getSidebarWidth(),
    moved: false
  };

  els.sideResizeHandle.setPointerCapture(event.pointerId);
  els.sidePanel.classList.add("resizing");
  document.body.classList.add("resizing-sidebar");
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", finishInteraction, { once: true });
  window.addEventListener("pointercancel", finishInteraction, { once: true });
  event.preventDefault();
}

function beginLinkDrag(event, sourceId, outputPort) {
  if (event.button !== 0 || !currentLayout?.positions[sourceId]) {
    return;
  }

  interaction = {
    type: "link",
    sourceId,
    sourceAnchor: normalizeAnchor(outputPort.dataset.anchor, "right"),
    pointerId: event.pointerId,
    pointer: stagePointFromEvent(event),
    validTargetId: null,
    validTargetAnchor: null
  };

  outputPort.setPointerCapture(event.pointerId);
  els.flowApp.classList.add("linking");
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", finishInteraction, { once: true });
  window.addEventListener("pointercancel", finishInteraction, { once: true });
  renderConnections();
  event.preventDefault();
  event.stopPropagation();
}

function beginRewireDrag(event, childId, inputPort) {
  if (event.button !== 0 || childId === state.rootId || !currentLayout?.positions[childId]) {
    return;
  }

  interaction = {
    type: "rewire",
    childId,
    childInputAnchor: normalizeAnchor(inputPort.dataset.anchor, "left"),
    pointerId: event.pointerId,
    pointer: stagePointFromEvent(event),
    validTargetId: null,
    validTargetAnchor: null
  };

  inputPort.setPointerCapture(event.pointerId);
  els.flowApp.classList.add("linking");
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", finishInteraction, { once: true });
  window.addEventListener("pointercancel", finishInteraction, { once: true });
  renderConnections();
  event.preventDefault();
  event.stopPropagation();
}

function handlePointerMove(event) {
  if (!interaction) {
    return;
  }

  if (interaction.type === "pan") {
    moveCanvasPan(event);
    return;
  }

  if (interaction.type === "node") {
    moveNode(event);
    return;
  }

  if (interaction.type === "project") {
    moveProjectIsland(event);
    return;
  }

  if (interaction.type === "inspector") {
    moveInspectorPanel(event);
    return;
  }

  if (interaction.type === "sidebar-resize") {
    moveSidebarResize(event);
    return;
  }

  if (interaction.type === "link" || interaction.type === "rewire") {
    moveLinkPreview(event);
  }
}

function moveCanvasPan(event) {
  const deltaX = event.clientX - interaction.startClientX;
  const deltaY = event.clientY - interaction.startClientY;

  if (!interaction.moved && Math.hypot(deltaX, deltaY) < PAN_THRESHOLD) {
    return;
  }

  interaction.moved = true;
  els.mapScroll.scrollLeft = interaction.startScrollLeft - deltaX;
  els.mapScroll.scrollTop = interaction.startScrollTop - deltaY;
}

function moveNode(event) {
  const deltaX = event.clientX - interaction.startClientX;
  const deltaY = event.clientY - interaction.startClientY;

  if (!interaction.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
    return;
  }

  const item = state.nodes[interaction.id];
  interaction.moved = true;
  interaction.nodeEl.classList.add("dragging");

  item.x = Math.max(24, interaction.startX + deltaX / zoom);
  item.y = Math.max(24, interaction.startY + deltaY / zoom);
  currentLayout.positions[interaction.id] = { x: item.x, y: item.y };
  interaction.nodeEl.style.left = `${item.x}px`;
  interaction.nodeEl.style.top = `${item.y}px`;
  updateStageBounds();
  renderConnections();
}

function moveProjectIsland(event) {
  const deltaX = event.clientX - interaction.startClientX;
  const deltaY = event.clientY - interaction.startClientY;

  if (!interaction.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
    return;
  }

  const project = state.projects.find((item) => item.id === interaction.projectId);

  if (!project) {
    return;
  }

  interaction.moved = true;
  const nextPosition = clampProjectPositionToViewport(
    project,
    interaction.startX + deltaX / zoom,
    interaction.startY + deltaY / zoom
  );
  project.x = nextPosition.x;
  project.y = nextPosition.y;

  const islandFrame = getOverviewIslandFrame(getStoredProjectFrame(project));
  interaction.islandEl.style.left = `${islandFrame.x}px`;
  interaction.islandEl.style.top = `${islandFrame.y}px`;

  if (currentLayout) {
    extendLayoutForWorkspace(currentLayout);
    els.stageScaler.style.width = `${currentLayout.width * zoom}px`;
    els.stageScaler.style.height = `${currentLayout.height * zoom}px`;
    els.mapStage.style.width = `${currentLayout.width}px`;
    els.mapStage.style.height = `${currentLayout.height}px`;
    renderMinimap(currentLayout);
  }
}

function clampProjectPositionToViewport(project, nextX, nextY) {
  const frame = getOverviewIslandFrame({
    ...getStoredProjectFrame(project),
    x: nextX,
    y: nextY
  });
  const bounds = getVisibleStageBounds();
  const minX = Math.max(0, bounds.x);
  const minY = Math.max(0, bounds.y);
  const maxX = Math.max(minX, bounds.x + bounds.width - frame.width);
  const maxY = Math.max(minY, bounds.y + bounds.height - frame.height);

  return {
    x: clamp(nextX, minX, maxX),
    y: clamp(nextY, minY, maxY)
  };
}

function getVisibleStageBounds() {
  return {
    x: els.mapScroll.scrollLeft / zoom,
    y: els.mapScroll.scrollTop / zoom,
    width: els.mapScroll.clientWidth / zoom,
    height: els.mapScroll.clientHeight / zoom
  };
}

function moveInspectorPanel(event) {
  const deltaX = event.clientX - interaction.startClientX;
  const deltaY = event.clientY - interaction.startClientY;

  if (!interaction.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
    return;
  }

  const appRect = els.flowApp.getBoundingClientRect();
  const panelRect = els.inspectorPanel.getBoundingClientRect();
  const nextX = clamp(interaction.startX + deltaX, 12, Math.max(12, appRect.width - panelRect.width - 12));
  const nextY = clamp(interaction.startY + deltaY, 12, Math.max(12, appRect.height - 260));
  const project = getActiveProject();

  interaction.moved = true;
  if (project) {
    project.inspectorX = nextX;
    project.inspectorY = nextY;
  }
  els.inspectorPanel.style.setProperty("--inspector-left", `${nextX}px`);
  els.inspectorPanel.style.setProperty("--inspector-top", `${nextY}px`);
}

function moveSidebarResize(event) {
  const deltaX = event.clientX - interaction.startClientX;

  if (!interaction.moved && Math.abs(deltaX) < DRAG_THRESHOLD) {
    return;
  }

  interaction.moved = true;
  state.sidebarWidth = clamp(interaction.startWidth + deltaX, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH);
  applySidebarWidth();
  positionInspectorPanel();
  renderMinimapViewport();
}

function moveLinkPreview(event) {
  interaction.pointer = stagePointFromEvent(event);
  const target = interaction.type === "link"
    ? getInputTargetFromPoint(event.clientX, event.clientY, interaction.sourceId)
    : getOutputTargetFromPoint(event.clientX, event.clientY, interaction.childId);
  setConnectTarget(target?.id || null, target?.anchor || null);
  renderConnections();
}

function finishInteraction() {
  if (!interaction) {
    return;
  }

  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", finishInteraction);
  window.removeEventListener("pointercancel", finishInteraction);

  if (interaction.type === "pan") {
    const didMove = interaction.moved;
    const startStagePoint = interaction.startStagePoint;
    els.mapScroll.classList.remove("panning");
    interaction = null;

    if (!didMove) {
      if (isProjectOpen() && currentLayout && !isPointInProjectFrame(startStagePoint)) {
        closeProjectToWorkspace();
        return;
      }
      clearSelection();
    }
    return;
  }

  if (interaction.type === "node") {
    interaction.nodeEl.classList.remove("pressed", "dragging");

    if (interaction.moved) {
      persist();
      renderMap();
    } else {
      selectNode(interaction.id);
    }
  }

  if (interaction.type === "project") {
    const { projectId, moved } = interaction;
    interaction.islandEl.classList.remove("dragging");
    interaction = null;

    if (moved) {
      persist();
      renderMap();
      return;
    }

    openProject(projectId);
    return;
  }

  if (interaction.type === "inspector") {
    els.inspectorPanel.classList.remove("dragging");
    interaction = null;
    persist({ history: false });
    return;
  }

  if (interaction.type === "sidebar-resize") {
    els.sidePanel.classList.remove("resizing");
    document.body.classList.remove("resizing-sidebar");
    interaction = null;
    persist({ history: false });
    return;
  }

  if (interaction.type === "link") {
    const { sourceId, sourceAnchor, validTargetId, validTargetAnchor } = interaction;
    els.flowApp.classList.remove("linking");
    setConnectTarget(null);
    interaction = null;

    if (validTargetId) {
      reparentNode(validTargetId, sourceId, {
        parentAnchor: sourceAnchor,
        inputAnchor: validTargetAnchor
      });
      return;
    }

    renderConnections();
    return;
  }

  if (interaction.type === "rewire") {
    const { childId, childInputAnchor, validTargetId, validTargetAnchor } = interaction;
    els.flowApp.classList.remove("linking");
    setConnectTarget(null);
    interaction = null;

    if (validTargetId) {
      reparentNode(childId, validTargetId, {
        parentAnchor: validTargetAnchor,
        inputAnchor: childInputAnchor
      });
      return;
    }

    renderConnections();
    return;
  }

  interaction = null;
}

function stagePointFromEvent(event) {
  const rect = els.mapStage.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / zoom,
    y: (event.clientY - rect.top) / zoom
  };
}

function getInputTargetFromPoint(clientX, clientY, sourceId) {
  const element = document.elementFromPoint(clientX, clientY);
  const port = element?.closest?.(".link-port");
  const nodeEl = port?.closest?.(".flow-node") || element?.closest?.(".flow-node");
  const targetId = nodeEl?.dataset.id || null;

  if (!isValidConnection(sourceId, targetId)) {
    return null;
  }

  return {
    id: targetId,
    anchor: port ? normalizeAnchor(port.dataset.anchor, "left") : getNearestAnchorForNode(clientX, clientY, nodeEl)
  };
}

function getOutputTargetFromPoint(clientX, clientY, childId) {
  const element = document.elementFromPoint(clientX, clientY);
  const port = element?.closest?.(".link-port");
  const nodeEl = port?.closest?.(".flow-node") || element?.closest?.(".flow-node");
  const targetId = nodeEl?.dataset.id || null;

  if (!isValidConnection(targetId, childId)) {
    return null;
  }

  return {
    id: targetId,
    anchor: port ? normalizeAnchor(port.dataset.anchor, "right") : getNearestAnchorForNode(clientX, clientY, nodeEl)
  };
}

function getNearestAnchorForNode(clientX, clientY, nodeEl) {
  const rect = nodeEl.getBoundingClientRect();
  const distances = {
    left: Math.abs(clientX - rect.left),
    right: Math.abs(clientX - rect.right),
    top: Math.abs(clientY - rect.top),
    bottom: Math.abs(clientY - rect.bottom)
  };

  return Object.entries(distances).sort((a, b) => a[1] - b[1])[0][0];
}

function setConnectTarget(targetId, anchor = null) {
  if (interaction?.validTargetId === targetId && interaction?.validTargetAnchor === anchor) {
    return;
  }

  els.nodeLayer.querySelectorAll(".connect-target").forEach((nodeEl) => {
    nodeEl.classList.remove("connect-target");
  });

  interaction.validTargetId = targetId;
  interaction.validTargetAnchor = anchor;

  if (targetId) {
    els.nodeLayer.querySelector(`[data-id="${CSS.escape(targetId)}"]`)?.classList.add("connect-target");
  }
}

function isValidConnection(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId || targetId === state.rootId) {
    return false;
  }

  if (!state.nodes[sourceId] || !state.nodes[targetId]) {
    return false;
  }

  return !isDescendantOf(sourceId, targetId);
}

function detachConnection(parentId, childId) {
  const parent = state.nodes[parentId];
  const child = state.nodes[childId];

  if (!parent || !child || child.parentId !== parentId) {
    return;
  }

  parent.children = parent.children.filter((id) => id !== childId);
  child.parentId = null;
  selectedId = childId;
  state.selectedId = childId;
  persist();
  render();
  requestAnimationFrame(() => scrollToNode(childId, true));
}

function reparentNode(childId, newParentId, anchors = {}) {
  if (!isValidConnection(newParentId, childId)) {
    return;
  }

  const child = state.nodes[childId];
  const oldParent = state.nodes[child.parentId];
  const newParent = state.nodes[newParentId];

  if (oldParent) {
    oldParent.children = oldParent.children.filter((id) => id !== childId);
  }

  if (!newParent.children.includes(childId)) {
    newParent.children.push(childId);
  }

  child.parentId = newParentId;
  child.parentAnchor = normalizeAnchor(anchors.parentAnchor, child.parentAnchor || "right");
  child.inputAnchor = normalizeAnchor(anchors.inputAnchor, child.inputAnchor || "left");
  newParent.collapsed = false;
  selectedId = childId;
  state.selectedId = childId;
  persist();
  render();
  requestAnimationFrame(() => scrollToNode(childId, true));
}

function updateStageBounds() {
  if (!currentLayout) {
    return;
  }

  const nodeWidth = getNodeWidth();
  const maxX = Math.max(...Object.values(currentLayout.positions).map((position) => position.x));
  const maxY = Math.max(...Object.values(currentLayout.positions).map((position) => position.y));
  const frame = getProjectFrame(currentLayout);
  currentLayout.width = Math.max(frame.x + frame.width + X_PADDING, maxX + nodeWidth + X_PADDING * 2, els.mapScroll.clientWidth / zoom);
  currentLayout.height = Math.max(frame.y + frame.height + Y_PADDING, maxY + NODE_HEIGHT + Y_PADDING, els.mapScroll.clientHeight / zoom);
  els.stageScaler.style.width = `${currentLayout.width * zoom}px`;
  els.stageScaler.style.height = `${currentLayout.height * zoom}px`;
  els.mapStage.style.width = `${currentLayout.width}px`;
  els.mapStage.style.height = `${currentLayout.height}px`;
  renderProjectFrame(currentLayout);
  positionInspectorPanel(currentLayout);
  renderMinimap(currentLayout);
  els.connectorLayer.setAttribute("viewBox", `0 0 ${currentLayout.width} ${currentLayout.height}`);
  els.connectorLayer.setAttribute("width", String(currentLayout.width));
  els.connectorLayer.setAttribute("height", String(currentLayout.height));
}

function getVisibleRootId() {
  if (!focusedRootId || !state.nodes[focusedRootId]) {
    return state.rootId;
  }

  return focusedRootId;
}

function ensureValidSelection() {
  if (selectedId && !state.nodes[selectedId]) {
    selectedId = null;
    state.selectedId = null;
  }

  if (focusedRootId && !state.nodes[focusedRootId]) {
    focusedRootId = null;
    state.focusedRootId = null;
  }
}

function isDescendantOf(id, ancestorId) {
  let current = state.nodes[id];

  while (current?.parentId) {
    if (current.parentId === ancestorId) {
      return true;
    }
    current = state.nodes[current.parentId];
  }

  return false;
}

function getCompletionPercent(id) {
  const ids = collectSubtreeIds(id);
  const done = ids.filter((nodeId) => state.nodes[nodeId]?.status === "done").length;
  return ids.length ? Math.round((done / ids.length) * 100) : 0;
}

function collectSubtreeIds(id) {
  const item = state.nodes[id];
  if (!item) {
    return [];
  }

  return [id, ...item.children.flatMap(collectSubtreeIds)];
}

function handleCanvasWheel(event) {
  if (!event.ctrlKey && !event.metaKey) {
    return;
  }

  event.preventDefault();
  const direction = -event.deltaY;
  const nextZoom = zoom * Math.exp(direction * 0.0026);
  setZoom(nextZoom, {
    clientX: event.clientX,
    clientY: event.clientY
  });
}

function setZoom(nextZoom, focalPoint = null) {
  const next = clamp(Number(nextZoom), MIN_ZOOM, MAX_ZOOM);

  if (!Number.isFinite(next)) {
    return;
  }

  const rect = els.mapScroll.getBoundingClientRect();
  const localX = focalPoint ? focalPoint.clientX - rect.left : els.mapScroll.clientWidth / 2;
  const localY = focalPoint ? focalPoint.clientY - rect.top : els.mapScroll.clientHeight / 2;
  const stageX = (els.mapScroll.scrollLeft + localX) / zoom;
  const stageY = (els.mapScroll.scrollTop + localY) / zoom;

  zoom = next;
  state.zoom = zoom;
  persist({ history: false });
  if (currentLayout) {
    els.stageScaler.style.width = `${currentLayout.width * zoom}px`;
    els.stageScaler.style.height = `${currentLayout.height * zoom}px`;
  }
  els.mapStage.style.transform = `scale(${zoom})`;
  els.mapScroll.scrollLeft = Math.max(0, stageX * zoom - localX);
  els.mapScroll.scrollTop = Math.max(0, stageY * zoom - localY);
  positionInspectorPanel();
  renderMinimapViewport();
  updateZoomReadout();
}

function fitView() {
  if (!currentLayout) {
    return;
  }

  if (!isProjectOpen()) {
    fitWorkspace();
    return;
  }

  fitBounds(getProjectFrame(currentLayout), 1.18);
}

function fitWorkspace() {
  if (isProjectOpen()) {
    closeProjectToWorkspace({ fit: true });
    return;
  }

  if (!currentLayout) {
    return;
  }

  fitBounds(getWorkspaceBounds(currentLayout), 0.82);
}

function fitBounds(bounds, maxZoom = 1.18, behavior = "smooth") {
  const availableWidth = Math.max(320, els.mapScroll.clientWidth - 48);
  const availableHeight = Math.max(280, els.mapScroll.clientHeight - 48);
  const nextZoom = Math.min(maxZoom, availableWidth / Math.max(1, bounds.width), availableHeight / Math.max(1, bounds.height));

  setZoom(nextZoom);
  requestAnimationFrame(() => scrollToBounds(bounds, behavior));
}

function scrollToBounds(bounds, behavior = "smooth") {
  els.mapScroll.scrollTo({
    left: Math.max(0, (bounds.x + bounds.width / 2) * zoom - els.mapScroll.clientWidth / 2),
    top: Math.max(0, (bounds.y + bounds.height / 2) * zoom - els.mapScroll.clientHeight / 2),
    behavior
  });
}

function scrollToNode(id, center = false, behavior = "smooth") {
  if (!currentLayout?.positions[id]) {
    return;
  }

  const nodeWidth = getNodeWidth();
  const position = currentLayout.positions[id];
  const left = position.x * zoom - (center ? (els.mapScroll.clientWidth - nodeWidth * zoom) / 2 : 30);
  const top = position.y * zoom - (center ? (els.mapScroll.clientHeight - NODE_HEIGHT * zoom) / 2 : 30);

  els.mapScroll.scrollTo({
    left: Math.max(0, left),
    top: Math.max(0, top),
    behavior
  });
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  persist({ history: false });
  applyTheme();
}

function applyTheme() {
  const theme = state.theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  els.themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  els.themeToggle.title = theme === "dark" ? "Light mode" : "Dark mode";
}

function toggleWorkspaceMode() {
  if (isProjectOpen()) {
    closeProjectToWorkspace();
    return;
  }

  openProject(state.activeProjectId);
}

function openProject(projectId = state.activeProjectId) {
  saveActiveProject();
  startCanvasTransition("open");

  if (projectId && state.projects.some((project) => project.id === projectId)) {
    state.activeProjectId = projectId;
  }

  state.selectedProjectId = state.activeProjectId;
  state.lastOpenedProjectId = state.activeProjectId;
  hydrateActiveProject(state);
  state.projectOpen = true;
  selectedId = state.rootId;
  state.selectedId = selectedId;
  focusedRootId = state.focusedRootId && state.nodes[state.focusedRootId] ? state.focusedRootId : null;
  zoom = Math.max(0.92, zoom);
  persist({ history: false });
  render();
  requestAnimationFrame(() => {
    setZoom(1);
    scrollToNode(selectedId, true);
  });
}

function closeProjectToWorkspace(options = {}) {
  saveActiveProject();
  startCanvasTransition("close");
  state.projectOpen = false;
  selectedId = null;
  state.selectedId = null;
  persist({ history: false });
  render();

  if (currentLayout) {
    const frame = getProjectFrame(currentLayout);
    if (options.fit) {
      fitBounds(getWorkspaceBounds(currentLayout), 0.82);
      return;
    }

    setZoom(WORKSPACE_ZOOM);
    requestAnimationFrame(() => scrollToBounds(frame));
  }
}

function createProjectIsland() {
  saveActiveProject();
  const index = state.projects.length + 1;
  const templateKey = projectTemplates[els.projectTemplate.value] ? els.projectTemplate.value : "build";
  const template = projectTemplates[templateKey];
  const title = templateKey === "blank" ? `New Project ${index}` : `${template.label} ${index}`;
  const nextPosition = getNextProjectIslandPosition(index);
  const nextProject = createTemplateProject({
    id: createId("project"),
    title,
    templateKey,
    x: nextPosition.x,
    y: nextPosition.y
  });

  startCanvasTransition("open");
  state.projects.push(nextProject);
  state.activeProjectId = nextProject.id;
  state.selectedProjectId = nextProject.id;
  state.lastOpenedProjectId = nextProject.id;
  hydrateActiveProject(state);
  state.projectOpen = true;
  selectedId = state.rootId;
  focusedRootId = null;
  state.selectedId = selectedId;
  state.focusedRootId = null;
  zoom = 1;
  persist();
  render();
  requestAnimationFrame(() => scrollToNode(selectedId, true));
}

function getNextProjectIslandPosition(index) {
  const previewProject = {
    frameWidth: PROJECT_ISLAND_WIDTH,
    frameHeight: PROJECT_ISLAND_HEIGHT
  };
  const bounds = getVisibleStageBounds();
  const previewFrame = getOverviewIslandFrame({
    x: bounds.x,
    y: bounds.y,
    width: PROJECT_ISLAND_WIDTH,
    height: PROJECT_ISLAND_HEIGHT
  });
  const inset = 42;
  const stepX = Math.min(230, Math.max(80, (bounds.width - previewFrame.width - inset * 2) / 2));
  const stepY = Math.min(170, Math.max(76, (bounds.height - previewFrame.height - inset * 2) / 2));
  const slot = Math.max(0, index - 1) % 6;
  const x = bounds.x + inset + (slot % 3) * stepX;
  const y = bounds.y + inset + Math.floor(slot / 3) * stepY;

  return clampProjectPositionToViewport(previewProject, x, y);
}

function isProjectOpen() {
  return state.projectOpen !== false;
}

function applyWorkspaceState() {
  const open = isProjectOpen();
  els.flowApp.classList.toggle("workspace-overview", !open);
  els.workspaceToggle.setAttribute("aria-pressed", String(!open));
  els.workspaceToggle.setAttribute("aria-label", open ? "Back to workspace" : "Open project");
  els.workspaceToggle.title = open ? "Back to workspace" : "Open project";
}

function startCanvasTransition(kind) {
  window.clearTimeout(transitionTimer);
  els.flowApp.classList.remove("transition-open", "transition-close");
  els.flowApp.classList.add("canvas-transitioning", `transition-${kind}`);
  transitionTimer = window.setTimeout(() => {
    els.flowApp.classList.remove("canvas-transitioning", "transition-open", "transition-close");
  }, 360);
}

function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen;
  persist({ history: false });
  applySidebarState();
}

function applySidebarState() {
  const isOpen = state.sidebarOpen !== false;
  applySidebarWidth();
  els.flowApp.classList.toggle("sidebar-closed", !isOpen);
  els.toggleSidebar.setAttribute("aria-expanded", String(isOpen));
}

function applySidebarWidth() {
  const width = getSidebarWidth();
  els.flowApp.style.setProperty("--sidebar-width", `${width}px`);
  els.sideResizeHandle.setAttribute("aria-valuenow", String(Math.round(width)));
  els.sideResizeHandle.setAttribute("aria-valuemin", String(SIDEBAR_MIN_WIDTH));
  els.sideResizeHandle.setAttribute("aria-valuemax", String(SIDEBAR_MAX_WIDTH));
}

function getSidebarWidth() {
  return clamp(Number(state.sidebarWidth) || 208, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH);
}

function applyPanelState() {
  const panels = normalizeOpenPanels(state.openPanels);
  state.openPanels = panels;
  document.querySelectorAll(".panel-accordion").forEach((section) => {
    const key = section.dataset.panel;
    section.open = panels[key] !== false;
  });
}

function updateZoomReadout() {
  els.zoomReadout.textContent = `${Math.round(zoom * 100)}%`;
}

function getNodeWidth() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--node-width").trim();
  return Number.parseInt(value, 10) || 214;
}

function serializeState(options = {}) {
  if (options.saveProject !== false) {
    saveActiveProject();
  }

  state.schemaVersion = CURRENT_SCHEMA_VERSION;
  return JSON.stringify(state);
}

function undoChange() {
  if (!undoStack.length) {
    showToast("Nothing to undo");
    return;
  }

  redoStack.push(serializeState());
  const snapshot = undoStack.pop();
  restoreStateSnapshot(snapshot);
  showToast("Undo applied");
}

function redoChange() {
  if (!redoStack.length) {
    showToast("Nothing to redo");
    return;
  }

  undoStack.push(serializeState());
  const snapshot = redoStack.pop();
  restoreStateSnapshot(snapshot);
  showToast("Redo applied");
}

function restoreStateSnapshot(snapshot) {
  try {
    state = normalizeLoadedState(JSON.parse(snapshot));
    hydrateActiveProject(state);
    zoom = clamp(Number(state.zoom) || 1, MIN_ZOOM, MAX_ZOOM);
    selectedId = state.selectedId && state.nodes[state.selectedId] ? state.selectedId : null;
    focusedRootId = state.focusedRootId && state.nodes[state.focusedRootId] ? state.focusedRootId : null;
    lastPersistedSnapshot = serializeState({ saveProject: false });
    localStorage.setItem(STORAGE_KEY, lastPersistedSnapshot);
    updateHistoryButtons();
    render();
  } catch {
    showToast("Could not restore this history step");
  }
}

function updateHistoryButtons() {
  els.undoAction.disabled = !undoStack.length;
  els.redoAction.disabled = !redoStack.length;
}

function exportWorkspaceState() {
  persist({ history: false });
  const blob = new Blob([JSON.stringify(JSON.parse(lastPersistedSnapshot), null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `valiant-flow-${date}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Workspace exported");
}

function importWorkspaceState(event) {
  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(String(reader.result || ""));
      const nextState = normalizeLoadedState(imported);

      undoStack.push(serializeState());
      redoStack = [];
      state = nextState;
      hydrateActiveProject(state);
      zoom = clamp(Number(state.zoom) || 1, MIN_ZOOM, MAX_ZOOM);
      selectedId = state.selectedId && state.nodes[state.selectedId] ? state.selectedId : null;
      focusedRootId = state.focusedRootId && state.nodes[state.focusedRootId] ? state.focusedRootId : null;
      lastPersistedSnapshot = serializeState({ saveProject: false });
      localStorage.setItem(STORAGE_KEY, lastPersistedSnapshot);
      render();
      showToast("Workspace imported");
    } catch {
      showToast("Import failed. Use a Valiant Flow JSON export.");
    } finally {
      els.importStateInput.value = "";
    }
  });

  reader.readAsText(file);
}

function showToast(message) {
  if (!els.appToast) {
    return;
  }

  els.appToast.textContent = message;
  els.appToast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    els.appToast.classList.remove("visible");
  }, 2400);
}

function persist(options = {}) {
  saveActiveProject();
  state.schemaVersion = CURRENT_SCHEMA_VERSION;
  state.zoom = zoom;
  state.selectedId = selectedId;
  state.focusedRootId = focusedRootId;
  state.theme = state.theme === "dark" ? "dark" : "light";
  state.sidebarOpen = state.sidebarOpen !== false;
  state.sidebarWidth = getSidebarWidth();
  state.openPanels = normalizeOpenPanels(state.openPanels);
  state.projectOpen = state.projectOpen !== false;
  hydrateActiveProject(state);
  const snapshot = serializeState({ saveProject: false });

  if (options.history !== false && lastPersistedSnapshot && snapshot !== lastPersistedSnapshot) {
    undoStack.push(lastPersistedSnapshot);
    if (undoStack.length > 80) {
      undoStack.shift();
    }
    redoStack = [];
  }

  lastPersistedSnapshot = snapshot;
  updateHistoryButtons();

  try {
    localStorage.setItem(STORAGE_KEY, snapshot);
    els.saveState.textContent = "Saving";
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      els.saveState.textContent = "Saved";
    }, 280);
  } catch {
    els.saveState.textContent = "Storage full";
    showToast("Storage is full. Export your workspace before more edits.");
  }
}

function createId(prefix = "node") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeAnchor(anchor, fallback) {
  return ["left", "right", "top", "bottom"].includes(anchor) ? anchor : fallback;
}

function normalizeOpenPanels(openPanels = {}) {
  return {
    project: openPanels.project !== false,
    workspace: openPanels.workspace !== false,
    actions: openPanels.actions !== false,
    legend: Boolean(openPanels.legend)
  };
}

function inferProjectCategory(value = "") {
  const text = String(value).toLowerCase();

  if (text.includes("thesis") || text.includes("writing") || text.includes("draft")) {
    return "Writing";
  }

  if (text.includes("research") || text.includes("study") || text.includes("literature")) {
    return "Research";
  }

  if (text.includes("launch") || text.includes("ship") || text.includes("release")) {
    return "Launch";
  }

  if (text.includes("build") || text.includes("flow") || text.includes("sprint")) {
    return "Build";
  }

  return "General";
}

function inferProjectTone(value = "") {
  const text = String(value).toLowerCase();

  if (text.includes("research")) {
    return "green";
  }

  if (text.includes("launch")) {
    return "amber";
  }

  if (text.includes("writing") || text.includes("thesis")) {
    return "blue";
  }

  if (text.includes("general") || text.includes("blank")) {
    return "iris";
  }

  return "rose";
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "step";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
