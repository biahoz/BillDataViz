// // set the dimensions and margins of the diagram
// var margin = {top: 20, right: 90, bottom: 30, left: 90},
//   width = 660 - margin.left - margin.right,
//   height = 500 - margin.top - margin.bottom;





  // load the external data
d3.json("offset0.json", function(error, data) {
  if (error) throw error;

  for (a in json.data) {
          result.innerText = result.innerText + json.data[a].latest_major_action_date + "\n";
      }
})


// from adam's example
var execute = function () {
        var svg = d3.select("svg");
        svg.append("path")
                .style("fill", "none")
                .style("stroke", "black")
                .style("stroke-width", 2)
                .attr("d", "M 10 10 L 200 200 " +
                        "L 200 400 L 300 100 L 400 150");
    }

var button = d3.select("body").append("button");
button.text("Run!");
button.on("click", execute);