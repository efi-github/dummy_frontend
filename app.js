// Data for circles
let data;
let colorscale;

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

const rgbColor = hsvToRgb(80 / 360, 0.9, 0.9); // Converting hue to [0,1] range

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
// Function that generates our new color scale function
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



const tooltip = d3.select('body').append('div')
  .attr('class', 'tooltip');

// Load the JSON file into the variable
Promise.all([
  fetch('http://localhost:8000/projects/1/plots/?all=true').then(response => response.json()),
  fetch('http://localhost:8000/projects/1/codes/tree').then(response => response.json())
])
  .then(([jsonData, codeTreeData]) => {
    data = jsonData.data;

    assignColors(codeTreeData.codes);
    colorScale = newColorScale;

        /*d3.scaleSequential()
  .domain([d3.min(data, d => d.code), d3.max(data, d => d.code)])
  .interpolator(d3.interpolateViridis);  // you can also use d3.interpolatePlasma, d3.interpolateMagma, etc.
*/
    container
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => {
    d.x = 100* d.reduced_embedding.x;  // Log data
    return d.x;
  })
        .attr('cy', (d) => {
    d.y = 100* d.reduced_embedding.y;  // Log data
    return d.y;
  })
        .attr('fill', d => {
            return colorScale(d.code);
        })
      .attr('r', 10)
      .on('mouseover', function(event, d) {
    const circleColor = colorScale(d.code);
    // Create a "weaker" version of the circle color, e.g., by adding opacity
    const weakColor = d3.color(circleColor).copy({opacity: 0.5});
    const path = findCodePath(codeTreeData.codes, d.code);

    tooltip
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY + 10}px`)
      .style('display', 'inline-block')
      .style('background-color', weakColor)
      .html(`Annotation: ${path} (${d.code})<br>Segment: ${d.segment}`);
  })
  .on('mouseout', function() {
    tooltip.style('display', 'none');
  })
  .call(drag);

    // You can also continue with D3.js operations here
    // For example, update the chart based on the loaded data
  })
  .catch(error => console.error('Error loading data:', error));

// SVG and container group
const svg = d3.select('#canvas');
const container = d3.select('#container');


let linesData = [];

// Function to update the line list
const updateLineList = () => {
  // Clear the list first
  d3.select('#lineList').html('');

  // Filter out line data objects that don't have associated lines
  const existingLinesData = linesData.filter(lineData => lineData.line);

  // Re-create list items
  existingLinesData.forEach((lineData, index) => {
    const listItem = d3.select('#lineList')
      .append('div')
      .attr('class', 'list-item');
  const circleColor = colorScale(lineData.data.code);

  // Create a "weaker" version of the circle color by adding opacity
  const weakColor = d3.color(circleColor).copy({opacity: 0.5});

  // Apply the weak color as the background of the list item
  listItem.style('background-color', weakColor);

    listItem.append('span')
      .text(`Movement of segment \"${lineData.data.segment}\"`);

    listItem.append('button')
  .text('Delete')
  .on('click', () => {
    // Remove the line and hitBox
    lineData.line.remove();
    lineData.hitBox.remove();

    // Remove this lineData from the linesData array
    linesData = linesData.filter(ld => ld.id !== lineData.id);
    updateLineList();
  });

    listItem.append('button')
      .text('Red')
      .on('click', () => {
        lineData.line.attr('stroke', 'red');
      });
  });
};



// Create arrow marker
svg.append("defs").selectAll("marker")
  .data(["end"])
  .enter().append("marker")
  .attr("id", String)
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 0)
  .attr("refY", 0)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M0,-5L10,0L0,5");

// Drag behavior for lines
const lineDrag = d3.drag()
  .on('drag', function (event, d) {
    d.x2 = event.x;
    d.y2 = event.y;
    d3.select(this)
      .attr('cx', d.x2)
      .attr('cy', d.y2);
    d.line.attr('x2', d.x2).attr('y2', d.y2);
    const found = linesData.find(ld => ld.id === d.id);
  if (found) {
    found.x2 = event.x;
    found.y2 = event.y;
  }
    updateLineList();
  });

// Drag behavior for circles

const drag = d3.drag()
  .on('start', function (event, d) {
    if (d.line) {
      d.line.remove();
      d.hitBox.remove();
      linesData = linesData.filter(ld => ld.id !== d.id);
    }
    //const lineId = Date.now();
    const lineData = { x1: d.x, y1: d.y, x2: event.x, y2: event.y, data: d};
    const newLine = container.append('line')
      .datum(lineData)
      .attr('x1', lineData.x1)
      .attr('y1', lineData.y1)
      .attr('x2', lineData.x2)
      .attr('y2', lineData.y2)
      .attr('stroke', lineData => colorScale(lineData.data.code))
      .attr('stroke-width', 5)
      .attr('marker-end', 'url(#end)');

    const newHitBox = container.append('circle')
      .datum(lineData)
      .attr('cx', lineData.x2)
      .attr('cy', lineData.y2)
      .attr('r', 10)
      .attr('opacity', 0) // setting to visible for debugging
      .call(lineDrag);

    // Attach line reference to the hitBox data
    lineData.line = newLine;
    lineData.hitBox = newHitBox;
    lineData.id = d.id;
    lineData.data = d;

    d.line = newLine;
    d.hitBox = newHitBox;
    //d.id = lineId;
    linesData.push(lineData);  // Add the new lineData object to the array
    updateLineList();  // Update the line list
  })
  .on('drag', function (event, d) {
    d.line
      .attr('x2', event.x)
      .attr('y2', event.y);

    d.hitBox
      .attr('cx', event.x)
      .attr('cy', event.y);
    const found = linesData.find(ld => ld.id === d.id);
  if (found) {
    found.x2 = event.x;
    found.y2 = event.y;
  }
    updateLineList();  // Update the line list
  });


const zoom = d3.zoom()
  .scaleExtent([0.1, 50])
  .on('zoom', (event) => {
    container.attr('transform', event.transform);

    // Dynamically select all circles within the container
    const dots = container.selectAll('circle');

    let scale = event.transform.k;

    if (scale > 1) {
      // We apply the inverse scale on the dots to keep them the same screen size
      dots.attr('r', 10*(1/scale));
    } else {
      // Reset the transform to keep the dots zooming along with the rest of the graphics
      dots.attr('transform', 'scale(1)');
    }
  });


// Attach zoom behavior to SVG
svg.call(zoom);

// Draw circles


// Function to log lines
function logLinesData() {
  const lines = d3.selectAll('line').data();
  console.log(lines);
}

function train_points_backend()
{
    result = []
    const lines = d3.selectAll('line').data();
    for (let i=0; i<lines.length; i++)
    {
        const current_line = lines[i]
        result.push({id: current_line.data.id, pos: [current_line.x2, current_line.y2]})
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://127.0.0.1:8000/projects/1/dynamic/correction?epochs=50");
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

    // Convert the result array to JSON and send it
    console.log(JSON.stringify(result))
    xhr.send(JSON.stringify(result));
}
// Add button
d3.select('body').append('button')
  .text('Log Line Data')
  .on('click', train_points_backend);
