// import fs from 'fs';
// const fs = require("fs");
var g;
var svg;

let getToggle;

var vadData = [];
const margin = { top: 80, right: 30, bottom: 30, left: 60 };
const width = 1200;
const height = 700;
var user_name = "chrisbryanASU"
const innerHeight = height - margin.bottom - margin.top;
const innerWidth = width - margin.left - margin.right;

const fontSize = `18px times`;
const fontFamily = `Arial, Helvetica, sans-serif`;
const fontColor = `black`;

const keys = [`Sadness`, `Joy`, `Trust`, `Fear`, `Surprise`, `Anticipation`, `Anger`, `Disgust`];
const emotion_map = {'Sadness' : 0, 'Joy' : 0, 'Trust' : 0, 'Fear' : 0, 'Surprise' : 0, 'Anticipation' : 0, 'Anger' : 0, 'Disgust' : 0}
const colors = [`#AFF3FF`, `#fe5eea`, `#00FF6A`, `#f39f69`, `#3BBFFC`, `#FFDA46`, `#F15236`, `#B333F1`];
const colorMap = d3.scaleOrdinal()
    .domain(keys)
    .range([`#AFF3FF`, `#fe5eea`, `#00FF6A`, `#f39f69`, `#3BBFFC`, `#FFDA46`, `#F15236`, `#B333F1`]);

let circleData;

let tip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("width", "auto")
        .style("height", "auto")
        .style("text-align", "center")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("padding", "15px")
        .style('background', function (d, i) { return "#FCE7BE"; })
        .attr("stroke", function (d, i) { return "black"; })
        .style("border", "2px")
        .style("margin", "5px")
        .style("border-radius", "8px")
        .style("border", "solid")
        .style("color", "#000")
        .style("font-family", "sans-serif")
        .style("font-size", "15px")
        .style("line-height", "20px")
        .style("pointer-events", "none");


let tip2 = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("width", "auto")
        .style("height", "auto")
        .style("text-align", "center")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("padding", "15px")
        // .style('background', function (d, i) { return "white"; })
        .attr("stroke", function (d, i) { return "black"; })
        // .style("border", "2px")
        .style("margin", "5px")
        // .style("border-radius", "8px")
        // .style("border", "solid")
        .style("color", "#000")
        .style("font-family", "sans-serif")
        .style("font-size", "15px")
        .style("line-height", "20px")
        .style("pointer-events", "none");





document.addEventListener(`DOMContentLoaded`, function () {

    svg = d3.select(`#stream-graph`)
        .append(`svg`)
        .attr(`width`, width)
        .attr(`height`, height);

       


    pie_svg = d3.select('#pie-graph')
    .append('svg')
    .attr('width', 500)
    .attr("height", 500)
    .attr(`transform`, `translate(${20},${60})`);


    g = svg.append(`g`)
        .attr(`transform`, `translate(${margin.left},${margin.top})`);

        
    drawgraphs();
    
});

async function drawPie(emotion_map) {
    var pie = d3.pie().value(d=>d[1])
    var data_ready = pie(Object.entries(emotion_map))

    var color = colorMap;

    var arcGenerator = d3.arc()
  .innerRadius(100)
  .outerRadius(175)

    const a = pie_svg.selectAll("pie")
    .data(data_ready);

    pie_svg
        .append(`text`)
        .attr(`x`, 500 / 2 - 55)
        .attr(`class`, `xAxisTextPie`)
        .attr(`y`, 17)
        .style(`font-size`, "22px")
        .text(`Emotion Distribution`);

    console.log(data_ready)

    a
    .join('path')
    .classed('pie_graph', true)
    .merge(a)
    //.attr('d', d3.arc().innerRadius(0).outerRadius(175))
    .attr('d', arcGenerator)
    .attr('transform', 'translate(290, 200)')
    .attr('fill', d => color(d.data[0]))
    .attr('stroke', 'black')
    .style('stroke-width', '1px')
    .on('mouseover', function (d, i) {
        let temp = d3.select(this)["_groups"][0][0]['__data__']["data"];
        console.log(temp);
        pie_svg.append('text').attr("id", "something_pie").attr("text-anchor", "middle")
        .text(temp[0] + ": " + temp[1]).attr('transform', 'translate(290, 200)');
        //d3.select(this).transition()
             //.style("stroke-width", '4px');

        d3.select(this).transition().duration(300).attr('d', d3.arc().innerRadius(95).outerRadius(180));
   })
   .on('mouseout', function (d, i) {
        pie_svg.select("#something_pie").remove();
        //d3.select(this).transition().duration(100)
             //.style("stroke-width", '1px');
        d3.select(this).transition().duration(300).attr('d', d3.arc().innerRadius(100).outerRadius(175));
   });
}

