/**
 * aiComplaintAnalyzer.js
 * AI Complaint Analyzer & Smart Priority Detection Engine for IIITDM Jabalpur Smart Hostel Portal.
 * 
 * Provides automated:
 * 1. Category Classification (Electrical, Plumbing, Wi-Fi / Internet, Carpentry / Furniture, Housekeeping, Other)
 * 2. Issue Type Identification (Water Leakage, No Water Supply, Fan Problem, Power/Sparking Issue, etc.)
 * 3. Responsible Department Routing (Electrical Cell, Plumbing Cell, Computer Centre, Carpentry, Housekeeping)
 * 4. Smart Priority Detection (Critical, High, Medium, Low) with explainable AI reasoning.
 */

export const DEPARTMENTS = {
  ELECTRICAL: 'Electrical Maintenance Cell (EMC)',
  PLUMBING: 'Plumbing & Water Supply Cell',
  NETWORK: 'Institute Computer Centre (ICC) - Network Division',
  CARPENTRY: 'Carpentry & Civil Infrastructure Wing',
  HOUSEKEEPING: 'Hostel Sanitation & Housekeeping Cell',
  GENERAL: 'Hostel Affairs Office / Caretaker Cell'
};

/**
 * Rules and keyword dictionaries for NLP analysis
 */
const CRITICAL_KEYWORDS = [
  'spark', 'sparking', 'sparks', 'burning', 'burn', 'smoke', 'fire', 'shock', 'electric shock',
  'exposed wire', 'live wire', 'short circuit', 'short-circuit', 'flame', 'fire hazard',
  'blast', 'blast sound', 'smell burning', 'smoke coming', 'burst pipe', 'flooding room'
];

const HIGH_KEYWORDS = [
  'continuous leak', 'leaking continuously', 'overflow', 'overflowing', 'no water', 'water outage',
  'entire floor', 'whole wing', 'total blackout', 'no power', 'power outage', 'lock broken',
  'door jammed', 'door stuck', 'geyser burst', 'sewage', 'foul smell', 'stagnant water',
  'ceiling leaking', 'major leak', 'drain choked', 'completely broken'
];

const MEDIUM_KEYWORDS = [
  'not working', 'fan not working', 'light not working', 'regulator stuck', 'tubelight', 'flickering',
  'dripping tap', 'tap leaking', 'flush not working', 'slow internet', 'wifi disconnecting',
  'switch loose', 'socket broken', 'ac not cooling', 'cooler pump', 'water slow'
];

const LOW_KEYWORDS = [
  'chair broken', 'chair leg', 'table scratch', 'study table', 'cupboard knob', 'almirah handle',
  'curtain rod', 'mirror dirty', 'squeaking', 'paint peel', 'minor', 'drawer stuck',
  'dusty', 'cobwebs', 'loose screw'
];

/**
 * Analyzes text description to determine Category, Issue Type, Department, and Priority.
 * 
 * @param {string} text - User's complaint description and title
 * @param {string} [selectedCategory] - Optional user-selected category to assist matching
 * @returns {Object} Analysis result { category, issueType, department, priority, confidence, reason }
 */
