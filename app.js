import utilities from "./utilities.js";




class TrainSlide {
    constructor(plot){
        console.log("Creating train slide...")
        this.plot = plot;
        this.plot.train_slide = this;
        //this.interval = setInterval(() => this.update(), 10 * 1000);
        this.setupTrainLinesButton();
    }
    setupTrainLinesButton() {
        const button = document.getElementById('trainLinesButton');
        button.addEventListener('click', () => this.trainLines());
    }

    trainLines() {
    // Transform lines data into the desired format
    const formattedData = this.plot.lines.map(line => {
        return {
            id: line.dot.dotId,
            pos: [line.end_x, line.end_y]
        };
    });

    const jsonData = JSON.stringify(formattedData); // Convert the formatted data to JSON
    console.log(jsonData);
    fetch(this.plot.source + "projects/" + this.plot.projectId + "/dynamic/correction?epochs=10", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'  // Specify that we're sending JSON data
        },
        body: jsonData  // Attach the JSON data to the request body
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        this.plot.update();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

    update(){
        d3.select('#lineList').html('');
        const existingLinesData = this.plot.lines;
        existingLinesData.forEach((lineData) => {
            const listItem = d3.select('#lineList')
                .append('div')
                .attr('class', 'list-item')
                .style('background-color', d3.color(lineData.dot.color).copy({opacity: 0.5}))
                .append('span')
                .append('div')
                .text(`Segment: \"${lineData.dot.segment}\"`)
                .append('div')
                .text(`Code: \"${utilities.findCodePath(lineData.dot.plot.tree, lineData.dot.code)}\"`)
                .append('div')
                .append('button')
                .text('Delete')
                .on('click', () => {
                    lineData.remove();
                    this.update();
                });
        });
}
}

class ConfigSlide {
    constructor(plot) {
        this.plot = plot;
    }
}
class Dot {
    constructor(dotId, x, y, segment, sentence, code, plot) {
        this.dotId = dotId;
        this.x = x;
        this.y = y;
        this.segment = segment;
        this.sentence = sentence;
        this.code = code;
        this.line = null;
        this.tooltip = null; // for tooltip
        this.circle = null;  // for the circle representation
        this.plot = plot;
        this.color = plot.color_mapper(this.code);
        this.plot.data.push(this)
    }

    draw(plotter) {
        this.circle = plotter.container.append('circle')
                         .attr('class', 'dot')
                         .attr('cx', this.x)
                         .attr('cy', this.y)
                         .attr('r', this.plot.point_r)
                         .attr('fill', this.color)  // Add fill color
                         .on('mouseover', (event) => {
                             this.showTooltip(plotter.svg);
                         })
                         .on('mouseout', (event) => {
                             this.hideTooltip();
                         });
        this.setDragBehavior(plotter);
    }

    move() {
        if (this.circle) {
            this.circle.transition()
                .duration(10 *300)
                .attr("cx", this.x)
                .attr("cy", this.y);
        }
        if (this.line) {
        this.line.updateStart(this.x, this.y);
    }

    }

    showTooltip(svg) {
    const absolutePosition = this.circle.node().getBoundingClientRect();

    this.tooltip = d3.select("body")
                      .append("div")
                      .attr("class", "tooltip")
                      .style("left", (absolutePosition.left + 10) + "px")
                      .style("top", (absolutePosition.top - 10) + "px")
                      .style("display", "block")
                      .style('background-color', d3.color(this.color).copy({opacity: 0.5}));
    this.tooltip.append("div")
                      .text("Segment: "+this.segment)
                      .append("div")
                      .text("Sentence: " + this.sentence)
                      .append("div")
                      .text("Code: " + utilities.findCodePath(this.plot.tree, this.code));
}


    hideTooltip() {
        if (this.tooltip) {
        this.tooltip.remove();
        this.tooltip = null;
    }
    }
    setDragBehavior(plotter) {
        const drag = d3.drag()
            .on('start', (event) => this.dragStart(plotter, event))
            .on('drag', (event) => this.dragMove(event))
            .on('end', (event) => this.dragEnd(event));

        this.circle.call(drag);
    }

    dragStart(plotter, event) {
        if (this.line) {
            this.line.remove();
        }
        this.line = new Line(this);
        this.line.draw(plotter);
    }

    dragMove(event) {
        if (this.line) {
            this.line.updateEnd(event.x, event.y);
        }
    }

