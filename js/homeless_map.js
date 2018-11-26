
var test_data = null;

function mapTypeSelected(mapType) {
    var districtElement = document.getElementById("district");
    var communityElement = document.getElementById("community");
    if ("district" === mapType) {
        districtElement.setAttribute("class", "noclass");
        communityElement.setAttribute("class", "hidden");


    } else {
        communityElement.setAttribute("class", "noclass");
        districtElement.setAttribute("class", "hidden");
    }

}
d3.json("../Dataset/la_district_data.json", function (districtData) {
    var width = 500;
    var height = 420;
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
    var offsetL = document.getElementById('district_tooltip').offsetLeft + 10;
    var offsetT = document.getElementById('district_tooltip').offsetTop + 10;



    var path = d3.geo.path()
        .projection(projection);

    var tooltip = d3.select("#district_tooltip")
        .append("div")
        .attr("class", "tooltip hidden");


    var svg = d3.select("#district_map").append("svg")
        .attr("id", "district_box")
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




    d3.json("../Dataset/la_district.geo.json", function (error, district_root) {
        if (error)
            return console.error(error);
        console.log(district_root.features);

        // var district_select = d3.select("#dropDistricts");
        // district_select.append("option").attr("value", "none").attr("selected", "true").text("Not Selected");
        // for (var i = 0; i < district_root.features.length; i++) {
        //     district_select.append("option")
        //         .attr("value", district_root.features[i].properties.name)
        //         .text(district_root.features[i].properties.name);

        // }

        drawMap("2015");



        function drawMap(year) {

            //reset-up the whole graph
            //d3.selectAll("svg > *").remove();
            svg.selectAll("*").remove();
            document.getElementById("dropDistricts").options[0].selected = true;


            var districtYearData = districtData[year];
            test_data = districtYearData;


            var scaleData = d3.extent(districtYearData, function (it) { return it.totPeople; });
            var linear = d3.scale.linear()
                .domain(scaleData)
                .range([0, 1]);


            for (var i = 0; i < districtYearData.length; i++) {

                //get data: community name
                var dataName = districtYearData[i].District_Name;
                //get data: community count
                var dataValue = districtYearData[i].totPeople;


                //match with geojson
                for (var j = 0; j < district_root.features.length; j++) {
                    var geoName = district_root.features[j].properties.name;
                    if (dataName == geoName) {
                        district_root.features[j].properties.counts = dataValue;

                    }
                }
            }

            //gray map background
            svg.append("g")
                .attr("id", "district_background")
                .selectAll("path")
                .data(district_root.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("stroke", "#000")
                .attr("stroke-width", 0.5)
                .attr("transform", "scale(" + SCALE + ")")
                .style("fill", "#D3D3D3");


            //draw the district map with homeless count data
            svg.append("g")
                .attr("id", "district_svg")
                .selectAll("path")
                .data(district_root.features)
                .enter()
                .append("path")
                .attr("d", path)
                //.on("click", clicked)
                .attr("stroke", "#000")
                .attr("stroke-width", 0)
                .attr("transform", "scale(" + SCALE + ")")
                .attr("id", function (d) {
                    var district_name = ("" + d.properties.name).replace(" ", "_");
                    return district_name;
                })
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
                .domain([0, scaleData[1]])
                .range([0, legendHeight]);

            var legendAxis = d3.svg.axis()
                .scale(legendScale)
                .orient("right")
                .tickValues([0, scaleData[1]])
                .tickFormat(d3.format("d"));

            var legendText = svg.append("g")
                .attr("class", "legend axis");

            //create legend text
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
                .attr("id", "district_gradient")
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
                .style("fill", "url(#district_gradient)");

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

                //highlight the choosen district
                if(" " === d){
                    svg.select("#district_svg").selectAll("*").attr("fill-opacity", 0);
                }
                else if (d) {
                    var district_name = ("" + d.properties.name).replace(" ", "_");
                    svg.select("#" + district_name).attr("fill-opacity", 1);
                } else {
                    svg.select("#district_svg").selectAll("*").attr("fill-opacity", 1);
                }

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

                // svg.select("#district_svg")
                //     .classed("active", centered && function (d) { return d === centered; });

                // svg.select("#district_svg")
                //     .transition()
                //     .duration(750)
                //     .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

            }

            var drop_select = d3.select('#dropDistricts');
            drop_select.on("change", function () {
                dropDpwnClicked(this.value);
            });


            function dropDpwnClicked(x) {

                d3.csv("../Dataset/Communities_Supervisorial_District.csv", function (error, mapping_data) {
                    clicked(" ");
                    if (x === "none") {
                        clicked(null);
                    } else {
                        for (var i = 0; i < mapping_data.length; i++) {
                            if (x === mapping_data[i].Community) {
                                var related_district = mapping_data[i].District;

                                district_root.features.forEach(function (d) { // loop through json data to match td entry
                                    if (related_district === d.properties.name) {
                                        clicked(d); // pass json element that matches td data to click 
                                    }
                                });
                            }
                        }
                    }

                });

                // clicked(root.features[1]);
                // district_root.features.forEach(function (d) { // loop through json data to match td entry
                //     if (x === d.properties.name) {
                //         clicked(d); // pass json element that matches td data to click 
                //     } else if (x === "none") {
                //         clicked(null);
                //     };
                // })
            }

            document.getElementById("dropDistricts").value = "none";



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

        var slider = d3.select('#district_year');
        slider.on('change', function () {
            drawMap(this.value);
        });









    });








})


console.log(test_data);




d3.json("../Dataset/la_community.json", function (communityAllData) {

    var width = 500;
    var height = 420;
    var SCALE = 0.9;
    var legendHeight = 100;
    var legendWidth = 15;
    var legendX = 0;
    var legendY = 0;
    var centered;


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
    var offsetL = document.getElementById('community_tooltip').offsetLeft + 10;
    var offsetT = document.getElementById('community_tooltip').offsetTop + 10;



    var path = d3.geo.path()
        .projection(projection);

    var tooltip = d3.select("#community_tooltip")
        .append("div")
        .attr("class", "tooltip hidden");




    var svg = d3.select("#community_map").append("svg")
        .attr("width", width)
        .attr("height", height);

    //.attr("transform", "translate(0,0)");

    var projection = d3.geo.mercator()
        //.center([-0.076132,51.508530])
        .center([-118, 34.052235])
        //.center([6512345, 1941234])
        //.center([-74, 4.5])
        //.center([107, 31])
        .scale(12000)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);


    var color = d3.scale.category20();

    d3.json("../Dataset/la_community_map_latest.json", function (error, community_root) {
        if (error)
            return console.error(error);

        // add community name to selector    
        var community_select = d3.select("#dropCommunities");
        var district_select = d3.select("#dropDistricts");
        var community_list = new Array(community_root.features.length);
        community_select.append("option").attr("value", "none").attr("selected", "true").text("Not Selected");
        district_select.append("option").attr("value", "none").attr("selected", "true").text("Not Selected");
        for (var i = 0; i < community_root.features.length; i++) {
            community_list[i] = community_root.features[i].properties.community_name;
        }
        community_list.sort();
        for (var i = 0; i < community_list.length; i++) {
            community_select.append("option")
                .attr("value", community_list[i])
                .text(community_list[i]);
            district_select.append("option")
                .attr("value", community_list[i])
                .text(community_list[i]);


        }


        drawCommunityMap("2016");
        function drawCommunityMap(year) {

            //reset svg map
            svg.selectAll("*").remove();

            var community_data = communityAllData[year];






            var scaleData = d3.extent(community_data, function (it) { return it.totPeople; });
            var linear = d3.scale.linear()
                .domain(scaleData)
                .range([0, 1]);

            console.log(scaleData);

            for (var i = 0; i < community_data.length; i++) {

                //get data: community name
                var dataName = community_data[i].Community_Name;
                //get data: community count
                var dataValue = community_data[i].totPeople;


                //match with geojson
                for (var j = 0; j < community_root.features.length; j++) {
                    if (community_root.features[j].properties.community_name) {
                        var geoName = community_root.features[j].properties.community_name;
                        if (dataName == geoName) {
                            community_root.features[j].properties.counts = dataValue;
                        }
                    }

                }
            }






            // var linear = d3.scale.linear()
            //     .domain(d3.extent(community_data, function (it) { return it.totPeople; }))
            //     .range([0, 1]);

            //d3.extent(data, function(it) { return it.totPeople; });

            // for (var i = 0; i < data.length; i++) {

            //     //get data: community name
            //     var dataName = data[i].District_Name;
            //     //get data: community count
            //     var dataValue = data[i].totPeople;


            //     //match with geojson
            //     for (var j = 0; j < root.features.length; j++) {
            //         var geoName = root.features[j].properties.name;
            //         if (dataName == geoName) {
            //             root.features[j].properties.counts = dataValue;

            //         }
            //     }
            // }

            svg.append("g")
                .selectAll("path")
                .data(community_root.features)
                .enter()
                .append("path")
                .attr("stroke", "#000")
                .attr("stroke-width", 0)

                .attr("transform", "scale(" + SCALE + ")")
                //.attr("name", function (d) { return d.properties.name; })
                .attr("fill", function (d) {
                    if (d.properties.counts) {
                        return mycolor(linear(d.properties.counts).toString());
                    } else {
                        return "white";
                    }


                })
                .attr("d", path)
                .on("mouseover", showTooltip)
                .on("mouseout", function (d) {
                    tooltip.classed("hidden", true);
                    if (d.properties.counts) {
                        d3.select(this)
                            .attr("fill", mycolor(linear(d.properties.counts)).toString()).attr("stroke-width", 0);
                    } else {
                        d3.select(this)
                            .attr("fill", "white").attr("stroke-width", 0);
                    }

                });



            var legendScale = d3.scale.linear()
                .domain([0, scaleData[1]])
                .range([0, legendHeight]);

            var legendAxis = d3.svg.axis()
                .scale(legendScale)
                .orient("right")
                .tickValues([0, scaleData[1]])
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
                .attr("id", "community_gradient")
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
                .style("fill", "url(#community_gradient)");

            gradient.selectAll("stop")
                .data(d3.zip(breaks, blues))
                .enter().append("stop")
                .attr("offset", function (d) { return d[0]; })
                .attr("stop-color", function (d) { return d[1]; });




            function showTooltip(d, i) {
                label = "Community name: " + d.properties.community_name + "</br>" + "Homeless Counts:" + d.properties.counts;
                var mouse = d3.mouse(svg.node())
                    .map(function (d) { return parseInt(d); });
                tooltip.classed("hidden", false)
                    .attr("style", "left:" + (mouse[0] + offsetL) + "px;top:" + (mouse[1] + offsetT) + "px")
                    .html(label);
                d3.select(this).attr("stroke", "orange").attr("stroke-width", 2);
            }


        }


        var slider = d3.select('#community_year');
        slider.on('change', function () {
            console.log(this.value);
            drawCommunityMap(this.value);

        });




    });







})




var mapType_select = d3.select('#map_category');
mapType_select.on("change", function () {
    mapTypeSelected(this.value);
});
mapTypeSelected("district");



