const drawStreamGraph = (data) => {
    //tip.selectAll('*').remove();
    d3.selectAll(`.xAxisText, .yAxisText, .myArea, .tick`).remove();

    // await new Promise(resolve => setTimeout(resolve, 3000));

    const stackedData = d3.stack()

        .offset(d3.stackOffsetWiggle)
        .order(d3.stackOrderAppearance)
        .keys(keys)
        (data);

    const xScale = d3.scaleTime().domain(d3.extent(data, d => d.timeStamp)).range([0, innerWidth]);

    const axisbottom = d3.axisBottom(xScale).tickSizeInner([-innerHeight]);

    const xAxis = g.append(`g`).attr(`transform`, `translate(0, ${innerHeight})`);

    xAxis.append(`text`)
        .attr(`x`, innerWidth / 2)
        .attr(`class`, `xAxisText`)
        .attr(`y`, 30)
        .style(`font`, fontSize)
        .style(`font-family`, fontFamily)
        .attr(`fill`, fontColor)
        .text(`Time Line`);

    xAxis.call(axisbottom).select(`.domain`).remove();

    const yScale = d3.scaleLinear()
        .domain([
            d3.min(stackedData, (d) =>
                d3.min(d, (d) => d[0])
            ),
            d3.max(stackedData, (d) =>
                d3.max(d, (d) => d[1])
            ),
        ])
        .range([innerHeight, 0]);

    const demo = d3.scaleLinear()
                    .domain([0,1])
                    .range([innerHeight,0]);

    const axisLeft = d3.axisLeft(yScale).tickSizeInner([-innerWidth]);

    const yAxis = g.append(`g`).attr(`class`, `yAxis`);

    yAxis.append(`text`)
        .attr(`x`, -innerHeight / 2 + 65)
        .attr(`y`, -40)
        .attr(`class`, `yAxisText`)
        .style(`font`, fontSize)
        .style(`font-family`, fontFamily)
        .attr(`fill`, fontColor)
        .style(`text-anchor`, `end`)
        .attr(`transform`, `rotate(-90)`)
        .text(`Valance`);

    yAxis.call(d3.axisLeft(demo));

    const area = d3.area()
        .x(function (d) { return xScale(d.data.timeStamp); })
        .y0(function (d) { return yScale(d[0]); })
        .y1(function (d) { return yScale(d[1]); })
        .curve(d3.curveMonotoneX);

    const mouseover = function (event, d) {
        getToggle = document.getElementById("toggle").checked
        Tooltip.style(`opacity`, 1)
        d3.selectAll(`.myArea`).style(`opacity`, .2)
        d3.select(this)
            .style(`stroke`, `black`)
            .style(`opacity`, 1)

        if(! getToggle){
                    tip2.selectAll('*').remove();
                    d3.select("#tipDiv2").remove();
                      
                    tip2.html("<div id='tipDiv2'></div>")
                            .style("visibility", "visible")
                            .style("left", (event.pageX)-20 + "px")
                            .style("top", (event.pageY)-20 + "px")
                            .style('background','None')
                            .style('border','None')
                            .transition().duration(50);

                    let margin = { top: -70, right: 10, bottom: 10, left: -30 },
                            width = 450 - margin.left - margin.right,
                            height = 450 - margin.top - margin.bottom;

                    let tipSVG2 = d3.select("#tipDiv2")
                            .append("svg")
                            .attr("width", 300)
                            .attr("height", 400)
                            .append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                    circle(tipSVG2,d.key);
        } else{
            tip.selectAll('*').remove();
            d3.select("#tipDiv").remove();
            // tip.style(`opacity`, 0)
            tip.style(`opacity`, 1)
          
            tip.html("<p></p><div id='tipDiv'></div>")
                .style("visibility", "visible")
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY) + "px")
                .transition().duration(200);

            let margin = { top: -120, right: 0, bottom: 20, left: 40 };

            let tipSVG = d3.select("#tipDiv")
                .append("svg")
                .attr("width", 200)
                .attr("height", 200)
                .style('opacity',1)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            

            drawWC(d.key, tipSVG);
        }

    }

    const mousemove = function (event, d, i) {
        
        Tooltip.text(d.key)
            .attr('fill', colorMap(d.key))
    }

    const mouseleave = function (event, d) {
      
        Tooltip.style(`opacity`, 0)
        d3.selectAll(`.myArea`).style(`opacity`, 1).style(`stroke`, `none`)
                    d3.select("#tipDiv2").remove();
                    d3.select("#tipDiv").remove();
                    tip.style("visibility", "hidden");
    }
    const Tooltip = svg
        .append(`text`)
        .attr(`x`, 30)
        .attr(`y`, 30)
        .style(`opacity`, 0)
        .style(`font`, fontSize)
        .style(`font-family`, fontFamily)


     tip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("width", "auto")
        .style("height", "auto")
        .style("text-align", "center")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("padding", "15px")
        .style('background', function (d, i) { return "#FCE7BE"; })
        .attr("stroke", function (d, i) { return "black"; })
        .style("border", "2px")
        .style("margin", "5px")
        .style("border-radius", "8px")
        .style("border", "solid")
        .style("color", "#000")
        .style("font-family", "sans-serif")
        .style("font-size", "15px")
        .style("line-height", "20px")
        .style("pointer-events", "none");

        let tip2 = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("width", "auto")
            .style("height", "auto")
            .style("text-align", "center")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("padding", "15px")
            .style('background', function (d, i) { return "white"; })
            .attr("stroke", function (d, i) { return "black"; })
            .style("border", "2px")
            .style("margin", "5px")
            .style("border-radius", "8px")
            .style("border", "solid")
            .style("color", "#000")
            .style("font-family", "sans-serif")
            .style("font-size", "15px")
            .style("line-height", "20px")
            .style("pointer-events", "none");

    const paths = g.selectAll(`mylayers`)
        .data(stackedData)

    paths.join(`path`)
        .on(`mouseover`, mouseover)
        .on(`mousemove`, mousemove)
        .on(`mouseleave`, mouseleave)
        .attr(`class`, `myArea`)
        .style(`fill`, d => colorMap(d.key))
        .attr(`d`, area);


    circle();
}


