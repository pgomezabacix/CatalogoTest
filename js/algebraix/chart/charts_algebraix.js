//$( document ).ready(function() {
function list_results_js(url, id, colors, type, options) {
    $.ajax({
        url: url,
        cache: false,
        success: function (json) {
            if(options.show_list){
                var list = document.getElementById(id + '_list');
                var total = json.chart_data.labels.length;
                var colors = colorsGraph(total);
                var newHtml = '';

                json.chart_data.labels.forEach(function(i, index){
                    var item =
                    `<li class="material-list__item">
                        <i class="fas fa-circle material-list__icon" style="color: ${colors[index]}"></i>
                        <span class="material-list__text">
                            <span class="material-list__text--primary">${i}</span>
                        </span>
                        <span class="material-list__meta--center">${json.chart_data.datasets[0].data[index]}</span>
                    </li>`;
                    newHtml += item;
                });
                list.innerHTML = newHtml;
            }

            if(options.hide_legend){
                json.options.legend.display = false;
            }

            json_chart_js(json, id, colors, type);
        }
    });
}

function ajax_json_chart_js(url, id, colors, type) {

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
        let res = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
            json_chart_js(res, id, colors, type);
        } else {
            console.error(xhr);
        }
    }
    xhr.send();

}

function json_chart_js(json, id, colors, type, colorsIndex) {

    /* plugin for text in pie */
        var plugins = Chart.plugins._plugins.filter( function(p) { return p.id == 'datalabels' || p.id == 'telescopes' });
        Chart.plugins.unregister(plugins);
    /* plugin for text in pie */

    if (dark_mode) {
        json = dark_mode_chart(json, type);
    }
    if (!colors){
        colors = colorsGraph(json.chart_data.labels.length);
    }

    if ( json.options) {
        if ( json.options.onClick && typeof(json.options.onClick) == 'string' ) {
            var name = json.options.onClick;
            json.options.onClick = function(e) {
                var fn = window[name] || function() { console.log(Error("Function \"" + name + "\" doesn't exists")) };
                fn(e);
            }
        }
    }

    var chart;

    switch (type) {
        case 'multibar':
            chart = graphMultiBar(json, id, colors);
            break;
        case 'bar':
            chart = graphBar(json, id, colors);
            break;
        case 'horizontalBar':
            chart = graphHorizontalBar(json, id, colors);
            break;
        case 'line':
            chart = graphLine(json, id, colors, colorsIndex);
            break;
        case 'pie':
            chart = graphPie(json, id, colors);
            break;
        case 'doughnut':
            chart = graphDoughnut(json, id, colors);
            break;
    }
    $('#' + id).removeClass('bg-animation');
    return chart;
}

function dark_mode_chart(json, type) {
    if(type !== 'pie'){
        json.options.scales.xAxes[0].gridLines = {
            color: 'white'
        };
        json.options.scales.yAxes[0].gridLines = {
            color: 'white'
        };
        json.options.scales.xAxes[0].scaleLabel.fontColor = "white";
        json.options.scales.xAxes[0].ticks = {
            fontColor: "white"
        };
        json.options.scales.yAxes[0].ticks.fontColor = "white";
        json.options.scales.yAxes[0].scaleLabel.fontColor = "white";
    }

   if (json.options.legend.labels) {
        json.options.legend.labels.fontColor = "white";
    }

    return json
}

function graphMultiBar(json, id, colors) {
    var myChart = document.getElementById(id).getContext('2d');

    if (colors.length >= 1) {
        json.chart_data.datasets.forEach(function (value, index) {
            value.backgroundColor = colors[index];
        });
    }


    return new Chart(myChart, {
        type: 'bar',
        data: {
            labels: json.chart_data.labels,
            datasets: json.chart_data.datasets
        },
        options: json.options,
        plugins: [{
            beforeInit: function (chart) {
                labelTextChart(chart);
            }
        }]
    });
}