    dragEnd(event) {
        if (this.line) {
            // Any logic you want after the drag ends
        }
    }
}

class Line {
    constructor(dot) {
        this.element = null;
    this.start = dot;
    this.end_x = dot.x;
    this.end_y = dot.y;
    this.hitbox = null;
    this.dot = dot;
    dot.line = this;
    dot.plot.lines.push(this);
    }
    updateStart(x, y) {
    this.start.x = x;
    this.start.y = y;
    if (this.element) {
        this.element.transition()
            .duration(10 * 300) // Match the dot's transition duration
            .attr('x1', x)
            .attr('y1', y);
    }
}
    remove()
    {
        console.log("remove line...")
        if (this.dot.line == this){
            this.dot.line = null;
        }
        if (this.dot.plot.lines.includes(this))
        {
            this.dot.plot.lines = utilities.arrayRemove(this.dot.plot.lines, this);
        }
        if (this.element) {
            this.element.remove();
        }

    }
        draw(plotter) {
        const creationZoomScale = d3.zoomTransform(this.dot.plot.svg.node()).k;
        this.element = plotter.container.append('line')
            .attr('x1', this.start.x)
            .attr('y1', this.start.y)
            .attr('x2', this.end_x)
            .attr('y2', this.end_y)
            .attr('stroke', this.dot.color) // or whatever style you want
            .attr('stroke-width', this.dot.plot.point_r/creationZoomScale)
        .attr("marker-end", "url(#arrowhead)");

        this.hitbox = plotter.container.append('circle')
            .attr('cx', this.end_x)
            .attr('cy', this.end_y)
            .attr('r', this.dot.plot.point_r/creationZoomScale)  // Adjust the radius for your preference
            .style('fill', 'transparent')
            .style('cursor', 'pointer');

        this.enableDrag(plotter);
        if (this.dot.plot.train_slide) {
            this.dot.plot.train_slide.update();
        }
    }

        updateEnd(x, y) {
        this.end_x = x;
        this.end_y = y;
        this.element.attr('x2', x).attr('y2', y);
        if (this.hitbox) {
            this.hitbox.attr('cx', x).attr('cy', y);
        }
    }

    enableDrag(plotter) {
        const lineDrag = d3.drag()
            .on('drag', (event) => this.dragLineEnd(event));

        this.hitbox.call(lineDrag);  // Attach the drag behavior to the hitbox
    }

    dragLineEnd(event) {
        this.updateEnd(event.x, event.y);
    }
}

class DotPlotter {
    constructor(containerId, projectId, source) {
        this.containerId = containerId;
        this.source = source;
        this.projectId = projectId;
        this.data = [];
        this.lines = [];
        this.selected = [];
        this.generateColors();
        this.svg = d3.select('#canvas');
        this.container = d3.select('#container');
        this.point_r = 2.5;

        this.svg.append("defs").append("marker")
                                        .attr("id", "arrowhead")
                                        .attr("viewBox", "0 -5 10 10")
                                        .attr("refX", 5)
                                        .attr("refY", 0)
                                        .attr("orient", "auto")
                                        .attr("markerWidth", 5)
                                        .attr("markerHeight", 5)
                                        .attr("xoverflow", "visible")
                                        .append("svg:path")
                                        .attr("d", "M 0,-5 L 10,0 L 0,5")
                                        .attr("fill", "#999")
                                        .style("stroke", "none");

        this.zoom = d3.zoom()
            .scaleExtent([0.01, 1000])  // Adjust as per your requirements
            .on('zoom', (event) => {
                this.container.attr('transform', event.transform);
                const scale = event.transform.k;
                const dots = this.container.selectAll('.dot');
                const lines = this.container.selectAll('line');
                const hitbox = this.container.selectAll('circle')
                lines.attr('stroke-width', this.point_r / scale);
                hitbox.attr('r', this.point_r/scale)
                if (scale > 1.5) {
                    dots.attr('r', this.point_r / scale);  // If original radius is this.point_r
                } else {
                    dots.attr('r', this.point_r);
                }
            });

        this.svg.call(this.zoom);
        this.update().then(() => {
                this.homeView();
                //this.interval = setInterval(() => this.update(), 10 * 300);
            }
        );
        this.setupTrainButton();

    }
    /*
    setupTrainButton() {
        document.getElementById("plotTrainButton")
            .addEventListener("click", () => this.trainForEpochs(10));

    }*/
    setupTrainButton() {
    const trainButton = document.getElementById("plotTrainButton");
    trainButton.addEventListener("click", () => {
        if (trainButton.textContent === "Train") {
            this.toggleTrainButtonState();
            this.trainForEpochs(10);
        } else {
            this.stopTraining = true;
        }
    });
}
toggleTrainButtonState() {
    const trainButton = document.getElementById("plotTrainButton");
    if (trainButton.textContent === "Train") {
        trainButton.textContent = "Stop";
        this.stopTraining = false;
    } else {
        trainButton.textContent = "Train";
        this.stopTraining = true;
    }
}
    setFilter(filterFunc) {
        this.filter = filterFunc;
        this.update();
    }
    homeView()
    {
    console.log("home view...");
    const xExtent = d3.extent(this.data, d => d.x);
    const yExtent = d3.extent(this.data, d => d.y);


    // Calculate width and height of the bounding box
    const dataWidth = xExtent[1] - xExtent[0];
    const dataHeight = yExtent[1] - yExtent[0];


    // Calculate the viewport's width and height
    const width = +this.svg.attr("width");
    const height = +this.svg.attr("height");


    // Calculate the scaling factor
    const kx = width / dataWidth;
    const ky = height / dataHeight;
    const k = 0.95 * Math.min(kx, ky); // 0.95 is for a little padding


    // Calculate the translation to center the bounding box in the viewport
    const tx = (width - k * (xExtent[1] + xExtent[0])) / 2;
    const ty = (height - k * (yExtent[1] + yExtent[0])) / 2;

    // Apply the zoom transform
    this.svg.transition()
        .call(this.zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));

    }