const drawLabels = () => {
   
    let xPosition = innerWidth - 500;
    let yPosition = 20;
    let length = colors.length / 2;

    for (let index = 0; index < colors.length; index++) {
        svg.append(`circle`)
            .style(`fill`, colors[index])
            .attr(`r`, 10)
            .attr(`cx`, xPosition)
            .attr(`cy`, yPosition);

        svg.append(`text`)
            .attr(`x`, xPosition + 20)
            .attr(`y`, yPosition + 10)
            .attr(`class`, `labels`)
            .style(`font`, fontSize)
            .style(`font-family`, fontFamily)
            .attr(`fill`, colors[index])
            .text(keys[index]);

        xPosition = xPosition + 140;
        if (index + 1 == length) {
            xPosition = innerWidth - 500;
            yPosition = 50
        }
    }
}

const dateChange = () => {
   
    tip.style(`opacity`, 0)
    let endDate = new Date(document.getElementById(`end-date`).value);
    let startDate = new Date(document.getElementById(`start-date`).value);
    let streamGraphInput = [];

    if (startDate < endDate) {
        vadData.forEach(element => {
            if (startDate <= element.timeStamp && element.timeStamp <= endDate) {
                streamGraphInput.push(element);
            }
        });
        drawStreamGraph(streamGraphInput);
        drawScatter();
    }

}