function graphBar(json, id, colors) {
    var myChart = document.getElementById(id).getContext('2d');
    json.chart_data.datasets[0].backgroundColor = [];

    json.chart_data.datasets[0].data.forEach(function (value, index) {
        json.chart_data.datasets[0].backgroundColor.push(colors[index]);
    });

    json.options.scales.xAxes[0].scaleLabel.display = false;

    if(json.chart_data.labels_y){
        json.options.scales.yAxes[0].ticks.callback = function (value, index, values) {
            return json.chart_data.labels_y[value];
        };

        json.options.tooltips = {
            callbacks: {
                label: function(tooltipItem) {
                    return json.chart_data.labels_y[tooltipItem.yLabel];
                },
            }
        };
    }

    json.options.scales.yAxes[0].ticks.callback = function (value, index, values) {
        return number_commify(value);
    };

    json.options = {
        plugins: {
            formatter: function(value, ctx) {
                return number_commify(value);
            }
        }
    }

    return new Chart(myChart, {
        type: 'bar',
        data: {
            labels: json.chart_data.labels,
            datasets: json.chart_data.datasets
        },
        options: json.options,
        plugins: [{
            beforeInit: function (chart) {
                if(json.chart_data.labels < 10){
                    labelTextChart(chart);
                }
            }
        }]
    });
}

function graphHorizontalBar(json, id, colors) {


    var myChart = document.getElementById(id).getContext('2d');
    json.chart_data.datasets[0].backgroundColor = [];

    json.chart_data.datasets[0].data.forEach(function (value, index) {
        json.chart_data.datasets[0].backgroundColor.push(colors[index]);
    });



    if(json.chart_data.labels_y){
            json.options.scales.xAxes[0].ticks.callback = function (value, index, values) {
                    return json.chart_data.labels_y[value];
            };
            json.options.tooltips = {
                callbacks: {
                    label: function(tooltipItem) {
                        return json.chart_data.labels_y[tooltipItem.xLabel];
                    },
                }
            };
    }

    if(json.options.scales){
        if (dark_mode) {
            json.options.scales.yAxes[0].ticks.fontSize = '10';
        } else {
            if(!json.options.scales.yAxes[0].ticks || !json.options.scales.yAxes[0].ticks.display === false){
                json.options.scales.yAxes[0].ticks = {};
            }
            json.options.scales.yAxes[0].ticks.fontSize = '10';
        }

        json.options.scales.xAxes[0].scaleLabel.display = false;
    }


    json.options.responsive = true;

    return new Chart(myChart, {
        type: 'horizontalBar',
        data: {
            labels: json.chart_data.labels,
            datasets: json.chart_data.datasets
        },
        options: json.options,
        plugins: [{
            beforeInit: function (chart) {
                labelTextChart(chart);
            }
        }]
    });
}

function graphLine(json, id, colors, colorsIndex) {

    var myChart = document.getElementById(id).getContext('2d');

    if (colors.length > 0) {
        json.chart_data.datasets.forEach(function (value, index) {
            value.backgroundColor = colors[index];
            value.borderColor = colors[index];
            value.fill = false;
        });
    } else {
        var graphColor = colorsIndex ? colorsGraph(0,colorsIndex) : '#4a7dff';
        json.chart_data.datasets.forEach(function (value, index) {
            value.backgroundColor = graphColor;
            value.borderColor = graphColor;
            value.fill = false;
        });
    }

    if(json.chart_data.labels_y){
            json.options.scales.yAxes[0].ticks.callback = function (value, index, values) {
                    return json.chart_data.labels_y[value];
            };
            json.options.tooltips = {
                callbacks: {
                    label: function(tooltipItem) {
                        return json.chart_data.labels_y[tooltipItem.yLabel];
                    },
                }
            };
    }

    return new Chart(myChart, {
        type: 'line',
        data: {
            labels: json.chart_data.labels,
            datasets: json.chart_data.datasets
        },
        options: json.options,
        plugins: [{
            beforeInit: function (chart) {
                labelTextChart(chart);
            }
        }]
    });
}