    train_clusters(){

    }

    fetchData() {
    console.log("fetching data...")
    const endpoint = this.source + "projects/" + this.projectId + "/plots/?all=true"
    return fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            return data['data'];
        })
        .catch(error => {
            console.error('Error fetching plot data:', error);
            throw error;
        });
}

    generateColors(){
        console.log("generating colors...")
        const endpoint = this.source + "projects/" + this.projectId + "/codes/tree"
        return fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                this.tree = data.codes;
                utilities.assignColors(data.codes);
                this.color_mapper = utilities.newColorScale;

            })
            .catch(error => {
                console.error('Error fetching plot data:', error);
                throw error;
            });
    }

    update() {
        return this.fetchData().then(newData => {
            this.render(newData);
        });
    }

    applyCodeFilter(codes) {
        function createCodeFilter(codes) {
        return function(dot) {
            return codes.includes(dot.code);
        };
    }
        const filterFunc = createCodeFilter(codes);
        this.setFilter(filterFunc);
        this.update().then(() => this.homeView());
    }
    /*
    trainForEpochs(epochs) {
    fetch(this.source + "projects/" + this.projectId + "/dynamic/cluster?epochs=" + epochs, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        this.update();
    });
}*/
    trainForEpochs(epochsRemaining) {
    if (this.stopTraining || epochsRemaining <= 0) {
        this.toggleTrainButtonState();
        return;
    }

    fetch(this.source + "projects/" + this.projectId + "/dynamic/cluster?epochs=3", {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        this.update().then(() => this.trainForEpochs(epochsRemaining - 1));
    })
    .catch(error => {
        console.error('Error:', error);
        this.toggleTrainButtonState(); // Ensure the button state is reset if there's an error
    });
}
    render(newData) {
        // Existing Dots
        newData = this.filter ? newData.filter(this.filter) : newData;
        newData.forEach(dotData => {
            let existingDot = this.data.find(d => d.dotId === dotData.id);
            if (existingDot) {
                // Update existing dot
                existingDot.x = dotData.reduced_embedding.x;
                existingDot.y = dotData.reduced_embedding.y;
                existingDot.move();  // Animate transition
            } else {
                // Create new dot
                let newDot = new Dot(dotData.id, dotData.reduced_embedding.x, dotData.reduced_embedding.y, dotData.segment, dotData.sentence, dotData.code, this);
                this.data.push(newDot);
                newDot.draw(this);
            }
        });

        // Optional: remove dots that don't exist in newData
        this.data = this.data.filter(dot => {
            let shouldKeep = newData.find(d => d.id === dot.dotId);
            if (!shouldKeep && dot.circle) {
                dot.circle.remove();
            }
            return shouldKeep;
        });
    }
}
// Usage
const plot = new DotPlotter('container', 1, "http://localhost:8000/");
const train = new TrainSlide(plot);
//plot.applyCodeFilter([2, 19])