function circle(tipSVG2, keyValue){
     d3.select("#circle").selectAll("*").remove();
      
      function cleanup_data(d) {
            return {
                id: +d.id,
                time: new Date(d.time),
                valence: +d.Valence,
                arousal: +d.Arousal,
                dominance: +d.Dominance,
                emotion: d.emotion,
                sadness: +d.Sadness,
                joy: +d.Joy,
                trust: +d.Trust,
                fear: +d.Fear,
                surprise: +d.Surprise,
                anticipation: +d.Anticipation,
                anger: +d.Anger,
                disgust: +d.Disgust
            }
        }

       var valKey = 0;
       var arKey =0 ;
       var countKey =0;
       var domKey =0;
       Promise.all([d3.csv('data/' + user_name + '.csv',cleanup_data)])
        .then(function (values) {

            circleData=values[0]
            const startDate1=new Date(document.getElementById(`end-date`).value);
            const endDate1=new Date(document.getElementById(`start-date`).value);
            let final = []
            let sadness = []
            let joy = []
            let trust = []
            let fear = []
            let surprise = []
            let anticipation = []
            let anger = []
            let disgust = []
            const start = Date.parse(endDate1);
            const end = Date.parse(startDate1);

            for (var i = 0; i < circleData.length; i++) {
                let current = circleData[i]
                let currentUnixtimeStamp = Date.parse(current["time"]);

                if(currentUnixtimeStamp>=start && currentUnixtimeStamp<=end){
                    final.push(current);
                    
                    console.log(current.emotion);
                    console.log(keyValue);
                    if(keyValue == current.emotion){
                        console.log(current.valence);
                        valKey = valKey + current.valence
                        arKey = arKey + current.arousal;
                        domKey = domKey + current.dominance;
                        countKey = countKey + 1;
                    }

                    switch(current["emotion"]){
                        case "Sadness":
                            sadness.push(current);
                            break;
                        case "Joy":
                            joy["count"]+=1;
                            joy.push(current);
                            break;
                        case "Trust":
                            trust.push(current);
                            break;
                        case "Surprise":
                            surprise.push(current);
                            break;
                        case "Anticipation":
                            anticipation.push(current);
                            break;
                        case "Anger":
                            anger.push(current);
                            break;
                        case "Disgust":
                            disgust.push(current);
                            break;
                        case "Fear":
                            fear.push(current);
                            break;
                    }
                    
                }

            }

            let result = [
                            { Name: "Joy", count: joy.length, color: "#fe5eea"},
                            { Name: "Sadness", count: sadness.length, color: "#AFF3FF"},
                            { Name: "Trust", count: trust.length, color: "#00FF6A"},
                            { Name: "Surprise", count: surprise.length, color: "#3BBFFC"},
                            { Name: "Anticipation", count: anticipation.length, color: "#FFDA46"},
                            { Name: "Anger", count: anger.length, color: "#F15236"},
                            { Name: "Disgust", count: disgust.length, color: "#B333F1"},
                            { Name: "Fear", count: fear.length, color: "#f39f69"}
                         ];

      const width = 300 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      console.log(valKey);
      console.log(domKey);
      console.log(arKey);
      console.log(countKey);
      if(countKey !=0 ){
        valKey = (valKey/countKey)/9;
        arKey = (arKey/countKey)/9;
        domKey = (domKey/countKey)/9;

      }

      const g1 = tipSVG2.append('g')
      // .opacity('opacity','1')
          .attr('transform', `translate(${margin.left},${margin.top})`);

      const groupBycountThreshold = d3.group(result, d => d.count >= 0);

      const hierarchy = d3.hierarchy({
        children: [
          { children: groupBycountThreshold.get(true) },
        ]
      })
        .sum(d => d.count)
        .sort((a, b) => b.value - a.value);

      const pack = d3.pack()
          .padding(5)
          .size([width, height]);

      const root = pack(hierarchy);
      let valence;
      let time ;

      g1.selectAll('circle')
        .data(root.descendants().slice(1))
        .join('circle')
          .attr('r', d => d.r)
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .style("stroke","black")
          .style("stroke-width",3)
          .attr('fill', function(d){
            return d.children ? '#ffffff00' : d.data.color
          })
          .on("mouseover", function(event,d) {
            // time = d["data"]["timeStamp"]
            // valence = d["data"][]
            console.log(d["data"]["Name"],d["data"]["count"]);
          });

    tipSVG2.append(`text`)
        .attr(`x`, 100)
        .attr(`class`, `keyText`)
        .attr(`y`, 300)
        .style(`font`, fontSize)
        .style(`font-family`, fontFamily)
        .attr(`fill`, fontColor)
        .style('font-weight','bold')
        .text('Emotion: '+keyValue);

    // tipSVG2.append(`text`)
    //     .attr(`x`, 100)
    //     .attr(`class`, `valText`)
    //     .attr(`y`, 350)
    //     .style(`font`, fontSize)
    //     .style(`font-family`, fontFamily)
    //     .attr(`fill`, fontColor)
    //     .text('Valence: '+valKey.toFixed(2));

    tipSVG2.append(`text`)
        .attr(`x`, 100)
        .attr(`class`, `domText`)
        .attr(`y`, 350)
        .style(`font`, fontSize)
        .style(`font-family`, fontFamily)
        .attr(`fill`, fontColor)
        .text('Dominance: '+domKey.toFixed(2));

    tipSVG2.append(`text`)
        .attr(`x`, 100)
        .attr(`class`, `arText`)
        .attr(`y`, 400)
        .style(`font`, fontSize)
        .style(`font-family`, fontFamily)
        .attr(`fill`, fontColor)
        .text('Arousal: '+arKey.toFixed(2));          
            });
    

}

