// Smooth Scroll
$(document).ready(function () {
    // Add smooth scrolling to all links
    $("a").on('click', function (event) {

        // Make sure this.hash has a value before overriding default behavior
        if (this.hash !== "") {
            // Prevent default anchor click behavior
            event.preventDefault();

            // Store hash
            var hash = this.hash;

            // Using jQuery's animate() method to add smooth page scroll
            // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 800, function () {

                // Add hash (#) to URL when done scrolling (default click behavior)
                window.location.hash = hash;
            });
        } // End if
    });
});

/*	An array to store all the data */
var items = [];

d3.queue(2)
    .defer(d3.json, "data.json")
    .defer(d3.json, "allData.json")
    .await(function (error, file1, file2) { runall(file1, file2); });

function runall(data, data2) {

    /* Helper function to format and parse date from data */
    function getDate(d) {
        /*	If d is a number or a string in the format Day Month Year
process it as normal. Other wise presume that it may be a string
in the format Month Year and add 1 to the start so that Firefox
and safari can parse the date */
        if (typeof d === "number") {
            return new Date(d);
        } else if (Date.parse(d)) {
            return new Date(d);
        } else {
            return new Date("1 " + d);
        }
    }
    var colourText = ["rgb(94, 94, 94)", "rgba(94, 94, 94,0.5)"]
    var fullData = $(data);

    /* Grab the tables headline and caption so that we can reproduce them in the widget */
    var headline = $(fullData).find("h2.table-heading").text();

    var standfirst = $(data).find("table caption p").text();

    /* Hides the table and shows the SVG if javascript is enabled */

    $(".outerwrapper span.timeline-heading").text(" Hover on a line to see the trajectory of a specific bill, or get more information on a mass shooting event.");
    $(".outerwrapper p.timeline-standfirst").text(standfirst);
    // $(".outerwrapper").css({"display":"block"});

    /*	Push an object into the items array for each table row/point on the timeline */
    for (var i = 0; i < $(data).length; i++) {
        var newObject = {};
        items.push(newObject);
    };

    /*	Add a prorerty to the objects for each column in the table/bit of info we want to show
i.e date, headline, the text, image link and credit */
    for (var i = 0; i < $(data).length; i++) {
        items[i].headline = data[i].Case;

        var dateStart = data[i].Date;
        var dateEnd = data[i].Date;
        items[i].dateStart = data[i].Date;
        items[i].dateEnd = data[i].Date;
        items[i].date1 = getDate(dateStart);
        items[i].date2 = getDate(dateEnd);
        items[i].link = data[i].Sources;
        items[i].text = data[i].Summary;
    };
    /*	Insert an .event div for each event */
    for (var i = 0; i < items.length; i++) {
        $(".outerwrapper .info-box .panel").append('<div class="event-' + i + '"></div>');
    };

    for (var i = 0; i < $('.outerwrapper div[class^="event"]').length; i++) {

        if (items[i].img) {
            $('.outerwrapper div[class="event-' + i + '"]')
                .append('<span class="timeline-img">' + items[i].img + '</span>');
        }

        if (items[i].date1 < items[i].date2) {
            $('.outerwrapper div[class="event-' + i + '"]')
                .append('<h3>' + items[i].dateStart + ' - ' + items[i].dateEnd + '</h3>');
        } else {
            $('.outerwrapper div[class="event-' + i + '"]')
                .append('<h3>' + items[i].dateStart + '</h3>');
        }

        if (items[i].headline) {
            $('.outerwrapper div[class="event-' + i + '"]')
                .append('<h4>' + items[i].headline + ' (' + (i + 1) + ' of ' + items.length + ')</h4>');
        } else {
            $('.outerwrapper div[class="event-' + i + '"]')
                .append('<h4> (' + (i + 1) + ' of ' + items.length + ')</h4>');
        }

        if (items[i].text) {
            $('.outerwrapper div[class="event-' + i + '"]')
                .append('<p>' + items[i].text + '</p>');
        }

        if (items[i].link) {
            $('.outerwrapper div[class="event-' + i + '"]')
                .append('<a class="credit" href="' + items[i].link + '">Link</a>');
        }

        if (items[i].source) {
            $('.outerwrapper div[class="event-' + i + '"]')
                .append('<br><a class="credit" href="' + items[i].source + '">Source</a>')
        }

    };

    var eventWidth = $('.outerwrapper .info-box').width();

    var position = 0;

    var panelWidth = eventWidth * items.length;

    $(".outerwrapper .info-box .panel").css({
        "width": panelWidth + "px"
    });

    /*	Define the dimensions of the SVG */
    var duration = 200;
    var marginTop = 5;
    var marginRight = 0;
    var marginBottom = 40;
    var marginLeft = 0;
    var padding = 2;
    var width = 1600 - marginRight - marginLeft;
    var height = 600 - marginTop - marginBottom;
    var miniHeight = 400;
    var mainHeight = height - miniHeight - 50;
    var zoom = 10;
    var maxZoom = 10;
    var zoomIncrement = 1;
    var valueline = d3.line()
        .curve(d3.curveCatmullRom) //curve
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.billStatus); });

    /*	A global variable to control which event/location to show */
    var counter = 20;

    /*	A global variable to control the amout of ticks visible */
    var ticks = 8;

    /*	Find the earliest and latest time in the range */
    var timeFirst = d3.min(items, function (d) {
        return d.date1.getTime();
    });
    var timeLast = d3.max(items, function (d) {
        // console.log(d.date2);
        return d.date2.getTime();

    });

    /*	Work out the time span of the whole timeline in miliseconds plus one tenth of this value */
    var timeDiff = timeLast - timeFirst;
    timeDiff = timeDiff + (timeDiff * 0.1);


    /*	Extend the time range before the first date and after the last date
to make for a more attractive timeline */
    var timeBegin = getDate(items[counter].date1.getTime() - timeDiff);
    var timeEnd = getDate(items[counter].date1.getTime() + timeDiff);

    /* Scales */
    var x = d3.scaleTime()
        .domain([timeBegin, timeEnd])
        .range([0, width]);

    /*	Create the SVG and its elements */
    var chart = d3.select(".timeline")
        .append("svg")
        .attr("width", width + marginRight + marginLeft)
        .attr("height", height + marginTop + marginBottom)
        .attr("class", "chart");

    /*	Draw the four icons for zooming and moving through the time line as well as their enclosing
rects. Add functionality for hover and click. */
    var zoomInIcon = chart.append("path")
        .attr("d", "M22.646,19.307c0.96-1.583,1.523-3.435,1.524-5.421C24.169,8.093,19.478,3.401,13.688,3.399C7.897,3.401,3.204,8.093,3.204,13.885c0,5.789,4.693,10.481,10.484,10.481c1.987,0,3.839-0.563,5.422-1.523l7.128,7.127l3.535-3.537L22.646,19.307zM13.688,20.369c-3.582-0.008-6.478-2.904-6.484-6.484c0.006-3.582,2.903-6.478,6.484-6.486c3.579,0.008,6.478,2.904,6.484,6.486C20.165,17.465,17.267,20.361,13.688,20.369zM15.687,9.051h-4v2.833H8.854v4.001h2.833v2.833h4v-2.834h2.832v-3.999h-2.833V9.051z")
        .style("pointer-events", "none")
        .attr("transform", "translate(5,60), scale(1.25)");

    var zoomInButton = chart.append("rect")
        .attr("width", 50)
        .attr("height", 50)
        .style("fill", "rgb(94, 94, 94)")
        .style("opacity", 0.2)
        .attr("transform", "translate(0,55)")
        .style("cursor", "pointer")
        .on("click", function (e) {
            if (zoom < maxZoom) {
                zoom += zoomIncrement;
                showLocation();
            };
            d3.event.preventDefault();
            return false;
        })
        .on("mouseover", function () {
            if (zoom < maxZoom) {
                d3.select(this).transition()
                    .duration(duration)
                    .style("opacity", 0.5);
            };
        })
        .on("mouseout", function () {
            d3.select(this).transition()
                .duration(duration)
                .style("opacity", 0.2);
        });

    var zoomOutIcon = chart.append("path")
        .attr("d", "M22.646,19.307c0.96-1.583,1.523-3.435,1.524-5.421C24.169,8.093,19.478,3.401,13.688,3.399C7.897,3.401,3.204,8.093,3.204,13.885c0,5.789,4.693,10.481,10.484,10.481c1.987,0,3.839-0.563,5.422-1.523l7.128,7.127l3.535-3.537L22.646,19.307zM13.688,20.369c-3.582-0.008-6.478-2.904-6.484-6.484c0.006-3.582,2.903-6.478,6.484-6.486c3.579,0.008,6.478,2.904,6.484,6.486C20.165,17.465,17.267,20.361,13.688,20.369zM8.854,11.884v4.001l9.665-0.001v-3.999L8.854,11.884z")
        .style("pointer-events", "none")
        .attr("transform", "translate(55,60), scale(1.25)");

    var zoomOutButton = chart.append("rect")
        .attr("width", 50)
        .attr("height", 50)
        .style("fill", "rgb(94, 94, 94)")
        .style("opacity", 0.2)
        .attr("transform", "translate(50,55)")
        .style("cursor", "pointer")
        .on("click", function (e) {
            if (zoom > 1) {
                zoom -= zoomIncrement;
                showLocation();
            };

            d3.event.preventDefault();
            return false;
        })
        .on("mouseover", function () {
            if (zoom > 1) {
                d3.select(this).transition()
                    .duration(duration)
                    .style("opacity", 0.5);
            };

        })
        .on("mouseout", function () {
            d3.select(this).transition()
                .duration(duration)
                .style("opacity", 0.2);
        });

    var leftIcon = chart.append("path")
        .attr("d", "M20.834,8.037L9.641,14.5c-1.43,0.824-1.43,2.175,0,3l11.193,6.463c1.429,0.826,2.598,0.15,2.598-1.5V9.537C23.432,7.887,22.263,7.211,20.834,8.037z")
        .style("pointer-events", "none")
        .attr("transform", "translate(0,0), scale(1.5)");

    var leftButton = chart.append("rect")
        .attr("width", 50)
        .attr("height", 50)
        .style("fill", "rgb(94, 94, 94)")
        .style("opacity", 0.2)
        .attr("transform", "translate(0,0)")
        .style("cursor", "pointer")
        .on("click", function (e) {
            if (counter < (items.length - 1)) {
                counter += 1;
            };
            showLocation();
            d3.event.preventDefault();
            return false;
        })
        .on("mouseover", function () {

            if (counter < (items.length - 1)) {
                d3.select(this).transition()
                    .duration(duration)
                    .style("opacity", 0.5);
            };
        })
        .on("mouseout", function () {
            d3.select(this).transition()
                .duration(duration)
                .style("opacity", 0.2);
        });

    var rightIcon = chart.append("path")
        .attr("d", "M11.166,23.963L22.359,17.5c1.43-0.824,1.43-2.175,0-3L11.166,8.037c-1.429-0.826-2.598-0.15-2.598,1.5v12.926C8.568,24.113,9.737,24.789,11.166,23.963z")
        .style("pointer-events", "none")
        .attr("transform", "translate(50,0), scale(1.5)");

    var rightButton = chart.append("rect")
        .attr("width", 50)
        .attr("height", 50)
        .style("fill", "rgb(94, 94, 94)")
        .style("opacity", 0.2)
        .attr("transform", "translate(50,0)")
        .style("cursor", "pointer")
        .on("click", function (e) {
            if (counter > 0) {
                counter -= 1;
            };

            showLocation();
            d3.event.preventDefault();
            return false;
        })
        .on("mouseover", function () {

            if (counter > 0) {
                d3.select(this).transition()
                    .duration(duration)
                    .style("opacity", 0.5);
            };

        })
        .on("mouseout", function () {
            d3.select(this).transition()
                .duration(duration)
                .style("opacity", 0.2);
        });


    /*	Prepare a cliping path to stop the locations and scales breaking spilling over the edges
of the SVG in IE */
    chart.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height + marginTop + marginBottom);

    chart.append("g")
        .append("rect")
        .attr("x", 0)
        .attr("y", (height - miniHeight))
        .attr("width", width)
        .attr("height", miniHeight)
        .attr("fill", "#ffffff")
        .style("opacity", 0.5);

    var miniHolder = chart.append("g")
        .attr("clip-path", "url(#clip)");

    var mini = miniHolder.append("g")
        .attr("width", width)
        .attr("height", miniHeight)
        .attr("class", "mini")
        .attr("transform", "translate(0," + (height - miniHeight) + ")")

    /* create three seperate x axis for Year, Month and Day based on the same x scale */
    var xYearAxis = d3.axisTop()
        .scale(x).tickFormat(d3.timeFormat('%Y')).tickArguments(d3.timeYear, 1).tickSize(15);


    var yearAxis = mini.append('g')
        .attr('class', 'year-axis')
        .call(xYearAxis);

    var xMonthAxis = d3.axisTop()
        .scale(x).tickSize(-miniHeight, 0);

    var monthAxis = mini.append('g')
        .attr('class', 'axis')
        .call(xMonthAxis);

    var xDayAxis = d3.axisBottom()
        .scale(x)
        .tickSize(10)
        .tickFormat(function (d) {
            return '';
        });

    var dayAxis = mini.append('g')
        .attr('class', 'axis')
        .attr("transform", "translate(0," + (miniHeight - 10) + ")")
        .call(xDayAxis);

    /* draw the static triangle to act as a pointer */
    chart.append("path")
        .attr("d", "M10,0 L20,20 L0,20z")
        .style("fill", "#999999")
        .style("pointer-events", "none")
        .attr("transform", "translate(" + ((width / 2) - 10) + "," + height + ")");

    /* 	Add rect for each point on the timeline */
    // gunshotincident
    var locations = mini.append("g").selectAll("rect")
        .data(items)
        .enter()
        .append("rect")
        .attr("class", function (d, i) {
            if (i === counter) {
                return "locations selected";
            } else {
                return "locations";
            };
        })
        .attr("x", function (d, i) {
            // console.log(d.date1);
            return x(d.date1);

        })
        .attr("y", function (d, i) {
            return 0;
        })
        .attr("width", function (d) {
            if (d.date1 < d.date2) {
                return 1;
            } else {
                return 1;
            }
        })
        .attr("height", function (d, i) {
            return miniHeight;
        })
        .on("mouseover", function (d, i) {

            if (d.date1 < d.date2) {
                d3.select(".outerwrapper .timeline .tooltip")
                    .html("<p>" + d.dateStart + " - <br />" + d.dateEnd + "</p><br><p>" + d.headline + "</p>");
            } else {
                d3.select(".outerwrapper .timeline .tooltip")
                    .html("<p>" + d.dateStart + "</p><br><p>" + d.headline + "</p>");
            }

            var eventLeft = parseInt(d3.select(this).attr("x"));
            var eventWidth = parseInt(d3.select(this).attr("width"));

            var eventTop = parseInt(d3.select(this).attr("y"));

            var tooltipHeight = parseInt($(".outerwrapper .timeline .tooltip").css("height"));

            $(".outerwrapper .timeline .tooltip")
                .css({
                    "left": eventLeft + (eventWidth / 2) + "px",
                    "top": 145 - (tooltipHeight - eventTop) + "px"
                });

            $(".outerwrapper .timeline .tooltip").css({
                "opacity": 1,
                "display": "block"
            });

        })
        .on("mouseout", function () {
            $(".outerwrapper .timeline .tooltip").css({
                "opacity": 0,
                "display": "none"
            });
        })
        .on("click", function (d, i) {
            counter = i;

            showLocation();

            $(".outerwrapper .timeline .tooltip").css({
                "opacity": 0,
                "display": "none"
            });

            d3.event.preventDefault();
            return false;
        })
    ///////////////////////////

    var parseTime = d3.timeParse("%Y-%m-%d");

    var parseTime = d3.timeParse("%Y-%m-%d");

    //format date data
    var formatTime = d3.timeFormat("%b %d %Y");

    //function to determine date
    //1 always exists
    //check if 2 exists, if yes then return
    //if it doesn't exist, then return the last existing points
    function getBillDate(point, introduced_date, house_passage, senate_passage, enacted, vetoed) {

        //create date array to store dates
        var dateArray = [0, 0, 0, 0];
        //create var to store last date
        var lastDate;

        //store introduced date
        dateArray[0] = introduced_date;
        lastDate = introduced_date;

        //check cases for if house or senate is first
        if (house_passage == null && senate_passage == null) {
            //set both to lastDate
            dateArray[1] = lastDate;
            dateArray[2] = lastDate;
        }
        else if (house_passage != null && senate_passage == null) {
            //if present, store in array
            dateArray[1] = house_passage;
            //update last date
            lastDate = house_passage;
            dateArray[2] = lastDate;
        } else if (house_passage == null && senate_passage != null) {
            //if present, store in array
            dateArray[1] = senate_passage;
            //update last date
            lastDate = senate_passage;
            dateArray[2] = lastDate;
        } else if (house_passage != null && senate_passage != null) {
            if (house_passage < senate_passage) {
                dateArray[1] = house_passage;
                dateArray[2] = senate_passage;
                lastDate = senate_passage;
            } else {
                dateArray[1] = senate_passage;
                dateArray[2] = house_passage;
                lastDate = house_passage;
            }
        }

        if (enacted != null) {
            dateArray[3] = enacted;
            lastDate = enacted;
        } else {
            dateArray[3] = lastDate;
        }

        if (vetoed != null) {
            dateArray[3] = vetoed;
            lastDate = vetoed;
        }
        else {
            dateArray[3] = lastDate;
        }

        return dateArray[point];
    }

    function getStatus(point, introduced_date, house_passage, senate_passage, enacted, vetoed) {
        var d1 = new Date();
        var d2 = new Date();

        //create date array to store dates
        var statusArray = [0, 0, 0, 0];
        //create var to store last date
        var lastStatus;

        //store introduced date
        statusArray[0] = 'Introduced';
        lastStatus = 'Introduced';

        //check cases for if house or senate is first
        if (house_passage == null && senate_passage == null) {
            //set both to lastDate
            statusArray[1] = lastStatus;
            statusArray[2] = lastStatus;
        }
        else if (house_passage != null && senate_passage == null) {
            //if present, store in array
            statusArray[1] = 'Passed House';
            //update last date
            lastStatus = 'Passed House';
            statusArray[2] = lastStatus;
        } else if (house_passage == null && senate_passage != null) {
            //if present, store in array
            statusArray[1] = 'Passed Senate';
            //update last date
            lastStatus = 'Passed Senate';
            statusArray[2] = lastStatus;
        } else if (house_passage != null && senate_passage != null) {
            if (house_passage < senate_passage) {
                statusArray[1] = 'Passed House';
                statusArray[2] = 'Passed Senate';
                lastStatus = 'Passed Senate';
            } else {
                statusArray[1] = 'Passed Senate';
                statusArray[2] = 'Passed House';
                lastStatus = 'Passed House';
            }
        }

        if (enacted != null) {
            statusArray[3] = 'Enacted';
            lastStatus = 'Enacted';
        } else {
            statusArray[3] = lastStatus;
        }

        if (vetoed != null) {
            statusArray[3] = 'Vetoed';
            lastStatus = 'Vetoed';
        }
        else {
            statusArray[3] = lastStatus;
        }

        return statusArray[point];
    }

    function getSizeByCosponsor(cosponsors) {
        var maxValue, maxCircleRadius;


        var scale = d3.scaleSqrt()
            .domain([0, 300])
            .range([2, 10]);

        return scale(cosponsors);
    }

    var x = d3.scaleTime().range([0, width]);
    var y = d3.scalePoint().range([height, 0]);

    var lineArray = [];
    var lineCount = 0;
    var bill;
    var allshowdata = [];

    data2.forEach(function (d) {

        //get relevant data points
        //parse into appropriate data formats
        d.bill_id = d.bill_id;
        d.govtrack_url = d.govtrack_url;
        d.number = d.number;
        d.sponsor_party = d.sponsor_party;
        d.active = d.active;

        d.introduced_date = parseTime(d.introduced_date); //for dates
        d.latest_major_action_date = parseTime(d.latest_major_action_date);
        d.house_passage = parseTime(d.house_passage);
        d.senate_passage = parseTime(d.senate_passage);
        d.enacted = parseTime(d.enacted);
        d.vetoed = parseTime(d.vetoed);

        d.cosponsors = +d.cosponsors; //for numbers

        //user defined data points
        //calculate status
        d["billStatus"] = getStatus(3, d.introduced_date, d.house_passage, d.senate_passage, d.enacted, d.vetoed);
        //calculate radius
        d["radius"] = +getSizeByCosponsor(d.cosponsors);

        //create objects of points to show
        var point0 = new Object();
        var point1 = new Object();
        var point2 = new Object();
        var point3 = new Object();

        //add properties to points
        point0.billStatus = getStatus(0, d.introduced_date, d.house_passage, d.senate_passage, d.enacted, d.vetoed);
        point1.billStatus = getStatus(1, d.introduced_date, d.house_passage, d.senate_passage, d.enacted, d.vetoed);
        point2.billStatus = getStatus(2, d.introduced_date, d.house_passage, d.senate_passage, d.enacted, d.vetoed);
        point3.billStatus = getStatus(3, d.introduced_date, d.house_passage, d.senate_passage, d.enacted, d.vetoed);

        point0.date = getBillDate(0, d.introduced_date, d.house_passage, d.senate_passage, d.enacted, d.vetoed);
        point1.date = getBillDate(1, d.introduced_date, d.house_passage, d.senate_passage, d.enacted, d.vetoed);
        point2.date = getBillDate(2, d.introduced_date, d.house_passage, d.senate_passage, d.enacted, d.vetoed);
        point3.date = getBillDate(3, d.introduced_date, d.house_passage, d.senate_passage, d.enacted, d.vetoed);

        point0.number = d.number;
        point1.number = d.number;
        point2.number = d.number;
        point3.number = d.number;

        point0.sponsor_party = d.sponsor_party;
        point1.sponsor_party = d.sponsor_party;
        point2.sponsor_party = d.sponsor_party;
        point3.sponsor_party = d.sponsor_party;

        point0.govtrack_url = d.govtrack_url;
        point1.govtrack_url = d.govtrack_url;
        point2.govtrack_url = d.govtrack_url;
        point3.govtrack_url = d.govtrack_url;

        //add points to array
        var showDates = [];
        showDates.push(point0);
        showDates.push(point1);
        showDates.push(point2);
        showDates.push(point3);

        y.domain(['Vetoed', 'Introduced', 'Passed House', 'Passed Senate', 'Enacted']);

        // define the line

        var lineName = "line" + lineCount.toString();
        var idLineName = "#" + lineName;
        lineArray.push(valueline);

        //     //hover to select
        //     // Determine if current line is visible
        var active = lineArray[lineCount].active ? false : true,
            newOpacity = active ? 0 : 1;

        lineCount++; //increment count
        allshowdata.push(showDates);
    }); //end loop
    //   console.log(allshowdata);
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    for (var i = 0; i < allshowdata.length; i++) {
        // console.log(allshowdata[i]);
        var lineName = "line" + i.toString();
        var idLineName = "#" + lineName;
        var bill = chart.append("path")
            .datum(allshowdata[i]) //pass an array of the dates
            .attr("class", "line")
            .attr("d", valueline)
            .attr("id", lineName);
        var drawdots = chart.selectAll("dot")
            // //filter to show only the first and last points
            .data(allshowdata[i].filter(function (d, i) { return (d && i == 3) || (d && i == 0); }))
            // .data(showDates)
            .enter().append("circle")
            .attr("r", 5)
            .attr("cx", function (d) { return x(d.date); })
            .attr("cy", function (d) { return y(d.billStatus); })
            //change color of dot
            .style("fill", function (d) {
                if (d.sponsor_party == "D") { return "darkblue"; }
                else { return "darkred"; }   
            }) //Do something
            .on("mouseover", function (d) {
                div.transition()
                    .duration(100)
                    .style("opacity", .9);
                //content of tooltip
                div.html(d.number + "<br/>" + formatTime(d.date) + "<br/>" + d.billStatus + "<br/><a href=\"" + d.govtrack_url + "\" target=\"_blank\">Link</a>")
                    .style("left", (d3.event.pageX + 28) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
                //hover to select
                // Determine if current line is visible
                var active = lineArray[lineCount].active ? false : true,
                    newOpacity = active ? 0 : 1;
                // Hide or show the elements
                d3.select(idLineName).style("opacity", newOpacity);
                // Update whether or not the elements are active
                lineArray[lineCount].active = active;
                if (d3.select(idLineName).style("opacity") != 0) {
                    div.transition()
                        .duration(100)
                        .style("opacity", .8);
                }
                div.html(d.number + "<br/>" + formatTime(d.date) + "<br/>" + d.billStatus + "<br/><a href=\"" + d.govtrack_url + "\" target=\"_blank\">Link</a>")
                    .style("left", (d3.event.pageX + 28) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");



            });
        chart.selectAll(".line")
            .on("mouseover", function (d) {
                d3.select(this)                          //on mouseover of each line, give it a nice thick stroke
                    .style("stroke-width", '3px')
                    .style("stroke", '#3a3a3a')
                    .style("z-index", 1000);
                var selectthegraphs = $('.line').not(this);     //select all the rest of the lines, except the one you are hovering on and drop their opacity
                d3.selectAll(selectthegraphs)
                    .style("opacity", 0)
                    .style("z-index", -1);
            })
            .on("mouseout", function (d) {
                d3.select(this)                          //on mouseover of each line, give it a nice thick stroke
                    .style("stroke-width", '2px')
                    .style("stroke", 'lightgrey');
                var selectthegraphs = $('.line').not(this);     //select all the rest of the lines, except the one you are hovering on and drop their opacity
                d3.selectAll(selectthegraphs)
                    .style("opacity", 1);
            });
    }
    // Add the Y Axis
    chart.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y))
        //tick labels
        .selectAll("text");
    // .style("fill","white");

    // text label for the y axis
    mini.append("text")
        .attr("class", "axislabel")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginLeft)
        .attr("x", 0 - (0))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Enacted");
    mini.append("text")
        .attr("class", "axislabel")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginLeft)
        .attr("x", 0 - (miniHeight / 3))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Senate");
    mini.append("text")
        .attr("class", "axislabel")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginLeft)
        .attr("x", 0 - (2 * miniHeight / 3))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("House");
    mini.append("text")
        .attr("class", "axislabel")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - marginLeft)
        .attr("x", 0 - (miniHeight))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Introduced");

    /*	Function to add the info for the next selected location
Adds the relevent content to info-box and provides a new value for xPosition
to center the timeline on the selected location*/

    function showLocation() {
        mini.selectAll("circle").remove();
        mini.selectAll("path").remove();


        position = eventWidth * counter;

        $('.outerwrapper .info-box').animate({
            scrollLeft: position
        }, duration);

        /*	Recalculate the start and end point of the time range based upon
the current location and the zoom level */
        timeBegin = getDate(items[counter].date1.getTime() - (timeDiff / zoom));
        timeEnd = getDate(items[counter].date1.getTime() + (timeDiff / zoom));
        // console.log(timeDiff);
        /*	Replace the values used in the x domain */
        x.domain([timeBegin, timeEnd]);

        /*	Adjust the ticks for each x axis depening on the time range */
        /* ticks for than 5 years, 157,788,000,000 milliseconds */
        if ((timeEnd - timeBegin) > 157788000000) {
            xMonthAxis.ticks(d3.timeYear, 1).tickFormat(function (d) {
                return '';
            });
            xDayAxis.ticks(d3.timeYear, 1);
        }
        /* ticks for than a year, 31,557,600,000 milliseconds */
        else if ((timeEnd - timeBegin) > 31557600000) {
            xMonthAxis.ticks(d3.time.months, 3).tickFormat(d3.time.format('%d %b'));
            xDayAxis.ticks(d3.time.months, 1);
        }
        /* ticks for than six months 31,557,600,000 milliseconds divided by 2 */
        else if ((timeEnd - timeBegin) > 15778800000) {
            xMonthAxis.ticks(d3.time.months, 1).tickFormat(d3.time.format('%d %b'));
            xDayAxis.ticks(d3.time.weeks, 1);
        }
        /* ticks for than two months 31,557,600,000 milliseconds divided by 6 */
        else if ((timeEnd - timeBegin) > 5259600000) {
            xMonthAxis.ticks(d3.time.months, 1).tickFormat(d3.time.format('%d %b'));
            xDayAxis.ticks(d3.time.days, 1);
        }
        /* ticks for than a month 31,557,600,000 milliseconds divided by 12 */
        else if ((timeEnd - timeBegin) > 2629800000) {
            xMonthAxis.ticks(d3.time.weeks, 1).tickFormat(d3.time.format('%d %b'));
            xDayAxis.ticks(d3.time.days, 1);
        }
        /* ticks for a day */
        else {
            xMonthAxis.ticks(d3.time.days, 4).tickFormat(d3.time.format('%d %b'));
            xDayAxis.ticks(d3.time.days, 1);
        }

        /*	Redraw each x axis based on the new domain */
        yearAxis.transition()
            .duration(duration)
            .call(xYearAxis);

        monthAxis.transition()
            .duration(duration)
            .call(xMonthAxis);

        dayAxis.transition()
            .duration(duration)
            .call(xDayAxis);

        /*	Give the selected location the class of 'selected'
then animate the locations to their new position based on the updated x scale */
        for (var i = 0; i < allshowdata.length; i++) {

            // console.log(allshowdata[i]);
            var lineName = "line" + i.toString();
            bill = mini.append("path")
                .datum(allshowdata[i]) //pass an array of the dates
                .attr("class", "line")
                .attr("d", valueline)
                .attr("id", lineName);
            drawdots = mini.selectAll("dot")
                // //filter to show only the first and last points
                .data(allshowdata[i].filter(function (d, i) { return (d && i == 3) || (d && i == 0); }))
                // .data(showDates)
                .enter().append("circle")
                .attr("r", 5)
                .attr("cx", function (d) { return x(d.date); })
                .attr("cy", function (d) { return y(d.billStatus); })
                //change color of dot
                .style("fill", function (d) {
                    if (d.sponsor_party == "D") { return "darkblue"; }
                    else { return "darkred"; }
                }) //Do something
                .on("mouseover", function (d) {
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    //content of tooltip
                    div.html(d.number + "<br/>" + formatTime(d.date) + "<br/>" + d.billStatus + "<br/><a href=\"" + d.govtrack_url + "\" target=\"_blank\">Link</a>")
                        .style("left", (d3.event.pageX + 28) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                    chart.selectAll(".line")
                        .on("mouseover", function (d) {
                            d3.select(this)                          //on mouseover of each line, give it a nice thick stroke
                                .style("stroke-width", '6px')
                                .style("stroke", '#3a3a3a')
                                .style("z-index", 1000);
                            var selectthegraphs = $('.line').not(this);     //select all the rest of the lines, except the one you are hovering on and drop their opacity
                            d3.selectAll(selectthegraphs)
                                .style("opacity", 0)
                                .style("z-index", -1);
                        })
                        .on("mouseout", function (d) {
                            d3.select(this)                          //on mouseover of each line, give it a nice thick stroke
                                .style("stroke-width", '2px')
                                .style("stroke", 'lightgrey');
                            var selectthegraphs = $('.line').not(this);     //select all the rest of the lines, except the one you are hovering on and drop their opacity
                            d3.selectAll(selectthegraphs)
                                .style("opacity", 1);
                        });
                    // Add the Y Axis
                    chart.append("g")
                        .attr("class", "axis")
                        .call(d3.axisLeft(y))
                        //tick labels
                        .selectAll("text")
                        // .style("fill","white")
                        ;
                });
        }

        locations.classed("selected", false)
            .attr("class", function (d, i) {
                if (i === counter) {
                    return "locations selected";
                } else {
                    return "locations";
                };
            })
            .transition()
            .duration(duration)
            .attr("x", function (d, i) {
                return x(d.date1);
            })
            .attr("width", function (d) {
                if (d.date1 < d.date2) {
                    /* 	decide the width of the rect based on the range of dates */

                    return x(d.date2) - x(d.date1);
                } else {
                    /* 	if no end date is specified add 86,400,000 milliseconds to the first
date to create a span of time for the width
but make sure that it is at least 4 px wide */
                    var thisWidth = x(getDate(d.date1.getTime() + 86400000)) - x(d.date1);

                    if (thisWidth < 4) {
                        return 2;
                    } else {
                        return thisWidth;
                    }
                }
            });

        /*	Fade out the next/prev and zoom buttons when they are not available */
        switch (counter) {
            case 0:
                leftIcon.style("fill", colourText[1]);
                rightIcon.style("fill", colourText[0]);
                break;
            case (items.length - 1):
                leftIcon.style("fill", colourText[0]);
                rightIcon.style("fill", colourText[1]);
                break;
            default:
                leftIcon.style("fill", colourText[0]);
                rightIcon.style("fill", colourText[0]);
                break;
        }

        switch (zoom) {
            case 1:
                zoomInIcon.style("fill", colourText[0]);
                zoomOutIcon.style("fill", colourText[1]);
                break;
            case maxZoom:
                zoomInIcon.style("fill", colourText[1]);
                zoomOutIcon.style("fill", colourText[0]);
                break;
            default:
                zoomInIcon.style("fill", colourText[0]);
                zoomOutIcon.style("fill", colourText[0]);
                break;
        }
        // d3.json("test.json", function(error, data) {
        // if (error) throw error;

    }

    /* Initial call of show position to adjust the timeline on page load */
    showLocation();

}