function graphPie(json, id, colors) {

    var myChart = document.getElementById(id).getContext('2d');

    json.chart_data.datasets[0].backgroundColor = [];

    if (colors.length >= 1) {
            json.chart_data.datasets[0].data.forEach(function (value, index) {
                json.chart_data.datasets[0].backgroundColor.push(colors[index]);
            });
    };

    /* plugin for text in pie */
    Chart.plugins.register(chartjs_plugin_telescopes());
    json.options.plugins = {};
    json.options.plugins.datalabels = _defaultsDatalabels();
    /* plugin for text in pie */

    if (json.options.tooltips == undefined){
        json.options.tooltips = {};
        json.options.tooltips.callbacks = {};
        json.options.tooltips.callbacks.label = {};

    }

    json.options.tooltips.callbacks.label = function(tooltipItem, data) {
            var label;
            var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
            var dataLabel = data.labels[tooltipItem.index];
            let sum = 0;

            var value_commify = number_commify(value);

            data.datasets[tooltipItem.datasetIndex].data.map(data => { sum += parseFloat(data); });
            let percentage = (value*100 / sum).toFixed(2)+"%";
            switch (json.options.tooltips.option_label) {
                    case 'auto':
                            if( dataLabel.toString().length > 40 ){
                                    label = [percentage, value_commify];
                            }
                            else {
                                    label = [dataLabel, percentage, value_commify];
                            }
                        break;
                    case 'vertical':
                        if (Chart.helpers.isArray(dataLabel)) {
                                dataLabel = dataLabel.slice();
                                dataLabel[0] += ': ' + percentage + ',  ' + value_commify;
                        } else {
                                dataLabel = [dataLabel, percentage, value_commify];
                        }
                        label = dataLabel;
                        break;
                    case 'horizontal':
                        label = dataLabel + ": " + percentage  + ', ' + value_commify;
                        break;
                    default:
                        label = dataLabel + ": " + percentage  + ', ' + value_commify;
            }
            return label;
    };

    return new Chart(myChart, {
        type: 'pie',
        data: {
            labels: json.chart_data.labels,
            datasets: json.chart_data.datasets
        },
        options: json.options,
        plugins: [ChartDataLabels, {
            beforeInit: function (chart) {
                //labelTextChart(chart);
            }
        }]
    });
}

function graphDoughnut(json, id, colors) {
    var myChart = document.getElementById(id).getContext('2d');


    if (colors.length >= 1) {
        json.chart_data.datasets.forEach(function (value, index) {
            value.backgroundColor = colors[index];
            value.borderColor = colors[index];
            value.fill = false;
        });
    }

    json.chart_data.hover = {};
    json.chart_data.hover.mode = 'nearest';
    json.chart_data.hover.intersect = true;

    json.chart_data.tooltips = {};
    json.chart_data.tooltips.mode = 'index';
    json.chart_data.tooltips.intersect = true;

    return new Chart(myChart, {
        type: 'doughnut',
        data: {
            labels: json.chart_data.labels,
            datasets: json.chart_data.datasets
        },
        options: json.options,
        plugins: [{
            beforeInit: function (chart) {
                labelTextChart(chart);
            }
        }]
    });
}



function colorsGraph(colorsCount, index) {
    var colors = [
        '#2397f4',
        '#ffc106',
        '#e52c28',
        '#00a56f',
        '#8B6BC4',
        '#d60052',
        '#ff9800',
        '#48cfad',
        !dark_mode ? '#2C2F36' : '#C9C9C9',
        '#820263',
        '#006BA6',
        '#6610f2',
        '#17a2b8',
        'rgba(35, 151, 244, .85)',
        'rgba(255, 193, 6, .85)',
        'rgba(229, 44, 40, .85)',
        'rgba(0, 165, 111, .85)',
        'rgba(139, 107, 196, .85)',
        'rgba(214, 0, 82, .85)',
        'rgba(255, 152, 0, .85)',
        'rgba(72, 207, 173, .85)',
        !dark_mode ? 'rgba(44, 47, 54, .85)' : 'rgba(249, 249, 249, .85)',
    ];

    if (colorsCount > colors.length) {
        var moreThan = (colorsCount - colors.length);
        for (var i = 0; i < moreThan; i++) {
            colors.push(colors[i])
        }
    }

    if (index) {
        return [colors[index % colors.length]];
    }

    return colors;

}