const drawWC = (key, tipSVG) => {
   
    
    d3.select("#wc").selectAll("*").remove();

    let eD = new Date(document.getElementById(`end-date`).value);
    let sD = new Date(document.getElementById(`start-date`).value);


    Promise.all([d3.csv('data/' + user_name + '.csv')])
        .then(function (data) {

            wcData = data[0]
            const startDate11 = new Date(document.getElementById(`end-date`).value);
            const endDate11 = new Date(document.getElementById(`start-date`).value);
            let final = []
            const start = Date.parse(endDate11);
            const end = Date.parse(startDate11);
            for (var i = 0; i < wcData.length; i++) {
                let current = wcData[i]
                let currentUnixtimeStamp = Date.parse(current["time"]);

                if (currentUnixtimeStamp >= start && currentUnixtimeStamp <= end && current["emotion"] == key) {
                    final.push(current);
                }
            }

            // console.log(final);

            // console.log("----1-----")

            dataSet = []
            countryDict = {}
            wordList = []

            // console.log("----2-----")

            for (var i = 0; i < final.length; i++) {
                // console.log(final[i])

                wordList.push(final[i]["Found Words"])

            }
            // console.log(wordList)
            final_f = []
            ab = []
            arr = []
            for (var j = 0; j < wordList.length; j++) {
                ab = Object.assign([], (wordList[j]))

                arr = ab.filter(function (item) {
                    return item !== ']' && item !== '[' && item !== "'" && item !== " "
                })
                let strr = ""
                // console.log("arr")
                // console.log(arr)
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] != ',') {
                        strr = strr + arr[i]

                    }
                    else {

                        final_f.push(strr)
                        strr = ""
                    }
                }
                ab = []
                arr = []

                final_f.push(strr)
                strr = ""


            }
            // console.log(final_f)

            final_f = final_f.filter(function (item) {
                return item !== ""
            })

            // console.log(final_f)


            function getWordCount(array) {
                let map = {};
                for (let i = 0; i < array.length; i++) {
                    let item = array[i];
                    map[item] = (map[item] + 1) || 1;
                }
                return map;
            }

            finalMap = getWordCount(final_f)

            // console.log(finalMap)

            myWords = []

            for (var i = 0; i < Object.keys(finalMap).length; i++) {
                map = {}
                map["word"] = Object.keys(finalMap)[i]
                map['size'] = finalMap[Object.keys(finalMap)[i]]
                myWords.push(map)
                map = {}

            }


            // console.log(myWords)
            const color = d3.scaleOrdinal()
                .domain(myWords)
                .range(d3.schemeSet1);

            var margin = { top: 10, right: 10, bottom: 10, left: 300 },
                width = 450 - margin.left - margin.right,
                height = 450 - margin.top - margin.bottom;






            var layout = d3.layout.cloud()
                .size([width, height])
                .words(myWords.map(function (d) { return { text: d.word, size: d.size }; }))
                .padding(5)
                .rotate(function() { return 0})
                .fontSize(function (d) { return d.size *3; })
                .on("end", draw);
            layout.start();

            function draw(words) {
                tipSVG
                    .append("g")
                    .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                    .style("font-size", function (d, i) { console.log(d); return `${d.size*3}px` })
                    .style("fill", color)
                    .attr("text-anchor", "middle")
                    .style("font-family", "Helvetica")
                    .attr("transform", function (d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function (d) { return d.text; });
            }
        });
        
}


