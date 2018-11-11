var width = 600;
var height = 400;

//leaflet map
// var map = new L.Map("map", { center: [37.8, -96.9], zoom: 4 })
//     .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));

//customize color range
var lightcolor = d3.rgb(250, 240, 230);    //light blue
var deepcolor = d3.rgb(25, 25, 250);        //deep blue
var mycolor = d3.interpolate(lightcolor, deepcolor);        //color range


//mapping data with color range
// var linear = d3.scale.linear()
//     .domain([0, 500])
//     .range([0, 1]);


//other way to customize color
var mycolor2 = d3.scale.linear().domain([1, 1000])
    .interpolate(d3.interpolateHcl)
    .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);


//for tooltip 
var offsetL = document.getElementById('map1').offsetLeft + 10;
var offsetT = document.getElementById('map1').offsetTop + 10;



var path = d3.geo.path()
    .projection(projection);

var tooltip = d3.select("#map1")
    .append("div")
    .attr("class", "tooltip hidden");


var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(0,0)");

var projection = d3.geo.mercator()
    //.center([-0.076132,51.508530])
    .center([-118.243683, 34.052235])
    //.center([-74, 4.5])
    //.center([107, 31])
    .scale(12000)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);


var color = d3.scale.category20();






d3.json("../Dataset/la_district.geo.json", function (error, root) {

    var count_data = {};

    function draw(year) {

        var data = count_data[year];

        var t = d3.transition()
            .duration(2000);


        if (error)
            return console.error(error);
        console.log(root.features);

        var linear = d3.scale.linear()
            .domain(d3.extent(data, function (it) { return it.totPeople; }))
            .range([0, 1]);

        //d3.extent(data, function(it) { return it.totPeople; });

        for (var i = 0; i < data.length; i++) {

            //get data: community name
            var dataName = data[i].District_Name;
            //get data: community count
            var dataValue = data[i].totPeople;


            //match with geojson
            for (var j = 0; j < root.features.length; j++) {
                var geoName = root.features[j].properties.name;
                if (dataName == geoName) {
                    root.features[j].properties.counts = dataValue;

                }
            }
        }

        var dis_map = svg.selectAll("path")
            .data(root.features)

        dis_map.exit()
            .remove();

        var new_map = dis_map.enter()
            .append("path")
            .attr("stroke", "#000")
            .attr("stroke-width", 0.1)
        //.attr("name", function (d) { return d.properties.name; })

        new_map.attr("d", path)
            //.transition(t)
            .attr("fill", function (d) {
                if (d.properties.counts) {
                    return mycolor(linear(d.properties.counts).toString());
                } else {
                    return "white";
                }

            })
            .on("mouseover", showTooltip)
            .on("mouseout", function (d) {

                tooltip.classed("hidden", true);
                if (d.properties.counts) {
                    d3.select(this)
                        .attr("stroke", "#000")
                        .attr("stroke-width", 0.1)
                        .attr("fill", mycolor(linear(d.properties.counts)).toString());
                } else {
                    d3.select(this)
                        .attr("fill", "white")
                        .attr("stroke", "#000")
                        .attr("stroke-width", 0.1);
                }

            });



    }


    d3.queue()
        .defer(d3.json, '../Dataset/la_district_data_2015.json')
        .defer(d3.json, '../Dataset/la_district_data_2016.json')
        .defer(d3.json, '../Dataset/la_district_data_2017.json')
        .defer(d3.json, '../Dataset/la_district_data_2018.json')
        .await(function (error, d2015, d2016, d2017, d2018) {
            count_data['2015'] = d2015;
            count_data['2016'] = d2016;
            count_data['2017'] = d2017;
            count_data['2018'] = d2018;
            draw('2015');
        });

    var slider = d3.select('#year');
    slider.on('change', function () {
        draw(this.value);
    });




});






function showTooltip(d, i) {
    label = "Name: " + d.properties.name + "</br>" + "Counts:" + d.properties.counts;
    var mouse = d3.mouse(svg.node())
        .map(function (d) { return parseInt(d); });
    tooltip.classed("hidden", false)
        .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
        .html(label);
    d3.select(this).attr("stroke", "red").attr("stroke-width", 2).attr("fill", mycolor(linear(d.properties.counts)).toString());;
}