function colorsSchedule() {
    return [
        '#04A777',
        '#793595',
        '#2E85FF',
        '#FFBC42',
        '#D9023F',
        '#E5822D',
        '#403F4C',
        '#1FBDB0',
        '#820263',
        '#006BA6',
        '#867C8A',
        '#09baff',
        '#f7d6bb',
        '#bab9c5',
        'rgba(51, 143, 255, 0.5)',
        'rgba(255, 195, 75, 0.4)',
        'rgba(130, 53, 28, 0.5)',
        'rgba(145, 135, 149, 0.4)',
        'rgba(1, 176, 130, 0.4)',
        'rgba(2, 118, 175, 0.5)',
        'rgba(141, 0, 110, 0.4)',
        'rgba(198, 9, 0, 0.48)',
        'rgba(33, 197, 185, 0.4)',
        'rgba(207, 124, 186, 0.5)',
    ]
}

function colorsSchedulePop(count) {

    var colors = [
        ['#1FBDB0'],
        ['#793595'],
        ['#2E85FF'],
        ['#FFBC42'],
        ['#09baff'],
        ['#867C8A'],
        ['#04A777'],
        ['#006BA6'],
        ['#820263'],
        ['#D9023F'],
        ['#E5822D'],
        ['#403F4C'],
        ['rgba(33, 197, 185, 0.4)'],
        ['rgba(207, 124, 186, 0.5)'],
        ['rgba(51, 143, 255, 0.5)'],
        ['rgba(255, 195, 75, 0.4)'],
        ['rgba(130, 53, 28, 0.5)'],
        ['rgba(145, 135, 149, 0.4)'],
        ['rgba(1, 176, 130, 0.4)'],
        ['rgba(2, 118, 175, 0.5)'],
        ['rgba(141, 0, 110, 0.4)'],
        ['rgba(198, 9, 0, 0.48)'],
        ['#f7d6bb'],
        ['#bab9c5']
    ];

    return colors[count];
}

function labelTextChart(chart) {
    chart.data.labels.forEach(function (value, index, array) {
        var maxwidth = 10;
        var sections = [];

        if(value == null)
            value = '';
        var words = value.split(" ");
        var temp = "";

        words.forEach(function (item, index) {
            if (temp.length > 0) {
                var concat = temp + ' ' + item;

                if (concat.length > maxwidth) {
                    sections.push(temp);
                    temp = "";
                } else {
                    if (index == (words.length - 1)) {
                        sections.push(concat);
                        return;
                    } else {
                        temp = concat;
                        return;
                    }
                }
            }

            if (index == (words.length - 1)) {
                sections.push(item);
                return;
            }

            if (item.length < maxwidth) {
                temp = item;
            } else {
                sections.push(item);
            }

        });
        array[index] = sections;
    })
}