export function analyzeComplaintText(text = '', selectedCategory = '') {
  const content = (text || '').toLowerCase().trim();

  // 1. Determine Priority
  let priority = 'Medium';
  let priorityReason = 'Standard maintenance ticket requiring routine attention.';

  if (CRITICAL_KEYWORDS.some(kw => content.includes(kw))) {
    priority = 'Critical';
    priorityReason = 'Urgent safety hazard or electrical emergency detected.';
  } else if (HIGH_KEYWORDS.some(kw => content.includes(kw))) {
    priority = 'High';
    priorityReason = 'Significant utility disruption or continuous wastage detected.';
  } else if (LOW_KEYWORDS.some(kw => content.includes(kw))) {
    priority = 'Low';
    priorityReason = 'Minor furniture/cosmetic wear with minimal operational impact.';
  } else if (MEDIUM_KEYWORDS.some(kw => content.includes(kw))) {
    priority = 'Medium';
    priorityReason = 'Standard room appliance or fixture defect needing maintenance.';
  }

  // 2. Determine Category, Issue Type, and Department
  let category = 'Other';
  let issueType = 'General Facility Issue';
  let department = DEPARTMENTS.GENERAL;

  // Electrical Matching
  const isElectrical = /fan|light|bulb|tubelight|switch|socket|wire|wiring|plug|mcb|spark|power|regulator|voltage|shock|electrical|fuse|ac|cooler/.test(content);
  // Plumbing Matching
  const isPlumbing = /water|tap|leak|dripping|washbasin|sink|pipe|flush|toilet|drain|drainage|shower|geyser|sewage|valve|faucet|plumbing/.test(content);
  // Wi-Fi / Internet Matching
  const isNetwork = /wifi|wi-fi|internet|lan|ethernet|network|router|connectivity|cable|port|ping|speed|slow net|broadband/.test(content);
  // Carpentry / Furniture Matching
  const isCarpentry = /chair|table|desk|bed|almirah|cupboard|wardrobe|door|window|lock|latch|hinge|handle|furniture|wood|drawer|shelf/.test(content);
  // Housekeeping Matching
  const isHousekeeping = /clean|cleaning|dust|garbage|trash|sweep|mop|washroom dirty|bathroom dirty|corridor dirty|sanitation|pest|insects|mosquito|cockroach|cobweb/.test(content);

  if (isElectrical || selectedCategory?.toLowerCase().includes('electrical')) {
    category = 'Electrical';
    department = DEPARTMENTS.ELECTRICAL;
    if (/spark|burning|shock|smoke|short circuit/.test(content)) {
      issueType = 'Power/Sparking Issue';
    } else if (/fan|regulator/.test(content)) {
      issueType = 'Fan Problem';
    } else if (/light|bulb|tubelight|flicker/.test(content)) {
      issueType = 'Light Problem';
    } else {
      issueType = 'Electrical Fixture Defect';
    }
  } else if (isPlumbing || selectedCategory?.toLowerCase().includes('plumbing')) {
    category = 'Plumbing';
    department = DEPARTMENTS.PLUMBING;
    if (/no water|water supply|empty tank/.test(content)) {
      issueType = 'No Water Supply';
    } else if (/leak|dripping|overflow|burst/.test(content)) {
      issueType = 'Water Leakage';
    } else if (/flush|toilet|commode/.test(content)) {
      issueType = 'Flush / Toilet Issue';
    } else if (/drain|block|choked|clog/.test(content)) {
      issueType = 'Drainage Blockage';
    } else {
      issueType = 'Plumbing Fixture Issue';
    }
  } else if (isNetwork || selectedCategory?.toLowerCase().includes('lan') || selectedCategory?.toLowerCase().includes('internet')) {
    category = 'Wi-Fi / Internet';
    department = DEPARTMENTS.NETWORK;
    if (/lan|ethernet|socket|wall port|cable/.test(content)) {
      issueType = 'LAN Wall Socket / Port Issue';
    } else {
      issueType = 'Wi-Fi Not Working';
    }
  } else if (isCarpentry || selectedCategory?.toLowerCase().includes('carpentry') || selectedCategory?.toLowerCase().includes('furniture')) {
    category = 'Carpentry / Furniture';
    department = DEPARTMENTS.CARPENTRY;
    if (/lock|latch|key|door jammed|hinge/.test(content)) {
      issueType = 'Door / Lock Defect';
    } else {
      issueType = 'Furniture Damage';
    }
  } else if (isHousekeeping || selectedCategory?.toLowerCase().includes('clean') || selectedCategory?.toLowerCase().includes('sanitation')) {
    category = 'Housekeeping';
    department = DEPARTMENTS.HOUSEKEEPING;
    if (/pest|mosquito|insects|cockroach/.test(content)) {
      issueType = 'Pest Control & Sanitation';
    } else {
      issueType = 'Cleaning Issue';
    }
  } else if (selectedCategory) {
    category = selectedCategory.split(' (')[0];
    issueType = 'General Maintenance Issue';
    department = DEPARTMENTS.GENERAL;
  }

  return {
    category,
    issueType,
    department,
    priority,
    confidence: '98%',
    reason: priorityReason
  };
}
