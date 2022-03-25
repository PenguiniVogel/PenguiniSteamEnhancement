/**
 * Replace Steams current chart with a fancy solution thanks to chart.js
 *
 * @author Felix Vogel
 */
/** */
module InjectChart {

    let div = document.createElement('div');

    div.setAttribute('style', 'height: 300px;');

    let canvas = document.createElement('canvas');

    canvas.setAttribute('style', 'max-height: 300px');

    div.appendChild(canvas);

    document.getElementById('pricehistory').after(div);

    let line1 = '';
    let scripts = document.querySelectorAll('body script');

    for (let i = 0, l = scripts.length; i < l; i ++) {
        line1 = (/var line1=(.*);/g.exec(scripts.item(i).innerHTML) ?? [])[1];

        if (line1) break;
    }

    let dates: string[] = [];
    let prices: number[] = [];
    let volumes: number[] = [];
    let parsedLine: [string, number, string][] = JSON.parse(line1);

    parsedLine.forEach(e => {
        let date = new Date(Date.parse(e[0]));
        // console.debug(date, '->', date.getDate(), date.getMonth(), date.getFullYear());
        dates.push(`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`);
        prices.push(e[1]);
        volumes.push(+e[2]);
    });

    // console.debug(dates, prices, volumes);

    let chart = new Chart.Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Price',
                    data: prices,
                    backgroundColor: '#688f3e',
                    borderColor: '#688f3e',
                    tension: 0.05,
                    pointStyle: 'circle',
                    pointRadius: 1,
                    pointHitRadius: 2,
                    pointHoverRadius: 5,
                    yAxisID: 'y'
                },
                {
                    hidden: true,
                    label: 'Volume',
                    data: volumes,
                    backgroundColor: '#6b8fc3',
                    borderColor: '#6b8fc3',
                    tension: 0.05,
                    pointStyle: 'circle',
                    pointRadius: 1,
                    pointHitRadius: 2,
                    pointHoverRadius: 5,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            layout: {
                padding: 5
            },
            scales: {
                x: {
                    grid: {
                        color: '#1b2939'
                    },
                    min: Math.max(0, dates.length - 150)
                },
                y: {
                    display: true,
                    position: 'left',
                    grid: {
                        color: '#1b2939'
                    }
                },
                y1: {
                    display: false,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                tooltip: {
                    position: 'nearest',
                    callbacks: {
                        label: (e) => {
                            let pricesDatasetMeta = e.chart.getDatasetMeta(0);
                            let volumesDatasetMeta = e.chart.getDatasetMeta(1);

                            let price = prices[e.dataIndex];
                            let volume = volumes[e.dataIndex];

                            // console.debug(price, pricesDatasetMeta, volume, volumesDatasetMeta, e);

                            if (pricesDatasetMeta.hidden || !pricesDatasetMeta.visible || volumesDatasetMeta.hidden || !volumesDatasetMeta.visible) {
                                return `${sprintf('%0.2f', price)} - ${volume} sold.`;
                            }

                            if (e.dataset.label == 'Price') {
                                return `${sprintf('%0.2f', price)}`;
                            }

                            if (e.dataset.label == 'Volume') {
                                return `${volume} sold.`;
                            }

                            return e.formattedValue;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: false,
                        mode: 'xy'
                    },
                    zoom: {
                        mode: 'xy',
                        drag: {
                            enabled: true,
                            borderColor: '#36a2eb',
                            borderWidth: 1,
                            backgroundColor: '#36a2eb4c'
                        }
                    }
                },
                legend: {
                    onClick(e, legendItem, legend: Chart.LegendElement<'line'>) {
                        // console.debug('click');
                        if (legendItem.text == 'Price') {
                            let m = chart.getDatasetMeta(0);
                            m.hidden = !m.hidden;

                            chart.options.scales['y'].display = !m.hidden;
                        }

                        if (legendItem.text == 'Volume') {
                            let m = chart.getDatasetMeta(1);
                            m.hidden = !m.hidden;

                            chart.options.scales['y1'].display = !m.hidden;
                        }

                        chart.update();
                    }
                }
            }
        }
    });

    document.getElementById('pricehistory').setAttribute('style', 'display: none;');

    // get zoom controls
    let zoomControls = document.querySelectorAll('div.zoom_controls.pricehistory_zoom_controls a.zoomopt');

    // Week
    zoomControls[0].setAttribute('onclick', '');
    zoomControls[0].addEventListener('click', () => {
        console.debug('[PSE] Week');

        chart.resetZoom();
        chart.reset();
        chart.options.scales['x'].min = Math.max(0, dates.length - 150);
        chart.update();
    });

    // Month
    zoomControls[1].setAttribute('onclick', '');
    zoomControls[1].addEventListener('click', () => {
        console.debug('[PSE] Month');

        chart.resetZoom();
        chart.reset();
        chart.options.scales['x'].min = Math.max(0, dates.length - 550);
        chart.update();
    });

    // Lifetime
    zoomControls[2].setAttribute('onclick', '');
    zoomControls[2].addEventListener('click', () => {
        console.debug('[PSE] Lifetime');

        chart.resetZoom();
        chart.reset();
        chart.options.scales['x'].min = 0;
        chart.update();
    });

}