function render_chartjs(ctxOrChart, config) {
    if (typeof(ctxOrChart) == 'string') {
        var element = document.getElementById(ctxOrChart)
		if (!element) return
		ctxOrChart = element.getContext('2d')
    }
    if (config.options.plugins && config.options.plugins.datalabels) {
        config.options.plugins.datalabels = _defaultsDatalabels()
    } else {
        config.options.plugins = config.options.plugins || {};
        config.options.plugins.datalabels = {
            display: false
        }
    }
    if (config.options.scales) {
        var fn = function(axis) {
            if (axis.type == 'logarithmic') {
                if (!axis.ticks) axis.ticks = {}
                axis.ticks.userCallback = function(tick, index, arr) {
                    const remain = tick / (Math.pow(10, Math.floor(Chart.helpers.log10(tick))))

                    if (remain === 1 || remain === 2 || remain === 5 || index === 0 || index === arr.length - 1) {
                        return (new Number(tick)).toLocaleString()
                    } else {
                        return ''
                    }
                }
            }
			else if (axis.value_format == 'number_magnitude_suffix') {
				if (!axis.ticks) axis.ticks = {}
				axis.ticks.userCallback = function(tick, index, arr) {
					return nFormatter(tick)
				}
			}
        }
        if (config.options.scales.xAxes instanceof Array) config.options.scales.xAxes.forEach(fn)
        if (config.options.scales.yAxes instanceof Array) config.options.scales.yAxes.forEach(fn)
    }
    if (config.options && config.options.algebraix && config.options.algebraix.use_html_tooltip) {
        if (!config.options.tooltips) config.options.tooltips = {};
        config.options.tooltips.enabled = false;
		var getBody;
		if (config.options.algebraix.html_tooltip_value_format == 'currency') {
			var formatter = new Intl.NumberFormat('es-MX', {
			  style: 'currency',
			  currency: 'MXN',
			});
			getBody = function (bodyItem) {
				return bodyItem.lines.map(function(line){
					var arr = line.split(': ')
					var value = arr[1] || 0
					arr[1] = formatter.format(value)
					return arr.join(': ')
				})
			}
		}
		else {
			getBody = function (bodyItem) {
				return bodyItem.lines
			}
		}
        config.options.tooltips.custom = function(tooltipModel) {
            // Tooltip Element
            var tooltipEl = document.getElementById('chartjs-tooltip');

            // Create element on first render
            if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.id = 'chartjs-tooltip';
                tooltipEl.innerHTML = '<table></table>';
                document.body.appendChild(tooltipEl);
            }

            // Hide if no tooltip
            if (tooltipModel.opacity === 0) {
                tooltipEl.style.opacity = 0;
                return;
            }

            // Set caret Position
            tooltipEl.classList.remove('above', 'below', 'no-transform');
            if (tooltipModel.yAlign) {
                tooltipEl.classList.add(tooltipModel.yAlign);
            } else {
                tooltipEl.classList.add('no-transform');
            }

            // Set Text
            if (tooltipModel.body) {
                var titleLines = tooltipModel.title || [];
                var bodyLines = tooltipModel.body.map(getBody);

                var innerHtml = '<thead>';

                titleLines.forEach(function(title) {
                    innerHtml += '<tr><th>' + title + '</th></tr>';
                });
                innerHtml += '</thead><tbody>';

                bodyLines.forEach(function(body, i) {
                    var colors = tooltipModel.labelColors[i];
                    var style = 'background:' + colors.backgroundColor;
                    style += '; border-color:' + colors.borderColor;
                    style += '; border-width: 2px';
                    style += '; margin-bottom: -2px';
                    style += '; display: inline-block';
                    style += '; width: 1em';
                    style += '; height: 1em';
                    var span = '<span style="' + style + '"></span>&nbsp;';
                    innerHtml += '<tr><td>' + span + body + '</td></tr>';
                });
                innerHtml += '</tbody>';

                var tableRoot = tooltipEl.querySelector('table');
                tableRoot.innerHTML = innerHtml;
            }

            // `this` will be the overall tooltip
            var position = this._chart.canvas.getBoundingClientRect();

            // Display, position, and set styles for font
            tooltipEl.style.opacity = 1;
            tooltipEl.style.transition = 'opacity 0.15s ease-in-out';
            tooltipEl.style.position = 'absolute';
            tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
            tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
            tooltipEl.style.fontFamily = tooltipModel._bodyFontFamily;
            tooltipEl.style.fontSize = tooltipModel.bodyFontSize + 'px';
            tooltipEl.style.fontStyle = tooltipModel._bodyFontStyle;
            tooltipEl.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px';
            tooltipEl.style.pointerEvents = 'none';
            tooltipEl.style.backgroundColor = '#000C'
            tooltipEl.style.color = 'white'
            tooltipEl.style.borderRadius = '0.5em'
            tooltipEl.style.lineHeight = '1.2'
        };
    }
    if (ctxOrChart instanceof Chart) {
        ctxOrChart.config.type = config.type;
        ctxOrChart.data = config.data;
        let traverse = (o, keys) => {
            Object.entries(o).forEach(([k, v]) => {
                if (v instanceof Object) {
                    traverse(v, [...keys, k]);
                }
                else {
                    let ref = ctxOrChart.config.options;
                    keys.forEach(key => ref = (ref[key] = ref[key] || {}));
                    ref[k] = v;
                }
            });
        };
        traverse(config.options, []);
        ctxOrChart.update();
        return ctxOrChart;
    }
    else {
        return new Chart(ctxOrChart, config);
    }
}

