import utilities from "./utilities.js";




class TrainSlide {
    constructor(plot){
        this.plot = plot;
    }

    update(){

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
    }

    draw(plotter) {
        this.circle = plotter.container.append('circle')
                         .attr('class', 'dot')
                         .attr('cx', this.x)
                         .attr('cy', this.y)
                         .attr('r', 5)
                         .attr('fill', this.color)  // Add fill color
                         .on('mouseover', (event) => {
                             this.showTooltip(plotter.svg);
                         })
                         .on('mouseout', (event) => {
                             this.hideTooltip();
                         });
        this.setDragBehavior(plotter);
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
    remove()
    {
        if (this.dot.line == this){
            this.dot.line = null;
        }
        if (this.element) {
            this.element.remove();
        }

    }
        draw(plotter) {
        console.log(this)
        this.element = plotter.container.append('line')
            .attr('x1', this.start.x)
            .attr('y1', this.start.y)
            .attr('x2', this.end_x)
            .attr('y2', this.end_y)
            .attr('stroke', this.dot.color) // or whatever style you want
            .attr('stroke-width', 2)///this.dot.plot.svg._groups[0][0].__zoom.k)
        .attr("marker-end", "url(#arrowhead)");

        this.hitbox = plotter.container.append('circle')
            .attr('cx', this.end_x)
            .attr('cy', this.end_y)
            .attr('r', 5)  // Adjust the radius for your preference
            .style('fill', 'transparent')
            .style('cursor', 'pointer');

        this.enableDrag(plotter);
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
            .scaleExtent([0.1, 50])  // Adjust as per your requirements
            .on('zoom', (event) => {
                this.container.attr('transform', event.transform);
                const scale = event.transform.k;
                const dots = this.container.selectAll('.dot');
                if (scale > 1) {
                    dots.attr('r', 5 / scale);  // If original radius is 5
                } else {
                    dots.attr('r', 5);
                }
            });

        this.svg.call(this.zoom);

        this.update();
    }

    fetchData() {
        console.log("fetching data...")
        const endpoint = this.source + "projects/" + this.projectId + "/plots/?all=true"
        return fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                this.data = data['data'].map(item => new Dot(item.id, item.reduced_embedding.x, item.reduced_embedding.y, item.segment, item.sentence, item.code, this));
                return this.data;
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
        this.fetchData().then(data => {
            this.render();
        });
    }

    render() {
        this.data.forEach(dot => {
            dot.draw(this);
        });
    }
}
// Usage
const plot = new DotPlotter('container', 1, "http://localhost:8000/");
plot.update();

