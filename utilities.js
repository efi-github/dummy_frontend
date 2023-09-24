
function hsvToRgb(h, s, v) {
  let r, g, b;
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function findCodePath(tree, code_id, currentPath = "") {
  for (const key in tree) {
    const node = tree[key];
    const newPath = currentPath ? `${currentPath}-${node.name}` : node.name;

    if (node.id === code_id) {
      return newPath;
    }

    const subcategories = node.subcategories;
    const result = findCodePath(subcategories, code_id, newPath);
    if (result) return result;
  }
  return null;
}

const idToColorMap = {};

function assignColors(codes, hueOffset=0, saturation=100, value=100, depth=0, hueStep=20, satStep=5, valStep=10) {
  let hue = hueOffset;
  let sat = saturation;
  let val = value;

  // Larger hue step for root categories
  if (depth === 0) {
    hueStep = 360 / Object.keys(codes).length;
  }

  for (const id in codes) {
    const category = codes[id];

    // Set the hue, making sure it's cycled within the 0-359 range
    const newHue = hue % 360;
    sat = sat % 100;  // Keep saturation within 0-100 range
      sat = Math.max(60, sat);

    const color =hsvToRgb(hue/380, sat/100, val/100);

    category.color = color;
    idToColorMap[id] = color;

    if (Object.keys(category.subcategories).length > 0) {
      // Increment hue and saturation for the next level, but reduce the step to keep colors close
      assignColors(category.subcategories, hue + hueStep, sat + satStep, value, depth + 1, hueStep, satStep, valStep);
    }

    // Increment hue and saturation for each category to make them distinct
    hue += hueStep;
    sat += satStep;
    val += valStep;

    val = val % 60 + 20;  // Keep value within 0-100 range

    // Cycle saturation back to 30 if it reaches 100, to ensure variety while avoiding very low saturation
    if (sat >= 100) {
      sat = 60;
    }
    if (sat <= 60) {
      sat = 100;
    }
  }
}

function newColorScale(code_id) {
    return idToColorMap[code_id] || "#808080"; // Fallback to gray
  }

  export default {
  hsvToRgb,
  findCodePath,
  idToColorMap,
  assignColors,
  newColorScale
};