function _defaultsDatalabels() {
    return {
        color: '#FFFE',
        clamp: true,
        font: {
            size: 14,
            weight: 'bold'
        },
        textAlign: 'center',
        anchor: function(ctx){
            switch(ctx.chart.config.type) {
                case 'pie': return 'end';
            }
        },
        align: function(ctx){
            switch(ctx.chart.config.type) {
                case 'pie': return 'start';
            }
        },
        offset: function(ctx){
            switch(ctx.chart.config.type) {
                case 'pie': return 24;
            }
        },
        display: function(ctx) {
            if ( ctx.chart.config.type == 'line' || ctx.chart.config.type == 'bar' || ctx.chart.config.type == 'doughnut' ) return false;
            var value = ctx.dataset.data[ctx.dataIndex];
            var total = ctx.dataset.data.reduce(function(total, num){return parseInt(total) + parseInt(num)}, 0);
            return Math.floor((value/total) * 100) > 6;
        },
        formatter: function(value, ctx) {
            var total = ctx.dataset.data.reduce(function(total, num){return parseInt(total) + parseInt(num)}, 0);
            return number_commify(value) + '\n' + Math.floor((value/total) * 100)+'%';
        }
    }
}

function chartjs_plugin_telescopes() {
    return {
        id: 'telescopes',
        afterDatasetDraw: function(chart, args, options) {
            if (chart.config.type != 'pie') return;
            if (chart.getVisibleDatasetCount() > 1) return;
            var dataset = chart.data.datasets[0];
            var total = dataset.data.reduce(function(total, i) { return total + parseInt(i) }, 0);
            var _2render = dataset.data.map(function(value){
                return Math.floor((value/total) * 100) <= 6;
            });
            var me = this;
            var count = -1;
            var shouldRenderTotal = _2render.reduce(function(total, i) {
                if(i) return total + 1;
                return total;
            }, 0);
            _2render.forEach( function(shouldRender, i) {
                if(!shouldRender) return;
                me.renderTelescope.apply(me, [chart, args, options, i, ++count, shouldRenderTotal, _2render.length, dataset, total]);
            });
        },
        renderTelescope: function(chart, args, options, i, count, shouldRenderTotal, total, dataset, dataTotal) {
            if (chart.config.type != 'pie') return;
            var meta = chart.getDatasetMeta(0);
            var model = meta.data[i]._model;
            var a = (model.startAngle + model.endAngle) / 2;
            var p = { x: model.outerRadius * (0.0 + (0.5*(total-count))/total), y: 0 };
            var x = p.y * Math.sin(a) + p.x * Math.cos(a);
            var y = -(p.y * Math.cos(a) - p.x * Math.sin(a));
            x += model.x;
            y += model.y;
            // var ev = args.meta.data[i].hidden ? 1 - args.ev : args.ev;
            var ev = args.meta.data[i].hidden ? 0 : 1;

            chart.ctx.save();

            chart.ctx.font = 'bold 12px Arial';
            var text = parseInt(100*dataset.data[i]/dataTotal) + '% - ' + number_commify(dataset.data[i]);

            var width = chart.ctx.measureText(text).width;
            var height = 16;
            var xStart = chart.width - 60;
            var yOffset = 10;
            var yGap = 10;
            var yStart = yOffset + ((count) * (height + yGap));
            var padding = 5;

            chart.ctx.strokeStyle = dark_mode ? '#FFFF' : '#3338';
            chart.ctx.beginPath();
            {
                var _x = xStart - 2;
                var _y = yStart + (height / 2);
                var delta = {
                    x: _x + ((x - _x) * ev),
                    y: _y + ((y - _y) * ev)
                };
                chart.ctx.moveTo(_x, _y);
                chart.ctx.lineTo(delta.x, delta.y);
            }
            chart.ctx.lineWidth = 1.1;
            chart.ctx.stroke();

            chart.ctx.strokeStyle = dark_mode ? '#FFFF' : '#333';
            chart.ctx.beginPath();
            {
                var _x = xStart - 2;
                var _y = yStart + (height / 2) * (1 - ev);
                var _height = height * ev;
                chart.ctx.moveTo(_x, _y);
                chart.ctx.lineTo(_x, _y + _height);
            }
            chart.ctx.lineWidth = 1.5;
            chart.ctx.stroke();

            chart.ctx.fillStyle = model.backgroundColor;
            chart.ctx.fillText(text, xStart + padding/2, yStart + height/2 + 1);

            chart.ctx.fillStyle = dark_mode && !ev ? '#2c2f36' : `rgba(255,255,255,${ 1 * ( 1 - ev ) })`;
            chart.ctx.fillRect(xStart + padding/2, yStart, width, 16);

            chart.ctx.restore();
        }
    };
}
