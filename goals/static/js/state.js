// ================================================
// GLOBAL STATE
// ================================================
var goals = [];
var userName = 'User';
var currentMonth = new Date();
var currentGoalId = window.currentGoalId || null;
var currentGoal = null;
var currentParentSubgoalId = null; // For nested subgoal creation
var unavailableDays = {}; // Format: { "2025-01-15": "reason for unavailability" }
var selectedDate = null; // For day modal operations
var specialEvents = {}; // Format: { "2025-01-15": { name: "Birthday", description: "...", color: "purple" } }
var scheduleVisible = false; // Track if schedule is visible