const drawgraphs = () => {
    console.log("Submit button invoked----------------------")
    vadData = [];
    const userId = document.getElementById('user-id').value;
    user_name = userId;
   
    const filePath = `data/${user_name}.csv`;
    // console.log(filePath); 
    var result = checkFileExist(`${filePath}`);
    if (result == true) {
        clearInterval(intervalId); 
        d3.csv(filePath).then(data => {
            let maxDate = new Date(2006, 2, 21);
            data.forEach(element => {
                let obj = {};
                obj.id = +element.id;
                obj.timeStamp = new Date(element.time);
                obj.Sadness = +element.Sadness;
                obj.Joy = +element.Joy;
                obj.Trust = +element.Trust;
                obj.Fear = +element.Fear;
                obj.Surprise = +element.Surprise;
                obj.Anticipation = +element.Anticipation;
                obj.Anger = +element.Anger;
                obj.Disgust = +element.Disgust;
                if (maxDate < obj.timeStamp) {
                    maxDate = obj.timeStamp;
                }
                obj.emotion = element.emotion;
                vadData.push(obj);

            });
    
            let endDate = document.getElementById(`end-date`);
            endDate.valueAsDate = maxDate;
    
            let month = maxDate.getMonth() - 6;
            let year = maxDate.getFullYear();
    
            if (month < 0) {
                year = year - 1;
                month = month + 12;
            }
    
            let startDate = document.getElementById(`start-date`);
            startDate.valueAsDate = new Date(year, month, 1);
    
            dateChange(vadData);
            drawLabels();

            console.log(vadData);
            vadData.forEach(e => {
                emotion_map[e.emotion] = emotion_map[e.emotion] + 1;
                
            })
            // for (let i = 0 ; i < vadData.length; ++i ) {
            //     let element = vadData[i];
            //     con
            //     emotion_map[element.emotion] = emotion_map[element.emotion] + 1;
            //     console.log(element.emotion);
            // }
            console.log(emotion_map);
            drawPie(emotion_map);
            drawScatter();
        });
    } else {
        console.log('file does not exist!');
        intervalId;
    }
}


function drawScatter() {
    Promise.all([d3.csv('data/' + user_name + '.csv')])
        .then(values => {
            d3.select("#scatter-plot-svg").remove();

            let data = values[0];
            let endDate = new Date(document.getElementById(`end-date`).value);
            let startDate = new Date(document.getElementById(`start-date`).value);

            if (startDate < endDate) {
                data = data.filter(element => {
                    if (startDate <= new Date(element.time) && new Date(element.time) <= endDate) {
                        return true;
                    }
                    return false;
                });
            }

            data.forEach(element => {
                element.Valence = +element.Valence / 9;
                element.Arousal = +element.Arousal / 9;
            });

            let margin = {top: 30, right: 30, bottom: 30, left: 50},
                width = 600 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            // append the svg object to the body of the page
            let svg = d3.select("#scatter-plot")
                .append("svg")
                    .attr("id", "scatter-plot-svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");

            let max_valence = d3.max(data, d => +d.Valence);
            let min_valance = d3.min(data, d => +d.Valence);
            let max_arousal = d3.max(data, d => +d.Arousal);
            let min_arousal = d3.min(data, d => +d.Arousal);

            let x = d3.scaleLinear()
                .domain([0, 1])
                .range([ 0, width ]);
            svg.append("g")
                .attr("transform", "translate(0," + (height / 2) + ")")
                .call(d3.axisBottom(x).ticks(5));

            svg.append(`text`)
                .attr(`x`, width / 2 + 10)
                .attr(`class`, `xAxisTextScatter`)
                .attr(`y`, 10)
                .style(`font`, 12)
                .text(`Valence`);

            svg.append(`text`)
                .attr(`x`, width - 40)
                .attr(`class`, `xAxisTextScatter`)
                .attr(`y`, height / 2 + 40)
                .style(`font`, 12)
                .text(`Arousal`);
        
            let y = d3.scaleLinear()
                .domain([0, 1])
                .range([ height, 0]);
            svg.append("g")
                .attr("transform", "translate(" + (width / 2) + ",0)")
                .call(d3.axisLeft(y).ticks(5));
        
            svg.append('g')
                .selectAll("dot")
                .data(data)
                .enter()
                .append("circle")
                    .attr("cx", function (d) { return x(+d.Arousal); } )
                    .attr("cy", function (d) { return y(+d.Valence); } )
                    .attr("r", 6.5)
                    .style("fill", function(d) { return colorMap(d.emotion); })
                    .style("opacity", 0.8);
        });
}


const checkFileExist = (urlToFile) => {
    // var xhr = new XMLHttpRequest();
    // xhr.open('HEAD', urlToFile, false);
    // xhr.send();
     
    // if (xhr.status == "404") {
    //     return false;
    // } else {
    //     return true;
    // }
    return true;
}

var intervalId = window.setInterval(function(){
    drawgraphs();
  }, 5000);
