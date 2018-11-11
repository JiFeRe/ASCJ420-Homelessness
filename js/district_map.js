d3.json("../Dataset/la_district_data.json", function (all_data) {
    var width = 500;
    var height = 450;
    var SCALE = 0.9;
    var legendHeight = 100;
    var legendWidth = 15;
    var centered;

    //leaflet map
    // var map = new L.Map("map", { center: [37.8, -96.9], zoom: 4 })
    //     .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));

    //customize color range
    var lightcolor = d3.rgb(250, 240, 230);    //light 
    //var lightcolor = d3.rgb("#85C1E9"); 
    var deepcolor = d3.rgb(25, 25, 250);        //deep blue
    //var deepcolor = d3.rgb("#C70039");
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


    var svg = d3.select("#draw_map").append("svg")
        .attr("width", width)
        .attr("height", height);
    //.attr("transform", "translate(0,0)");

    var projection = d3.geo.mercator()
        //.center([-0.076132,51.508530])
        .center([-118, 34.052235])
        //.center([-74, 4.5])
        //.center([107, 31])
        .scale(12000)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);


    var color = d3.scale.category20();




    d3.json("../Dataset/la_district.geo.json", function (error, root) {
        if (error)
            return console.error(error);
        console.log(root.features);

        draw("2015");

        function draw(year) {

            d3.selectAll("svg > *").remove();

            var data = all_data[year];



            var scaleData = d3.extent(data, function (it) { return it.totPeople; });
            var linear = d3.scale.linear()
                .domain(scaleData)
                .range([0, 1]);







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

            svg.append("g")
                .attr("id", "district-map")
                .selectAll("path")
                .data(root.features)
                .enter()
                .append("path")
                .attr("d", path)
                //.on("click", clicked)
                .attr("stroke", "#000")
                .attr("stroke-width", 0)
                .attr("transform", "scale(" + SCALE + ")")
                //.attr("name", function (d) { return d.properties.name; })
                .style("fill", function (d) {
                    if (d.properties.counts) {
                        return mycolor(linear(d.properties.counts).toString());
                    } else {
                        return "white";
                    }

                })
                .on("mouseover", showTooltip)
                .on("mousemove", showTooltip)
                .on("mouseout", function (d) {

                    tooltip.classed("hidden", true);
                    if (d.properties.counts) {
                        d3.select(this)
                            .attr("stroke", "#000")
                            .attr("stroke-width", 0)
                            .style("fill", mycolor(linear(d.properties.counts)).toString());
                    } else {
                        d3.select(this)
                            .style("fill", "white")
                            .attr("stroke", "#000")
                            .attr("stroke-width", 0);
                    }

                });


            var legendScale = d3.scale.linear()
                .domain([0,scaleData[1]])
                .range([0, legendHeight]);

            var legendAxis = d3.svg.axis()
                .scale(legendScale)
                .orient("right")
                .tickValues([0,scaleData[1]])
                .tickFormat(d3.format("d"));

            var legendText = svg.append("g")
                .attr("class", "legend axis");

            legendText
                .attr("transform", "translate(440,300)")
                .style("stroke-width", 0.1)
                .call(legendAxis);

            svg.append("text")
                .attr("transform", "translate(445,278)")
                //.attr("transform", "rotate(-90)")
                // .attr("y", 405)
                // .attr("x",-300-50)
                //.attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Homeless Count");




            //create linear of legend
            var breaks = [0, 0.2, 1];
            var blues = ["white", lightcolor, deepcolor];

            var gradient = svg.append("defs")
                .append("linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "0%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");


            svg.append("rect")
                .attr("class", "linearLegend")
                .attr("transform", "translate(430,300)")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#gradient)");

            gradient.selectAll("stop")
                .data(d3.zip(breaks, blues))
                .enter().append("stop")
                .attr("offset", function (d) { return d[0]; })
                .attr("stop-color", function (d) { return d[1]; });





            // legend = svg.append("g")
            //     .attr("class", "legend")
            //     .attr("transform", "translate(50,30)")
            //     .style("font-size", "12px")
            //     .call(d3.legend)


            //legend
            // svg.append("g")
            //     .attr("class", "legendQuantize")
            //     .attr("transform", "translate(820,300)");

            // svg.select(".legendQuantize")
            //     .call(legendQuantize);



            function showTooltip(d, i) {
                label = "Name: " + d.properties.name + "</br>" + "Counts:" + d.properties.counts;
                var mouse = d3.mouse(svg.node())
                    .map(function (d) { return parseInt(d); });
                tooltip.classed("hidden", false)
                    .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                    .html(label);
                d3.select(this).attr("stroke", "black").attr("stroke-width", 1).style("fill", mycolor(linear(d.properties.counts)).toString());
            }


            function clicked(d) {
                var x, y, k;


                if (d && centered !== d) {
                    var centroid = path.centroid(d);
                    x = centroid[0];
                    y = centroid[1];
                    k = 1.5;
                    centered = d;
                } else {
                    x = width / 2;
                    y = height / 2;
                    k = 1;
                    centered = null;
                }

                svg.select("#district-map")
                    .classed("active", centered && function (d) { return d === centered; });

                svg.select("#district-map")
                    .transition()
                    .duration(750)
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
            }

            var drop_select = d3.select('#dropDistricts');
            drop_select.on("change", function () {
                dropDpwnClicked(this.value);
            });


            function dropDpwnClicked(x) {

                // clicked(root.features[1]);
                root.features.forEach(function (d) { // loop through json data to match td entry
                    if (x === d.properties.name) {
                        clicked(d); // pass json element that matches td data to click 
                    } else if (x === "none") {
                        clicked(null);
                    };
                })
            }



        }




        // d3.queue()
        //     .defer(d3.json, '../Dataset/la_district_data_2015.json')
        //     .defer(d3.json, '../Dataset/la_district_data_2016.json')
        //     .defer(d3.json, '../Dataset/la_district_data_2017.json')
        //     .defer(d3.json, '../Dataset/la_district_data_2018.json')
        //     .await(function (error, d2015, d2016, d2017, d2018) {
        //         count_data['2015'] = d2015;
        //         count_data['2016'] = d2016;
        //         count_data['2017'] = d2017;
        //         count_data['2018'] = d2018;
        //         draw('2015');
        //     });

        var slider = d3.select('#year');
        slider.on('change', function () {
            draw(this.value);
        });









    });






})



















